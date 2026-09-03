package catalog

import "github.com/frame/eyewear/internal/fit"

const jeelizOptical = "jeeliz:optical"

var atelierColors = []string{"black", "gold", "tortoise", "burgundy", "silver", "horn"}

func Frames() []fit.Frame {
	return []fit.Frame{
		optical("FR-RECT-50", "Прямоугольник 50", "rect", "acetate", "black", 50, 22, 150),
		optical("FR-OVAL-58", "Овал 58", "oval", "metal", "gold", 58, 14, 135),
		optical("FR-RECT-54", "Прямоугольник 54", "rect", "combo", "grey", 54, 17, 138),
		optical("FR-OVAL-54", "Панто 54", "oval", "acetate", "tortoise", 54, 20, 145),
		optical("FR-ROUND-47", "Круг 47", "round", "acetate", "horn", 47, 22, 145),
		optical("FR-ROUND-46", "Панто-круг 46", "round", "acetate", "black", 46, 24, 145),
		optical("FR-RECT-51", "Тонкий прямоугольник 51", "rect", "metal", "silver", 51, 17, 135),
		optical("FR-CAT-52", "Кошка 52", "cat", "acetate", "burgundy", 52, 17, 140),
	}
}

func optical(sku, name, shape, material, color string, lens, bridge, temple float64) fit.Frame {
	return fit.Frame{
		SKU: sku, Name: name, Brand: "FRAME", Shape: shape, Material: material, Color: color,
		LensWidthMm: lens, BridgeMm: bridge, TempleMm: temple, Model: jeelizOptical, Colors: atelierColors,
	}
}
