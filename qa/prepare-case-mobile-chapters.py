"""Make bounded-size chapter artwork from capture-case-chapters.cjs output."""
from pathlib import Path
from PIL import Image
import hashlib
import json
root=Path(__file__).resolve().parents[1]
captures=root/'.tmp/case-chapter-captures'
output=root/'public/assets/case-mobile-chapters'
output.mkdir(parents=True,exist_ok=True)
manifest=json.loads((captures/'manifest.json').read_text('utf-8'))
for route,chapters in manifest.items():
    for chapter in chapters:
        source=captures/chapter.pop('file')
        digest=hashlib.sha256(source.read_bytes()).hexdigest()[:16]
        variants=[]
        with Image.open(source) as original:
            chapter['width'],chapter['height']=original.size
            for width in (960,1440):
                target=output/f'{digest}-{width}.webp'
                original.resize((width,round(original.height*width/original.width)),Image.Resampling.LANCZOS).save(target,'WEBP',lossless=True,method=3)
                variants.append({'src':target.relative_to(root/'public').as_posix(),'width':width})
        chapter['variants']=variants
(root/'src/case-mobile-chapters.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
used={variant['src'].split('/')[-1] for chapters in manifest.values() for chapter in chapters for variant in chapter['variants']}
for previous in output.glob('*.webp'):
    if previous.name not in used:
        assert previous.resolve().parent==output.resolve()
        previous.unlink()
print('Prepared',sum(map(len,manifest.values())),'mobile chapters.')
