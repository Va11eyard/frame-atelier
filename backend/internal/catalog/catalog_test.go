package catalog

import (
	"strings"
	"testing"
)

func TestFrames_HaveRealGeometry(t *testing.T) {
	frames := Frames()
	if len(frames) < 6 {
		t.Fatalf("catalog too small: %d", len(frames))
	}
	seen := map[string]struct{}{}
	for _, f := range frames {
		if f.SKU == "" || f.LensWidthMm < 40 || f.BridgeMm < 10 || f.TempleMm < 120 {
			t.Fatalf("invalid geometry %#v", f)
		}
		if !hasTryOnMesh(f.Model) || len(f.Colors) < 3 {
			t.Fatalf("try-on mesh and tints required %#v", f)
		}
		if _, dup := seen[f.SKU]; dup {
			t.Fatalf("duplicate sku %s", f.SKU)
		}
		seen[f.SKU] = struct{}{}
	}
}

func hasTryOnMesh(model string) bool {
	return strings.HasPrefix(model, "jeeliz:") || strings.HasSuffix(model, ".glb")
}
