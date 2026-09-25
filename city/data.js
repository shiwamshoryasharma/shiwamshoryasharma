import { designBuilding } from './architecture.js';
const OWNER = 'shiwamshoryasharma';
export const CITY_LAYOUT = Object.freeze({spacing:11,roadWidth:4.6,parkingOffset:4});
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
  const columns = Math.max(1, Math.ceil(Math.sqrt(repos.length+2)));
  const rows = Math.ceil((repos.length+2)/columns);
  const buildings = repos.map((r,i) => {
    const languages = Object.entries(r.languages || {}).filter(([,n])=>Number.isFinite(n)&&n>0).sort((a,b)=>b[1]-a[1]);
    const language = languages[0]?.[0] || 'Other';
    const rawColor = r.colors?.[language];
    const architecture=designBuilding({...r,language,languages});
    return {...r, url:safeRepoUrl(r.url), language, languages, color:/^#[0-9a-f]{6}$/i.test(rawColor) ? rawColor : '#bc9cff',
      index:i+1, x:(i%columns-(columns-1)/2)*CITY_LAYOUT.spacing, z:(Math.floor(i/columns)-(rows-1)/2)*CITY_LAYOUT.spacing,
      height:architecture.height, architecture};
  });
  return {...CITY_LAYOUT, buildings, columns, rows, span:Math.max(28,columns*CITY_LAYOUT.spacing+6), totalBytes:repos.reduce((n,r)=>n+r.bytes,0)};
}
export function formatBytes(bytes) {
  return bytes>=1000000 ? `${(bytes/1000000).toFixed(2)} MB` : bytes>=1000 ? `${(bytes/1000).toFixed(1)} KB` : `${bytes} B`;
}
