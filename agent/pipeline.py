"""خط إنتاج الصور: قصّ المنتج ← خلفية بيضاء ← مشاهد لايف ستايل ← فحص جودة ← علامة مائية للعينات."""
import io
import json
import os
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps, ImageStat

HERE = Path(__file__).resolve().parent
PROMPTS = json.loads((HERE / "prompts.json").read_text(encoding="utf-8-sig"))
WORKFLOW_PATH = HERE.parent / "workflows" / "qwen_image_edit_api.json"
LIGHTNING_WORKFLOW_PATH = HERE.parent / "workflows" / "qwen_image_edit_lightning_api.json"


# ---------------------------------------------------------------- القصّ
_session = None


def _preload_cuda_libs() -> None:
    """يحمّل مكتبات CUDA/cuDNN المثبتة عبر pip (onnxruntime-gpu[cuda,cudnn]) ليعمل القصّ على كرت الشاشة.
    إن لم تتوفر يعمل onnxruntime على المعالج تلقائياً."""
    try:
        import onnxruntime as ort  # noqa: WPS433

        if hasattr(ort, "preload_dlls"):
            ort.preload_dlls()
    except Exception:  # noqa: BLE001
        pass


def cutout(img: Image.Image, dry_run: bool = False) -> Image.Image:
    """يعيد صورة RGBA للمنتج بلا خلفية (rembg + BiRefNet-general، ترخيص MIT)."""
    img = ImageOps.exif_transpose(img).convert("RGBA")
    if dry_run:
        return img
    global _session
    try:
        from rembg import new_session, remove  # noqa: WPS433
    except ImportError as e:  # pragma: no cover
        raise RuntimeError("rembg غير مثبت: pip install rembg[gpu]") from e
    if _session is None:
        _preload_cuda_libs()
        _session = new_session("birefnet-general")
    out = remove(img, session=_session, alpha_matting=False, post_process_mask=True)
    return out.convert("RGBA")


def _bbox_crop(rgba: Image.Image) -> Image.Image:
    bbox = rgba.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    return rgba.crop(bbox) if bbox else rgba


def white_background(rgba: Image.Image, size: int = 2000, fill: float = 0.85) -> Image.Image:
    """صورة أساسية بخلفية بيضاء نقية، المنتج يملأ ~85% من الإطار (شرط أمازون ونون)."""
    prod = _bbox_crop(rgba)
    w, h = prod.size
    scale = (size * fill) / max(w, h)
    prod = prod.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    x = (size - prod.width) // 2
    y = (size - prod.height) // 2
    canvas.paste(prod, (x, y), prod)
    return canvas


# ---------------------------------------------------------------- المشاهد
def _gradient(size: int, seed: int) -> Image.Image:
    rnd = random.Random(seed)
    c1 = tuple(rnd.randint(170, 235) for _ in range(3))
    c2 = tuple(rnd.randint(60, 140) for _ in range(3))
    base = Image.new("RGB", (size, size), c1)
    draw = ImageDraw.Draw(base)
    for y in range(size):
        t = y / size
        col = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
        draw.line([(0, y), (size, y)], fill=col)
    return base.filter(ImageFilter.GaussianBlur(2))


