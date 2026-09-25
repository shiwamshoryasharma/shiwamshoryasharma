import * as THREE from 'three';
export function addDriveScenery(scene,world,box,material,map){
  function sign(text,x,y,z,color='#a8f5d1',width=2.8){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#102033';ctx.fillRect(0,0,512,128);ctx.strokeStyle=color;ctx.lineWidth=9;ctx.strokeRect(5,5,502,118);
    ctx.fillStyle=color;ctx.textAlign='center';let size=42;while(size>16){ctx.font=`700 ${size}px Segoe UI, sans-serif`;if(ctx.measureText(text).width<470)break;size-=2;}ctx.fillText(text,256,78);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.set(x,y,z);world.add(mesh);return mesh;
  }
  for(const bay of map.bays){
    const {x,z,repo}=bay;
    box(world,x,.091,z,2.35,.015,1.15,'#244a4d');
    for(const side of [-1,1])box(world,x+side*1.17,.105,z,.035,.025,1.15,'#a8f5d1',true);
    box(world,x,.107,z+.56,2.35,.025,.035,'#a8f5d1',true);
    const marker=sign('P',x,.12,z,'#a8f5d1',.85);marker.rotation.x=-Math.PI/2;
    box(world,x+.85,1.05,z-.65,.045,1.95,.045,'#9fbacc');
    sign(`P  ${String(repo.index).padStart(2,'0')}`,x+.85,1.9,z-.65,'#a8f5d1',.9);
    sign(repo.name,x,2.05,z-1.72,'#d4e8ff',2.8);
  }
  for(const landmark of map.restricted){
    const {x,z}=landmark;const royal=landmark.kind==='royal';const stone=royal?'#8e749e':'#728591';const gold=royal?'#e2b970':'#b3dae3';
    const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
    box(group,0,.22,0,6,.44,6,'#38465d');box(group,0,2.5,0,4.5,4.5,4,stone);
    box(group,0,4.85,0,4.9,.3,4.4,gold);box(group,0,.6,0,4.95,.35,4.5,gold);
    if(royal){
      for(const side of [-1,1])for(const front of [-1,1]){
        box(group,side*2,3.5,front*1.7,1.05,6,1.05,stone);
        const spire=new THREE.Mesh(new THREE.ConeGeometry(.85,1.8,4),material('#755091'));spire.position.set(side*2,7.2,front*1.7);spire.rotation.y=Math.PI/4;group.add(spire);
        box(group,side*2,8.3,front*1.7,.055,.6,.055,gold);
      }
      box(group,0,5.8,0,1.9,1.5,1.9,stone);sign('ROYAL ARCHIVE',x,4.1,z+2.02,gold,3.5);
    }else{
      for(const offset of [-1.8,-.9,0,.9,1.8])box(group,offset,2.6,2.25,.28,3.9,.3,'#cad7dc');
      const roof=new THREE.Mesh(new THREE.ConeGeometry(3.55,1.6,4),material(gold));roof.rotation.y=Math.PI/4;roof.scale.z=.73;roof.position.y=5.6;group.add(roof);
      sign('CIVIC AUTHORITY',x,3.8,z+2.42,'#d5edfa',3.8);
    }
    // A closed fence and barrier: decorative placeholders have no entrance or URL.
    for(const side of [-1,1]){
      box(group,side*3,1,0,.06,1.8,6,'#b99b71');box(group,0,1,side*3,6,1.8,.06,'#b99b71');
    }
    for(let offset=-3;offset<=3;offset+=.4){
      for(const side of [-1,1]){box(group,offset,1.1,side*3,.06,2,.06,'#e3c790');box(group,side*3,1.1,offset,.06,2,.06,'#e3c790');}
    }
    box(group,0,1.05,3.08,2,.18,.12,'#ff858f',true);
    sign('RESTRICTED',x,2.25,z+3.1,'#ff9da6',2.65);
    sign('NO PARKING / NO ENTRY',x,1.35,z+3.17,'#ffe6b5',2.5);
  }
  const cabin=new THREE.Group();scene.add(cabin);
  box(cabin,0,.6,-.78,1.78,.075,.07,'#111b29');
  const left=box(cabin,-.7,.06,-.75,.075,1.3,.075,'#142234');left.rotation.z=-.15;
  const right=box(cabin,.7,.06,-.75,.075,1.3,.075,'#142234');right.rotation.z=.15;
  // Curved, tapering bonnet: its silhouette and bodywork distinguish it from the road.
  box(cabin,0,-.55,-.69,1.65,.24,.32,'#152234');
  box(cabin,0,-.405,-.88,1.5,.055,.12,'#101b28');
  const bonnetVertices=[],bonnetIndices=[];
  const across=16,along=10;
  for(let row=0;row<=along;row++){
    const t=row/along,z=-.95-t*.96,halfWidth=.74-t*.17;
    for(let column=0;column<=across;column++){
      const u=column/across*2-1;
      bonnetVertices.push(u*halfWidth,-.43-t*.065+.075*(1-u*u),z);
    }
  }
  for(let row=0;row<along;row++)for(let column=0;column<across;column++){
    const a=row*(across+1)+column,b=a+1,c=a+across+1,d=c+1;
    bonnetIndices.push(a,c,b,b,c,d);
  }
  const bonnetGeometry=new THREE.BufferGeometry();bonnetGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bonnetVertices,3));bonnetGeometry.setIndex(bonnetIndices);bonnetGeometry.computeVertexNormals();
  const bodyPaint=new THREE.MeshStandardMaterial({color:'#315971',metalness:.65,roughness:.24,side:THREE.DoubleSide});
  const bonnet=new THREE.Mesh(bonnetGeometry,bodyPaint);cabin.add(bonnet);
  // Rounded fenders and a dark front lip complete the car's body, without a center stripe.
  for(const side of [-1,1]){
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.75,-.435,-.92),new THREE.Vector3(side*.70,-.435,-1.30),new THREE.Vector3(side*.60,-.495,-1.86)]);
    const fender=new THREE.Mesh(new THREE.TubeGeometry(curve,18,.055,8,false),bodyPaint);cabin.add(fender);
  }
  box(cabin,0,-.515,-1.92,1.17,.06,.065,'#132635');
  // Low windshield wipers sit at the glass base rather than reading as road markings.
  for(const side of [-1,1]){const wiper=box(cabin,side*.34,-.367,-.97,.47,.017,.021,'#101722');wiper.rotation.y=side*.12;}
  cabin.visible=false;
  return {cabin};
}
