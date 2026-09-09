from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public' / 'icon-512.png'
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

if not SOURCE.exists():
    raise SystemExit(f'Logo source not found: {SOURCE}')

logo = Image.open(SOURCE).convert('RGBA')


def extend_edges(image, target_size):
    """Extend only the outer pixels of the artwork to fill a larger square.

    The original icon remains untouched and centered. The extra adaptive-icon
    area is filled by stretching the edge pixels outward, so Android never
    reveals the white adaptive background and the central Oitava mark is not
    enlarged.
    """
    width, height = image.size
    if width != height:
        raise ValueError('Launcher source must be square')
    if target_size < width:
        raise ValueError('Target size must be at least the source size')

    canvas = Image.new('RGBA', (target_size, target_size))
    left = (target_size - width) // 2
    top = (target_size - height) // 2
    right = left + width
    bottom = top + height

    # Keep the official source artwork at exactly its original scale.
    canvas.alpha_composite(image, (left, top))

    # Extend the four edge rows/columns into the surrounding adaptive area.
    if top > 0:
        top_edge = image.crop((0, 0, width, 1)).resize((width, top), Image.Resampling.NEAREST)
        canvas.alpha_composite(top_edge, (left, 0))
    if bottom < target_size:
        bottom_edge = image.crop((0, height - 1, width, height)).resize(
            (width, target_size - bottom), Image.Resampling.NEAREST
        )
        canvas.alpha_composite(bottom_edge, (left, bottom))
    if left > 0:
        left_edge = image.crop((0, 0, 1, height)).resize((left, height), Image.Resampling.NEAREST)
        canvas.alpha_composite(left_edge, (0, top))
    if right < target_size:
        right_edge = image.crop((width - 1, 0, width, height)).resize(
            (target_size - right, height), Image.Resampling.NEAREST
        )
        canvas.alpha_composite(right_edge, (right, top))

    # Fill the corners using the corresponding corner pixel from the source.
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


# Legacy launcher icons. These are used on Android versions/devices that do not
# render adaptive icons.
launcher_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

for folder, size in launcher_sizes.items():
    target_dir = RES / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    rendered = logo.resize((size, size), Image.Resampling.LANCZOS)
    rendered.save(target_dir / 'ic_launcher.png')
    rendered.save(target_dir / 'ic_launcher_round.png')

    # Adaptive foreground canvases are 2.25x the legacy launcher size.
    # Keep the official icon at the same visual scale already approved, while
    # extending only its background to the adaptive canvas edges. This removes
    # the white border without zooming the central Oitava symbol.
    fg_size = int(size * 2.25)
    foreground = extend_edges(rendered, fg_size)
    foreground.save(target_dir / 'ic_launcher_foreground.png')

# Rebuild every existing Capacitor splash image, preserving its original pixel
# dimensions while centering the exact logo used on the login screen.
for splash_path in RES.glob('drawable*/splash.png'):
    try:
        current = Image.open(splash_path)
        width, height = current.size
    except Exception:
        continue

    background = Image.new('RGBA', (width, height), (240, 242, 248, 255))
    mark_size = max(96, int(min(width, height) * 0.28))
    mark = logo.resize((mark_size, mark_size), Image.Resampling.LANCZOS)
    background.alpha_composite(mark, ((width - mark_size) // 2, (height - mark_size) // 2))
    background.convert('RGB').save(splash_path)

print('Android branding generated from public/icon-512.png')
