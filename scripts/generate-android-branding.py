from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public' / 'icon-512.png'
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

if not SOURCE.exists():
    raise SystemExit(f'Logo source not found: {SOURCE}')

logo = Image.open(SOURCE).convert('RGBA')

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

    # Adaptive foreground canvases are larger than the visible safe area.
    fg_size = int(size * 2.25)
    foreground = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
    safe = int(fg_size * 0.66)
    mark = logo.resize((safe, safe), Image.Resampling.LANCZOS)
    foreground.alpha_composite(mark, ((fg_size - safe) // 2, (fg_size - safe) // 2))
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
