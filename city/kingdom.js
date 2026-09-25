import * as THREE from 'three';
import {addCastle,addCottage} from './settlement.js';
import {createDragon} from './dragon.js';
export function createKingdom(scene,box,material){
  const group=new THREE.Group();scene.add(group);group.visible=false;
  const island=new THREE.Mesh(new THREE.CylinderGeometry(29,20,9,9),material('#676485'));island.position.y=-4;group.add(island);
  addCastle(group,box,material,{scale:1.6});
  box(group,0,.58,21,5,.2,34,'#b1a1c3');
  const lawn=new THREE.Mesh(new THREE.CircleGeometry(27,48),material('#809092'));lawn.rotation.x=-Math.PI/2;lawn.position.y=.52;group.add(lawn);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(8,32),material('#9cc8df',true));pool.rotation.x=-Math.PI/2;pool.position.set(-14,.6,1);pool.scale.set(.5,1.6,1);group.add(pool);
  for(let i=0;i<10;i++){
    const angle=i/10*Math.PI*2,radius=15+(i%2)*5,x=Math.sin(angle)*radius,z=Math.cos(angle)*radius;
    if(Math.abs(x)>6&&x>0)addCottage(group,box,material,x,z,['#ad608b','#6c65a4','#53869e'][i%3],1.2);
    else if(z<0){
      box(group,x,2,z,.4,4,.4,'#806476');
      for(let j=0;j<4;j++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2,1),material(i%2?'#d1aacb':'#a6b8d7'));crown.position.set(x+Math.sin(j*2)*1.2,4.5+j%2,z+Math.cos(j*2));group.add(crown);}
    }
  }
  const waterfalls=[];
  for(const x of [-16,16]){
    const water=new THREE.Mesh(new THREE.PlaneGeometry(2.5,20),new THREE.MeshBasicMaterial({color:'#abd2f0',transparent:true,opacity:.55,side:THREE.DoubleSide}));water.position.set(x,-9,22);group.add(water);waterfalls.push(water);
    for(let i=0;i<8;i++)box(group,x-1+i*.29,-9,22.05,.04,19,.04,'#c7e5ff',true);
  }
  const clouds=new THREE.Group();group.add(clouds);
  for(let i=0;i<22;i++)for(let j=0;j<3;j++){
    const angle=i*2.4,cloud=new THREE.Mesh(new THREE.SphereGeometry(1,10,7),material('#d0c4e4'));
    cloud.position.set(Math.sin(angle)*(40+i%3*8)+j*3,-9+i%4*2,Math.cos(angle)*(40+i%3*8));cloud.scale.set(7,2+j,5);clouds.add(cloud);
  }
  for(let i=0;i<16;i++){
    const angle=i/16*Math.PI*2,radius=19+i%3*2;
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(1),material(i%2?'#a697ed':'#e5a99b'));gem.position.set(Math.sin(angle)*radius,1.8,Math.cos(angle)*radius);gem.scale.y=3;group.add(gem);
    const satellite=new THREE.Mesh(new THREE.ConeGeometry(4+i%3,9,6),material('#777099'));satellite.rotation.z=Math.PI;satellite.position.set(Math.sin(angle)*45,3+i%4*3,Math.cos(angle)*45);group.add(satellite);
  }
  const flyer=createDragon(group,box,material),dragon=flyer.group;
  const motes=new THREE.BufferGeometry(),positions=[];for(let i=0;i<160;i++)positions.push(Math.sin(i*2.4)*(12+i%28),3+i%31,Math.cos(i*2.4)*(12+i%28));motes.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const lights=new THREE.Points(motes,new THREE.PointsMaterial({color:'#ffd8bc',size:.15,transparent:true,opacity:.8}));group.add(lights);
  function update(time,motion){
    const t=motion?time:0,angle=t*.13;dragon.position.set(Math.sin(angle)*28,20+Math.sin(t*.3)*2,Math.cos(angle)*28);dragon.rotation.y=angle+Math.PI/2;
    flyer.animate(t);lights.rotation.y=t*.025;clouds.rotation.y=t*.005;waterfalls.forEach((w,i)=>w.material.opacity=.5+Math.sin(t*1.5+i)*.1);
  }
  update(0,false);return {group,update};
}
