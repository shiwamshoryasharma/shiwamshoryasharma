"""Stage only the public city files and the public GitHub snapshot for Pages."""
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / '.preview' / 'site'

def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / 'city', DESTINATION, dirs_exist_ok=True)
    (DESTINATION / 'data').mkdir(exist_ok=True)
    shutil.copy2(ROOT / 'assets/github-data.json', DESTINATION / 'data/github-data.json')
    print(f'Staged public city at {DESTINATION}')

if __name__ == '__main__':
    main()
