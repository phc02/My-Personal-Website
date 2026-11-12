"""Prepare user-supplied icons for small orbit cards; never modify originals."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
assets = root / 'public/assets/software-icons'
target = assets / 'home'
target.mkdir(parents=True, exist_ok=True)
for name, source in [('figma','figma'),('blender','blender'),('codex','codex'),
                     ('photoshop','photoshop'),('jimeng-ai','jimeng-color'),
                     ('jianying','jianying'),('unity','unity'),
                     ('after-effects','Adobe After Effects'),('vscode','Visual Studio Code')]:
    original = Image.open(assets / 'originals' / f'{source}.png')
    image = original.convert('RGBA')
    if name == 'jianying':
        # This supplied white mark has an opaque black matte. Keep the white
        # shape and antialiasing while making its black background transparent.
        alpha = ImageOps.grayscale(original.convert('RGB'))
        image = Image.new('RGBA', original.size, 'white')
        image.putalpha(alpha)
    bounds = image.getchannel('A').getbbox()
    if bounds:
        image = image.crop(bounds)
    surfaces = {'photoshop': '#001e36', 'after-effects': '#00005b',
                'codex': '#000000', 'unity': '#000000'}
    if name in surfaces:
        # App badges own the entire card surface. Fill their rounded source
        # corners with the native app color instead of revealing a second tile.
        image = ImageOps.fit(image, (512, 512), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (512, 512), surfaces[name])
        canvas.alpha_composite(image)
    else:
        # Other tools retain the original padded composition and silhouette.
        image = ImageOps.contain(image, (432, 432), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(image, ((512-image.width)//2, (512-image.height)//2))
    canvas.save(target / f'{name}.png', optimize=True)
    print(f'{name}: {original.size} -> 512x512')
