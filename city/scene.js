import { addResidents } from './characters.js';
import { addRealmScenery } from './realm.js';
import { addSettlement } from './settlement.js';
import { addLandscape } from './landscape.js';
import { createHorseCart } from './horse-cart.js';
import { createKingdom } from './kingdom.js';
import { localLighting } from './daylight.js';
import { createTownDragon } from './dragon.js';
import { addGuards } from './guards.js';
import { batchStaticBoxes } from './static-batching.js';
import { createSurfaceMaps } from './surface-materials.js';
import { addRepositoryBuilding } from './buildings.js';
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { createDriveWorld, spawnCar, stepCar, parkingStatus } from './driving.js';
import { addDriveScenery } from './drive-scenery.js';

export function createCity(host, district, onSelect, onHover, onFailure) {
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.98;
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#203335');
  const span=district.span;
  scene.fog=new THREE.Fog('#203335',span*2,span*5);
  const camera=new THREE.PerspectiveCamera(40,1,.1,span*12);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=8;controls.maxDistance=span*3;
  controls.maxPolarAngle=Math.PI*.47;controls.minPolarAngle=.12;controls.autoRotateSpeed=.38;
  controls.enablePan=true;controls.screenSpacePanning=true;
  const hemi=new THREE.HemisphereLight('#d3deed','#494339',1.65);scene.add(hemi);
  const key=new THREE.DirectionalLight('#ffe0ac',2.1);key.position.set(-20,45,25);scene.add(key);
  const rim=new THREE.DirectionalLight('#a497ff',.9);rim.position.set(30,20,-30);scene.add(rim);
  const geometry=new THREE.BoxGeometry(1,1,1);
  const surfaces=createSurfaceMaps();
  const materials=new Map();
  function material(color,glow=false,finish='plain'){
    const id=color+glow+finish;
    if(!materials.has(id)){
      const surface=finish==='plain'?{}:surfaces.get(finish);
      const mat=glow?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:finish==='slate'?.72:.88,metalness:.04,...surface});
      if(glow)mat.userData.lightColor=new THREE.Color(color);materials.set(id,mat);
    }
    return materials.get(id);
  }
  function box(parent,x,y,z,w,h,d,color,glow=false,finish='plain'){
    const mesh=new THREE.Mesh(geometry,material(color,glow,finish));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
  }
  const world=new THREE.Group();scene.add(world);
  box(world,0,-.04,0,span,.08,span,'#58636b');
  // Wide two-way streets surround each six-unit building lot.
  const rowCenter=(district.rows-1)/2, colCenter=(district.columns-1)/2;
  const spacing=district.spacing,roadWidth=district.roadWidth;
  for(let col=0;col<=district.columns;col++){
    const x=(col-colCenter-.5)*spacing;
    box(world,x,.01,0,roadWidth,.025,span-.8,'#525467');
  }
  for(let row=0;row<=district.rows;row++){
    const z=(row-rowCenter-.5)*spacing;
    box(world,0,.04,z,span-.8,.025,roadWidth,'#525467');
  }
  const accents=['#a8f5d1','#ccaaff','#ffb78d','#99ddff','#ffb3dd'];
  const windowInstances=[];
  const selectables=[];
  const labels=[];
  const treeCrown=new THREE.IcosahedronGeometry(.56,0);
  const trunk=new THREE.CylinderGeometry(.075,.12,.55,6);
  function tree(x,z,color){
    const stem=new THREE.Mesh(trunk,material('#7e6a73'));stem.position.set(x,.38,z);world.add(stem);
    const crown=new THREE.Mesh(treeCrown,material(color));crown.position.set(x,1.12,z);crown.scale.set(.8,1.25,.8);world.add(crown);
  }
  function label(repo){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#24203bee';ctx.beginPath();ctx.roundRect(1,1,510,94,25);ctx.fill();
    ctx.strokeStyle='#8299bd66';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=repo.color;ctx.beginPath();ctx.roundRect(16,18,62,60,16);ctx.fill();
    ctx.fillStyle='#ffffff';ctx.font='600 30px Segoe UI, sans-serif';ctx.fillText(String(repo.index).padStart(2,'0'),28,59);
    ctx.font='500 25px Georgia, serif';ctx.fillStyle='#e5edff';
    let title=repo.name;while(ctx.measureText(title).width>394)title=title.slice(0,-2)+'…';ctx.fillText(title,93,58);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));
    sprite.position.set(repo.x,repo.height+3.4,repo.z);sprite.scale.set(6.5,1.22,1);sprite.renderOrder=3;scene.add(sprite);labels.push(sprite);
  }
  for(const repo of district.buildings){
    const {x,z,height:h,index}=repo;
    const accent=accents[(index-1)%accents.length];
    const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
    box(group,0,.14,0,6,.28,6,'#819176');
    box(group,0,.32,0,5.7,.09,5.7,'#9b9e80');
    box(group,0,.67,0,4.7,.6,4.7,'#82735c');
    addRepositoryBuilding(repo,group,box,material,selectables,windowInstances);
    for(const side of [-1,1]){
      tree(x+side*2.45,z+1.8,index%2?'#69977b':'#b49bbb');
      box(world,x+side*2.55,.12,z-2.4,.65,.16,.65,'#263d43');
      box(world,x+side*2.55,.8,z-2.4,.045,1.25,.045,'#71583e');
      box(world,x+side*2.55,1.43,z-2.4,.22,.27,.22,'#edce86',true);
      box(world,x+side*2.55,1.61,z-2.4,.32,.07,.32,'#70573c');
      box(world,x+side*2.55,1.27,z-2.4,.3,.06,.3,'#70573c');
    }
    label(repo);
  }
  const shadowMaterial=new THREE.MeshBasicMaterial({color:'#21192d',transparent:true,opacity:.16,depthWrite:false});
  for(const lot of [...district.buildings,...district.restricted,...district.amenities]){
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(4.8,24),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.set(lot.x,.065,lot.z);world.add(shadow);
  }
  addRealmScenery(world,district,box,material);
  const citizens=addResidents(world,district,box,material);
  const litWindowMaterial=new THREE.MeshBasicMaterial({color:'#9b9b9b'});
  const darkWindowMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.3,metalness:.35});
  const transform=new THREE.Object3D();
  for(const lit of [false,true]){
    const panes=windowInstances.filter(win=>win.lit===lit);
    const windows=new THREE.InstancedMesh(geometry,lit?litWindowMaterial:darkWindowMaterial,panes.length);
    panes.forEach((win,i)=>{transform.position.set(win.x,win.y,win.z);transform.scale.set(win.w,win.h,win.d);transform.updateMatrix();windows.setMatrixAt(i,transform.matrix);windows.setColorAt(i,new THREE.Color(win.color));});
    windows.instanceMatrix.needsUpdate=true;world.add(windows);
  }
  const selection=new THREE.Mesh(new THREE.TorusGeometry(3.3,.065,6,64),new THREE.MeshBasicMaterial({color:'#d9bcff'}));
  selection.rotation.x=Math.PI/2;selection.position.y=.4;scene.add(selection);selection.visible=false;
  const stars=new THREE.BufferGeometry();const positions=[];
  for(let i=0;i<260;i++){const angle=i*2.39996, radius=span*(1.8+(i%13)/18);positions.push(Math.cos(angle)*radius,9+(i%29)*1.5,Math.sin(angle)*radius);}
  stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const starField=new THREE.Points(stars,new THREE.PointsMaterial({color:'#aebeff',size:.09,transparent:true,opacity:.65,fog:false}));scene.add(starField);
  const driveWorld=createDriveWorld(district);
  addDriveScenery(scene,world,box,material,driveWorld);
  const settlement=addSettlement(world,district,driveWorld,box,material);
  selectables.push(...settlement.selectables);
  const guards=addGuards(world,driveWorld,box,material);selectables.push(...guards.selectables);
  const landscape=addLandscape(scene,driveWorld,material);
  const cart=createHorseCart(world,box,material);
  const kingdom=createKingdom(scene,box,material);
  const townDragon=createTownDragon(world,box,material,district);let worldTime=0;
  // Roads continue through all four wall openings into the surrounding countryside.
  box(world,driveWorld.gateX,.015,0,roadWidth,.025,driveWorld.period*3,'#525467');
  box(world,0,.015,driveWorld.gateZ,driveWorld.period*3,.025,roadWidth,'#525467');
  batchStaticBoxes(world,geometry);
  let driveMode=false,car=spawnCar(driveWorld),driveInput={},driveObserver=()=>{},orbitState=null,accumulator=0,lastHud=0;
  let dirty=true,disposed=false,last=0,selected=null,firstPerson=false,kingdomActive=false,kingdomTime=0,kingdomState=null,lastLighting=-Infinity;
  let lighting=localLighting();
  function updateLighting(){
    lighting=localLighting();scene.background.set(lighting.sky);scene.fog.color.copy(scene.background);
    hemi.intensity=lighting.ambient*.7;key.intensity=lighting.sun*1.2;key.color.set(lighting.color);
    key.position.set(Math.cos(lighting.hour/24*Math.PI*2)*45,35,25);
    for(const mat of materials.values())if(mat.userData.lightColor)mat.color.copy(mat.userData.lightColor).multiplyScalar(.4+lighting.lamps*.6);
    rim.intensity=.35;litWindowMaterial.color.setScalar(.38+lighting.lamps*.62);
    starField.material.opacity=lighting.lamps*.7;starField.visible=lighting.lamps>.5;
    host.dispatchEvent(new CustomEvent('worldclock',{detail:{phase:lighting.phase,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}}));dirty=true;
  }
  function driveCamera(delta=1){
    const forward=new THREE.Vector3(Math.sin(car.yaw),0,-Math.cos(car.yaw));
    const seat=new THREE.Vector3(car.x,1.85,car.z);
    const desired=seat.clone().addScaledVector(forward,firstPerson?.25:-6.5);desired.y=firstPerson?1.85:4.4;
    // Pull the chase camera forward before it passes through nearby walls or houses.
    if(!firstPerson){for(let t=.12;t<=1;t+=.08){const p=seat.clone().lerp(desired,t);if(driveWorld.colliders.some(c=>Math.abs(p.x-c.x)<c.halfX+.3&&Math.abs(p.z-c.z)<c.halfZ+.3)){desired.copy(seat.clone().lerp(desired,Math.max(0,t-.1)));break;}}}
    const snap=delta===1||camera.position.distanceTo(seat)>driveWorld.period/3||firstPerson;
    camera.position.lerp(desired,snap?1:1-Math.exp(-delta*10));camera.lookAt(seat.clone().addScaledVector(forward,firstPerson?12:3));
  }
  function emitDrive(){driveObserver({car:{...car},parking:parkingStatus(car,driveWorld),world:driveWorld,input:{...driveInput},firstPerson,nearPortal:Math.hypot(car.x-driveWorld.gateX,car.z+driveWorld.bounds)<10});}
  function setDriving(enabled){
    if(kingdomActive)leaveKingdom();if(driveMode===enabled)return;
    driveMode=enabled;driveInput={};car.speed=0;accumulator=0;last=0;cart.group.visible=enabled;labels.forEach(label=>label.visible=!enabled);onHover(null);
    if(enabled){orbitState={position:camera.position.clone(),target:controls.target.clone(),rotating:controls.autoRotate};controls.autoRotate=false;controls.enabled=false;camera.fov=65;driveCamera();}
    else{landscape.update(0,0);starField.position.set(0,0,0);controls.enabled=true;camera.fov=40;camera.position.copy(orbitState.position);controls.target.copy(orbitState.target);controls.autoRotate=orbitState.rotating;controls.update();}
    scene.fog.near=enabled?35:span*2;scene.fog.far=enabled?Math.min(180,driveWorld.period/2-driveWorld.bounds-10):span*5;
    camera.updateProjectionMatrix();dirty=true;emitDrive();
  }
  function enterKingdom(){
    if(kingdomActive)return;driveInput={};car.speed=0;
    kingdomState={position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov,rotating:controls.autoRotate};
    kingdomActive=true;kingdomTime=0;controls.enabled=false;controls.autoRotate=false;world.visible=false;landscape.group.visible=false;scene.fog.near=200;scene.fog.far=500;
    kingdom.group.visible=true;selection.visible=false;labels.forEach(l=>l.visible=false);camera.fov=50;camera.updateProjectionMatrix();
    host.dispatchEvent(new CustomEvent('kingdomchange',{detail:true}));dirty=true;
  }
  function leaveKingdom(){
    if(!kingdomActive)return;kingdomActive=false;scene.fog.near=driveMode?35:span*2;scene.fog.far=driveMode?Math.min(180,driveWorld.period/2-driveWorld.bounds-10):span*5;world.visible=true;landscape.group.visible=true;kingdom.group.visible=false;
    labels.forEach(l=>l.visible=!driveMode);selection.visible=!!selected;camera.position.copy(kingdomState.position);controls.target.copy(kingdomState.target);
    camera.fov=kingdomState.fov;camera.updateProjectionMatrix();controls.enabled=!driveMode;controls.autoRotate=kingdomState.rotating;
    host.dispatchEvent(new CustomEvent('kingdomchange',{detail:false}));dirty=true;
  }
  function findPortal(){if(driveMode||kingdomActive)return;controls.autoRotate=false;controls.target.set(driveWorld.gateX,3,-driveWorld.bounds);camera.position.set(driveWorld.gateX+9,9,-driveWorld.bounds+17);controls.update();dirty=true;}
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  controls.autoRotate=!reducedMotion.matches;
  let citizensMoving=!reducedMotion.matches,citizenTime=0,citizenIndex=-1,inView=false;
  const visibilityObserver=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;last=0;dirty=true;},{rootMargin:'120px'});visibilityObserver.observe(host);
  const markDirty=()=>{dirty=true;};controls.addEventListener('change',markDirty);
  const resize=()=>{const {width,height}=host.getBoundingClientRect();if(width<1||height<1)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function reset(){if(kingdomActive)return;if(driveMode){car=spawnCar(driveWorld);driveInput={};driveCamera();emitDrive();dirty=true;return;}controls.target.set(0,4,0);const distance=span*(camera.aspect<1?2.25:1.7);camera.position.copy(new THREE.Vector3(1,.83,1.2).normalize().multiplyScalar(distance).add(controls.target));controls.update();dirty=true;}
  reset();
  function select(repo,focus=false){
    selected=repo;selection.visible=true;selection.position.set(repo.x,.4,repo.z);
    if(focus&&!driveMode&&!kingdomActive){const offset=camera.position.clone().sub(controls.target);controls.target.set(repo.x,repo.height*.45,repo.z);camera.position.copy(controls.target).add(offset);controls.update();}
    dirty=true;
  }
  function zoom(factor){if(driveMode||kingdomActive)return;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();dirty=true;}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  function hit(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(selectables,false)[0]?.object.userData;}
  const pointerDown=event=>{if(kingdomActive)return;down={x:event.clientX,y:event.clientY,id:event.pointerId};};
  const pointerUp=event=>{if(kingdomActive)return;if(down&&down.id===event.pointerId&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<5&&event.button===0){const target=hit(event);if(target?.portal)enterKingdom();else if(target?.guard){guards.greet(target.guard);dirty=true;}else if(target?.repo&&!driveMode)onSelect(target.repo);}down=null;};
  const pointerMove=event=>{if(driveMode||event.pointerType==='touch'||event.buttons)return;const target=hit(event),repo=target?.repo;renderer.domElement.style.cursor=target?'pointer':'grab';const bounds=host.getBoundingClientRect();onHover(repo,event.clientX-bounds.left,event.clientY-bounds.top);};
  const pointerLeave=()=>{onHover(null);};
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerleave',pointerLeave);
  function keyboard(event){
    if(driveMode||kingdomActive)return;
    if(event.target!==host&&event.target!==renderer.domElement)return;
    const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home'];if(!keys.includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home')return reset();if(['+','='].includes(event.key))return zoom(.85);if(['-','_'].includes(event.key))return zoom(1.18);
    const horizontal=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
    const vertical=event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0;
    if(event.shiftKey){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);const up=new THREE.Vector3().setFromMatrixColumn(camera.matrix,1);const delta=right.multiplyScalar(horizontal*1.4).add(up.multiplyScalar(-vertical*1.4));camera.position.add(delta);controls.target.add(delta);}
    else{const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));spherical.theta-=horizontal*.13;spherical.phi=THREE.MathUtils.clamp(spherical.phi+vertical*.1,controls.minPolarAngle,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));}
    controls.update();dirty=true;
  }
  host.addEventListener('keydown',keyboard);
  const lost=event=>{event.preventDefault();renderer.setAnimationLoop(null);onFailure('The graphics connection was interrupted. Reload to reopen the 3D view; repository links still work.');};
  renderer.domElement.addEventListener('webglcontextlost',lost);
  const motionChanged=()=>{if(reducedMotion.matches){controls.autoRotate=false;citizensMoving=false;citizens.update(citizenTime,false);dirty=true;host.dispatchEvent(new CustomEvent('orbitstopped'));host.dispatchEvent(new CustomEvent('citizenspaused'));}};
  reducedMotion.addEventListener('change',motionChanged);
  const visibilityChanged=()=>{last=0;dirty=true;if(document.hidden){driveInput={};car.speed=0;}};document.addEventListener('visibilitychange',visibilityChanged);
  renderer.setAnimationLoop(time=>{
    if(disposed||document.hidden||!inView)return;
    if(time-last<1000/30)return;
    const delta=last?Math.min((time-last)/1000,.1):1/30;last=time;
    let moved=false;
    if(time-lastLighting>30000){updateLighting();lastLighting=time;}
    if(kingdomActive){if(reducedMotion.matches&&!dirty)return;kingdomTime+=reducedMotion.matches?0:delta;kingdom.update(kingdomTime,!reducedMotion.matches);camera.position.set(Math.sin(kingdomTime*.055+.5)*58,30+Math.sin(kingdomTime*.1)*2,Math.cos(kingdomTime*.055+.5)*58);camera.lookAt(0,11,0);renderer.render(scene,camera);dirty=false;return;}
    if(guards.update(driveMode?car:camera.position))dirty=true;
    if(citizensMoving){citizenTime+=delta;citizens.update(citizenTime,true,driveMode?car:null);dirty=true;}
    if(!reducedMotion.matches){worldTime+=delta;settlement.update(worldTime);townDragon.update(worldTime,true);dirty=true;}else townDragon.update(worldTime,false);
    if(driveMode){
      accumulator+=delta;
      while(accumulator>=1/60){car=stepCar(car,driveInput,1/60,driveWorld);accumulator-=1/60;}
      driveCamera(delta);cart.update(car,delta,firstPerson);landscape.update(car.x,car.z,true);starField.position.set(car.x,0,car.z);moved=true;
      if(time-lastHud>100){emitDrive();lastHud=time;}
    }else moved=controls.update(delta);
    if(dirty||moved||controls.autoRotate){renderer.render(scene,camera);dirty=false;}
  });
  return {
    reset,zoom,select,setDriving,enterKingdom,leaveKingdom,findPortal,
    get inKingdom(){return kingdomActive;},
    toggleTravelView(){firstPerson=!firstPerson;driveCamera();emitDrive();dirty=true;return firstPerson;},
    get driving(){return driveMode;},
    get residentsMoving(){return citizensMoving;},
    toggleResidents(){citizensMoving=!citizensMoving;citizens.update(citizenTime,citizensMoving);dirty=true;return citizensMoving;},
    meetResident(){
      if(driveMode||!citizens.residents.length)return null;
      const resident=citizens.residents[++citizenIndex%citizens.residents.length];
      controls.autoRotate=false;
      const position=resident.group.position;
      const front=new THREE.Vector3(Math.sin(resident.group.rotation.y),0,Math.cos(resident.group.rotation.y));
      controls.target.set(position.x,1.1,position.z);camera.position.copy(controls.target).add(front.multiplyScalar(3.1)).add(new THREE.Vector3(.8,.5,.4));
      controls.update();dirty=true;return resident.name;
    },
    get parking(){return parkingStatus(car,driveWorld);},
    setDriveInput(input){driveInput={...input};},
    onDriveUpdate(callback){driveObserver=callback;},
    get rotating(){return controls.autoRotate;},
    toggleRotation(){controls.autoRotate=!controls.autoRotate;dirty=true;return controls.autoRotate;},
    dispose(){
      disposed=true;renderer.setAnimationLoop(null);observer.disconnect();visibilityObserver.disconnect();controls.dispose();host.removeEventListener('keydown',keyboard);document.removeEventListener('visibilitychange',visibilityChanged);reducedMotion.removeEventListener('change',motionChanged);
      renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerleave',pointerLeave);renderer.domElement.removeEventListener('webglcontextlost',lost);
      const geometries=new Set(),mats=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m.map)textures.add(m.map);}}});surfaces.dispose();geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());mats.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();
    }
  };
}
