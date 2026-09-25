import * as THREE from 'three';
export function addCastle(parent,box,material,{x=0,z=0,scale=1}={}){
  const castle=new THREE.Group();castle.position.set(x,0,z);castle.scale.setScalar(scale);parent.add(castle);
  box(castle,0,.2,0,8.3,.4,8.3,'#55526a');box(castle,0,3.5,0,6.6,6.6,5.8,'#888981',false,'stone');
  box(castle,0,7.1,-.5,3.3,13.6,3.4,'#9e9c91',false,'stone');
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(.7,.8,8.8,10),material('#aaa59a',false,'stone'));tower.position.set(sx*3.25,4.6,sz*3.1);castle.add(tower);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1.05,3,10),material('#493575'));roof.position.set(sx*3.25,10.4,sz*3.1);castle.add(roof);
    box(castle,sx*3.25,12.3,sz*3.1,.045,.9,.045,'#d6b083');box(castle,sx*3.25+.28,12.55,sz*3.1,.55,.32,.03,'#a84067');
  }
  const crown=new THREE.Mesh(new THREE.ConeGeometry(2.65,3.4,4),material('#34366f'));crown.rotation.y=Math.PI/4;crown.position.set(0,15.6,-.5);castle.add(crown);
  for(let x=-2.7;x<=2.8;x+=.9){box(castle,x,7.1,2.85,.5,.85,.65,'#aca1b6');box(castle,x,7.1,-2.85,.5,.85,.65,'#aca1b6');}
  for(const x of [-2,0,2])for(const y of [2.2,4.6])box(castle,x,y,2.94,.35,.65,.06,'#d1ae83',true);
  for(const y of [8,10.3,12.5])box(castle,0,y,1.23,.45,.8,.055,'#c8b3f5',true);
  for(const side of [-1,1])for(const y of [2.2,4.6])for(const z of [-1.7,0,1.7])box(castle,side*3.34,y,z,.055,.7,.34,'#cbb0e1',true);
  for(const y of [8,10.3,12.5]){box(castle,0,y,-2.23,.45,.8,.055,'#c8b3f5',true);for(const side of [-1,1])box(castle,side*1.68,y,-.5,.055,.8,.45,'#c8b3f5',true);}
  box(castle,0,1.25,3.03,1.6,2.1,.1,'#30253c');for(let x=-.65;x<.8;x+=.25)box(castle,x,1.3,3.12,.045,2.2,.045,'#9b859e');
  for(const side of [-1,1]){
    for(const z of [-2.4,0,2.4])box(castle,side*3.45,3.1,z,.36,5.9,.42,'#7f817b',false,'stone');
    for(const y of [3,6,9,12]){box(castle,0,y,-2.24,3.55,.16,.2,'#777970');box(castle,side*1.71,y,-.5,.17,.16,3.6,'#777970');}
  }
  return castle;
}
export function addCottage(parent,box,material,x,z,color='#61566c',scale=1){
  const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);parent.add(group);
  const variant=Math.abs(Math.round(x*13+z*7))%3,wall=['#b9b1a0','#a9a6a0','#c3b6a3'][variant],wood='#493d36';
  box(group,0,.22,0,2.65,.44,3.65,'#817d76',false,'stone');
  box(group,0,1.58,0,2.5,2.5,3.5,wall,false,'plaster');
  // Separate plaster gables and slate slopes give each surface its proper material.
  const gables=new THREE.BufferGeometry();gables.setAttribute('position',new THREE.Float32BufferAttribute([-1.25,2.82,1.75,1.25,2.82,1.75,0,4.15,1.75,1.25,2.82,-1.75,-1.25,2.82,-1.75,0,4.15,-1.75],3));gables.computeVertexNormals();group.add(new THREE.Mesh(gables,material(wall,false,'plaster')));
  for(const side of [-1,1]){
    const pos=[0,4.24,-2,side*1.47,2.72,-2,0,4.24,2,side*1.47,2.72,2];
    const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));roof.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,2,1,2],2));roof.setIndex(side>0?[0,2,1,1,2,3]:[0,1,2,1,3,2]);roof.computeVertexNormals();group.add(new THREE.Mesh(roof,material(color,false,'slate')));
    box(group,side*1.46,2.72,0,.13,.16,4.12,wood,false,'wood');
    for(const front of [-1,1]){
      box(group,side*1.22,1.66,front*1.78,.14,2.65,.13,wood,false,'wood');
      const rafter=box(group,side*.72,3.47,front*2.025,.12,2.12,.12,wood,false,'wood');rafter.rotation.z=side*.77;
    }
    // Side windows, leaded mullions, shutters, and stone lintels.
    for(const depth of [-.82,.82]){
      box(group,side*1.266,1.75,depth,.035,.72,.55,'#26313a');
      for(const edge of [-1,1]){box(group,side*1.3,1.75+edge*.41,depth,.13,.1,.78,wood);box(group,side*1.3,1.75,depth+edge*.32,.12,.78,.08,wood);}
      box(group,side*1.31,1.75,depth,.035,.68,.04,'#ad9980');box(group,side*1.32,1.75,depth,.035,.035,.58,'#ad9980');
      box(group,side*1.33,1.25,depth,.22,.11,.85,'#979184',false,'stone');
    }
  }
  for(const y of [.45,2.58,2.87])box(group,0,y,1.79,2.52,.12,.1,wood,false,'wood');
  for(const side of [-1,1])box(group,side*1.28,2.57,0,.12,.13,3.6,wood,false,'wood');
  box(group,0,3.43,1.8,.13,1.2,.11,wood);box(group,0,3.35,1.82,.4,.42,.035,'#29303a');
  box(group,-.35,1.18,1.8,.81,1.76,.12,'#664a36',false,'wood');
  for(const side of [-1,1])box(group,-.35+side*.48,1.2,1.84,.12,1.96,.2,'#8b8579',false,'stone');
  box(group,-.35,2.18,1.84,1.1,.18,.23,'#9f9887',false,'stone');
  for(const y of [.7,1.6])box(group,-.35,y,1.89,.73,.065,.035,'#393737');box(group,-.11,1.18,1.92,.06,.08,.04,'#b09262');
  box(group,-.35,.2,2.02,1.15,.24,.45,'#8d887d',false,'stone');
  box(group,.76,1.75,1.8,.46,.66,.05,'#39414a');
  for(const side of [-1,1]){box(group,.76+side*.3,1.75,1.86,.14,.76,.08,wood,false,'wood');box(group,.76,1.75+side*.38,1.86,.74,.1,.13,wood);}
  box(group,.76,1.75,1.88,.035,.6,.03,'#c5b28d');box(group,.76,1.75,1.89,.44,.04,.025,'#c5b28d');
  box(group,.76,1.28,1.97,.76,.2,.3,'#705240',false,'wood');
  for(let i=0;i<4;i++){box(group,.5+i*.17,1.42,1.99,.09,.13,.1,i%2?'#7b8563':'#985465');}
  box(group,-.94,2.07,1.98,.1,.27,.12,'#dfac6e',true);box(group,-.94,2.25,1.98,.2,.065,.21,'#3d3736');
  box(group,.72,3.95,-.72,.42,1.3,.49,'#8b8277',false,'stone');box(group,.72,4.64,-.72,.57,.13,.61,'#655f58');box(group,.72,4.72,-.72,.28,.06,.32,'#2e2d2b');
  box(group,0,4.24,0,.14,.12,4.12,'#69616b');
  return group;
}
export function addCastleCompound(parent,box,material,lot){
  const group=new THREE.Group();group.position.set(lot.x,0,lot.z);parent.add(group);
  box(group,0,.18,0,25,.36,25,'#777284');box(group,0,.4,0,22.5,.12,22.5,'#a59aab');
  const palace=addCastle(group,box,material,{z:-3,scale:1.45});palace.scale.y=1.8;
  for(const side of [-1,1]){
    box(group,side*11.7,2,0,.65,4,23.5,'#93938b',false,'stone');box(group,0,2,side*-11.7,23.5,4,.65,'#93938b',false,'stone');
    // Side galleries and sloping slate roofs enrich the palace silhouette.
    box(group,side*7.5,3.4,-3,3.2,6.4,9,'#a297ad');
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1,1,4),material('#575181'));roof.rotation.y=Math.PI/4;roof.position.set(side*7.5,7.5,-3);roof.scale.set(2.7,2.3,6.8);group.add(roof);
    for(const z of [-6,-3,0]){box(group,side*9.14,3.2,z,.045,1.2,.5,'#bca7da',true);box(group,side*9.18,4.8,z,.08,.12,.8,'#d0bccb');}
    for(const z of [-11,11]){
      const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.65,7,12),material('#9d9c95',false,'stone'));tower.position.set(side*11,3.7,z);group.add(tower);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(1.85,3.2,12),material('#664e84'));roof.position.set(side*11,8.75,z);group.add(roof);
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2;box(group,side*11+Math.sin(a)*1.35,7.25,z+Math.cos(a)*1.35,.4,.7,.4,'#c0b0c2');}
      box(group,side*11,10.9,z,.065,1.6,.065,'#c5a07f');box(group,side*11+.43,11.3,z,.9,.55,.04,side<0?'#a24d70':'#5b61a3');
    }
    for(let v=-9.5;v<=10;v+=1.25){box(group,side*11.7,4.3,v,.85,.7,.65,'#c1b3c7');box(group,v,4.3,side*11.7,.65,.7,.85,'#c1b3c7');}
  }
  // An imposing closed gatehouse sits in front of the courtyard wall.
  for(const side of [-1,1]){
    box(group,side*2.5,3,12,1.65,6,2.2,'#a6a095',false,'stone');box(group,side*2.5,6.4,12,2.1,.7,2.6,'#cfbfd0');
    box(group,side*2.5,4.5,13.13,.8,1.7,.05,side<0?'#a34b69':'#545993');box(group,side*2.5,4.6,13.17,.12,.95,.02,'#e4c799');
  }
  box(group,0,5.8,12,3.5,1,2.2,'#b5ad9e',false,'stone');box(group,0,2.5,12.4,3.3,5,.22,'#44364e');
  for(let x=-1.4;x<=1.5;x+=.35)box(group,x,2.5,12.6,.07,5,.07,'#aa8eac');
  for(const y of [1.2,3.7])box(group,0,y,12.66,3,.1,.06,'#b9a1b8');
  box(group,0,.56,7.7,4,.14,8,'#c0afbd');
  const fountain=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2,.65,16),material('#bbb1c7'));fountain.position.set(0,.75,3.2);group.add(fountain);
  const water=new THREE.Mesh(new THREE.CircleGeometry(1.6,24),material('#90c3df',true));water.rotation.x=-Math.PI/2;water.position.set(0,1.09,3.2);group.add(water);
  box(group,0,1.7,3.2,.3,1.4,.3,'#d0bed5');
  for(const side of [-1,1]){box(group,side*6,.57,7,4,.16,5,'#718987');for(let i=0;i<3;i++){const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),material('#c69bc2'));tree.position.set(side*6,2,5+i*2);group.add(tree);box(group,side*6,1,5+i*2,.16,1.5,.16,'#846574');}}
  return group;
}
export function addSettlement(world,district,map,box,material){
  for(const lot of map.restricted){
    if(lot.kind==='castle')addCastleCompound(world,box,material,lot);
    else if(lot.kind==='mage'){
      const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.65,2.4,10,8),material('#8a7f9c'));tower.position.set(lot.x,5.1,lot.z);world.add(tower);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(2.35,4.5,8),material('#654699'));roof.position.set(lot.x,12.2,lot.z);world.add(roof);
      for(const y of [2.5,5.5,8]){box(world,lot.x,y,lot.z+1.8,.5,.8,.08,'#b8b3f4',true);}
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.4),material('#b79ee8',true));gem.position.set(lot.x,14.9,lot.z);world.add(gem);
    }else{
      addCottage(world,box,material,lot.x,lot.z,'#9c455f',1.4);
      for(let i=0;i<6;i++)box(world,lot.x-1.5+i*.6,2.2,lot.z+2.9,.58,.13,1.1,i%2?'#e5d2c6':'#b7684e');
    }
    if(lot.compound)continue;
    const half=lot.half;
    for(const side of [-1,1]){box(world,lot.x+side*half,.7,lot.z,.1,1.4,half*2,'#6c5269');box(world,lot.x,.7,lot.z+side*half,half*2,1.4,.1,'#6c5269');}
    box(world,lot.x,1.1,lot.z+half+.05,1.7,.18,.1,'#ae5971');
  }
  for(const lot of district.amenities){
    box(world,lot.x,.04,lot.z,9,.08,9,lot.kind==='park'?'#5e6973':'#757386');
    if(lot.kind==='homes'||lot.kind==='market'){for(const side of [-1,1]){const home=addCottage(world,box,material,lot.x+side*2,lot.z,['#5c5086','#87505d','#627f9d','#a66d59'][(lot.variant+(side>0?1:0))%4]);if(lot.kind==='market')for(let i=0;i<4;i++)box(home,-.9+i*.6,1.85,2.1,.57,.1,1.05,i%2?'#e5d1c8':'#a55d7f');}}
    else{
      for(const side of [-1,1]){
        box(world,lot.x+side*2.8,1.15,lot.z-2.5,.22,2.3,.22,'#796176');
        for(let petal=0;petal<4;petal++){
          const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,1),material(side<0?'#c399c2':'#a7aad5'));crown.position.set(lot.x+side*2.8+Math.sin(petal*2)*.6,2.6+(petal%2)*.7,lot.z-2.5+Math.cos(petal*2)*.5);world.add(crown);
        }
        box(world,lot.x+side*3,1.25,lot.z+2.6,.1,2.5,.1,'#514664');box(world,lot.x+side*3,2.55,lot.z+2.6,.45,.5,.45,'#f2bc8b',true);box(world,lot.x+side*3,2.85,lot.z+2.6,.65,.12,.65,'#665071');
        for(let i=0;i<6;i++){const grass=new THREE.Mesh(new THREE.ConeGeometry(.2,.5,3),material('#8c9d8d'));grass.position.set(lot.x-2+i*.8,.3,lot.z+side*3.6);world.add(grass);}
      }
      const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.5,.45,16),material('#9791ae'));basin.position.set(lot.x,.25,lot.z);world.add(basin);
      const water=new THREE.Mesh(new THREE.CircleGeometry(1.18,24),material('#799dc9'));water.rotation.x=-Math.PI/2;water.position.set(lot.x,.49,lot.z);world.add(water);
      box(world,lot.x,1,lot.z,.22,1.4,.22,'#bab1ca');
      for(const side of [-1,1]){box(world,lot.x+side*2.5,.5,lot.z,1.2,.16,.5,'#a57c69');box(world,lot.x+side*2.5,.85,lot.z-.23,1.2,.6,.1,'#765268');}
    }
  }
  for(const wall of map.walls){
    box(world,wall.x,2.15,wall.z,wall.halfX*2,4.3,wall.halfZ*2,'#78788b');
    const horizontal=wall.halfX>wall.halfZ,len=horizontal?wall.halfX*2:wall.halfZ*2;
    for(let offset=-len/2+.45;offset<len/2;offset+=1.3)box(world,wall.x+(horizontal?offset:0),4.65,wall.z+(horizontal?0:offset),horizontal?.72:1.18,.8,horizontal?1.18:.72,'#9891a5');
  }
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.4,6,10),material('#9390a5'));tower.position.set(sx*map.bounds,3,sz*map.bounds);world.add(tower);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1.7,2.4,10),material('#56416e'));roof.position.set(sx*map.bounds,7.2,sz*map.bounds);world.add(roof);
  }
  const portal=new THREE.Group();portal.position.set(map.gateX,0,-map.bounds);world.add(portal);
  for(const side of [-1,1])box(portal,side*3.1,3,0,1.1,6,1.5,'#aaa2ba');box(portal,0,6.2,0,7.3,.65,1.6,'#aaa2ba');
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.15,8,48),material('#b69ef3',true));ring.position.y=3;ring.scale.y=1.15;portal.add(ring);
  const surface=new THREE.Mesh(new THREE.CircleGeometry(2.15,48),new THREE.MeshBasicMaterial({color:'#5342b3',transparent:true,opacity:.72,side:THREE.DoubleSide}));surface.position.set(0,3,0);surface.scale.y=1.15;surface.userData.portal=true;portal.add(surface);ring.userData.portal=true;
  const inner=new THREE.Mesh(new THREE.TorusGeometry(1.7,.035,5,6),material('#ffa78a',true));inner.position.set(0,3,.08);portal.add(inner);
  return {portal,surface,ring,inner,selectables:[surface,ring],update(time){inner.rotation.z=time*.24;surface.material.opacity=.66+Math.sin(time*1.2)*.06;}};
}
