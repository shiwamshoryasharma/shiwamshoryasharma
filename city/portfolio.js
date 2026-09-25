// Optional ornament interaction; all portfolio content and links are plain HTML.
const cube=document.getElementById('identity-cube');
const turn=document.getElementById('turn-cube');
let angle=-30;
if(cube&&turn){turn.hidden=false;turn.addEventListener('click',()=>{angle+=90;cube.style.setProperty('--cube-angle',`${angle}deg`);});}

const portrait=document.getElementById('profile-portrait'),tilt=document.getElementById('turn-portrait');
let portraitSide=false;
if(portrait&&tilt){tilt.hidden=false;tilt.addEventListener('click',()=>{portraitSide=!portraitSide;portrait.style.setProperty('--portrait-turn',portraitSide?'7deg':'-7deg');});}
