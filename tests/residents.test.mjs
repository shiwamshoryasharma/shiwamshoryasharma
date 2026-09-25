import test from 'node:test';
import assert from 'node:assert/strict';
import {createDistrict} from '../city/data.js';
import {createResidentSimulation,stepResidents,RESIDENT_TYPES} from '../city/residents.js';
const district=createDistrict({repositories:[{name:'A',bytes:100},{name:'B',bytes:200}]});
test('residents include all archetypes and visit destinations beyond their starting block',()=>{
 const sim=createResidentSimulation(district);assert.deepEqual(new Set(sim.residents.map(r=>r.type)),new Set(RESIDENT_TYPES));
 const start=sim.residents.map(r=>({x:r.x,z:r.z}));let traveled=false,rested=false;
 for(let i=0;i<6000;i++){stepResidents(sim,.1);sim.residents.forEach((r,n)=>{if(Math.hypot(r.x-start[n].x,r.z-start[n].z)>district.spacing)traveled=true;if(r.visited&&r.wait>0)rested=true;});}
 assert.ok(traveled);assert.ok(rested);assert.ok(sim.residents.every(r=>r.visited>0));
});
test('residents follow pavement edges and yield to the moving cart',()=>{
 const sim=createResidentSimulation(district),r=sim.residents[0];r.wait=0;stepResidents(sim,.1);
 const before={x:r.x,z:r.z};stepResidents(sim,.1,{x:r.x,z:r.z,yaw:0,speed:2});assert.equal(r.x,before.x);assert.equal(r.z,before.z);assert.equal(r.activity,'yielding');
 for(let i=0;i<300;i++){stepResidents(sim,.1);for(const person of sim.residents)assert.ok(sim.nodes.some(n=>Math.abs(n.x-person.x)<.001)||sim.nodes.some(n=>Math.abs(n.z-person.z)<.001));}
});

test('no walking route crosses the guarded castle compound',()=>{
 const sim=createResidentSimulation(district),castle=district.restricted.find(r=>r.compound);
 const inside=p=>Math.abs(p.x-castle.x)<castle.half+.55&&Math.abs(p.z-castle.z)<castle.half+.55;
 for(const n of sim.nodes){assert.ok(!inside(n));for(const edge of n.edges){const to=sim.nodes[edge];assert.ok(!inside({x:(n.x+to.x)/2,z:(n.z+to.z)/2}));}}
});
