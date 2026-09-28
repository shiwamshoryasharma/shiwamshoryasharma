"""Prepare a verified CC0 VRoid base for Blender's standard glTF importer.
Download/extract the documented upstream VRM into .tmp/character-source/sakurada first.
This conversion removes VRM-only vertex masks, not the painted textures or skin weights.
"""
from pathlib import Path
import hashlib,json,struct
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'.tmp/character-source/sakurada/Sakurada Fumiriya.vrm'
EXPECTED='a36e91b81518c59f6da0e3f34a176b79090a8c68cc6bd5fe03c1560744b283f3'
def main():
 b=SOURCE.read_bytes()
 if hashlib.sha256(b).hexdigest()!=EXPECTED:raise ValueError('Unexpected source VRM; verify its provenance before converting')
 length=struct.unpack_from('<I',b,12)[0];model=json.loads(b[20:20+length])
 for material in model['materials']:
  material['doubleSided']=True;material.pop('normalTexture',None);material.pop('extensions',None)
  name=material['name']
  if 'HAIR' in name:material['pbrMetallicRoughness']['baseColorFactor']=[.56,.70,.77,1]
  if any(part in name for part in ['FaceBrow','FaceEyelash','FaceEyeline']):material['pbrMetallicRoughness']['baseColorFactor']=[.17,.23,.27,1]
 for mesh in model['meshes']:
  for primitive in mesh['primitives']:primitive['attributes'].pop('COLOR_0',None)
 model.pop('extensions',None);model['extensionsUsed']=[];model.pop('extensionsRequired',None)
 encoded=json.dumps(model,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4);tail=b[20+length:]
 output=struct.pack('<III',0x46546c67,2,20+len(encoded)+len(tail))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+tail
 (ROOT/'.tmp/character-source/anime-base.glb').write_bytes(output)
if __name__=='__main__':main()
