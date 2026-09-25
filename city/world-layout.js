export const PRIVATE_LANDMARK_COUNT=3; // Fictional anonymous scenery, not an actual private-repository count.
export function wrapCoordinate(value,period){return ((value+period/2)%period+period)%period-period/2;}
export function privateLandmarks(lots){
  if(!lots.length)return [];
  // Seeded choice keeps the skyline stable across reloads without fixing a slot.
  const seed=lots.reduce((hash,lot)=>Math.imul(hash^Math.round((lot.x??0)*31+(lot.z??0)*17),16777619)>>>0,2166136261);
  const castleIndex=seed%lots.length;
  return lots.map((lot,i)=>{const kind=i===castleIndex?'castle':(i<castleIndex?i:i-1)%2?'restaurant':'mage';return {...lot,kind,name:kind==='castle'?'The Royal Citadel':kind==='mage'?'The Silent Spire':'The Hidden Hearth',half:kind==='castle'?4.1:3.25};});
}
export function wallSegments(half,gateX,gateZ,gap=5){
  const segments=[];
  for(const side of [-1,1]){
    for(const [a,b] of [[-half,gateX-gap],[gateX+gap,half]])segments.push({x:(a+b)/2,z:side*half,halfX:(b-a)/2,halfZ:.55,kind:'wall'});
    for(const [a,b] of [[-half,gateZ-gap],[gateZ+gap,half]])segments.push({x:side*half,z:(a+b)/2,halfX:.55,halfZ:(b-a)/2,kind:'wall'});
  }
  return segments;
}
