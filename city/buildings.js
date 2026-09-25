import * as THREE from 'three';

// Facade panes sit outside the actual wall surface, avoiding coplanar flicker.
export function addRepositoryBuilding(repo,group,box,material,selectables,windows) {
  const design=repo.architecture;
  const colors=repo.languages.map(([name])=>repo.colors?.[name]).filter(c=>/^#[0-9a-f]{6}$/i.test(c));
  const tint=new THREE.Color(repo.color).lerp(new THREE.Color('#182c43'),.68);
  const facade='#'+tint.getHexString();
  const accent=colors[1]||repo.color;
  let paneIndex=0;
  for(const [partIndex,p] of design.parts.entries()){
    const base=.72+p.y;
    const body=box(group,p.x,base+p.h/2,p.z,p.w,p.h,p.d,facade);body.userData.repo=repo;selectables.push(body);
    const floorStep=.86;
    const floors=Math.max(1,Math.floor(p.h/floorStep));
    const step=p.h/floors;
    for(let floor=0;floor<floors;floor++){
      const y=base+(floor+.5)*step;
      // Narrow floor ledges leave the glazing clear; setbacks get an accent cornice.
      box(group,p.x,base+floor*step,p.z,p.w+.08,.045,p.d+.08,'#52667a');
      for(let side=0;side<4;side++){
        const front=side<2, length=front?p.w:p.d;
        const cols=Math.max(1,Math.floor((length-.25)/.6));
        for(let col=0;col<cols;col++){
          const offset=(col-(cols-1)/2)*(length-.3)/cols;
          const localX=p.x+(front?offset:(side===2?1:-1)*(p.w/2+.065));
          const localZ=p.z+(front?(side===0?1:-1)*(p.d/2+.065):offset);
          // Skip panes on any face buried inside a connecting wing.
          if(design.parts.some((q,i)=>i!==partIndex&&localX>q.x-q.w/2&&localX<q.x+q.w/2&&localZ>q.z-q.d/2&&localZ<q.z+q.d/2&&y>.72+q.y&&y<.72+q.y+q.h))continue;
          const random=(Math.imul(design.seed^(++paneIndex),1597334677)>>>0)%100;
          const lit=random<42;
          windows.push({x:repo.x+localX,y,z:repo.z+localZ,w:front?(length-.3)/cols*.61:.025,d:front?.025:(length-.3)/cols*.61,h:Math.min(.46,step*.58),lit,color:lit?(random%3?'#f4cf91':'#8ed7df'):'#243b52'});
        }
      }
    }
    box(group,p.x,base+p.h+.035,p.z,p.w+.12,.07,p.d+.12,accent);
    // Vertical edge fins retain language color without covering the facade.
    for(const side of [-1,1])box(group,p.x+side*(p.w/2+.018),base+p.h/2,p.z+p.d/2+.025,.055,p.h,.06,accent);
  }
  const top=design.parts.reduce((a,b)=>a.y+a.h>b.y+b.h?a:b);
  const roofY=.82+top.y+top.h;
  if(design.roof==='dome'){
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.77,16,10,0,Math.PI*2,0,Math.PI/2),material('#b8cfdf'));
    dome.position.set(top.x,roofY,top.z);group.add(dome);
    box(group,top.x,roofY+.32,top.z,.075,.64,1.5,'#526d88');
  }else if(design.roof==='spire'){
    const crown=new THREE.Mesh(new THREE.ConeGeometry(.78,1.3,4),material(accent));crown.position.set(top.x,roofY+.65,top.z);crown.rotation.y=Math.PI/4;group.add(crown);
    box(group,top.x,roofY+1.6,top.z,.05,.7,.05,'#b4c9d6');
  }else if(design.roof==='garden'){
    box(group,top.x,roofY,top.z,top.w*.8,.09,top.d*.8,'#477b61');
    for(const side of [-1,1])box(group,top.x+side*.55,roofY+.2,top.z,.22,.35,top.d*.6,'#78a779');
  }else{
    for(const side of [-1,1]){
      const panel=box(group,top.x+side*.5,roofY+.13,top.z,.75,.06,top.d*.6,'#326584');panel.rotation.x=.18;
      box(group,top.x+side*.5,roofY+.17,top.z,.025,.05,top.d*.6,'#8ba6bb');
    }
  }
  const front=design.parts.filter(p=>p.y===0).sort((a,b)=>(b.z+b.d/2)-(a.z+a.d/2))[0];
  box(group,front.x,1.15,front.z+front.d/2+.09,.58,.8,.1,'#82bcc6');
  box(group,front.x,1.65,front.z+front.d/2+.35,1.1,.09,.65,accent);
}
