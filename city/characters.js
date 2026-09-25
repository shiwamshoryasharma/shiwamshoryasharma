import * as THREE from 'three';
import {residentRoutes,residentPose} from './residents.js';
const NAMES={adventurer:'Rose · anime-inspired adventurer',elf:'Sylva · elven ranger',dwarf:'Bram · dwarven smith',beastfolk:'Fen · foxfolk traveler',human:'Mira · human cartographer',mage:'Orin · wandering mage'};
export function addResidents(world,district,box,material){
  const sphere=new THREE.SphereGeometry(1,10,8),cone=new THREE.ConeGeometry(1,1,8),cylinder=new THREE.CylinderGeometry(1,1,1,8);
  function form(parent,geo,color,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  const residents=residentRoutes(district.buildings).map((route,i)=>{
    const group=new THREE.Group();world.add(group);
    const type=route.type,dwarf=type==='dwarf',beast=type==='beastfolk';
    const skin=beast?'#c69a6b':['#f0c9aa','#ad7f60','#dab494'][i%3];
    const cloth={adventurer:'#ae698b',elf:'#6c9676',dwarf:'#916343',beastfolk:'#a88b55',human:'#6d94af',mage:'#8770ad'}[type];
    const hair={adventurer:'#ead3a8',elf:'#e7dbb2',dwarf:'#965f35',beastfolk:'#b77d4d',human:'#51423a',mage:'#bfc8cf'}[type];
    const body=new THREE.Group();group.add(body);
    const torso=form(body,cylinder,cloth,0,.77,0,.18,.43,.13);
    if(dwarf)torso.scale.x=.24;
    box(body,0,.61,0,.36,.065,.27,'#675038');box(body,0,.62,.15,.07,.06,.04,'#dfc188');
    // Long coats, capes, and adult adventurer proportions; no downloaded character models.
    const cape=form(body,cone,cloth,0,.72,-.13,.24,.58,.08);cape.rotation.x=-.1;
    if(type==='adventurer'||type==='mage')form(body,cone,cloth,0,.51,0,.24,.43,.17);
    const limbs=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.105,.53,0);body.add(leg);
      box(leg,0,-.2,0,.12,.4,.12,'#454338');box(leg,0,-.43,.05,.14,.12,.22,'#57432f');
      const arm=new THREE.Group();arm.position.set(side*.22,.94,0);body.add(arm);
      box(arm,0,-.16,0,.105,.29,.12,cloth);form(arm,sphere,skin,0,-.34,0,.06,.075,.06);
      limbs.push({leg,arm,side});
    }
    form(body,cylinder,skin,0,1.02,0,.057,.1,.057);
    form(body,sphere,skin,0,1.18,0,.135,.165,.125);
    form(body,sphere,hair,0,1.26,-.036,.145,.125,.115);
    if(type==='adventurer'||type==='elf'){
      box(body,0,1.06,-.11,.26,.32,.075,hair);
      for(const side of [-1,1]){const lock=form(body,cone,hair,side*.128,1.12,.055,.055,.25,.045);lock.rotation.z=side*.15;}
    }
    // Large irises, highlights, small brows, and a nose read from the close-up view.
    for(const side of [-1,1]){
      form(body,sphere,'#f4f0df',side*.056,1.196,.109,.039,.042,.015);
      form(body,sphere,type==='elf'?'#539b78':'#7764aa',side*.056,1.19,.123,.022,.03,.009);
      form(body,sphere,'#272a37',side*.056,1.19,.13,.011,.02,.004);
      form(body,sphere,'#ffffff',side*.05,1.207,.134,.007,.009,.003);
      box(body,side*.056,1.249,.105,.06,.012,.015,hair);
    }
    form(body,sphere,skin,0,1.16,.13,.024,.035,.024);
    box(body,0,1.103,.108,.04,.008,.013,'#9d6657');
    if(type==='elf')for(const side of [-1,1]){const ear=form(body,cone,skin,side*.177,1.21,0,.04,.19,.045);ear.rotation.z=-side*1.03;}
    if(dwarf){form(body,cone,hair,0,1.06,.105,.135,.31,.11);form(body,sphere,'#899691',0,1.33,0,.17,.08,.15);box(body,0,1.33,.157,.025,.1,.025,'#d9c184');}
    if(beast){
      for(const side of [-1,1]){const ear=form(body,cone,hair,side*.105,1.41,-.015,.085,.22,.06);ear.rotation.z=-side*.18;form(body,cone,'#e2b6a4',side*.105,1.41,.031,.044,.14,.014);}
      form(body,sphere,'#ecd3aa',0,1.12,.125,.081,.06,.048);form(body,sphere,'#45362d',0,1.15,.173,.023,.017,.016);
      const tail=form(body,cone,hair,.1,.52,-.35,.11,.55,.1);tail.rotation.x=.9;form(body,sphere,'#f0dfbd',.1,.68,-.54,.083,.1,.08);
    }
    if(type==='mage'){
      const brim=form(body,cylinder,cloth,0,1.33,0,.27,.035,.25);brim.rotation.z=.08;
      const hat=form(body,cone,cloth,-.035,1.58,0,.2,.49,.19);hat.rotation.z=.13;
      box(body,.3,.68,.12,.035,1.28,.035,'#886444');form(body,new THREE.OctahedronGeometry(.1), '#b4dcb2',.3,1.39,.12,1,1.5,1);
    }else if(type==='adventurer'||type==='elf'){
      const sword=box(body,-.25,.64,-.11,.055,.57,.035,'#b3c3c6');sword.rotation.z=-.2;
      box(body,-.3,.9,-.11,.16,.045,.045,'#d7b978');
    }else{box(body,.13,.79,-.19,.25,.3,.14,'#82684c');box(body,.13,.85,-.275,.17,.045,.04,'#c1a782');}
    group.scale.set(dwarf?1.18:1.17,dwarf?.9:1.2,dwarf?1.18:1.17);
    return {route,group,body,limbs,name:NAMES[type]};
  });
  function update(time,moving=true){for(const resident of residents){const p=residentPose(resident.route,time);resident.group.position.set(p.x,.3,p.z);resident.group.rotation.y=p.yaw;resident.body.position.y=moving?Math.abs(p.stride)*.018:0;for(const {leg,arm,side} of resident.limbs){leg.rotation.x=moving?p.stride*.35*side:0;arm.rotation.x=moving?-p.stride*.27*side:0;}}}
  update(0,false);
  return {update,residents};
}
