import test from 'node:test';
import assert from 'node:assert/strict';
import {localLighting} from '../city/daylight.js';
import {privateLandmarks,wrapCoordinate,wallSegments} from '../city/world-layout.js';
test('lighting follows the visitor clock through night, dawn, day, and evening',()=>{
  const at=hour=>localLighting(new Date(2026,8,25,hour,0));
  assert.equal(at(2).phase,'Night');assert.equal(at(6).phase,'Dawn');assert.equal(at(12).phase,'Day');assert.equal(at(18).phase,'Evening');
  assert.ok(at(12).sun>at(2).sun);assert.ok(at(2).lamps>at(12).lamps);
});
test('an anonymous private district always has exactly one stable castle',()=>{
  for(const count of [1,2,9,20]){const lots=Array.from({length:count},(_,i)=>({x:i*16,z:0}));const result=privateLandmarks(lots);
    assert.equal(result.filter(r=>r.kind==='castle').length,1);assert.deepEqual(result,privateLandmarks(lots));
    assert.ok(result.every(r=>!r.url&&!r.repo&&['castle','mage','restaurant'].includes(r.kind)));
  }
});
test('world coordinates wrap without changing their periodic position',()=>{
  assert.equal(wrapCoordinate(129,256),-127);assert.equal(wrapCoordinate(-129,256),127);
  for(let x=-2000;x<2000;x+=13)assert.equal(wrapCoordinate(x,256),wrapCoordinate(x+256,256));
});
test('walls leave all four road gates passable',()=>{
  const segments=wallSegments(50,8,0,5);
  for(const [x,z] of [[8,50],[8,-50],[50,0],[-50,0]])assert.ok(segments.every(c=>Math.abs(x-c.x)>c.halfX||Math.abs(z-c.z)>c.halfZ));
  assert.equal(segments.length,8);
});
