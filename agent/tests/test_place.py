import sys
sys.path.insert(0, sys.argv[1])
from PIL import Image, ImageDraw
import pipeline
# fake cutout: transparent canvas with an opaque red ellipse "product"
cut = Image.new("RGBA", (600, 900), (0, 0, 0, 0))
ImageDraw.Draw(cut).ellipse((100, 100, 500, 850), fill=(200, 30, 30, 255))
png, layer = pipeline.placement(cut, canvas=1024)
assert png.size == (1024, 1024) and png.mode == "RGBA"
a = png.getchannel("A"); bbox = a.getbbox()
assert bbox is not None
x0, y0, x1, y1 = bbox
assert abs((x0 + x1) / 2 - 512) <= 2, bbox                    # centred
assert 1024 - y1 >= int(1024 * 0.14) - 2, bbox                # bottom margin
assert (y1 - y0) <= int(1024 * 0.58) + 2, bbox                # height cap
assert png.getpixel((5, 5))[:3] == (128, 128, 128)            # neutral grey around
# generated scene (blue) with a wrongly-recoloured product → restore must bring back the exact red pixels
gen = Image.new("RGB", (1024, 1024), (20, 40, 200))
out = pipeline.restore_product(gen, layer)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
assert out.getpixel((cx, cy)) == (200, 30, 30), out.getpixel((cx, cy))
assert out.getpixel((5, 5)) == (20, 40, 200)
# generated at a different size is resized first
out2 = pipeline.restore_product(gen.resize((512, 512)), layer)
assert out2.size == (1024, 1024) and out2.getpixel((cx, cy)) == (200, 30, 30)
print("placement/restore tests passed")
