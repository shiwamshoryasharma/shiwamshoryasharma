import test from 'node:test';
import assert from 'node:assert/strict';
import {residentRoutes,residentPose,RESIDENT_TYPES} from '../city/residents.js';
test('residents are bounded, deterministic, and include every fantasy archetype',()=>{
  const lots=Array.from({length:30},(_,i)=>({x:i*11,z:0}));
  assert.deepEqual(residentRoutes(lots),residentRoutes(lots));
  assert.equal(residentRoutes(lots).length,18);
  assert.deepEqual(new Set(residentRoutes(lots).map(r=>r.type)),new Set(RESIDENT_TYPES));
  assert.deepEqual(residentRoutes([]),[]);
});
test('residents stay on their own footpaths and keep out of repository structures',()=>{
  const route={x:12,z:-8,offset:3,speed:.4};
  for(let time=0;time<300;time+=.25){
    const p=residentPose(route,time),dx=Math.abs(p.x-route.x),dz=Math.abs(p.z-route.z);
    assert.ok(dx<=2.94001&&dz<=2.94001);
    assert.ok(dx>2.9||dz>2.9);
    assert.ok(Number.isFinite(p.yaw)&&Math.abs(p.stride)<=1);
  }
  assert.deepEqual(residentPose(route,5),residentPose(route,5));
});
