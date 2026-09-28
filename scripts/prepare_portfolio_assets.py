"""Encode the supplied artwork and Blender render for the website (Pillow required).

Original supplied pictures stay local; committed WebP derivatives are the public assets.
Use --poster-only after rebuilding the Blender character.
"""
import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--poster-only', action='store_true')
    args = parser.parse_args()
    pairs = [('wayfarer-poster.png', 'wayfarer-poster.webp')]
    if not args.poster_only:
        pairs += [('SGT29ajkskd.png', 'workshop.webp'), ('suawuaiduw.png', 'fantasy-workshop.webp')]
    for source, destination in pairs:
        with Image.open(ROOT / 'assets' / source) as image:
            image.thumbnail((1600, 1600))
            # Only encode image pixels; no EXIF or personal metadata is copied.
            image.save(ROOT / 'assets' / destination, format='WEBP', quality=88, method=6)
        print(destination)


if __name__ == '__main__':
    main()
