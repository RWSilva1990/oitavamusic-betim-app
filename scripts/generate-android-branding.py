from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public' / 'icon-512.png'
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

if not SOURCE.exists():
    raise SystemExit(f'Logo source not found: {SOURCE}')

logo = Image.open(SOURCE).convert('RGBA')


def extend_edges(image, target_size):
    """Extend only the outer pixels of the artwork to fill a larger square.

    The artwork itself stays at the same scale. Only the pixels at its outer
    edge are stretched outward to fill the extra area.
    """
    width, height = image.size
    if width != height:
        raise ValueError('Launcher artwork must be square')
    if target_size < width:
        raise ValueError('Target size must be at least the artwork size')

    canvas = Image.new('RGBA', (target_size, target_size))
    left = (target_size - width) // 2
    top = (target_size - height) // 2
    right = left + width
    bottom = top + height

    canvas.alpha_composite(image, (left, top))

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
    """Remove the white frame around icon-512 without resizing the artwork.

    icon-512 contains the desired colored artwork already at the visual scale
    we want, but it also contains white outer padding. We find only the colored
    artwork, keep that crop at its current pixel size, and extend its own edge
    colors into the former white area. The central Oitava symbol therefore does
    not get any larger.
    """
    rgb = image.convert('RGB')
    white = Image.new('RGB', rgb.size, (255, 255, 255))
    difference = ImageChops.difference(rgb, white).convert('L')

    # Ignore tiny JPEG/PNG antialiasing variations that are visually white.
    mask = difference.point(lambda value: 255 if value > 12 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox

    # Keep the crop square and centered so the logo position/scale is preserved.
    crop_width = right - left
    crop_height = bottom - top
    side = max(crop_width, crop_height)
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

    # First resize the official source exactly as before. Then remove only the
    # white outer frame by extending the colored background into it. Nothing in
    # the central artwork is resized during this second step.
    rendered_source = logo.resize((size, size), Image.Resampling.LANCZOS)
    rendered = remove_white_frame_without_zoom(rendered_source)
    rendered.save(target_dir / 'ic_launcher.png')
    rendered.save(target_dir / 'ic_launcher_round.png')

    # Adaptive foreground canvases are 2.25x the legacy launcher size. Extend
    # the already cleaned background to the adaptive edges; do not enlarge the
    # icon artwork itself.
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
