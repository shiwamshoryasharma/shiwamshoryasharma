import * as THREE from 'three';
export function addGuards(world,map,box,material){
 const guards=[],selectables=[];
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#f4e8ef';ctx.beginPath();ctx.roundRect(3,3,506,114,22);ctx.fill();ctx.fillStyle='#422745';ctx.font='600 36px Georgia,serif';ctx.textAlign='center';ctx.fillText('No entry allowed.',256,73);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 for(const lot of map.restricted){
  const group=new THREE.Group();group.userData.dynamic=true;group.position.set(lot.x+(lot.compound?2.1:1.2),.12,lot.z+lot.half+1.2);world.add(group);
  const armor='#9facc3',cloth=lot.kind==='castle'?'#8d415f':'#5f518b';
  const torso=box(group,0,1,0,.55,.65,.32,armor);box(group,0,.68,0,.52,.35,.37,cloth);
  for(const side of [-1,1]){box(group,side*.16,.36,0,.16,.5,.19,'#55526a');box(group,side*.16,.11,.08,.22,.17,.33,'#494357');box(group,side*.38,1.1,0,.24,.27,.36,armor);box(group,side*.36,.8,0,.15,.43,.19,armor);}
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),material(armor));head.position.set(0,1.55,0);group.add(head);
  box(group,0,1.54,.224,.34,.09,.03,'#272839');box(group,0,1.41,.23,.035,.23,.045,'#d3c1bb');
  const plume=new THREE.Mesh(new THREE.ConeGeometry(.12,.45,6),material(cloth));plume.position.set(0,1.92,-.02);plume.rotation.x=-.4;group.add(plume);
  box(group,.53,1.05,.03,.045,2.1,.045,'#856348');const spear=new THREE.Mesh(new THREE.ConeGeometry(.11,.35,4),material('#cfcbdf'));spear.position.set(.53,2.25,.03);group.add(spear);
  const shield=box(group,-.39,.89,.26,.44,.67,.1,cloth);box(group,-.39,.92,.32,.055,.45,.035,'#dfba8f');box(group,-.39,1.02,.32,.3,.055,.035,'#dfba8f');
  const bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));bubble.position.set(0,2.8,0);bubble.scale.set(4.1,1.03,1);bubble.renderOrder=5;bubble.visible=false;group.add(bubble);
  const guard={group,bubble,lot,until:0};guards.push(guard);torso.userData.guard=guard;shield.userData.guard=guard;selectables.push(torso,shield);
 }
 return {selectables,greet(guard){guard.until=performance.now()+5000;},update(visitor){let speaking=false,changed=false;for(const guard of guards){const near=visitor&&Math.hypot(visitor.x-guard.group.position.x,visitor.z-guard.group.position.z,(visitor.y??1.8)-1.5)<8;const visible=!!near||performance.now()<guard.until;changed ||= guard.bubble.visible!==visible;guard.bubble.visible=visible;speaking ||= visible;if(near)guard.group.rotation.y=Math.atan2(visitor.x-guard.group.position.x,visitor.z-guard.group.position.z);else guard.group.rotation.y=0;}return speaking||changed;}};
}
