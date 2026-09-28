"""Stage only public city files, with a build revision to invalidate browser caches."""
from pathlib import Path
import hashlib
import re
import shutil
ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / '.preview' / 'site'
PUBLIC_ASSETS = ('anime-robotics-lab.png', 'workshop.webp', 'fantasy-workshop.webp',
                 'anime-explorer.glb', 'anime-explorer-poster.webp', 'sky-district.glb', 'sky-district-poster.webp',
                 'factory-isaac.webp', 'factory-dashboard.webp', 'robot-controls.webp',
                 'conveyor-simulation.webp', 'virtual-lab.webp')


def main():
    # Fail before touching a previous build if a required input is missing.
    for name in (*PUBLIC_ASSETS, 'github-data.json'):
        if not (ROOT / 'assets' / name).is_file():
            raise FileNotFoundError(f'Missing public asset: {name}')
    expected = ROOT.resolve() / '.preview' / 'site'
    if DESTINATION.is_symlink() or DESTINATION.resolve() != expected:
        raise ValueError('Refusing to clean a staging path outside .preview/site')
    if DESTINATION.exists():
        shutil.rmtree(DESTINATION)
    DESTINATION.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / 'city', DESTINATION, dirs_exist_ok=True)
    sources = sorted(p for p in (ROOT / 'city').iterdir() if p.suffix in {'.js', '.css', '.html'})
    revision_inputs = sources + [ROOT / 'assets' / name for name in PUBLIC_ASSETS]
    revision = hashlib.sha256(b''.join(p.read_bytes() for p in revision_inputs)).hexdigest()[:12]
    # Revision local application modules together; immutable vendored Three stays cached.
    for source in sources:
        target = DESTINATION / source.name
        content = target.read_text(encoding='utf-8-sig')
        if source.suffix == '.js':
            content = re.sub(r"(['\"])(\./[\w-]+\.js)\1", lambda m: f'{m[1]}{m[2]}?v={revision}{m[1]}', content)
        elif source.suffix == '.html':
            content = re.sub(r'(src|href)="([\w-]+\.(?:js|css))"', lambda m: f'{m[1]}="{m[2]}?v={revision}"', content)
            content = re.sub(r'src="(assets/[\w-]+\.(?:webp|png))"', lambda m: f'src="{m[1]}?v={revision}"', content)
        target.write_text(content, encoding='utf-8')
    (DESTINATION / 'data').mkdir(exist_ok=True)
    shutil.copy2(ROOT / 'assets/github-data.json', DESTINATION / 'data/github-data.json')
    (DESTINATION / 'assets').mkdir(exist_ok=True)
    for name in PUBLIC_ASSETS:
        shutil.copy2(ROOT / 'assets' / name, DESTINATION / 'assets' / name)
    print(f'Staged public city at {DESTINATION} ({revision})')


if __name__ == '__main__':
    main()
