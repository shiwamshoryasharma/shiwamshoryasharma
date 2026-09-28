import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

/** Small isolated hero scene. The town keeps its own camera and lifecycle. */
export async function createCharacter(host, { isPaused, onStatus }) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
  camera.position.set(0, 2.5, 10.7);
  camera.lookAt(.12, 2.2, 0);
  scene.add(new THREE.HemisphereLight('#d5fff2', '#3d3c49', 2.1));
  const key = new THREE.DirectionalLight('#fff1df', 3.2);
  key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#83e8db', 2.3);
  rim.position.set(3, 3, -3); scene.add(rim);
  const warm = new THREE.DirectionalLight('#ffac63', 1.5);
  warm.position.set(-3, 2, -2); scene.add(warm);

  let model;
  try {
    const asset = new URL('./assets/wayfarer.glb', document.baseURI);
    asset.search = new URL(import.meta.url).search;
    const gltf = await new GLTFLoader().loadAsync(asset.href);
    model = gltf.scene;
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  const pivot = new THREE.Group();
  pivot.add(model); scene.add(pivot);
  const head = model.getObjectByName('Head');
  const arm = model.getObjectByName('ArmL');
  const robot = model.getObjectByName('Companion');
  const eyes = ['EyeL', 'EyeR'].map(name => model.getObjectByName(name));
  const robotOrigin = robot.position.clone();
  const headRotation = head.rotation.clone();
  const armRotation = arm.rotation.clone();
  let elapsed = 0, last = 0, frame = 0, inView = true, disposed = false, dirty = true;
  let yaw = -.27, targetYaw = -.27, drag = null, wave = -10, greeting = false;
  const homeYaw = -.27;

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    // Preserve the full model on narrow stages rather than cropping the robot.
    camera.position.z = Math.max(9.8, 7.3 / camera.aspect);
    camera.updateProjectionMatrix();
    dirty = true; schedule();
  }
  function schedule() {
    if (!frame && inView && !document.hidden && !disposed) frame = requestAnimationFrame(render);
  }
  function render(time) {
    frame = 0;
    if (disposed || document.hidden || !inView) { last = 0; return; }
    if (last && time - last < 1000 / 30 && !dirty) { schedule(); return; }
    const dt = last ? Math.min((time - last) / 1000, .05) : 0;
    last = time;
    const moving = !isPaused();
    if (moving) elapsed += dt;
    const turn = Math.abs(yaw - targetYaw) > .001;
    yaw = moving ? THREE.MathUtils.damp(yaw, targetYaw, 12, dt || .016) : targetYaw;
    pivot.rotation.y = yaw;
    if (moving) {
      model.position.y = Math.sin(elapsed * 1.5) * .018;
      head.rotation.z = headRotation.z + Math.sin(elapsed * .7) * .025;
      robot.position.y = robotOrigin.y + Math.sin(elapsed * 2.1) * .12;
      robot.rotation.y = Math.sin(elapsed * .85) * .15;
      const blink = elapsed % 4.8;
      const openness = blink < .15 ? Math.max(.07, Math.abs(blink - .075) / .075) : 1;
      // The exporter converts pivots and geometry to glTF's Y-up convention.
      eyes.forEach(eye => { eye.scale.y = openness; });
      const t = elapsed - wave;
      const envelope = Math.max(0, Math.min(t * 4, (2.7 - t) * 3, 1));
      arm.rotation.z = armRotation.z - envelope * 1.95;
      arm.rotation.x = armRotation.x + envelope * Math.sin(t * 12) * .16;
      robot.position.x = robotOrigin.x + envelope * Math.sin(t * 3) * .16;
      robot.rotation.z = envelope * Math.sin(t * 5) * .23;
      if (greeting && t > 2.7) { greeting = false; onStatus('DRAG TO ROTATE / ARROW KEYS TO TURN'); }
    }
    if (dirty || moving || turn) renderer.render(scene, camera);
    dirty = false;
    if (moving || turn) schedule();
  }
  function refreshMotion() {
    last = 0; dirty = true;
    if (isPaused()) {
      eyes.forEach(eye => { eye.scale.y = 1; });
      arm.rotation.copy(armRotation);
      robot.rotation.z = 0;
      greeting = false;
      onStatus('MOTION PAUSED / DRAG TO ROTATE');
    } else onStatus('DRAG TO ROTATE / ARROW KEYS TO TURN');
    schedule();
  }
  function pointerDown(event) {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, yaw: targetYaw };
    host.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if (!drag || drag.id !== event.pointerId) return;
    targetYaw = drag.yaw + (event.clientX - drag.x) * .009;
    dirty = true; schedule();
  }
  function pointerUp(event) {
    if (drag?.id === event.pointerId) drag = null;
  }
  function keyboard(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    targetYaw = event.key === 'Home' ? homeYaw : targetYaw + (event.key === 'ArrowLeft' ? -.25 : .25);
    dirty = true; schedule();
  }
  function visibility() { last = 0; schedule(); }
  function contextLost(event) {
    event.preventDefault();
    host.classList.remove('ready');
    onStatus('3D UNAVAILABLE / EXPLORER PREVIEW');
    document.getElementById('character-greet').disabled = true;
    document.getElementById('character-reset').disabled = true;
    dispose();
  }
  const resizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting; last = 0; schedule();
  });
  resizeObserver.observe(host); visibilityObserver.observe(host);
  host.addEventListener('pointerdown', pointerDown);
  host.addEventListener('pointermove', pointerMove);
  host.addEventListener('pointerup', pointerUp);
  host.addEventListener('pointercancel', pointerUp);
  host.addEventListener('lostpointercapture', pointerUp);
  host.addEventListener('keydown', keyboard);
  document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  host.append(renderer.domElement); host.classList.add('ready'); resize();
  onStatus('DRAG TO ROTATE / ARROW KEYS TO TURN');
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame);
    resizeObserver.disconnect(); visibilityObserver.disconnect();
    for (const [name, callback] of [['pointerdown',pointerDown],['pointermove',pointerMove],['pointerup',pointerUp],['pointercancel',pointerUp],['lostpointercapture',pointerUp],['keydown',keyboard]]) host.removeEventListener(name, callback);
    document.removeEventListener('visibilitychange', visibility);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    const geometries = new Set(), materials = new Set();
    model.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    renderer.dispose(); renderer.domElement.remove();
  }
  return {
    refreshMotion, dispose,
    greet() {
      if (disposed) return;
      if (isPaused()) { onStatus('HELLO, TRAVELER. WELCOME TO MY WORLD.'); return; }
      wave = elapsed; greeting = true; targetYaw = homeYaw;
      onStatus('HELLO, TRAVELER. PIXEL SAYS HI TOO.'); dirty = true; schedule();
    },
    reset() { targetYaw = homeYaw; dirty = true; schedule(); }
  };
}
