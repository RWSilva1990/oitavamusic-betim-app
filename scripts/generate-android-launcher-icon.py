from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "icon-512.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

if not SOURCE.exists():
    raise SystemExit(f"Logo source not found: {SOURCE}")

logo = Image.open(SOURCE).convert("RGBA")


def extend_edges(image, target_size):
    """Fill a larger square by extending only the artwork edge pixels.

    The artwork itself is never scaled in this step, so the central Oitava
    symbol keeps exactly the same visual size.
    """
    width, height = image.size
    if width != height:
        raise ValueError("Launcher artwork must be square")
    if target_size < width:
        raise ValueError("Target size must be at least the artwork size")

    canvas = Image.new("RGBA", (target_size, target_size))
    left = (target_size - width) // 2
    top = (target_size - height) // 2
    right = left + width
    bottom = top + height

    canvas.alpha_composite(image, (left, top))

    if top > 0:
        edge = image.crop((0, 0, width, 1)).resize((width, top), Image.Resampling.NEAREST)
        canvas.alpha_composite(edge, (left, 0))
    if bottom < target_size:
        edge = image.crop((0, height - 1, width, height)).resize(
            (width, target_size - bottom), Image.Resampling.NEAREST
        )
        canvas.alpha_composite(edge, (left, bottom))
    if left > 0:
        edge = image.crop((0, 0, 1, height)).resize((left, height), Image.Resampling.NEAREST)
        canvas.alpha_composite(edge, (0, top))
    if right < target_size:
        edge = image.crop((width - 1, 0, width, height)).resize(
            (target_size - right, height), Image.Resampling.NEAREST
        )
        canvas.alpha_composite(edge, (right, top))

    corners = [
        ((0, 0, 1, 1), (0, 0, left, top)),
        ((width - 1, 0, width, 1), (right, 0, target_size, top)),
        ((0, height - 1, 1, height), (0, bottom, left, target_size)),
        ((width - 1, height - 1, width, height), (right, bottom, target_size, target_size)),
    ]
    for crop_box, dest_box in corners:
        x0, y0, x1, y1 = dest_box
        if x1 <= x0 or y1 <= y0:
            continue
        corner = image.crop(crop_box).resize((x1 - x0, y1 - y0), Image.Resampling.NEAREST)
        canvas.alpha_composite(corner, (x0, y0))

    return canvas


def remove_white_frame_without_zoom(image):
    """Remove only the white outer frame, without enlarging the logo artwork."""
    rgb = image.convert("RGB")
    white = Image.new("RGB", rgb.size, (255, 255, 255))
    difference = ImageChops.difference(rgb, white).convert("L")
    mask = difference.point(lambda value: 255 if value > 12 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    side = max(right - left, bottom - top)
    center_x = (left + right) // 2
    center_y = (top + bottom) // 2
    left = max(0, center_x - side // 2)
    top = max(0, center_y - side // 2)
    right = min(image.width, left + side)
    bottom = min(image.height, top + side)
    left = max(0, right - side)
    top = max(0, bottom - side)

    artwork = image.crop((left, top, right, bottom))
    return extend_edges(artwork, image.width)


launcher_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in launcher_sizes.items():
    target_dir = RES / folder
    target_dir.mkdir(parents=True, exist_ok=True)

    # Preserve the approved visual scale: resize the official 512 source once
    # to Android's required size, then only extend the colored edges into the
    # white frame. Do not zoom/crop the central mark.
    rendered_source = logo.resize((size, size), Image.Resampling.LANCZOS)
    rendered = remove_white_frame_without_zoom(rendered_source)
    rendered.save(target_dir / "ic_launcher.png")
    rendered.save(target_dir / "ic_launcher_round.png")

    # Android adaptive icon canvas. Keep the already-approved mark at the same
    # size and extend only its background to the larger adaptive canvas.
    fg_size = int(size * 2.25)
    foreground = extend_edges(rendered, fg_size)
    foreground.save(target_dir / "ic_launcher_foreground.png")

print("Launcher icons generated without zoom; splash resources left untouched")
