import { wrapCoordinate, wallSegments } from './world-layout.js';
import { safeRepoUrl } from './data.js';
export const CAR_RADIUS=.82;
export function createDriveWorld(district){
  const restricted=district.restricted;
  const gateX=district.columns%2?district.spacing/2:0,gateZ=district.rows%2?district.spacing/2:0;
  const bounds=district.span/2;
  const walls=wallSegments(bounds,gateX,gateZ);
  const bays=district.buildings.filter(r=>safeRepoUrl(r.url)).map(repo=>({x:repo.x,z:repo.z+district.parkingOffset,repo}));
  const colliders=[...district.buildings.map(r=>({x:r.x,z:r.z,halfX:4,halfZ:4})),...restricted.map(r=>({x:r.x,z:r.z,halfX:r.half+(r.compound?1.2:0),halfZ:r.half+(r.compound?1.2:0)}))];
  for(const lot of district.amenities){if(lot.kind==='homes'||lot.kind==='market')for(const dx of [-2,2])colliders.push({x:lot.x+dx,z:lot.z,halfX:1.55,halfZ:2.1});}
  for(const lot of restricted)colliders.push({x:lot.x+(lot.compound?2.1:1.2),z:lot.z+lot.half+1.2,halfX:.48,halfZ:.48});
  colliders.push(...walls);
  return {bounds,period:Math.ceil((district.span+400)/64)*64,gateX,gateZ,walls,parkingOffset:district.parkingOffset,colliders,bays,restricted};
}
export function spawnCar(world){
  const bay=world.bays[0];return {x:bay?bay.x-3.6:0,z:bay?bay.z:world.bounds-1,yaw:Math.PI/2,speed:0};
}
export function stepCar(previous,input,elapsed,world){
  const dt=Math.max(0,Math.min(elapsed,1/30));const car={...previous};
  const throttle=Math.max(-1,Math.min(1,input.throttle||0));const steer=Math.max(-1,Math.min(1,input.steer||0));
  if(input.brake||!throttle){const drag=(input.brake?7:1.6)*dt;car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-drag);}
  else car.speed=Math.max(-1.8,Math.min(4.2,car.speed+throttle*2.7*dt));
  car.yaw+=steer*car.speed/2.2*dt;
  let x=car.x+Math.sin(car.yaw)*car.speed*dt,z=car.z-Math.cos(car.yaw)*car.speed*dt;
  if(world.period){x=wrapCoordinate(x,world.period);z=wrapCoordinate(z,world.period);}
  const footprints=[[-.35,CAR_RADIUS],[.4,CAR_RADIUS],[1.6,.45],[2.55,.5],[3.55,.3]].map(([offset,r])=>({x:x+Math.sin(car.yaw)*offset,z:z-Math.cos(car.yaw)*offset,r}));
  const blocked=(!world.period&&(Math.abs(x)>world.bounds-CAR_RADIUS||Math.abs(z)>world.bounds-CAR_RADIUS))||footprints.some(p=>world.colliders.some(c=>Math.abs(p.x-c.x)<c.halfX+p.r&&Math.abs(p.z-c.z)<c.halfZ+p.r));
  if(blocked){car.speed=0;car.yaw=previous.yaw;}else {car.x=x;car.z=z;}
  return car;
}
export function parkingStatus(car,world){
  const restricted=world.restricted.find(r=>Math.abs(car.x-r.x)<r.half+2&&car.z>r.z-r.half-.55&&car.z<r.z+r.half+7);
  if(restricted)return {canOpen:false,restricted:true,label:restricted.name,repo:null,distance:0};
  let nearest=null,distance=Infinity;
  for(const bay of world.bays){const next=Math.hypot(car.x-bay.x,car.z-bay.z);if(next<distance){nearest=bay;distance=next;}}
  const yaw=car.yaw??Math.PI/2;
  const headX=car.x+Math.sin(yaw)*3.55,headZ=car.z-Math.cos(yaw)*3.55;
  const inBay=nearest&&Math.abs(headX-nearest.x)<3.7&&Math.abs(headZ-nearest.z)<.8&&Math.abs(car.x-nearest.x)<.85&&Math.abs(car.z-nearest.z)<.65&&Math.abs(car.x+Math.sin(yaw)*2.45-nearest.x)<3.25&&Math.abs(car.z-Math.cos(yaw)*2.45-nearest.z)<.8;
  return {canOpen:!!(inBay&&Math.abs(car.speed)<.12),restricted:false,repo:nearest?.repo||null,distance,inBay:!!inBay};
}
