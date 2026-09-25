import * as THREE from 'three';
// Small shared tileable surface maps; generated once, never downloaded.
export function createSurfaceMaps(){
 const cache=new Map();
 return {get(kind){
  if(cache.has(kind))return cache.get(kind);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
  let seed=9173;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle='#b9b9b9';ctx.fillRect(0,0,256,256);
  for(let i=0;i<7000;i++){const g=155+Math.floor(random()*70);ctx.fillStyle=`rgb(${g},${g},${g})`;ctx.fillRect(random()*256,random()*256,1+random()*2,1+random()*2);}
  if(kind==='stone'||kind==='slate'){
   const h=kind==='stone'?32:24,w=kind==='stone'?64:40;
   for(let y=0,row=0;y<256;y+=h,row++)for(let x=-w;x<256;x+=w){
    const start=x+(row%2)*w/2,g=150+Math.floor(random()*70);ctx.fillStyle=`rgb(${g},${g},${g})`;ctx.fillRect(start+2,y+2,w-4,h-4);ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.strokeRect(start+.5,y+.5,w-1,h-1);
    ctx.fillStyle='#ffffff19';ctx.fillRect(start+3,y+3,w-6,2);
   }
  }else if(kind==='scales'){
   for(let row=0;row<16;row++)for(let col=-1;col<17;col++){const x=col*16+(row%2)*8,y=row*16;ctx.fillStyle=row%2?'#b2b2b2':'#bdbdbd';ctx.beginPath();ctx.ellipse(x,y,9,11,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#747474';ctx.stroke();}
  }else if(kind==='wood'){
   for(let i=0;i<120;i++){ctx.strokeStyle=`rgba(65,55,50,${.08+random()*.2})`;ctx.beginPath();const x=random()*256;ctx.moveTo(x,0);ctx.bezierCurveTo(x+8,90,x-8,170,x+3,256);ctx.stroke();}
  }
  ctx.fillStyle='#ffffff';ctx.globalAlpha=.48;ctx.fillRect(0,0,256,256);ctx.globalAlpha=1;
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
  const bump=map.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;const result={map,bumpMap:bump,bumpScale:kind==='plaster'?.035:.09};cache.set(kind,result);return result;
 },dispose(){for(const value of cache.values()){value.map.dispose();value.bumpMap.dispose();}}};
}
