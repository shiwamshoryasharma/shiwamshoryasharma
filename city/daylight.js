const KEYS=[
  {hour:0,sky:'#101127',sun:.12,ambient:.6,lamps:1,color:'#a8a8ff'},
  {hour:5,sky:'#19152f',sun:.18,ambient:.7,lamps:.95,color:'#aaa4f2'},
  {hour:7,sky:'#bd8295',sun:1.5,ambient:1.25,lamps:.45,color:'#ffb783'},
  {hour:9,sky:'#aac4e0',sun:2.6,ambient:1.8,lamps:.18,color:'#fff1df'},
  {hour:16,sky:'#a2c0e1',sun:2.6,ambient:1.8,lamps:.18,color:'#fff1df'},
  {hour:19,sky:'#a2709d',sun:.85,ambient:1.1,lamps:.7,color:'#ff9a6a'},
  {hour:21,sky:'#101127',sun:.12,ambient:.6,lamps:1,color:'#a8a8ff'},
  {hour:24,sky:'#101127',sun:.12,ambient:.6,lamps:1,color:'#a8a8ff'}
];
function mixColor(a,b,t){const channels=[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t));return '#'+channels.map(c=>c.toString(16).padStart(2,'0')).join('');}
export function localLighting(date=new Date()){
  const hour=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
  const i=KEYS.findIndex((k,j)=>j<KEYS.length-1&&hour>=k.hour&&hour<KEYS[j+1].hour);
  const a=KEYS[Math.max(0,i)],b=KEYS[Math.max(0,i)+1],raw=(hour-a.hour)/(b.hour-a.hour),t=raw*raw*(3-2*raw);
  const mix=key=>a[key]+(b[key]-a[key])*t;
  return {hour,phase:hour<5||hour>=20?'Night':hour<8?'Dawn':hour<17?'Day':'Evening',sky:mixColor(a.sky,b.sky,t),color:mixColor(a.color,b.color,t),sun:mix('sun'),ambient:mix('ambient'),lamps:mix('lamps')};
}
