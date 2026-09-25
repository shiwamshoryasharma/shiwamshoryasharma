import test from 'node:test';
import assert from 'node:assert/strict';
import {dragonFlyby} from '../city/dragon-flight.js';
test('dragon arrives, crosses above the roofs, leaves and returns from the opposite side',()=>{
 assert.equal(dragonFlyby(0,100,30),null);
 assert.equal(dragonFlyby(11,100,30),null);
 const entry=dragonFlyby(12,100,30),middle=dragonFlyby(28,100,30),exit=dragonFlyby(43.9,100,30);
 assert.ok(entry.x < -100 && exit.x>100);assert.equal(middle.x,0);assert.ok(middle.y>39);
 assert.equal(dragonFlyby(44,100,30),null);assert.equal(dragonFlyby(110,100,30),null);
 const returning=dragonFlyby(122,100,30);assert.ok(returning.x>100);assert.ok(returning.y>30);
});
