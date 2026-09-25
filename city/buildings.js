import * as THREE from 'three';

// Facade panes sit outside the actual wall surface, avoiding coplanar flicker.
export function addRepositoryBuilding(repo,group,box,material,selectables,windows) {
  const design=repo.architecture;
  const colors=repo.languages.map(([name])=>repo.colors?.[name]).filter(c=>/^#[0-9a-f]{6}$/i.test(c));
  const stone=['#b3b09a','#a5b1a5','#baa590','#9faaaf','#b0a2b1'][design.seed%5];
  const facade=stone;
  const accent=colors[1]||repo.color;
  const roofColor='#'+new THREE.Color(repo.color).lerp(new THREE.Color('#44444e'),.52).getHexString();
  let paneIndex=0;
  for(const [partIndex,p] of design.parts.entries()){
    const base=.72+p.y;
    const body=box(group,p.x,base+p.h/2,p.z,p.w,p.h,p.d,facade);body.userData.repo=repo;selectables.push(body);
    const floorStep=1.15;
    const floors=Math.max(1,Math.floor(p.h/floorStep));
    const step=p.h/floors;
    for(let floor=0;floor<floors;floor++){
      const y=base+(floor+.5)*step;
      // Narrow floor ledges leave the glazing clear; setbacks get an accent cornice.
      box(group,p.x,base+floor*step,p.z,p.w+.08,.045,p.d+.08,'#725e48');
      if(floor%2===0&&p.w>2){
        for(const side of [-1,1]){
          const brace=box(group,p.x+side*(p.w/2-.25),base+(floor+.5)*step,p.z+p.d/2+.02,.06,step*.8,.045,'#72563c');brace.rotation.z=side*.4;
        }
      }
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
          windows.push({x:repo.x+localX,y,z:repo.z+localZ,w:front?(length-.3)/cols*.61:.025,d:front?.025:(length-.3)/cols*.61,h:Math.min(.46,step*.58),lit,color:lit?(random%3?'#f4cf91':'#8ed7df'):'#3a4a43'});
        }
      }
    }
    box(group,p.x,base+p.h+.035,p.z,p.w+.14,.11,p.d+.14,'#735a43');
    // Vertical edge fins retain language color without covering the facade.
    for(const side of [-1,1])box(group,p.x+side*(p.w/2+.018),base+p.h/2,p.z+p.d/2+.025,.1,p.h,.11,'#705640');
  }
  const top=design.parts.reduce((a,b)=>a.y+a.h>b.y+b.h?a:b);
  const roofY=.82+top.y+top.h;
  function peakedRoof(part,roofHeight){
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1,1,4),material(roofColor));
    roof.rotation.y=Math.PI/4;roof.scale.set((part.w+.45)/Math.SQRT2,roofHeight,(part.d+.45)/Math.SQRT2);
    roof.position.set(part.x,.79+part.y+part.h+roofHeight/2,part.z);group.add(roof);
  }
  if(design.roof==='dome'){
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.8,16,10,0,Math.PI*2,0,Math.PI/2),material('#8cabb7'));
    dome.position.set(top.x,roofY,top.z);group.add(dome);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.035,6,32),material('#d3b777'));ring.position.copy(dome.position);ring.rotation.x=Math.PI/2;group.add(ring);
    box(group,top.x,roofY+.8,top.z,.04,.55,.04,'#d3b777');
    const star=new THREE.Mesh(new THREE.OctahedronGeometry(.15),material('#e5d69b',true));star.position.set(top.x,roofY+1.15,top.z);group.add(star);
  }else{
    peakedRoof(top,design.roof==='spire'?2.15:1.4);
    // Lower wings keep their own pitched roofs instead of sharing a flat office crown.
    for(const part of design.parts){
      if(part===top||part.y!==0||part.h>=top.y+top.h)continue;
      const covered=design.parts.some(q=>q!==part&&q.y>=part.h-.01&&Math.abs(q.x-part.x)<(q.w+part.w)/2&&Math.abs(q.z-part.z)<(q.d+part.d)/2);
      if(!covered)peakedRoof(part,1.15);
    }
    box(group,top.x,roofY+(design.roof==='spire'?2.3:1.55),top.z,.035,.7,.035,'#d8bf84');
    box(group,top.x+.17,roofY+(design.roof==='spire'?2.5:1.75),top.z,.34,.23,.025,accent);
  }
  // Heraldic hanging banner in the primary language color.
  const bannerPart=design.parts[0];
  box(group,bannerPart.x+bannerPart.w*.28,1.85,bannerPart.z+bannerPart.d/2+.15,.42,.68,.035,repo.color);
  box(group,bannerPart.x+bannerPart.w*.28,1.85,bannerPart.z+bannerPart.d/2+.177,.055,.4,.012,'#ead8a4');
  box(group,bannerPart.x+bannerPart.w*.28,1.9,bannerPart.z+bannerPart.d/2+.182,.24,.05,.012,'#ead8a4');
  const front=design.parts.filter(p=>p.y===0).sort((a,b)=>(b.z+b.d/2)-(a.z+a.d/2))[0];
  box(group,front.x,1.15,front.z+front.d/2+.09,.64,.85,.1,'#4f3c2b');
  const doorway=new THREE.Mesh(new THREE.TorusGeometry(.36,.065,6,18,Math.PI),material('#d0bea0'));
  doorway.position.set(front.x,1.35,front.z+front.d/2+.16);group.add(doorway);
  for(const side of [-1,1])box(group,front.x+side*.36,1.02,front.z+front.d/2+.16,.11,.66,.13,'#d0bea0');
  box(group,front.x,1.86,front.z+front.d/2+.35,1.15,.12,.65,'#725638');
}
