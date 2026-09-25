import { safeRepoUrl } from './data.js';
export function createDrivingUI(city,onOpen){
  const $=id=>document.getElementById(id),host=$('viewport');
  const originalLabel=host.getAttribute('aria-label');
  const held=new Set(),touch=new Set();let goal=null,lastParkingText='',savedScroll=0;
  const mapping={KeyW:'forward',ArrowUp:'forward',KeyS:'reverse',ArrowDown:'reverse',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'brake'};
  function sync(){const active=name=>held.has(name)||touch.has(name);city.setDriveInput({throttle:Number(active('forward'))-Number(active('reverse')),steer:Number(active('right'))-Number(active('left')),brake:active('brake')});}
  function clear(){held.clear();touch.clear();sync();}
  function setMode(enabled){
    if(enabled&&!city.driving)savedScroll=window.scrollY;
    clear();host.setAttribute('aria-label',enabled?'Horse-cart view. W or Up accelerates, S or Down reverses, A and D steer, Space brakes, F opens a repository while stopped, R resets. C switches camera, E enters a nearby portal.':originalLabel);document.body.classList.toggle('driving-mode',enabled);$('drive-overlay').hidden=!enabled;
    $('drive-mode').textContent=enabled?'← Back to town':'Travel by horse cart ↗';$('drive-mode').setAttribute('aria-pressed',String(enabled));
    city.setDriving(enabled);host.focus({preventScroll:true});
    if(enabled)document.querySelector('.city-panel').scrollIntoView({block:'start',behavior:'instant'});else window.scrollTo({top:savedScroll,behavior:'instant'});
    $('rotate').setAttribute('aria-pressed',String(city.rotating));
  }
  function allowed(){const status=city.parking;return city.driving&&status.canOpen&&safeRepoUrl(status.repo?.url)?status:null;}
  $('park-link').addEventListener('click',event=>{
    const status=allowed();if(!status){event.preventDefault();return;}
    $('park-link').href=status.repo.url;onOpen(status.repo);
  });
  function open(){const status=allowed();if(!status)return;$('park-link').href=status.repo.url;$('park-link').click();}
  function keyDown(event){
    if(!city.driving||city.inKingdom||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(mapping[event.code]){event.preventDefault();held.add(mapping[event.code]);sync();}
    if(event.code==='KeyC'&&!event.repeat){event.preventDefault();city.toggleTravelView();}
    if(event.code==='KeyE'&&!event.repeat&&!$('travel-portal').hidden){event.preventDefault();clear();city.enterKingdom();}
    if(event.code==='KeyF'){event.preventDefault();if(!event.repeat)open();}
    if(event.code==='KeyR'){event.preventDefault();if(!event.repeat){clear();city.reset();}}
    if(event.code==='Escape'&&!document.fullscreenElement){event.preventDefault();setMode(false);}
  }
  function keyUp(event){if(mapping[event.code]){held.delete(mapping[event.code]);sync();}}
  document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);
  window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  for(const button of document.querySelectorAll('[data-drive]')){
    const action=button.dataset.drive;
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);touch.add(action);button.classList.add('held');sync();});
    const release=()=>{touch.delete(action);button.classList.remove('held');sync();};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  $('drive-mode').disabled=false;$('drive-to-repo').disabled=false;
  $('drive-mode').addEventListener('click',()=>{goal=null;setMode(!city.driving);});
  $('respawn').addEventListener('click',()=>{clear();city.reset();host.focus({preventScroll:true});});
  $('travel-view').addEventListener('click',()=>city.toggleTravelView());
  $('travel-portal').addEventListener('click',()=>{clear();city.enterKingdom();});
  host.addEventListener('kingdomchange',clear);
  const map=$('minimap'),ctx=map.getContext('2d');
  function minimap(car,world){
    const scale=210/(Math.max(world.bounds,Math.abs(car.x)+8,Math.abs(car.z)+8)*2),px=x=>120+x*scale,pz=z=>120+z*scale;
    ctx.clearRect(0,0,240,240);ctx.fillStyle='#0e1929';ctx.fillRect(0,0,240,240);
    ctx.strokeStyle='#344960';ctx.lineWidth=1;
    for(const bay of world.bays){ctx.fillStyle='#6687ac';ctx.fillRect(px(bay.repo.x)-2.6*scale,pz(bay.repo.z)-2.6*scale,5.2*scale,5.2*scale);ctx.fillStyle='#a4f1ce';ctx.beginPath();ctx.arc(px(bay.x),pz(bay.z),2.6,0,Math.PI*2);ctx.fill();}
    for(const landmark of world.restricted){ctx.fillStyle='#c19b63';ctx.fillRect(px(landmark.x)-2.8*scale,pz(landmark.z)-2.8*scale,5.6*scale,5.6*scale);ctx.strokeStyle='#ff7a95';ctx.strokeRect(px(landmark.x)-2.8*scale,pz(landmark.z)-2.8*scale,5.6*scale,5.6*scale);}
    if(goal){ctx.strokeStyle='#e2c2ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px(goal.x),pz(goal.z+world.parkingOffset),6,0,Math.PI*2);ctx.stroke();}
    ctx.save();ctx.translate(px(car.x),pz(car.z));ctx.rotate(car.yaw);ctx.fillStyle='#fcfaf4';ctx.shadowColor='#9ef4cd';ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(0,2);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();
  }
  city.onDriveUpdate(({car,parking,world,input,firstPerson,nearPortal})=>{
    if(!city.driving)return;
    $('travel-view').textContent=firstPerson?'First person · C':'Third person · C';$('travel-portal').hidden=!nearPortal;
    $('drive-speed').textContent=String(Math.round(Math.abs(car.speed)*3.6)).padStart(2,'0');$('drive-gear').textContent=Math.abs(car.speed)<.12?(parking.canOpen?'H':'—'):car.speed<0?'R':'→';
    $('steering-wheel').style.transform=`rotate(${(input.steer||0)*35}deg)`;
    const target=goal||parking.repo;
    if(parking.restricted){$('drive-destination').textContent=parking.label;$('drive-hint').textContent='Royal guard: No entry allowed.';}
    else if(target){const distance=Math.hypot(car.x-target.x,car.z-(target.z+world.parkingOffset));$('drive-destination').textContent=target.name;$('drive-hint').textContent=parking.canOpen?`Stopped at ${parking.repo.name}. Press F to open.`:`${distance.toFixed(1)} m to the guild stop · hold Space to brake`;}
    const label=parking.restricted?'GUARD · NO ENTRY ALLOWED':parking.canOpen?'AT THE GUILD · READY':parking.inBay?'STOP TO VISIT':'FIND A GUILD SIGN';
    if(label!==lastParkingText){$('parking-status').textContent=label;lastParkingText=label;}
    $('park-link').setAttribute('aria-disabled',String(!parking.canOpen));$('drive-overlay').classList.toggle('restricted-zone',parking.restricted);
    if(parking.canOpen)$('park-link').href=parking.repo.url;else $('park-link').removeAttribute('href');
    minimap(car,world);
  });
  return {start(repo){goal=repo||null;setMode(true);},stop(){setMode(false);}};
}
