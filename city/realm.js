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
    if((roadX||roadZ)&&!district.restricted.some(lot=>lot.compound&&Math.abs(x-lot.x)<lot.half+.4&&Math.abs(z-lot.z)<lot.half+.4))stones.push({x,z});
  }
  const cobbles=new THREE.InstancedMesh(new THREE.BoxGeometry(.86,.025,.64),material('#a6a1b6'),stones.length),transform=new THREE.Object3D();
  stones.forEach((p,i)=>{transform.position.set(p.x,.072,p.z);transform.rotation.y=(i%3-1)*.035;transform.updateMatrix();cobbles.setMatrixAt(i,transform.matrix);cobbles.setColorAt(i,new THREE.Color(['#8c8396','#a9a0ac','#8c929f','#b2a5aa'][i%4]));});cobbles.instanceMatrix.needsUpdate=true;world.add(cobbles);
  // Raised footpaths follow the same intersections used by the residents.
  for(const lot of [...district.buildings,...district.restricted,...district.amenities]){
    if(lot.compound)continue;
    for(const side of [-1,1]){
      box(world,lot.x+side*4.5,.12,lot.z,.95,.24,9.9,'#a5a0b3');
      box(world,lot.x,.12,lot.z+side*4.5,9.9,.24,.95,'#a5a0b3');
    }
  }
  for(const x of vertical)for(const z of horizontal){
    if(district.restricted.some(lot=>lot.compound&&Math.abs(x-lot.x)<lot.half+5&&Math.abs(z-lot.z)<lot.half+5))continue;
    for(const side of [-1,1])for(let i=-2;i<=2;i++){
      box(world,x+i*.9,.09,z+side*4.5,.55,.03,1,'#a49aa8');
      box(world,x+side*4.5,.09,z+i*.9,1,.03,.55,'#a49aa8');
    }
  }
  // Wildflowers occupy the garden edges, away from residents' footpaths.
  const flowerGeometry=new THREE.IcosahedronGeometry(.055,0);
  for(const repo of district.buildings)for(let i=0;i<7;i++){
    const blossom=new THREE.Mesh(flowerGeometry,material(['#e0b3b7','#ddc681','#ae9cca'][i%3]));blossom.position.set(repo.x-1.5+i*.48,.43,repo.z+2.6);world.add(blossom);
  }
}
