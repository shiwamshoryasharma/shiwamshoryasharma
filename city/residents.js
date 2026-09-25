export const RESIDENT_TYPES=['adventurer','elf','dwarf','beastfolk','human','mage'];
function random(resident){resident.seed=(Math.imul(resident.seed,1664525)+1013904223)>>>0;return resident.seed/4294967296;}
function pathTo(nodes,start,end){
  const queue=[start],previous=new Map([[start,null]]);
  for(let i=0;i<queue.length&&!previous.has(end);i++)for(const next of nodes[queue[i]].edges){if(!previous.has(next)){previous.set(next,queue[i]);queue.push(next);}}
  const path=[];for(let current=end;current!==start&&current!==null&&previous.has(current);current=previous.get(current))path.unshift(current);
  return path;
}
export function createResidentSimulation(district){
  const xs=[],zs=[],r=district.sidewalkOffset;
  for(let c=0;c<district.columns;c++){const x=(c-(district.columns-1)/2)*district.spacing;xs.push(x-r,x+r);}
  for(let row=0;row<district.rows;row++){const z=(row-(district.rows-1)/2)*district.spacing;zs.push(z-r,z+r);}
  const nodes=[];
  for(let z=0;z<zs.length;z++)for(let x=0;x<xs.length;x++){const id=z*xs.length+x;nodes.push({x:xs[x],z:zs[z],edges:[x>0?id-1:null,x<xs.length-1?id+1:null,z>0?id-xs.length:null,z<zs.length-1?id+xs.length:null].filter(n=>n!==null)});}
  const compounds=district.restricted.filter(lot=>lot.compound);
  const blocked=(x,z)=>compounds.some(lot=>Math.abs(x-lot.x)<lot.half+.55&&Math.abs(z-lot.z)<lot.half+.55);
  const remap=new Map(),walkable=[];
  nodes.forEach((node,id)=>{if(!blocked(node.x,node.z)){remap.set(id,walkable.length);walkable.push({...node});}});
  for(const node of walkable)node.edges=node.edges.filter(id=>remap.has(id)&&!blocked((node.x+nodes[id].x)/2,(node.z+nodes[id].z)/2)).map(id=>remap.get(id));
  nodes.splice(0,nodes.length,...walkable);
  const count=district.buildings.length?Math.min(30,Math.max(18,district.buildings.length*3)):0;
  const residents=Array.from({length:count},(_,i)=>{
    const node=i*7%nodes.length,point=nodes[node];
    return {type:RESIDENT_TYPES[i%6],seed:7919+i*104729,node,x:point.x,z:point.z,yaw:i,phase:0,stride:0,path:[],wait:1+i%5,speed:.62+(i%5)*.085,activity:'looking',visited:0};
  });
  return {nodes,residents};
}
export function stepResidents(simulation,elapsed,cart=null){
  const dt=Math.min(.1,Math.max(0,elapsed));
  for(const resident of simulation.residents){
    resident.stride=0;
    if(resident.wait>0){resident.wait-=dt;continue;}
    if(!resident.path.length){
      let target=Math.floor(random(resident)*simulation.nodes.length);
      if(target===resident.node)target=(target+5)%simulation.nodes.length;
      resident.path=pathTo(simulation.nodes,resident.node,target);resident.activity='walking';
    }
    const destination=simulation.nodes[resident.path[0]];
    if(!destination)continue;
    const dx=destination.x-resident.x,dz=destination.z-resident.z,distance=Math.hypot(dx,dz);
    const nearCart=cart&&Math.abs(cart.speed)>.15&&(Math.hypot(resident.x-cart.x,resident.z-cart.z)<3.5||Math.hypot(resident.x-cart.x-Math.sin(cart.yaw)*2.45,resident.z-cart.z+Math.cos(cart.yaw)*2.45)<3);
    if(nearCart){resident.activity='yielding';continue;}
    resident.activity='walking';
    const facing=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(facing-resident.yaw),Math.cos(facing-resident.yaw));resident.yaw+=Math.max(-dt*4,Math.min(dt*4,turn));
    const step=Math.min(distance,resident.speed*dt);
    if(distance>.001){resident.x+=dx/distance*step;resident.z+=dz/distance*step;resident.phase+=step*8;resident.stride=Math.sin(resident.phase);}
    if(distance<=resident.speed*dt+.001){resident.x=destination.x;resident.z=destination.z;resident.node=resident.path.shift();
      if(!resident.path.length){resident.visited++;resident.wait=2+random(resident)*7;resident.activity=random(resident)>.5?'resting':'looking';}
    }
  }
  for(const resident of simulation.residents){if(resident.wait<=0)continue;
    const friend=simulation.residents.find(other=>other!==resident&&other.wait>0&&Math.hypot(other.x-resident.x,other.z-resident.z)<1.5);
    if(friend){resident.activity='chatting';resident.yaw=Math.atan2(friend.x-resident.x,friend.z-resident.z);}
  }
}
