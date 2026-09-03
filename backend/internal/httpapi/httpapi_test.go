package httpapi

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/frame/eyewear/internal/optics"
)

type stubFinder struct {
	shops []optics.Shop
	err   error
}

func (s stubFinder) Nearby(float64, float64) ([]optics.Shop, error) {
	return s.shops, s.err
}

func tinyJPEG() string {
	raw := []byte{0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10}
	return base64.StdEncoding.EncodeToString(raw)
}

func postFit(t *testing.T, h http.Handler, body any) *httptest.ResponseRecorder {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodPost, "/v1/fit", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestFit_HappyPathReturnsHeadAndMatches(t *testing.T) {
	srv := New(stubFinder{}, nil)
	rec := postFit(t, srv.Handler(), map[string]any{
		"imageBase64": tinyJPEG(),
		"landmarks": []map[string]any{
			{"index": 133, "x": 0.38, "y": 0.42},
			{"index": 362, "x": 0.62, "y": 0.42},
			{"index": 234, "x": 0.22, "y": 0.52},
			{"index": 454, "x": 0.78, "y": 0.52},
			{"index": 10, "x": 0.50, "y": 0.18},
			{"index": 152, "x": 0.50, "y": 0.88},
			{"index": 468, "x": 0.36, "y": 0.42},
			{"index": 469, "x": 0.382, "y": 0.42},
		},
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var out fitResp
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out.Head.IPDMm <= 0 || len(out.Matches) == 0 {
		t.Fatalf("%#v", out)
	}
	if out.Matches[0].Breakdown.Size == 0 {
		t.Fatal("expected breakdown")
	}
	if !hasTryOnMesh(out.Matches[0].Frame.Model) || len(out.Matches[0].Frame.Colors) == 0 {
		t.Fatal("expected try-on mesh and colors")
	}
}

func TestFit_NoFace(t *testing.T) {
	srv := New(stubFinder{}, nil)
	rec := postFit(t, srv.Handler(), map[string]any{
		"imageBase64": tinyJPEG(),
		"landmarks":   []any{},
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestFit_InvalidImage(t *testing.T) {
	srv := New(stubFinder{}, nil)
	rec := postFit(t, srv.Handler(), map[string]any{
		"imageBase64": base64.StdEncoding.EncodeToString([]byte("hello")),
		"landmarks": []map[string]any{
			{"index": 133, "x": 0.38, "y": 0.42},
			{"index": 362, "x": 0.62, "y": 0.42},
		},
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestFit_InvalidJSON(t *testing.T) {
	srv := New(stubFinder{}, nil)
	req := httptest.NewRequest(http.MethodPost, "/v1/fit", bytes.NewReader([]byte("{nope")))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestOptics_MissingLocation(t *testing.T) {
	srv := New(stubFinder{shops: []optics.Shop{{ID: "9", Name: "X"}}}, nil)
	req := httptest.NewRequest(http.MethodGet, "/v1/optics", nil)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
	if bytes.Contains(rec.Body.Bytes(), []byte("X")) {
		t.Fatal("must not return shops without coordinates")
	}
}

func TestOptics_ReturnsFinderShops(t *testing.T) {
	srv := New(stubFinder{shops: []optics.Shop{{ID: "3", Name: "Lens House", Source: "openstreetmap"}}}, nil)
	req := httptest.NewRequest(http.MethodGet, "/v1/optics?lat=43.2&lng=76.9", nil)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte("Lens House")) {
		t.Fatalf("body %s", rec.Body.String())
	}
}

func TestFit_DataURLAndMapError(t *testing.T) {
	srv := New(stubFinder{err: errMap}, nil)
	rec := postFit(t, srv.Handler(), map[string]any{
		"imageBase64": "data:image/jpeg;base64," + tinyJPEG(),
		"landmarks": []map[string]any{
			{"index": 133, "x": 0.38, "y": 0.42},
			{"index": 362, "x": 0.62, "y": 0.42},
		},
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("data url status %d %s", rec.Code, rec.Body.String())
	}
	req := httptest.NewRequest(http.MethodGet, "/v1/optics?lat=1&lng=2", nil)
	out := httptest.NewRecorder()
	srv.Handler().ServeHTTP(out, req)
	if out.Code != http.StatusBadGateway {
		t.Fatalf("map status %d", out.Code)
	}
}

var errMap = errString("down")

type errString string

func (e errString) Error() string { return string(e) }

func TestOptionsAndHealth(t *testing.T) {
	srv := New(stubFinder{}, []string{"http://localhost:3200"})
	req := httptest.NewRequest(http.MethodOptions, "/v1/fit", nil)
	req.Header.Set("Origin", "http://localhost:3200")
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("options %d", rec.Code)
	}
	h := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	hr := httptest.NewRecorder()
	srv.Handler().ServeHTTP(hr, h)
	if hr.Code != http.StatusOK {
		t.Fatalf("health %d", hr.Code)
	}
}

func hasTryOnMesh(model string) bool {
	return strings.HasPrefix(model, "jeeliz:") || strings.HasSuffix(model, ".glb")
}

func TestFit_EmptyImage(t *testing.T) {
	srv := New(stubFinder{}, nil)
	rec := postFit(t, srv.Handler(), map[string]any{"imageBase64": "   ", "landmarks": []any{}})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}
