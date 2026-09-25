const EPSILON=1e-6;
const overlap=(a0,a1,b0,b1)=>Math.min(a1,b1)-Math.max(a0,b0)>EPSILON;
const bounds=p=>({x0:p.x-p.w/2,x1:p.x+p.w/2,z0:p.z-p.d/2,z1:p.z+p.d/2});

// Roofs belong to exposed rooms, not bridges or terraces supporting another room.
export function planRoofs(parts,style){
  const roofs=[];
  parts.forEach((part,partIndex)=>{
    if(part.kind==='bridge'||part.kind==='connector')return;
    const b=bounds(part),top=part.y+part.h;
    const neighbors=parts.filter(q=>q!==part&&q.y<=top+EPSILON&&q.y+q.h>top+EPSILON);
    if(neighbors.some(q=>{const n=bounds(q);return overlap(b.x0,b.x1,n.x0,n.x1)&&overlap(b.z0,b.z1,n.z0,n.z1);}))return;
    const roof={partIndex,x0:b.x0-.2,x1:b.x1+.2,z0:b.z0-.2,z1:b.z1+.2,y:.81+top,h:style==='spire'?2.15:Math.min(1.4,Math.min(part.w,part.d)*.65),style};
    // Trim only the eave facing a taller adjoining volume, leaving a small flashing gap.
    for(const neighbor of neighbors){
      const n=bounds(neighbor),gap=.025;
      if(overlap(roof.z0,roof.z1,n.z0,n.z1)){
        if(n.x0>=b.x1-EPSILON)roof.x1=Math.min(roof.x1,Math.max(b.x1,n.x0-gap));
        if(n.x1<=b.x0+EPSILON)roof.x0=Math.max(roof.x0,Math.min(b.x0,n.x1+gap));
      }
      if(overlap(roof.x0,roof.x1,n.x0,n.x1)){
        if(n.z0>=b.z1-EPSILON)roof.z1=Math.min(roof.z1,Math.max(b.z1,n.z0-gap));
        if(n.z1<=b.z0+EPSILON)roof.z0=Math.max(roof.z0,Math.min(b.z0,n.z1+gap));
      }
    }
    roofs.push(roof);
  });
  return roofs;
}

// Explicit rectangular eaves avoid rotation/nonuniform-scale distortion of a cone.
export function roofMeshData(roof){
  const {x0,x1,z0,z1,y,h}=roof,w=x1-x0,d=z1-z0,xc=(x0+x1)/2,zc=(z0+z1)/2;
  const positions=[x0,y,z0,x1,y,z0,x1,y,z1,x0,y,z1];
  const indices=[0,1,2,0,2,3];
  if(roof.style==='spire'||Math.abs(w-d)<.25){
    positions.push(xc,y+h,zc);indices.push(0,4,1,1,4,2,2,4,3,3,4,0);
  }else if(d>w){
    const inset=Math.min(w*.48,d*.35);
    positions.push(xc,y+h,z0+inset,xc,y+h,z1-inset);
    indices.push(0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0);
  }else{
    const inset=Math.min(d*.48,w*.35);
    positions.push(x0+inset,y+h,zc,x1-inset,y+h,zc);
    indices.push(0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0);
  }
  return {positions,indices};
}
