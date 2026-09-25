import test from 'node:test';
import assert from 'node:assert/strict';
import { planRoofs, roofMeshData } from '../city/roofs.js';
const wing=(x,z,w,d,h,y=0,kind='volume')=>({x,z,w,d,h,y,kind});
test('rectangular roofs preserve the exact eave footprint on long and narrow wings',()=>{
  const [roof]=planRoofs([wing(1,-2,1.6,3.5,7)],'hip');
  const {positions}=roofMeshData(roof);
  const xs=positions.filter((_,i)=>i%3===0),zs=positions.filter((_,i)=>i%3===2);
  assert.equal(Math.min(...xs),roof.x0);assert.equal(Math.max(...xs),roof.x1);
  assert.equal(Math.min(...zs),roof.z0);assert.equal(Math.max(...zs),roof.z1);
  assert.ok(roof.z1-roof.z0>roof.x1-roof.x0+1);
});
test('lower roofs stop before neighboring taller walls',()=>{
  const parts=[wing(-1.15,0,1.7,3.5,7),wing(.9,-.35,2.2,2.8,10),wing(-.1,-.35,.45,1.4,.8,4,'bridge')];
  const roofs=planRoofs(parts,'hip');assert.equal(roofs.length,2);
  const lower=roofs.find(r=>r.partIndex===0);
  assert.ok(lower.x1<parts[1].x-parts[1].w/2);
  assert.ok(lower.x1>=parts[0].x+parts[0].w/2);
});
test('stacked terraces and connecting passages do not sprout intersecting roofs',()=>{
  const parts=[wing(0,0,4,4,3),wing(0,0,2,2,4,3),wing(2,0,.6,1,2,0,'connector')];
  const roofs=planRoofs(parts,'hip');assert.equal(roofs.length,1);assert.equal(roofs[0].partIndex,1);
});
test('each pitched roof has a watertight mesh with outward-facing triangles',()=>{
  for(const [w,d,style] of [[2,4,'spire'],[2,4,'hip'],[4,2,'hip'],[3,3,'hip']]){
  const [roof]=planRoofs([wing(0,0,w,d,8)],style);
  const {positions,indices}=roofMeshData(roof);const edges=new Map();
  for(let i=0;i<indices.length;i+=3){
    const tri=indices.slice(i,i+3);
    for(let j=0;j<3;j++){const edge=[tri[j],tri[(j+1)%3]].sort((a,b)=>a-b).join(':');edges.set(edge,(edges.get(edge)||0)+1);}
    const [a,b,c]=tri.map(n=>positions.slice(n*3,n*3+3));
    const u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]);
    const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    assert.ok(Math.hypot(...normal)>0);
    const center=[(roof.x0+roof.x1)/2,roof.y+roof.h/4,(roof.z0+roof.z1)/2];
    assert.ok(normal.reduce((n,x,j)=>n+x*(a[j]-center[j]),0)>0);
  }
  assert.ok([...edges.values()].every(n=>n===2));
  }
});
