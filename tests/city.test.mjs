import test from 'node:test';
import assert from 'node:assert/strict';
import { createDistrict, safeRepoUrl } from '../city/data.js';

const repo = (name, bytes) => ({ name, bytes, languages: { Python: bytes }, colors: { Python: '#3572A5' }, url: `https://github.com/shiwamshoryasharma/${name}` });
test('new code repositories expand beyond twelve buildings without overlapping lots', () => {
  const { buildings, span } = createDistrict({ repositories: Array.from({length: 40}, (_, i) => repo(`repo-${i}`, 100+i)) });
  assert.equal(buildings.length,40);
  assert.equal(new Set(buildings.map(b=>`${b.x},${b.z}`)).size,40);
  assert.ok(buildings.every(b=>Math.abs(b.x)<span/2 && Math.abs(b.z)<span/2));
});
test('size controls height and each repository keeps its language identity', () => {
  const { buildings } = createDistrict({repositories:[repo('small',100),repo('large',1000000)]});
  assert.ok(buildings.find(b=>b.name==='large').height > buildings.find(b=>b.name==='small').height);
  assert.ok(buildings.every(b=>b.language==='Python' && b.color==='#3572A5'));
});
test('empty and malformed entries do not produce invalid 3D geometry', () => {
  assert.deepEqual(createDistrict({repositories:[]}).buildings,[]);
  const {buildings}=createDistrict({repositories:[null,repo('empty',0),repo('bad',NaN),repo('negative',-1),repo('valid',10)]});
  assert.equal(buildings.length,1);
  assert.ok(Number.isFinite(buildings[0].height));
});
test('repository links cannot navigate to script URLs or unrelated sites', () => {
  assert.equal(safeRepoUrl('javascript:alert(1)'),null);
  assert.equal(safeRepoUrl('https://github.com.evil.test/a'),null);
  assert.equal(safeRepoUrl('https://github.com/another-user/repo'),null);
  assert.equal(safeRepoUrl(repo('valid',1).url),repo('valid',1).url);
});

test('repositories are scattered through a residential town and clear the castle compound',()=>{
 const repositories=Array.from({length:10},(_,i)=>repo(`guild-${i}`,100+i));
 const town=createDistrict({repositories}),again=createDistrict({repositories:[...repositories].reverse()});
 assert.ok(town.columns*town.rows>=64);assert.ok(town.amenities.length>town.buildings.length*2);
 assert.deepEqual(town.buildings.map(b=>[b.name,b.x,b.z]),again.buildings.map(b=>[b.name,b.x,b.z]));
 assert.ok(new Set(town.buildings.map(b=>b.z)).size>=4);
 const castle=town.restricted.find(r=>r.kind==='castle');assert.equal(castle.compound,true);
 for(const lot of [...town.buildings,...town.amenities,...town.restricted.filter(r=>r!==castle)])assert.ok(Math.abs(lot.x-castle.x)>castle.half+4||Math.abs(lot.z-castle.z)>castle.half+4);
});
