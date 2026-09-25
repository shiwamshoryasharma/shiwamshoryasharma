import * as THREE from 'three';
import {wrapCoordinate} from './world-layout.js';
export function addLandscape(scene,map,material){
  const group=new THREE.Group();scene.add(group);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(2048,2048),material('#657580'));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;group.add(ground);
  const max=49*9,transform=new THREE.Object3D();
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.18,1.6,5),material('#726076'),max);
  const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(1.05,3.4,7),material('#ffffff'),max);
  const grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.16,.6,3),material('#888798'),49*16);
  group.add(trunks,crowns,grass);
  const hills=new THREE.Group();group.add(hills);
  for(let i=0;i<24;i++){
    const angle=i/24*Math.PI*2,mesh=new THREE.Mesh(new THREE.SphereGeometry(1,9,5),material(i%2?'#777a99':'#686682'));
    mesh.position.set(Math.sin(angle)*185,9+(i%5)*4,Math.cos(angle)*185);mesh.scale.set(25+i%3*12,12+i%5*6,26);mesh.rotation.y=i;hills.add(mesh);
  }
  const cloudMaterial=new THREE.MeshStandardMaterial({roughness:1,color:'#d9d2eb',transparent:true,opacity:.65});
  for(let i=0;i<12;i++)for(let puff=0;puff<3;puff++){
    const cloud=new THREE.Mesh(new THREE.SphereGeometry(1,9,6),cloudMaterial),angle=i/12*Math.PI*2;
    cloud.position.set(Math.sin(angle)*150+puff*7,39+i%3*9,Math.cos(angle)*150);cloud.scale.set(11,3.5+puff,6);hills.add(cloud);
  }
  let key='';
  function place(mesh,index,x,y,z,sx=1,sy=1,sz=1){transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(0,index*.7,0);transform.updateMatrix();mesh.setMatrixAt(index,transform.matrix);}
  function update(x,z,travelling=false){
    hills.scale.setScalar(travelling?1:3);
    ground.position.x=x;ground.position.z=z;hills.position.set(x,0,z);
    const cx=Math.floor(x/64),cz=Math.floor(z/64),next=`${cx}:${cz}`;if(next===key)return;key=next;
    let treeCount=0,grassCount=0;
    for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
      const chunkX=cx+dx,chunkZ=cz+dz;
      const sx=wrapCoordinate(chunkX*64,map.period),sz=wrapCoordinate(chunkZ*64,map.period);
      let seed=(Math.imul(Math.round(sx)+713,73856093)^Math.imul(Math.round(sz)+137,19349663))>>>0;
      const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<9;i++){
        const px=chunkX*64+5+rand()*54,pz=chunkZ*64+5+rand()*54,localX=wrapCoordinate(px,map.period),localZ=wrapCoordinate(pz,map.period);
        if(Math.abs(localX)<map.bounds+5&&Math.abs(localZ)<map.bounds+5)continue;
        if(Math.abs(wrapCoordinate(px-map.gateX,map.period))<5||Math.abs(wrapCoordinate(pz-map.gateZ,map.period))<5)continue;
        const size=.8+rand()*.65;place(trunks,treeCount,px,.8,pz,size,size,size);place(crowns,treeCount,px,2.6*size,pz,size,size,size);crowns.setColorAt(treeCount,new THREE.Color(['#c1b0d8','#819cc1','#b999ba','#899bac'][i%4]));treeCount++;
      }
      for(let i=0;i<16;i++){
        const px=chunkX*64+rand()*64,pz=chunkZ*64+rand()*64,lx=wrapCoordinate(px,map.period),lz=wrapCoordinate(pz,map.period);
        if(Math.abs(lx)<map.bounds+2&&Math.abs(lz)<map.bounds+2)continue;
        if(Math.abs(wrapCoordinate(px-map.gateX,map.period))<4||Math.abs(wrapCoordinate(pz-map.gateZ,map.period))<4)continue;
        place(grass,grassCount++,px,.18,pz,.8,.6+rand(),.8);
      }
    }
    trunks.count=crowns.count=treeCount;grass.count=grassCount;trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;grass.instanceMatrix.needsUpdate=true;if(crowns.instanceColor)crowns.instanceColor.needsUpdate=true;for(const mesh of [trunks,crowns,grass])mesh.computeBoundingSphere();
  }
  update(0,0);return {group,update};
}
