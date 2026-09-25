import { PRIVATE_LANDMARK_COUNT, privateLandmarks } from './world-layout.js';
import { designBuilding } from './architecture.js';
const OWNER = 'shiwamshoryasharma';
export const CITY_LAYOUT = Object.freeze({spacing:16,roadWidth:6,parkingOffset:6.1,sidewalkOffset:4.5});
export function safeRepoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname.startsWith(`/${OWNER}/`) ? url.href : null;
  } catch { return null; }
}
export function createDistrict(data) {
  const seen = new Set();
  const repos = (Array.isArray(data?.repositories) ? data.repositories : []).filter(r => {
    if (!r || r.private === true || r.isPrivate === true || String(r.visibility || '').toLowerCase() === 'private' || typeof r.name !== 'string' || !Number.isFinite(r.bytes) || r.bytes <= 0 || seen.has(r.name)) return false;
    seen.add(r.name); return true;
  }).sort((a,b) => b.bytes-a.bytes || a.name.localeCompare(b.name));
  // Extra residential blocks keep repositories scattered through an actual town.
  const target=Math.max(64,repos.length*3+PRIVATE_LANDMARK_COUNT+8);
  const columns=Math.max(8,Math.ceil(Math.sqrt(target)/2)*2),rows=Math.ceil(target/columns/2)*2;
  const position=i=>({x:(i%columns-(columns-1)/2)*CITY_LAYOUT.spacing,z:(Math.floor(i/columns)-(rows-1)/2)*CITY_LAYOUT.spacing});
  const slots=Array.from({length:columns*rows},(_,i)=>i);
  let seed=0x71a5c3;
  for(let i=slots.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[slots[i],slots[j]]=[slots[j],slots[i]];}
  const centerColumn=columns/2-1,centerRow=rows/2-1;
  const reserved=[centerRow*columns+centerColumn,centerRow*columns+centerColumn+1,(centerRow+1)*columns+centerColumn,(centerRow+1)*columns+centerColumn+1];
  for(const id of reserved)slots.splice(slots.indexOf(id),1);
  const privateSlots=slots.splice(0,PRIVATE_LANDMARK_COUNT);
  const restricted=privateLandmarks(privateSlots.map(position));
  const castle=restricted.find(lot=>lot.kind==='castle');
  if(castle){
    slots.push(privateSlots[restricted.indexOf(castle)]);
    Object.assign(castle,{x:0,z:0,half:12,compound:true});
  }
  const repoSlots=slots.splice(0,repos.length);
  const amenities=slots.map((slot,i)=>({...position(slot),kind:i%5===0?'park':i%7===0?'market':'homes',variant:(slot*7)%4}));
  const buildings = repos.map((r,i) => {
    const languages = Object.entries(r.languages || {}).filter(([,n])=>Number.isFinite(n)&&n>0).sort((a,b)=>b[1]-a[1]);
    const language = languages[0]?.[0] || 'Other';
    const rawColor = r.colors?.[language];
    const architecture=designBuilding({...r,language,languages});
    return {...r, url:safeRepoUrl(r.url), language, languages, color:/^#[0-9a-f]{6}$/i.test(rawColor) ? rawColor : '#bc9cff',
      index:i+1, ...position(repoSlots[i]),
      height:architecture.height, architecture};
  });
  return {...CITY_LAYOUT, buildings, restricted, amenities, columns, rows, span:Math.max(48,Math.max(columns,rows)*CITY_LAYOUT.spacing+20), totalBytes:repos.reduce((n,r)=>n+r.bytes,0)};
}
export function formatBytes(bytes) {
  return bytes>=1000000 ? `${(bytes/1000000).toFixed(2)} MB` : bytes>=1000 ? `${(bytes/1000).toFixed(1)} KB` : `${bytes} B`;
}
