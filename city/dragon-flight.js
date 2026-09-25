// A brief passage followed by a long absence; no timers or growing scene objects.
export function dragonFlyby(time,span,rooftop){
  const elapsed=time-12,cycle=Math.floor(elapsed/110),phase=((elapsed%110)+110)%110;
  if(elapsed<0||phase>=32)return null;
  const t=phase/32,direction=cycle%2?-1:1;
  const x=direction*(t-.5)*span*2.8,z=Math.sin(t*Math.PI*2)*span*.22;
  const dx=direction*span*2.8,dz=Math.cos(t*Math.PI*2)*Math.PI*2*span*.22;
  return {x,z,y:rooftop+9+Math.sin(t*Math.PI)*5,yaw:Math.atan2(-dx,-dz),bank:Math.sin(t*Math.PI*2)*.16,phase};
}
