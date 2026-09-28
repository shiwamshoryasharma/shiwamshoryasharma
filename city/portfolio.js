const motion = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.getElementById('motion-toggle');
let paused = motion.matches;
let character, leaving = false;
const reveals = new Set();
function updateMotion() {
  document.documentElement.classList.toggle('motion-paused', paused);
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
  character?.refreshMotion();
  if (paused) { reveals.forEach(animation => animation.finish()); reveals.clear(); }
}
toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
motion.addEventListener('change', event => { paused = event.matches; updateMotion(); });
updateMotion();
// Content is visible before JS; entry motion never gates access to the page.
const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    revealObserver.unobserve(entry.target);
    if (paused) continue;
    const animation = entry.target.animate([
      { opacity: .35, transform: 'translateY(24px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
    reveals.add(animation);
    animation.onfinish = () => reveals.delete(animation);
  }
}, { threshold: .12 });
document.querySelectorAll('.project-card,.toolkit-card,.workshop-banner,.off-duty').forEach(node => revealObserver.observe(node));
const status = document.getElementById('character-status');
const greet = document.getElementById('character-greet');
const reset = document.getElementById('character-reset');
greet.addEventListener('click', () => character?.greet());
reset.addEventListener('click', () => character?.reset());
async function loadCharacter() {
  try {
    const { createCharacter } = await import('./character-view.js');
    character = await createCharacter(document.getElementById('character-view'), {
      isPaused: () => paused, onStatus: message => { status.textContent = message; }
    });
    if (leaving) { character.dispose(); return; }
    greet.disabled = false; reset.disabled = false;
    if (paused) character.refreshMotion();
  } catch (error) {
    console.warn('Character preview remains available:', error);
    status.textContent = 'EXPLORER PREVIEW / 3D UNAVAILABLE';
  }
}
loadCharacter();
window.addEventListener('pagehide', event => {
  if (!event.persisted) { leaving = true; character?.dispose(); revealObserver.disconnect(); }
});
