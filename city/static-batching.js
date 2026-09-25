import * as THREE from 'three';
// Repeated building timbers and cottage details share draw calls by material.
// Original meshes retain their world matrices for the existing repository ray targets.
export function batchStaticBoxes(root,geometry){
 root.updateMatrixWorld(true);const batches=new Map();
 root.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||mesh.geometry!==geometry)return;
  for(let node=mesh;node;node=node.parent)if(node.userData.dynamic)return;
  const list=batches.get(mesh.material)||[];list.push(mesh);batches.set(mesh.material,list);
 });
 for(const [material,meshes] of batches){
  if(meshes.length<2)continue;
  const batch=new THREE.InstancedMesh(geometry,material,meshes.length);
  meshes.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);mesh.removeFromParent();});
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();root.add(batch);
 }
}
