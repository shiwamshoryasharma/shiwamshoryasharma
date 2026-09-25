import * as THREE from 'three';
export function createHorseCart(parent,box,material){
  const group=new THREE.Group();group.userData.dynamic=true;parent.add(group);
  const sphere=new THREE.SphereGeometry(1,12,8),cylinder=new THREE.CylinderGeometry(1,1,1,10);
  const form=(parent,geo,color,x,y,z,sx,sy,sz)=>{const mesh=new THREE.Mesh(geo,material(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;};
  box(group,0,.65,0,1.5,.2,1.95,'#6c4133');
  for(const x of [-.7,.7]){box(group,x,1.02,0,.12,.65,1.95,'#975c43');box(group,x,1.38,0,.16,.1,2,'#d1a371');}
  box(group,0,1.04,.92,1.42,.65,.12,'#88503e');box(group,0,1.06,-.92,1.4,.5,.12,'#88503e');
  for(let z=-.75;z<.95;z+=.25)box(group,0,.78,z,1.3,.055,.18,'#b07a54');
  box(group,0,1.15,-.58,1.25,.17,.45,'#382d4a');box(group,0,1.43,-.36,1.25,.45,.1,'#654268');
  const wheels=[];
  for(const side of [-1,1])for(const z of [-.66,.66]){
    const wheel=new THREE.Group();wheel.position.set(side*.87,.44,z);group.add(wheel);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.41,.055,8,16),material('#3e3344'));rim.rotation.y=Math.PI/2;wheel.add(rim);
    for(let i=0;i<4;i++){const spoke=box(wheel,0,0,0,.07,.76,.055,'#bc9367');spoke.rotation.x=i*Math.PI/4;}
    form(wheel,sphere,'#c5a682',0,0,0,.095,.095,.095);wheels.push(wheel);
  }
  const horse=new THREE.Group();horse.position.z=-2.55;group.add(horse);
  form(horse,sphere,'#a87655',0,1.2,0,.38,.48,.78);
  form(horse,sphere,'#74513d',0,1.34,.56,.32,.4,.3);
  const neck=form(horse,cylinder,'#b7845c',0,1.62,-.62,.22,.85,.23);neck.rotation.x=-.5;
  const head=form(horse,sphere,'#b98965',0,1.98,-.94,.19,.26,.4);head.rotation.x=-.18;
  form(horse,sphere,'#d5b59b',0,1.85,-1.22,.17,.16,.18);
  for(const side of [-1,1]){
    const ear=form(horse,sphere,'#b58662',side*.105,2.3,-.9,.055,.18,.065);ear.rotation.z=-side*.17;
    form(horse,sphere,'#191927',side*.172,2.03,-1.04,.025,.035,.05);
  }
  box(horse,0,1.91,-.54,.07,.6,.13,'#3c2d36');
  const tail=form(horse,cylinder,'#382b35',0,1.03,.88,.085,.8,.085);tail.rotation.x=-.35;
  const legs=[];
  for(const side of [-1,1])for(const z of [-.48,.46]){
    const leg=new THREE.Group();leg.position.set(side*.245,1.03,z);horse.add(leg);
    form(leg,cylinder,'#906046',0,-.32,0,.07,.62,.07);form(leg,cylinder,'#d7c7b8',0,-.69,0,.055,.24,.055);box(leg,0,-.87,-.025,.13,.12,.17,'#302b34');legs.push({leg,phase:side*(z>0?1:-1)});
  }
  // Shafts and reins visibly connect the horse to its carriage.
  for(const side of [-1,1]){
    box(group,side*.5,.86,-1.55,.06,.06,2.4,'#c1a073');
    const line=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.4,1.5,-.65),new THREE.Vector3(side*.3,1.3,-1.8),new THREE.Vector3(side*.2,1.87,-3.55)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(line,10,.018,4,false),material('#372b32')));
    box(horse,side*.36,1.3,-.3,.03,.5,.08,'#46323b');
  }
  const driver=new THREE.Group();group.add(driver);box(driver,0,1.48,-.58,.38,.5,.25,'#555185');form(driver,sphere,'#cfa788',0,1.87,-.58,.15,.17,.15);form(driver,cylinder,'#483b63',0,2.02,-.58,.21,.07,.2);
  let phase=0;
  function update(car,dt,firstPerson){group.position.set(car.x,0,car.z);group.rotation.y=-car.yaw;phase+=car.speed*dt*3.4;
    for(const wheel of wheels)wheel.rotation.x=-phase;
    for(const {leg,phase:offset} of legs)leg.rotation.x=Math.abs(car.speed)>.05?Math.sin(phase+offset*Math.PI/2)*.5:0;
    horse.position.y=Math.abs(car.speed)>.05?Math.abs(Math.sin(phase*2))*.025:0;driver.visible=!firstPerson;
  }
  group.visible=false;return {group,update};
}
