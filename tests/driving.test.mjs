import test from 'node:test';
import assert from 'node:assert/strict';
import { createDistrict } from '../city/data.js';
import { createDriveWorld, spawnCar, stepCar, parkingStatus } from '../city/driving.js';
const district=createDistrict({repositories:[{name:'Example',bytes:100,languages:{Python:100},colors:{Python:'#3572a5'},url:'https://github.com/shiwamshoryasharma/Example'}]});

test('throttle moves the car and braking brings it to a stop',()=>{
  const world={bounds:50,colliders:[],bays:[],restricted:[]};let car={x:0,z:0,yaw:0,speed:0};
  for(let i=0;i<60;i++)car=stepCar(car,{throttle:1},1/60,world);
  assert.ok(car.z < -1 && car.speed>0);
  for(let i=0;i<120;i++)car=stepCar(car,{brake:true},1/60,world);
  assert.equal(car.speed,0);
});
test('collision and boundaries prevent driving through buildings outside bounded test worlds',()=>{
  const world={bounds:5,colliders:[{x:0,z:-2,halfX:1,halfZ:.5}],bays:[],restricted:[]};let car={x:0,z:0,yaw:0,speed:0};
  for(let i=0;i<300;i++)car=stepCar(car,{throttle:1},1/60,world);
  assert.ok(car.z> -1.2);
  car={x:4.6,z:0,yaw:Math.PI/2,speed:3};
  for(let i=0;i<60;i++)car=stepCar(car,{throttle:1},1/60,world);
  assert.ok(car.x<=5);
});
test('repository access requires both a stopped car and the correct parking bay',()=>{
  const world=createDriveWorld(district);const bay=world.bays[0];
  assert.equal(parkingStatus({x:bay.x,z:bay.z,speed:0},world).canOpen,true);
  assert.equal(parkingStatus({x:bay.x,z:bay.z,speed:1},world).canOpen,false);
  assert.equal(parkingStatus({x:bay.x+5,z:bay.z,speed:0},world).canOpen,false);
});
test('restricted landmarks have no URL or parking access',()=>{
  const world=createDriveWorld(district);assert.equal(world.restricted.length,3);
  for(const landmark of world.restricted){
    assert.equal(landmark.url,undefined);
    const status=parkingStatus({x:landmark.x,z:landmark.z+3.6,speed:0},world);
    assert.equal(status.canOpen,false);assert.equal(status.restricted,true);
  }
  assert.equal(world.bays.length,district.buildings.length);
});
test('private repository metadata never enters the public scene',()=>{
  const result=createDistrict({repositories:[{name:'secret-name',bytes:100,private:true,url:'https://github.com/shiwamshoryasharma/secret-name'}]});
  assert.equal(result.buildings.length,0);
  assert.ok(!JSON.stringify(createDriveWorld(result)).includes('secret-name'));
});
test('spawn is on a clear road and simulation is stable across frame rates',()=>{
  const world=createDriveWorld(district);const spawn=spawnCar(world);
  assert.ok(world.colliders.every(c=>Math.abs(spawn.x-c.x)>c.halfX+.3 || Math.abs(spawn.z-c.z)>c.halfZ+.3));
  const empty={bounds:100,colliders:[],bays:[],restricted:[]};
  let a={x:0,z:0,yaw:0,speed:0},b={...a};
  for(let i=0;i<60;i++)a=stepCar(a,{throttle:1,steer:.5},1/60,empty);
  for(let i=0;i<120;i++)b=stepCar(b,{throttle:1,steer:.5},1/120,empty);
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.1);
});

test('streets fit two horse carts and parking bays clear the building collision footprint',()=>{
  const world=createDriveWorld(district);
  assert.ok(district.roadWidth > 2*1.44+.8);
  for(const bay of world.bays){
    assert.ok(Math.abs(bay.z-bay.repo.z)>3+.72);
    assert.ok(Math.abs(bay.z-(bay.repo.z+district.spacing/2))+.72<=district.roadWidth/2);
  }
});


test('travel wraps continuously beyond town while the gate stays passable',()=>{
 const world=createDriveWorld(district);let cart={x:world.gateX,z:-world.bounds+2,yaw:0,speed:3};
 for(let i=0;i<180;i++)cart=stepCar(cart,{throttle:1},1/60,world);
 assert.ok(cart.z < -world.bounds);
 cart={x:world.period/2-.01,z:world.gateZ,yaw:Math.PI/2,speed:3};
 cart=stepCar(cart,{throttle:1},1/60,world);assert.ok(cart.x<0);
});
test('parking requires the horse as well as cart to fit the bay',()=>{
 const world=createDriveWorld(district),bay=world.bays[0];
 assert.equal(parkingStatus({x:bay.x,z:bay.z,speed:0,yaw:0},world).canOpen,false);
 assert.equal(parkingStatus({x:bay.x,z:bay.z,speed:0,yaw:Math.PI/2},world).canOpen,true);
});

test('a rejected steering step cannot rotate the horse into a wall',()=>{
 const world={bounds:100,period:512,colliders:[{x:1,z:-3.5,halfX:.3,halfZ:.4}],bays:[],restricted:[]};
 const cart={x:0,z:0,yaw:0,speed:3};let result=cart;
 for(let i=0;i<30;i++){
  const previous=result;result=stepCar(previous,{throttle:1,steer:1},1/60,world);
  if(result.speed===0){assert.equal(result.yaw,previous.yaw);assert.equal(result.x,previous.x);return;}
 }
 assert.fail('Expected a collision while steering toward the wall');
});
