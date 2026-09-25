"""Stage only public city files, with a build revision to invalidate browser caches."""
from pathlib import Path
import hashlib
import re
import shutil
ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / '.preview' / 'site'


def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / 'city', DESTINATION, dirs_exist_ok=True)
    sources = sorted(p for p in (ROOT / 'city').iterdir() if p.suffix in {'.js', '.css', '.html'})
    revision = hashlib.sha256(b''.join(p.read_bytes() for p in sources)).hexdigest()[:12]
    # Revision local application modules together; immutable vendored Three stays cached.
    for source in sources:
        target = DESTINATION / source.name
        content = target.read_text(encoding='utf-8-sig')
        if source.suffix == '.js':
            content = re.sub(r"(['\"])(\./[\w-]+\.js)\1", lambda m: f'{m[1]}{m[2]}?v={revision}{m[1]}', content)
        elif source.suffix == '.html':
            content = re.sub(r'(src|href)="([\w-]+\.(?:js|css))"', lambda m: f'{m[1]}="{m[2]}?v={revision}"', content)
        target.write_text(content, encoding='utf-8')
    (DESTINATION / 'data').mkdir(exist_ok=True)
    shutil.copy2(ROOT / 'assets/github-data.json', DESTINATION / 'data/github-data.json')
    (DESTINATION / 'assets').mkdir(exist_ok=True)
    for name in ['anime-robotics-lab.png', 'profile.png']:
        shutil.copy2(ROOT / 'assets' / name, DESTINATION / 'assets' / name)
    print(f'Staged public city at {DESTINATION} ({revision})')


if __name__ == '__main__':
    main()
