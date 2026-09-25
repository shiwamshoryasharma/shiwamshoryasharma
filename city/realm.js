import * as THREE from 'three';
export function addRealmScenery(world,district,box,material){
  const span=district.span,spacing=district.spacing;
  const rows=(district.rows-1)/2,cols=(district.columns-1)/2;
  const stones=[];
  const vertical=Array.from({length:district.columns+1},(_,i)=>(i-cols-.5)*spacing);
  const horizontal=Array.from({length:district.rows+1},(_,i)=>(i-rows-.5)*spacing);
  // One instanced mesh makes the stone lanes inexpensive even as the district grows.
  for(let x=-span/2+.65;x<span/2-.5;x+=.94)for(let z=-span/2+.65;z<span/2-.5;z+=.73){
    const roadX=vertical.some(lane=>Math.abs(x-lane)<district.roadWidth/2-.12);
    const roadZ=horizontal.some(lane=>Math.abs(z-lane)<district.roadWidth/2-.12);
    if(roadX||roadZ)stones.push({x,z});
  }
  const cobbles=new THREE.InstancedMesh(new THREE.BoxGeometry(.86,.025,.64),material('#8a8872'),stones.length),transform=new THREE.Object3D();
  stones.forEach((p,i)=>{transform.position.set(p.x,.072,p.z);transform.rotation.y=(i%3-1)*.035;transform.updateMatrix();cobbles.setMatrixAt(i,transform.matrix);cobbles.setColorAt(i,new THREE.Color(['#d0c6ad','#b6b89f','#a9afa0','#c3b6a1'][i%4]));});cobbles.instanceMatrix.needsUpdate=true;world.add(cobbles);
  const crown=new THREE.ConeGeometry(1,1,7),rock=new THREE.DodecahedronGeometry(1,0),crystal=new THREE.OctahedronGeometry(1,0);
  for(let i=0;i<20;i++){
    const angle=i/20*Math.PI*2,radius=span*.57;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    // Floating perimeter rocks keep all scenery outside the drivable island.
    const boulder=new THREE.Mesh(rock,material(i%3?'#687063':'#7b7489'));boulder.position.set(x,-.9-(i%3)*.3,z);boulder.scale.set(1.2+i%2,1.7,1.1);world.add(boulder);
    box(world,x,.45,z,.17,2,.17,'#736043');
    for(let tier=0;tier<3;tier++){
      const tree=new THREE.Mesh(crown,material(i%4?'#547765':'#a58fba'));tree.position.set(x,1.5+tier*.8,z);tree.scale.set(1.1-tier*.23,1.8,1.1-tier*.23);world.add(tree);
    }
    if(i%3===0){const gem=new THREE.Mesh(crystal,material('#92bfc0'));gem.position.set(x+1,-.25,z);gem.scale.set(.35,1.05,.35);gem.rotation.z=.25;world.add(gem);}
  }
  // Wildflowers occupy the garden edges, away from residents' footpaths.
  const flowerGeometry=new THREE.IcosahedronGeometry(.055,0);
  for(const repo of district.buildings)for(let i=0;i<7;i++){
    const blossom=new THREE.Mesh(flowerGeometry,material(['#e0b3b7','#ddc681','#ae9cca'][i%3]));blossom.position.set(repo.x-1.5+i*.48,.43,repo.z+2.6);world.add(blossom);
  }
}
