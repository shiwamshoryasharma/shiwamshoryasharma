import * as THREE from 'three';
import {dragonFlyby} from './dragon-flight.js';
export function createDragon(parent,box,material){
 const dragon=new THREE.Group();dragon.userData.dynamic=true;parent.add(dragon);
 const skin=material('#58474b',false,'scales'),bone=material('#b1a08a'),belly=material('#9c8263');
 const sphere=new THREE.SphereGeometry(1,16,12);
 function form(parent,mat,x,y,z,sx,sy,sz){const mesh=new THREE.Mesh(sphere,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;}
 function tube(parent,points,radii,mat,segments=24){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),frames=curve.computeFrenetFrames(segments,false),positions=[],uv=[],indices=[],sides=10;
  for(let i=0;i<=segments;i++){
   const t=i/segments,p=curve.getPoint(t),ri=t*(radii.length-1),a=Math.floor(ri),r=THREE.MathUtils.lerp(radii[a],radii[Math.min(a+1,radii.length-1)],ri-a);
   for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2,v=p.clone().addScaledVector(frames.normals[i],Math.cos(angle)*r).addScaledVector(frames.binormals[i],Math.sin(angle)*r);positions.push(v.x,v.y,v.z);uv.push(j/sides,t*3);
    if(i<segments&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,mat);parent.add(mesh);return mesh;
 }
 form(dragon,skin,0,0,.1,.75,.78,1.65);form(dragon,skin,0,.22,-.75,.9,.85,.9);form(dragon,belly,0,-.35,-.1,.58,.43,1.35);
 const neck=new THREE.Group();dragon.add(neck);
 tube(neck,[[0,.3,-1],[0,.7,-1.7],[0,1.55,-2.4],[0,1.6,-3.2]],[.58,.47,.33,.28],skin);
 form(neck,skin,0,1.67,-3.28,.38,.35,.56);form(neck,skin,0,1.48,-3.77,.27,.2,.51);form(neck,belly,0,1.24,-3.64,.25,.09,.49);
 for(const side of [-1,1]){
  form(neck,material('#d8a05b',true),side*.32,1.79,-3.43,.065,.052,.12);
  form(neck,material('#171715'),side*.373,1.79,-3.46,.012,.045,.045);
  tube(neck,[[side*.25,1.91,-3.05],[side*.45,2.28,-2.85],[side*.65,2.58,-2.3]],[.15,.11,.006],bone,12);
  tube(neck,[[side*.31,1.56,-3.08],[side*.65,1.57,-2.85],[side*.8,1.72,-2.6]],[.13,.09,.004],skin,10);
  for(let i=0;i<4;i++)tube(neck,[[side*.23,1.35,-3.42-i*.16],[side*.21,1.24,-3.46-i*.16]],[.035,.002],bone,3);
  form(neck,material('#211e20'),side*.13,1.59,-4.14,.045,.025,.03);
 }
 const tailRoot=new THREE.Group();tailRoot.position.z=1.15;dragon.add(tailRoot);
 tube(tailRoot,[[0,0,0],[0,-.05,1.5],[.4,.15,3],[.95,.55,4.5],[1.25,1,5.6]],[.48,.32,.2,.1,.012],skin,36);
 for(let i=0;i<12;i++){
  const z=-1.5+i*.6,y=z<1.5?.76:Math.max(.25,.6-(z-1.5)*.13),x=z<1.5?0:(z-1.5)*.18;
  const spike=new THREE.Mesh(new THREE.ConeGeometry(.14, .48-i*.018,6),bone);spike.position.set(x,y,z);spike.rotation.x=.35;dragon.add(spike);
 }
 for(let row=0;row<7;row++)for(let i=0;i<5;i++){
  const a=(i-2)*.38,plate=form(dragon,skin,Math.sin(a)*.72,Math.cos(a)*.78,-1.1+row*.34,.13,.055,.19);plate.rotation.z=-a;
 }
 const legs=[];
 for(const side of [-1,1])for(const rear of [false,true]){
  const leg=new THREE.Group();leg.position.set(side*.55,-.2,rear?1.05:-.85);dragon.add(leg);
  tube(leg,[[0,0,0],[side*.4,-.55,.15],[side*.24,-1,.65],[side*.23,-1.3,.25]],[rear?.29:.2,.19,.12,.095],skin,16);
  for(let toe=0;toe<3;toe++)tube(leg,[[side*.23+(toe-1)*.13,-1.28,.3],[side*.23+(toe-1)*.18,-1.38,-.01],[side*.23+(toe-1)*.16,-1.25,-.2]],[.065,.045,.003],bone,8);
  legs.push(leg);
 }
 const wings=[];
 for(const side of [-1,1]){
  const pivot=new THREE.Group();pivot.position.set(side*.55,.3,-.65);dragon.add(pivot);
  const outline=[[0,0,0],[1.6,.45,-1.2],[3,.65,-1.55],[7.4,.2,-.7],[6.1,.02,.1],[5.8,-.02,1.8],[4.85,-.12,1.35],[4.1,-.05,2.85],[3.15,-.1,2.2],[2.1,0,3.05],[1.5,.02,2.2],[.25,0,1.65]];
  const vertices=[side*2.8,.5,-.7,...outline.flatMap(p=>[side*p[0],p[1],p[2]])],indices=[];
  for(let i=0;i<outline.length;i++)indices.push(0,i+1,(i+1)%outline.length+1);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
  const membrane=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#784d59',side:THREE.DoubleSide,roughness:.78}));pivot.add(membrane);
  const arm=[[0,0,0],[side*1.6,.45,-1.2],[side*3,.65,-1.55]];tube(pivot,arm,[.22,.15,.12],skin,16);
  for(const index of [3,5,7,9,11]){
   const tip=outline[index];tube(pivot,[[side*3,.65,-1.55],[side*(tip[0]*.65+1),.22,tip[2]*.45],[side*tip[0],tip[1],tip[2]]],[.09,.055,.012],bone,14);
  }
  tube(pivot,[[side*3,.65,-1.55],[side*3.3,1,-1.8],[side*3.2,1.2,-1.7]],[.12,.06,.003],bone,9);
  wings.push({pivot,side});
 }
 return {group:dragon,animate(time){for(const {pivot,side} of wings){pivot.rotation.z=Math.sin(time*2.1)*.32*side;pivot.rotation.x=Math.cos(time*2.1)*.07;}tailRoot.rotation.y=Math.sin(time*1.1)*.13;neck.rotation.x=Math.sin(time*.8)*.035;legs.forEach((leg,i)=>leg.rotation.x=.15+Math.sin(time*1.1+i)*.06);}};
}
export function createTownDragon(parent,box,material,district){
  const dragon=createDragon(parent,box,material),rooftop=Math.max(34,...district.buildings.map(r=>r.height+3));
  dragon.group.scale.setScalar(1.25);dragon.group.visible=false;
  return {update(time,motion){const flight=motion?dragonFlyby(time,district.span,rooftop):null;dragon.group.visible=!!flight;if(!flight)return;dragon.group.position.set(flight.x,flight.y,flight.z);dragon.group.rotation.set(0,flight.yaw,flight.bank);dragon.animate(flight.phase);}};
}
