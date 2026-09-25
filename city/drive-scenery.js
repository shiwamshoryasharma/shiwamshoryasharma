import * as THREE from 'three';
export function addDriveScenery(scene,world,box,material,map){
  function sign(text,x,y,z,color='#e5c4ad',width=2.8,subtitle=''){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#493b29';ctx.fillRect(0,0,512,128);ctx.strokeStyle=color;ctx.lineWidth=9;ctx.strokeRect(5,5,502,118);
    ctx.fillStyle=color;ctx.textAlign='center';let size=42;while(size>16){ctx.font=`700 ${size}px Georgia, serif`;if(ctx.measureText(text).width<470)break;size-=2;}ctx.fillText(text,256,subtitle?55:78);if(subtitle){ctx.font='24px Georgia, serif';ctx.fillText(subtitle,256,101);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.set(x,y,z);world.add(mesh);return mesh;
  }
  for(const bay of map.bays){
    const {x,z,repo}=bay;
    // A worn stone stopping place and a hanging guild sign, without road paint.
    box(world,x,.085,z,8,.03,1.85,'#958891');
    const postX=x+3.65,postZ=z-1.22;
    box(world,postX,1.18,postZ,.13,2.2,.13,'#755341');
    box(world,postX-.45,2.3,postZ,1.08,.12,.14,'#755341');
    const brace=box(world,postX-.2,2.05,postZ,.07,.6,.08,'#896345');brace.rotation.z=-.7;
    for(const dx of [-.76,-.22])box(world,postX+dx,2.15,postZ+.13,.035,.28,.035,'#4b3949');
    // The face sits in front of its support so the timber never cuts through the text.
    sign(`GUILD ${String(repo.index).padStart(2,'0')}`,postX-.49,1.86,postZ+.15,'#e5c7a4',1.7,'HITCH CART / PRESS F');
    sign(repo.name,x,2.05,repo.z+2.45,'#e5d3a1',2.8);
  }
  return {};
}
