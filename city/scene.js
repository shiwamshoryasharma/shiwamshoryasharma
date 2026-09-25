import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

export function createCity(host, district, onSelect, onHover, onFailure) {
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.35;
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#0c1424');
  const span=district.span;
  scene.fog=new THREE.Fog('#0c1424',span*2,span*5);
  const camera=new THREE.PerspectiveCamera(40,1,.1,span*12);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=8;controls.maxDistance=span*3;
  controls.maxPolarAngle=Math.PI*.47;controls.minPolarAngle=.12;controls.autoRotateSpeed=.38;
  controls.enablePan=true;controls.screenSpacePanning=true;
  const hemi=new THREE.HemisphereLight('#b7d5ff','#393456',2.5);scene.add(hemi);
  const key=new THREE.DirectionalLight('#ffe3c1',3.2);key.position.set(-20,45,25);scene.add(key);
  const rim=new THREE.DirectionalLight('#a497ff',3);rim.position.set(30,20,-30);scene.add(rim);
  const geometry=new THREE.BoxGeometry(1,1,1);
  const materials=new Map();
  function material(color,glow=false){
    const id=color+glow;
    if(!materials.has(id)) materials.set(id,glow ? new THREE.MeshBasicMaterial({color}) : new THREE.MeshStandardMaterial({color,roughness:.5,metalness:.25}));
    return materials.get(id);
  }
  function box(parent,x,y,z,w,h,d,color,glow=false){
    const mesh=new THREE.Mesh(geometry,material(color,glow));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
  }
  const world=new THREE.Group();scene.add(world);
  box(world,0,-1,0,span+1,1.8,span+1,'#10172b');
  box(world,0,-.11,0,span,.16,span,'#273449');
  box(world,0,-.65,0,span+1.07,.12,span+1.07,'#8e7ce5',true);
  box(world,0,-1.96,0,span-1,.13,span-1,'#427b82',true);
  // Streets form a regular grid around the eight-unit building lots.
  const rowCenter=(district.rows-1)/2, colCenter=(district.columns-1)/2;
  for(let col=0;col<=district.columns;col++){
    const x=(col-colCenter-.5)*8;
    box(world,x,.01,0,1.65,.025,span-.8,'#111e30');
    for(let z=-span/2+1;z<span/2;z+=2.2)box(world,x,.03,z,.06,.015,.8,'#c5c8b2',true);
  }
  for(let row=0;row<=district.rows;row++){
    const z=(row-rowCenter-.5)*8;
    box(world,0,.04,z,span-.8,.025,1.65,'#111e30');
    for(let x=-span/2+1;x<span/2;x+=2.2)box(world,x,.06,z,.8,.015,.06,'#c5c8b2',true);
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
    const ctx=canvas.getContext('2d');ctx.fillStyle='#142036ee';ctx.beginPath();ctx.roundRect(1,1,510,94,25);ctx.fill();
    ctx.strokeStyle='#8299bd66';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=repo.color;ctx.beginPath();ctx.roundRect(16,18,62,60,16);ctx.fill();
    ctx.fillStyle='#ffffff';ctx.font='600 30px Segoe UI, sans-serif';ctx.fillText(String(repo.index).padStart(2,'0'),28,59);
    ctx.font='500 25px Segoe UI, sans-serif';ctx.fillStyle='#e5edff';
    let title=repo.name;while(ctx.measureText(title).width>394)title=title.slice(0,-2)+'…';ctx.fillText(title,93,58);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));
    sprite.position.set(repo.x,repo.height+2.2,repo.z);sprite.scale.set(6.5,1.22,1);sprite.renderOrder=3;scene.add(sprite);labels.push(sprite);
  }
  for(const repo of district.buildings){
    const {x,z,height:h,index}=repo;
    const accent=accents[(index-1)%accents.length];
    const baseColor=new THREE.Color(repo.color).lerp(new THREE.Color('#161f39'),.24);
    const color='#'+baseColor.getHexString();
    const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
    box(group,0,.14,0,6,.28,6,'#4c6077');
    box(group,0,.32,0,5.7,.09,5.7,accent,true);
    box(group,0,.67,0,4.7,.6,4.7,'#273b52');
    const width=index%3===0?3.65:3.25, depth=index%3===1?3.55:3.25;
    const body=box(group,0,h/2+.68,0,width,h,depth,color);body.userData.repo=repo;selectables.push(body);
    // Facade mullions, stepped rooftop crowns, a service room, and an antenna.
    for(const side of [-1,1]){
      box(group,side*(width/2+.018),h/2+.68,0,.07,h,depth+.05,accent);
      box(group,0,h/2+.68,side*(depth/2+.018),width+.05,h,.055,color);
      for(const xx of [-1,0,1])box(group,xx,h/2+.68,side*(depth/2+.04),.035,h,.035,'#728899');
    }
    for(let floor=0;floor<h;floor+=1.1){
      box(group,0,floor+.85,0,width+.12,.055,depth+.12,'#4b6275');
      for(let col=0;col<4;col++)for(let side=0;side<4;side++){
        const offset=(col-1.5)*.7;
        if((floor*10+col+side+index)%7<1)continue;
        const light=(col+side+index)%4===0?accent:'#f9db9c';
        const front=side<2;
        windowInstances.push({x:x+(front?offset:(side===2?1:-1)*(width/2+.035)),y:floor+1.17,z:z+(front?(side===0?1:-1)*(depth/2+.06):offset),w:front?.43:.035,d:front?.035:.43,color:light});
      }
    }
    box(group,0,h+.77,0,width+.2,.16,depth+.2,accent,true);
    box(group,0,h+1.13,0,width*.64,.58,depth*.64,color);
    box(group,0,h+1.46,0,width*.68,.08,depth*.68,accent,true);
    box(group,.35,h+1.75,0,.055,.6,.055,'#b6c9de');
    box(group,.35,h+2.08,0,.12,.12,.12,'#ff91c1',true);
    box(group,0,1,depth/2+.1,.8,.7,.1,'#d3f9ff',true);
    for(const side of [-1,1]){
      tree(x+side*2.5,z+2.25,index%2?'#458d87':'#867bc0');
      box(world,x+side*2.55,.12,z-2.4,.65,.16,.65,'#263d43');
      box(world,x+side*2.55,.8,z-2.4,.045,1.25,.045,'#8096aa');
      box(world,x+side*2.55,1.43,z-2.4,.28,.06,.28,accent,true);
    }
    // One miniature car parked along each block and a four-stripe crosswalk.
    box(world,x+3.5,.22,z-1.2,.55,.3,1.05,accent);
    box(world,x+3.5,.42,z-1.3,.43,.18,.5,'#344157');
    for(let n=0;n<4;n++)box(world,x-3.75+n*.24,.085,z+3.5,.12,.02,1.1,'#b8cad7',true);
    label(repo);
  }
  const windows=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({color:'#ffffff'}),windowInstances.length);
  const transform=new THREE.Object3D();
  windowInstances.forEach((win,i)=>{transform.position.set(win.x,win.y,win.z);transform.scale.set(win.w,.36,win.d);transform.updateMatrix();windows.setMatrixAt(i,transform.matrix);windows.setColorAt(i,new THREE.Color(win.color));});
  windows.instanceMatrix.needsUpdate=true;world.add(windows);
  const selection=new THREE.Mesh(new THREE.TorusGeometry(3.3,.065,6,64),new THREE.MeshBasicMaterial({color:'#d9bcff'}));
  selection.rotation.x=Math.PI/2;selection.position.y=.4;scene.add(selection);selection.visible=false;
  const stars=new THREE.BufferGeometry();const positions=[];
  for(let i=0;i<260;i++){const angle=i*2.39996, radius=span*(1.8+(i%13)/18);positions.push(Math.cos(angle)*radius,9+(i%29)*1.5,Math.sin(angle)*radius);}
  stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const starField=new THREE.Points(stars,new THREE.PointsMaterial({color:'#aebeff',size:.09,transparent:true,opacity:.65}));scene.add(starField);
  let dirty=true,disposed=false,last=0,daylight=false,selected=null;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  controls.autoRotate=!reducedMotion.matches;
  const markDirty=()=>{dirty=true;};controls.addEventListener('change',markDirty);
  const resize=()=>{const {width,height}=host.getBoundingClientRect();if(width<1||height<1)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function reset(){controls.target.set(0,4,0);const distance=span*(camera.aspect<1?2.5:1.95);camera.position.copy(new THREE.Vector3(1,.83,1.2).normalize().multiplyScalar(distance).add(controls.target));controls.update();dirty=true;}
  reset();
  function select(repo,focus=false){
    selected=repo;selection.visible=true;selection.position.set(repo.x,.4,repo.z);
    if(focus){const offset=camera.position.clone().sub(controls.target);controls.target.set(repo.x,repo.height*.45,repo.z);camera.position.copy(controls.target).add(offset);controls.update();}
    dirty=true;
  }
  function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();dirty=true;}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  function hit(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(selectables,false)[0]?.object.userData.repo;}
  const pointerDown=event=>{down={x:event.clientX,y:event.clientY,id:event.pointerId};};
  const pointerUp=event=>{if(down&&down.id===event.pointerId&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<5&&event.button===0){const repo=hit(event);if(repo)onSelect(repo);}down=null;};
  const pointerMove=event=>{if(event.pointerType==='touch'||event.buttons)return;const repo=hit(event);renderer.domElement.style.cursor=repo?'pointer':'grab';const bounds=host.getBoundingClientRect();onHover(repo,event.clientX-bounds.left,event.clientY-bounds.top);};
  const pointerLeave=()=>{onHover(null);};
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerleave',pointerLeave);
  function keyboard(event){
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
  const motionChanged=()=>{if(reducedMotion.matches){controls.autoRotate=false;host.dispatchEvent(new CustomEvent('orbitstopped'));}};
  reducedMotion.addEventListener('change',motionChanged);
  const visibilityChanged=()=>{last=0;dirty=true;};document.addEventListener('visibilitychange',visibilityChanged);
  renderer.setAnimationLoop(time=>{
    if(disposed||document.hidden)return;
    if(time-last<1000/30)return;
    const delta=last?Math.min((time-last)/1000,.1):1/30;last=time;
    const moved=controls.update(delta);
    if(dirty||moved||controls.autoRotate){renderer.render(scene,camera);dirty=false;}
  });
  return {
    reset,zoom,select,
    get rotating(){return controls.autoRotate;},
    toggleRotation(){controls.autoRotate=!controls.autoRotate;dirty=true;return controls.autoRotate;},
    toggleDaylight(){daylight=!daylight;scene.background.set(daylight?'#a1b9d4':'#0c1424');scene.fog.color.copy(scene.background);hemi.intensity=daylight?3.6:2.5;key.intensity=daylight?4.3:3.2;rim.intensity=daylight?1.2:3;renderer.toneMappingExposure=daylight?1.2:1.35;starField.visible=!daylight;dirty=true;return daylight;},
    dispose(){
      disposed=true;renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();host.removeEventListener('keydown',keyboard);document.removeEventListener('visibilitychange',visibilityChanged);reducedMotion.removeEventListener('change',motionChanged);
      renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerleave',pointerLeave);renderer.domElement.removeEventListener('webglcontextlost',lost);
      const geometries=new Set(),mats=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m.map)textures.add(m.map);}}});geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());mats.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();
    }
  };
}
