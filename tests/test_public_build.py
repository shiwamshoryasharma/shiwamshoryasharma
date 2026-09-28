import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('build_city', Path(__file__).resolve().parents[1] / 'scripts/build_city.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class PublicBuild(unittest.TestCase):
    def test_rebuild_excludes_private_portrait_and_stale_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'city').mkdir()
            (root / 'assets').mkdir()
            (root / 'city/index.html').write_text('<script src="app.js"></script>')
            (root / 'city/app.js').write_text('export const ready = true;')
            for name in ['github-data.json', 'anime-robotics-lab.png', 'workshop.webp', 'fantasy-workshop.webp', 'wayfarer.glb', 'wayfarer-poster.webp']:
                (root / 'assets' / name).write_text('{}')
            (root / 'assets/profile.png').write_bytes(b'private original')
            site = root / '.preview/site'
            (site / 'assets').mkdir(parents=True)
            (site / 'assets/profile.png').write_bytes(b'private stale copy')
            (site / 'old-page.html').write_text('old page')
            with patch.object(build, 'ROOT', root), patch.object(build, 'DESTINATION', site):
                build.main()
            self.assertFalse((site / 'assets/profile.png').exists())
            self.assertFalse((site / 'old-page.html').exists())
            self.assertTrue((site / 'assets/wayfarer.glb').exists())
            self.assertTrue((site / 'assets/workshop.webp').exists())
            self.assertIn('?v=', (site / 'index.html').read_text())
            self.assertEqual((root / 'assets/profile.png').read_bytes(), b'private original')


if __name__ == '__main__':
    unittest.main()
