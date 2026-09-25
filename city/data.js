const OWNER = 'shiwamshoryasharma';
export function safeRepoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname.startsWith(`/${OWNER}/`) ? url.href : null;
  } catch { return null; }
}
export function createDistrict(data) {
  const seen = new Set();
  const repos = (Array.isArray(data?.repositories) ? data.repositories : []).filter(r => {
    if (!r || typeof r.name !== 'string' || !Number.isFinite(r.bytes) || r.bytes <= 0 || seen.has(r.name)) return false;
    seen.add(r.name); return true;
  }).sort((a,b) => b.bytes-a.bytes || a.name.localeCompare(b.name));
  const columns = Math.max(1, Math.ceil(Math.sqrt(repos.length)));
  const rows = Math.ceil(repos.length/columns);
  const largest = Math.max(1, ...repos.map(r=>r.bytes));
  const buildings = repos.map((r,i) => {
    const languages = Object.entries(r.languages || {}).filter(([,n])=>Number.isFinite(n)&&n>0).sort((a,b)=>b[1]-a[1]);
    const language = languages[0]?.[0] || 'Other';
    const rawColor = r.colors?.[language];
    return {...r, url:safeRepoUrl(r.url), language, languages, color:/^#[0-9a-f]{6}$/i.test(rawColor) ? rawColor : '#bc9cff',
      index:i+1, x:(i%columns-(columns-1)/2)*8, z:(Math.floor(i/columns)-(rows-1)/2)*8,
      height:3+13*Math.log1p(r.bytes)/Math.log1p(largest)};
  });
  return {buildings, columns, rows, span:Math.max(24,columns*8+6), totalBytes:repos.reduce((n,r)=>n+r.bytes,0)};
}
export function formatBytes(bytes) {
  return bytes>=1000000 ? `${(bytes/1000000).toFixed(2)} MB` : bytes>=1000 ? `${(bytes/1000).toFixed(1)} KB` : `${bytes} B`;
}
