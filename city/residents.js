// Cosmetic residents follow deterministic footpaths; they never affect repository data.
export const RESIDENT_TYPES=['adventurer','elf','dwarf','beastfolk','human','mage'];
export function residentRoutes(buildings){
  if(!buildings.length)return [];
  return Array.from({length:Math.min(18,Math.max(6,buildings.length))},(_,i)=>{
    const lot=buildings[i%buildings.length];
    return {x:lot.x,z:lot.z,type:RESIDENT_TYPES[i%RESIDENT_TYPES.length],offset:i*3.73,speed:.38+(i%3)*.055};
  });
}
export function residentPose(route,time){
  const radius=2.94,side=radius*2,perimeter=side*4;
  const distance=((route.offset+Math.max(0,time)*route.speed)%perimeter+perimeter)%perimeter;
  const edge=Math.floor(distance/side),t=distance%side;
  const points=[[-radius+t,radius],[radius,radius-t],[radius-t,-radius],[-radius,-radius+t]];
  const [x,z]=points[edge];
  return {x:route.x+x,z:route.z+z,yaw:[Math.PI/2,Math.PI,-Math.PI/2,0][edge],stride:Math.sin(distance*8)};
}