def composite_scene(rgba: Image.Image, size: int, seed: int) -> Image.Image:
    """بديل آمن: المنتج الحقيقي فوق خلفية مولّدة (أو متدرجة في الوضع التجريبي) مع ظل ناعم."""
    bg = _gradient(size, seed)
    prod = _bbox_crop(rgba)
    w, h = prod.size
    scale = (size * 0.62) / max(w, h)
    prod = prod.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    x = (size - prod.width) // 2
    y = int(size * 0.66) - prod.height
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", prod.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 120), (0, 0), prod)
    shadow.paste(sh, (x + 10, y + 16), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    out = bg.convert("RGBA")
    out.alpha_composite(shadow)
    out.paste(prod, (x, y), prod)
    return out.convert("RGB")


def scene_prompt(category: str, variant: int, revision_note: str | None = None) -> str:
    cats = PROMPTS["categories"]
    scenes = cats.get(category) or cats["other"]
    base = scenes[variant % len(scenes)]
    extra = f" Customer request: {revision_note}." if revision_note else ""
    return f"{base}{extra} {PROMPTS['keep']}"


def placement(cut: Image.Image, canvas: int = 1024, height_frac: float = 0.58, width_frac: float = 0.62, bottom: float = 0.14, grey: int = 128):
    """يضع المنتج الحقيقي أسفل منتصف لوحة رمادية محايدة.
    يعيد (png_rgba للنموذج: RGB = المنتج فوق الرمادي، alpha = المنتج) و(طبقة المنتج RGBA بالحجم نفسه)."""
    prod = _bbox_crop(cut.convert("RGBA"))
    w, h = prod.size
    scale = min(canvas * height_frac / h, canvas * width_frac / w)
    pw, ph = max(1, int(w * scale)), max(1, int(h * scale))
    prod = prod.resize((pw, ph), Image.LANCZOS)
    x = (canvas - pw) // 2
    y = max(0, canvas - int(canvas * bottom) - ph)
    layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    layer.paste(prod, (x, y), prod)
    rgb = Image.new("RGB", (canvas, canvas), (grey, grey, grey))
    rgb.paste(prod, (x, y), prod)
    png = rgb.copy()
    png.putalpha(layer.getchannel("A"))
    return png, layer


def restore_product(generated: Image.Image, layer: Image.Image) -> Image.Image:
    """يلصق بكسلات المنتج الأصلية فوق المشهد المولَّد: المنتج يبقى مطابقاً تماماً للصورة الحقيقية."""
    out = generated.convert("RGB")
    if out.size != layer.size:
        out = out.resize(layer.size, Image.LANCZOS)
    out.paste(layer.convert("RGB"), (0, 0), layer.getchannel("A"))
    return out


def edit_scene(comfy, cut: Image.Image, category: str, variant: int, size: int, seed: int, steps: int = 20, revision_note: str | None = None, prefix: str = "job", lora: str | None = None, work_dir: str | None = None, canvas: int = 1024) -> Image.Image:
    """مشهد تسويقي حول المنتج الحقيقي: Qwen-Image-Edit يولّد الخلفية فقط (inpaint)، والمنتج مقفل ثم يُعاد لصقه بدقة.
    مع lora (Lightning) يُستخدم سير العمل السريع (8 خطوات، cfg 1)."""
    use_lightning = bool(lora) and LIGHTNING_WORKFLOW_PATH.exists()
    path = LIGHTNING_WORKFLOW_PATH if use_lightning else WORKFLOW_PATH
    wf = json.loads(path.read_text(encoding="utf-8-sig"))
    wf.pop("_about", None)
    png, layer = placement(cut, canvas=canvas)
    place_path = str(Path(work_dir or ".") / f"{prefix}_place.png")
    png.save(place_path, "PNG")
    name = comfy.upload_image(place_path)
    raw = json.dumps(wf)
    if use_lightning:
        raw = raw.replace("{{LORA}}", lora)
    raw = raw.replace("{{IMAGE}}", name).replace("{{PROMPT}}", json.dumps(scene_prompt(category, variant, revision_note))[1:-1])
    raw = raw.replace("{{NEGATIVE}}", PROMPTS["negative"]).replace("\"{{SEED}}\"", str(seed)).replace("\"{{STEPS}}\"", str(steps)).replace("{{PREFIX}}", prefix)
    images = comfy.run(json.loads(raw))
    img = restore_product(Image.open(io.BytesIO(images[0])), layer)
    if img.width != size:
        img = img.resize((size, int(img.height * size / img.width)), Image.LANCZOS)
    return img


# ---------------------------------------------------------------- الجودة
def quality_ok(img: Image.Image, min_side: int = 800) -> tuple[bool, str]:
    if min(img.size) < min_side:
        return False, f"small image {img.size}"
    stat = ImageStat.Stat(img.convert("L"))
    if stat.stddev[0] < 4:
        return False, "flat image"
    return True, "ok"


def watermark(img: Image.Image, text: str) -> Image.Image:
    out = img.convert("RGBA")
    layer = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    size = max(18, out.width // 36)
    try:
        font = ImageFont.truetype("arial.ttf", size)
    except OSError:
        font = ImageFont.load_default()
    pad = out.width // 50
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rectangle([out.width - tw - pad * 2, out.height - th - pad * 2, out.width - pad // 2, out.height - pad // 2], fill=(0, 0, 0, 90))
    draw.text((out.width - tw - pad * 1.5, out.height - th - pad * 1.5), text, font=font, fill=(255, 255, 255, 230))
    out.alpha_composite(layer)
    return out.convert("RGB")


def save_jpeg(img: Image.Image, path: str, quality: int = 92) -> str:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.convert("RGB").save(path, "JPEG", quality=quality, optimize=True)
    return path
