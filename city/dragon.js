import * as THREE from 'three';
import {dragonFlyby} from './dragon-flight.js';
export function createDragon(parent,box,material){
  const dragon=new THREE.Group();dragon.userData.dynamic=true;parent.add(dragon);
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),material('#52406d'));body.scale.set(.8,.65,2.3);dragon.add(body);
  box(dragon,0,.5,-2.2,.5,.5,1,'#6e5586');box(dragon,0,.1,2.7,.22,.22,2,'#6e5586');
  const snout=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),material('#9d749e'));snout.position.set(0,.6,-2.65);snout.scale.set(.35,.27,.65);dragon.add(snout);
  for(const side of [-1,1]){
    box(dragon,side*.29,.72,-2.5,.065,.09,.2,'#ffd9a0',true);
    const horn=new THREE.Mesh(new THREE.ConeGeometry(.12,.7,6),material('#d5bca9'));horn.position.set(side*.24,1,-2.2);horn.rotation.x=.4;dragon.add(horn);
    for(const z of [-1,1]){const foot=box(dragon,side*.5,-.55,z,.2,.65,.22,'#786088');foot.rotation.z=side*.45;}
  }
  for(let i=0;i<6;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.15,.5,4),material('#d3a0ae'));spike.position.set(0,.65,-1.6+i*.7);dragon.add(spike);}
  const wings=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();dragon.add(pivot);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.7,side*5,0,.5,side*2.7,0,2.2],3));geometry.computeVertexNormals();
    const wing=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#b96991',side:THREE.DoubleSide,roughness:.9}));pivot.add(wing);wings.push({pivot,side});
  }
  return {group:dragon,animate(time){for(const {pivot,side} of wings)pivot.rotation.z=Math.sin(time*2.8)*.34*side;}};
}
export function createTownDragon(parent,box,material,district){
  const dragon=createDragon(parent,box,material),rooftop=Math.max(26,...district.buildings.map(r=>r.height+3));
  dragon.group.scale.setScalar(1.25);dragon.group.visible=false;
  return {update(time,motion){const flight=motion?dragonFlyby(time,district.span,rooftop):null;dragon.group.visible=!!flight;if(!flight)return;dragon.group.position.set(flight.x,flight.y,flight.z);dragon.group.rotation.set(0,flight.yaw,flight.bank);dragon.animate(flight.phase);}};
}
