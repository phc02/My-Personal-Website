"""Generate mobile-sized artwork; retain the full-resolution desktop originals."""
import hashlib
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
public = root / 'public'
output = public / 'assets/case-responsive'
output.mkdir(parents=True, exist_ok=True)
manifest = {}
for project in ('zhurong', 'm7-monitor'):
    for source in sorted((public / 'projects' / project / 'assets').rglob('*.webp')):
        with Image.open(source) as original:
            if original.width < 1600:
                continue
            key = source.relative_to(public).as_posix()
            token = hashlib.sha256(source.read_bytes()).hexdigest()[:16]
            variants = []
            for width in (480, 960, 1440):
                target = output / f'{token}-{width}.webp'
                height = round(original.height * width / original.width)
                image = original.resize((width, height), Image.Resampling.LANCZOS)
                image.save(target, 'WEBP', lossless=True, method=3)
                variants.append({'src': target.relative_to(public).as_posix(), 'width': width})
            manifest[key] = {'width': original.width, 'variants': variants}
(root / 'src/case-responsive-images.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared responsive variants for {len(manifest)} case-study images.')
