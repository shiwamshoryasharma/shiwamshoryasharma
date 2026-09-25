// Stable architecture derived from public repository metadata, never its grid position.
export function designBuilding(repo) {
  let seed=2166136261;
  for(const char of `${repo.name}:${repo.language}`)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  const sourceFiles=Number.isInteger(repo.source_files)&&repo.source_files>=0?repo.source_files:null;
  const height=(3.8+Math.min(9,Math.log2(1+(sourceFiles??0))*1.1)+Math.min(4,Math.log10(1+repo.bytes)*.45))*.78;
  const language=repo.language;
  const family=language==='Jupyter Notebook'?'Astral observatory':language==='Python'?'Mage archives':language==='TypeScript'?'Crystal citadel':language==='JavaScript'?'Twin guild halls':['HTML','CSS','SCSS'].includes(language)?'Artisan quarters':'Forge keep';
  const parts=[];
  const add=(x,z,w,d,y,h)=>parts.push({x,z,w,d,y,h});
  const flip=seed%2?1:-1;
  if(family==='Crystal citadel'){
    add(0,0,3.6,3.4,0,height*.4);add(flip*.3,0,2.8,2.8,height*.4,height*.34);add(flip*.45,0,1.9,2.1,height*.74,height*.26);
  }else if(family==='Twin guild halls'){
    add(-1.1,0,1.6,3,0,height);add(1.1,.35,1.6,2.5,0,height*.76);add(0,.35,.6,1.1,height*.47,.65);
  }else if(family==='Mage archives'){
    if(seed%3===0){
      add(-1.15,0,1.7,3.5,0,height*.72);add(.9,-.35,2.2,2.8,0,height);
      add(-.1,-.35,.45,1.4,height*.42,.8);
    }else if(seed%3===1){
      add(0,0,3.8,3.5,0,height*.24);
      add(-flip*.5,0,2.7,2.7,height*.24,height*.28);
      add(flip*.4,0,3.1,2.5,height*.52,height*.26);
      add(flip*.65,0,1.8,2.1,height*.78,height*.22);
    }else{
      const count=3+seed%2;
      for(let i=0;i<count;i++)add(flip*i*.16,-i*.15,4.1-i*.7,3.8-i*.65,height*i/count,height/count);
    }
  }else if(family==='Astral observatory'){
    add(0,0,4.4,3.9,0,height*.28);add(-flip*.65,-.25,2.6,3.1,height*.28,height*.42);add(-flip*.65,-.25,1.8,2,height*.7,height*.3);
  }else if(family==='Artisan quarters'){
    add(-1.2,0,1.8,4,0,height*.72);add(1.05,-.7,2,2.6,0,height);add(.05,-1.25,.7,1.5,0,height*.38);
  }else{
    add(0,0,4.1,3.7,0,height*.36);add(flip*.35,0,3.1,3,height*.36,height*.42);add(-flip*.1,0,2.6,2.4,height*.78,height*.22);
  }
  return {seed,height,sourceFiles,family,parts,roof:family==='Astral observatory'?'dome':family==='Crystal citadel'?'spire':family==='Artisan quarters'?'garden':'solar'};
}
