import { safeRepoUrl } from './data.js';
export const CAR_RADIUS=.72;
export function createDriveWorld(district){
  const landmarks=['Royal Archive','Civic Authority'];
  const position=i=>({x:(i%district.columns-(district.columns-1)/2)*district.spacing,z:(Math.floor(i/district.columns)-(district.rows-1)/2)*district.spacing});
  const restricted=landmarks.map((name,i)=>({name,...position(district.buildings.length+i),kind:i?'government':'royal'}));
  const bays=district.buildings.filter(r=>safeRepoUrl(r.url)).map(repo=>({x:repo.x,z:repo.z+district.parkingOffset,repo}));
  const colliders=[...district.buildings.map(r=>({x:r.x,z:r.z,halfX:3,halfZ:3})),...restricted.map(r=>({x:r.x,z:r.z,halfX:3.15,halfZ:3.15}))];
  for(const repo of district.buildings)colliders.push({x:repo.x+3.7,z:repo.z-1.2,halfX:.43,halfZ:.8});
  return {bounds:district.span/2-.35,parkingOffset:district.parkingOffset,colliders,bays,restricted};
}
export function spawnCar(world){
  const bay=world.bays[0];return {x:bay?bay.x-3:0,z:bay?bay.z:world.bounds-1,yaw:Math.PI/2,speed:0};
}
export function stepCar(previous,input,elapsed,world){
  const dt=Math.max(0,Math.min(elapsed,1/30));const car={...previous};
  const throttle=Math.max(-1,Math.min(1,input.throttle||0));const steer=Math.max(-1,Math.min(1,input.steer||0));
  if(input.brake||!throttle){const drag=(input.brake?7:1.6)*dt;car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-drag);}
  else car.speed=Math.max(-1.8,Math.min(4.2,car.speed+throttle*2.7*dt));
  car.yaw+=steer*car.speed/2.2*dt;
  const x=car.x+Math.sin(car.yaw)*car.speed*dt,z=car.z-Math.cos(car.yaw)*car.speed*dt;
  const blocked=Math.abs(x)>world.bounds-CAR_RADIUS||Math.abs(z)>world.bounds-CAR_RADIUS||world.colliders.some(c=>Math.abs(x-c.x)<c.halfX+CAR_RADIUS&&Math.abs(z-c.z)<c.halfZ+CAR_RADIUS);
  if(blocked)car.speed=0;else {car.x=x;car.z=z;}
  return car;
}
export function parkingStatus(car,world){
  const restricted=world.restricted.find(r=>Math.abs(car.x-r.x)<3.4&&car.z-r.z>-3.4&&car.z-r.z<5.15);
  if(restricted)return {canOpen:false,restricted:true,label:restricted.name,repo:null,distance:0};
  let nearest=null,distance=Infinity;
  for(const bay of world.bays){const next=Math.hypot(car.x-bay.x,car.z-bay.z);if(next<distance){nearest=bay;distance=next;}}
  const inBay=nearest&&Math.abs(car.x-nearest.x)<1.2&&Math.abs(car.z-nearest.z)<.62;
  return {canOpen:!!(inBay&&Math.abs(car.speed)<.12),restricted:false,repo:nearest?.repo||null,distance,inBay:!!inBay};
}
