import test from 'node:test';
import assert from 'node:assert/strict';
import { designBuilding } from '../city/architecture.js';
const base={name:'Example',language:'TypeScript',languages:[['TypeScript',1000]],bytes:1000,source_files:10};
test('architecture is stable between refreshes and independent of repository order',()=>{
  assert.deepEqual(designBuilding(base),designBuilding({...base,index:99}));
});
test('source-file growth increases the building height',()=>{
  assert.ok(designBuilding({...base,source_files:180}).height>designBuilding({...base,source_files:2}).height);
});
test('different language families produce different architecture',()=>{
  assert.notEqual(designBuilding({...base,language:'Jupyter Notebook'}).family,designBuilding(base).family);
  assert.notEqual(designBuilding({...base,language:'HTML'}).family,designBuilding({...base,language:'Python'}).family);
});
test('missing source counts are not invented and all sections stay inside their lot',()=>{
  for(const language of ['TypeScript','JavaScript','Python','HTML','Jupyter Notebook','C++']){
    const result=designBuilding({...base,language,source_files:null});
    assert.equal(result.sourceFiles,null);
    for(const part of result.parts){assert.ok(Math.abs(part.x)+part.w/2<2.5);assert.ok(Math.abs(part.z)+part.d/2<2.5);assert.ok(part.h>0);}
  }
});
