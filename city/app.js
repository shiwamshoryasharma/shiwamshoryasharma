import { createDistrict, formatBytes } from './data.js';
import { createDrivingUI } from './drive-ui.js';
const $=id=>document.getElementById(id);
let city,drivingUI,selectedRepo,buildings=[];
const cameraButtons=['zoom-in','zoom-out','reset','rotate','theme','fullscreen','drive-mode','drive-to-repo'];
function unavailable(message){$('loading').hidden=true;$('fallback').hidden=false;$('fallback-message').textContent=message;cameraButtons.forEach(id=>$(id).disabled=true);}
function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function select(repo,focus=false){
  selectedRepo=repo;
  city?.select(repo,focus);
  $('repo-number').textContent=String(repo.index).padStart(2,'0');$('repo-language').textContent=repo.language;$('repo-name').textContent=repo.name;
  $('repo-caption').textContent=repo.architecture.family+' · shaped by its language and source files.';
  $('repo-metrics').replaceChildren();
  for(const [value,label] of [[formatBytes(repo.bytes),'DETECTED CODE'],[repo.languages.length,'LANGUAGES'],[repo.architecture.sourceFiles??'Unknown','SOURCE FILES']]){
    const metric=element('div',undefined,'metric');metric.append(element('strong',value),element('span',label));$('repo-metrics').append(metric);
  }
  $('language-bar').replaceChildren();$('language-details').replaceChildren();
  const total=repo.languages.reduce((n,[,size])=>n+size,0);
  for(const [name,size] of repo.languages){
    const value=repo.colors?.[name];const color=/^#[0-9a-f]{6}$/i.test(value)?value:'#c5b6ff';
    const part=element('i');part.style.width=`${size/total*100}%`;part.style.background=color;$('language-bar').append(part);
    const label=element('li',`${name} ${(size/total*100).toFixed(1)}%`);label.style.setProperty('--language-color',color);$('language-details').append(label);
  }
  $('repo-link').hidden=!repo.url;if(repo.url)$('repo-link').href=repo.url;else $('repo-link').removeAttribute('href');
  for(const row of $('repo-list').children)row.setAttribute('aria-pressed',String(row.dataset.name===repo.name));
}
function directory(){
  const query=$('search').value.trim().toLowerCase();const visible=buildings.filter(r=>r.name.toLowerCase().includes(query)||r.language.toLowerCase().includes(query));
  const selected=$('repo-name').textContent;$('repo-list').replaceChildren();
  for(const repo of visible){
    const row=element('button',undefined,'repo-row');row.type='button';row.dataset.name=repo.name;row.setAttribute('aria-label',`Explore ${repo.name}`);row.setAttribute('aria-pressed',String(selected===repo.name));
    const swatch=element('span',undefined,'swatch');swatch.style.background=repo.color;
    row.append(swatch,element('span',repo.name,'name'),element('span',String(repo.index).padStart(2,'0'),'number'));
    row.addEventListener('click',()=>select(repo,true));$('repo-list').append(row);
  }
  $('list-count').textContent=visible.length;$('no-results').hidden=visible.length>0;
}
$('search').addEventListener('input',directory);
$('drive-to-repo').addEventListener('click',()=>drivingUI?.start(selectedRepo));
$('retry').addEventListener('click',()=>location.reload());
$('zoom-in').addEventListener('click',()=>city?.zoom(.83));$('zoom-out').addEventListener('click',()=>city?.zoom(1.2));
$('reset').addEventListener('click',()=>city?.reset());
$('rotate').addEventListener('click',()=>{$('rotate').setAttribute('aria-pressed',String(city?.toggleRotation()||false));});
$('viewport').addEventListener('orbitstopped',()=>{$('rotate').setAttribute('aria-pressed','false');});
$('theme').addEventListener('click',()=>{$('theme').setAttribute('aria-pressed',String(city?.toggleDaylight()||false));});
$('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.city-panel').requestFullscreen();}
  catch{$('fullscreen').title='Fullscreen is unavailable in this browser';}
});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
async function start(){
  try{
    const response=await fetch('./data/github-data.json',{cache:'no-cache'});if(!response.ok)throw new Error('Snapshot could not be loaded.');
    const data=await response.json();const district=createDistrict(data);buildings=district.buildings;
    if(!buildings.length)throw new Error('No code repositories are present in this snapshot.');
    $('updated').textContent=`Updated ${data.updated}`;$('city-count').textContent=`${buildings.length} buildings · all districts`;
    $('total-code').textContent=`${formatBytes(district.totalBytes)} across ${buildings.length} repositories.`;directory();select(buildings[0]);
    try{
      const {createCity}=await import('./scene.js');
      city=createCity($('viewport'),district,repo=>select(repo),(repo,x,y)=>{
        const tip=$('tooltip');tip.hidden=!repo;if(!repo)return;tip.textContent=repo.name;
        tip.style.left=`${Math.max(8,Math.min(x+12,$('viewport').clientWidth-270))}px`;tip.style.top=`${Math.max(8,y-45)}px`;
      },unavailable);
      drivingUI=createDrivingUI(city,repo=>select(repo));
      city.select(buildings[0]);$('rotate').setAttribute('aria-pressed',String(city.rotating));$('loading').hidden=true;
      if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
    }catch(error){console.error('City rendering failed:',error);unavailable('3D could not start on this browser. Explore the directory below or open the illustrated skyline.');}
  }catch(error){console.error('District data failed:',error);$('updated').textContent='Snapshot unavailable';unavailable('The repository snapshot could not be loaded. Please try again shortly, or visit the GitHub profile.');}
}
window.addEventListener('pagehide',event=>{if(!event.persisted)city?.dispose();});
start();
