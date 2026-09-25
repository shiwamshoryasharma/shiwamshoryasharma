import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from update_profile import count_source_files

class SourceFiles(unittest.TestCase):
    def test_counts_source_and_notebooks_but_ignores_generated_dependencies(self):
        paths=['src/app.tsx','api/main.py','notebooks/model.ipynb','index.html','style.css','README.md','image.png','node_modules/a/index.js','dist/index.js','vendor/cv.py','package-lock.json']
        self.assertEqual(count_source_files({'tree':[{'type':'blob','path':p} for p in paths]}),5)
    def test_truncated_tree_is_unknown_not_a_misleading_partial_count(self):
        self.assertIsNone(count_source_files({'truncated':True,'tree':[{'type':'blob','path':'one.py'}]}))

if __name__=='__main__': unittest.main()
