import * as T from "three";
import { mergeGeometries } from "./vendor/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "./vendor/loaders/GLTFLoader.js";
import {
  PROJECTS,
  SPAWN,
  TREE_SPOTS,
  floorHeight,
  nearestProject,
  arrivalPoint,
} from "./sky-state.js";
import { createMotion, stepMotion } from "./sky-motion.js";
import { createCharacterAnimator } from "./sky-character.js";
import { addGardenDetails } from "./sky-details.js";

/** Rendering owns GPU resources. Walking rules and exhibit content live in sky-state. */
export async function createWorld(
  host,
  { paused, onNear, onStats, onFailure },
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  const scene = new T.Scene();
  scene.background = new T.Color("#a7d2df");
  scene.fog = new T.Fog("#a7d2df", 80, 190);
  const camera = new T.PerspectiveCamera(42, 1, 0.1, 260);
  const hemi = new T.HemisphereLight("#e5fcff", "#749477", 1.8);
  scene.add(hemi);
  const sun = new T.DirectionalLight("#fff0ce", 2.5);
  sun.position.set(-20, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -35,
    right: 35,
    top: 35,
    bottom: -35,
    near: 1,
    far: 100,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  scene.add(sun);
  const loader = new GLTFLoader(),
    resources = new Set();
  const assetURL = (name) => {
    const u = new URL(`./assets/${name}`, document.baseURI);
    u.search = new URL(import.meta.url).search;
    return u.href;
  };
  let environment, avatar;
  try {
    [environment, avatar] = await Promise.all([
      loader.loadAsync(assetURL("sky-district.glb")),
      loader.loadAsync(assetURL("anime-explorer.glb")),
    ]);
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  const lab = environment.scene;
  scene.add(lab);
  lab.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const hero = avatar.scene.getObjectByName("AnimeExplorer");
  const robot = avatar.scene.getObjectByName("Companion");
  // Attach preserves the exported transform before giving each actor its own world position.
  scene.attach(hero);
  scene.attach(robot);
  hero.scale.setScalar(1.18);
  robot.scale.setScalar(0.44);
  const character = createCharacterAnimator(hero);
  const blinking = [];
  hero.traverse((o) => {
    if (o.morphTargetDictionary?.Blink !== undefined) blinking.push(o);
  });
  hero.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.frustumCulled = false;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        m.roughness = 0.85;
        m.metalness = 0;
      }
    }
  });
  hero.updateMatrixWorld(true);
  const soleOffset = -new T.Box3().setFromObject(hero).min.y;
  const ramp = new T.DataTexture(
    new Uint8Array([90, 155, 220, 255]),
    4,
    1,
    T.RedFormat,
  );
  ramp.needsUpdate = true;
  ramp.minFilter = ramp.magFilter = T.NearestFilter;
  resources.add(ramp);
  const skyMaterial = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      top: { value: new T.Color("#77b8e5") },
      bottom: { value: new T.Color("#e9f5f2") },
    },
    vertexShader:
      "varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "uniform vec3 top;uniform vec3 bottom;varying vec3 vDirection;void main(){float h=smoothstep(-.12,.75,normalize(vDirection).y);gl_FragColor=vec4(mix(bottom,top,h),1.);}",
  });
  const sky = new T.Mesh(new T.SphereGeometry(220, 24, 16), skyMaterial);
  scene.add(sky);
  const materials = new Map(),
    staticMeshes = [];
  function mat(color) {
    if (!materials.has(color))
      materials.set(
        color,
        new T.MeshToonMaterial({ color, gradientMap: ramp }),
      );
    return materials.get(color);
  }
  function mesh(geo, color, x, y, z, parent = scene) {
    const m = new T.Mesh(geo, typeof color === "string" ? mat(color) : color);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    staticMeshes.push(m);
    return m;
  }
  const box = (w, h, d, c, x, y, z, parent) =>
    mesh(new T.BoxGeometry(w, h, d), c, x, y, z, parent);
  const cyl = (r1, r2, h, c, x, y, z, parent, n = 24) =>
    mesh(new T.CylinderGeometry(r1, r2, h, n), c, x, y, z, parent);
  const ico = (r, c, x, y, z, parent, detail = 1) =>
    mesh(new T.IcosahedronGeometry(r, detail), c, x, y, z, parent);
  // A broad explorable meadow, with a sculpted cliff edge above the cloud sea.
  const landGeo = new T.CircleGeometry(34, 96);
  landGeo.rotateX(-Math.PI / 2);
  const pos = landGeo.attributes.position;
  for (let i = 1; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i),
      a = Math.atan2(z, x);
    const r = 33 + Math.sin(a * 7) * 1.4 + Math.cos(a * 11) * 0.65;
    pos.setXYZ(i, Math.cos(a) * r, 0, Math.sin(a) * r);
  }
  landGeo.computeVertexNormals();
  mesh(landGeo, "#679658", 0, -0.15, 0);
  cyl(33, 26, 5, "#719a82", 0, -2.95, 0, scene, 72);
  cyl(26, 17, 7, "#507f7c", 0, -8.8, 0, scene, 64);
  const water = mesh(
    new T.PlaneGeometry(600, 600),
    new T.MeshBasicMaterial({ color: "#9fcdd0" }),
    0,
    -14,
    0,
  );
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  // Curved stepping-stone trails radiate from the research pavilion.
  const trailMaterial = mat("#d6d8ba");
  for (const p of PROJECTS) {
    const [x, , z] = p.position;
    const length = Math.hypot(x, z),
      dx = x / length,
      dz = z / length;
    for (let d = 6.2; d < length - 2; d += 0.8) {
      const tile = box(1.8, 0.1, 0.62, trailMaterial, dx * d, -0.08, dz * d);
      tile.rotation.y = -Math.atan2(dx, dz);
    }
  }
  // Instanced ground cover is a single draw call, with an open center and clear trails.
  let seed = 127;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const wind = { value: 0 };
  const grassMaterial = mat("#60934e").clone();
  grassMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = "uniform float uWind;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n transformed.x += sin(uWind*1.1 + instanceMatrix[3].x*.4 + instanceMatrix[3].z*.3)*max(position.y,0.)*.24;",
    );
  };
  const grassGeo = new T.BufferGeometry();
  grassGeo.setAttribute(
    "position",
    new T.Float32BufferAttribute(
      [
        -0.06, 0, 0, 0.06, 0, 0, 0.035, 0.25, 0.025, -0.06, 0, 0, 0.035, 0.25,
        0.025, -0.045, 0.25, 0.025, -0.045, 0.25, 0.025, 0.035, 0.25, 0.025,
        -0.025, 0.47, 0.08, 0, 0, -0.045, 0, 0, 0.045, 0.025, 0.2, 0.025, 0, 0,
        -0.045, 0.025, 0.2, 0.025, 0.02, 0.2, -0.035, 0.02, 0.2, -0.035, 0.025,
        0.2, 0.025, 0.075, 0.38, -0.01,
      ],
      3,
    ),
  );
  grassGeo.computeVertexNormals();
  grassMaterial.side = T.DoubleSide;
  const grass = new T.InstancedMesh(grassGeo, grassMaterial, 3800),
    dummy = new T.Object3D();
  let gi = 0;
  while (gi < 3800) {
    const a = rand() * Math.PI * 2,
      r = 7 + rand() * 25,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    if (
      PROJECTS.some(
        (p) => Math.hypot(x - p.position[0], z - p.position[2]) < 3.2,
      )
    )
      continue;
    dummy.position.set(x, -0.15, z);
    dummy.scale.setScalar(0.55 + rand() * 0.8);
    dummy.rotation.y = rand() * 6.28;
    dummy.updateMatrix();
    grass.setMatrixAt(gi++, dummy.matrix);
  }
  scene.add(grass);
  const trees = new T.Group();
  scene.add(trees);
  function tree(x, z, s, pink = false) {
    const g = new T.Group();
    g.position.set(x, -0.25, z);
    g.scale.setScalar(s);
    trees.add(g);
    const trunkPath = new T.CatmullRomCurve3([
      new T.Vector3(0, 0, 0),
      new T.Vector3(0.13, 0.9, -0.08),
      new T.Vector3(-0.06, 1.8, 0.03),
      new T.Vector3(0.18, 2.6, 0.06),
    ]);
    mesh(
      new T.TubeGeometry(trunkPath, 10, 0.16, 7, false),
      "#796e58",
      0,
      0,
      0,
      g,
    );
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        r = 0.8 + (i % 3) * 0.3,
        y = 2.1 + (i % 4) * 0.32;
      const bx = Math.cos(a) * r,
        bz = Math.sin(a) * r;
      const branch = new T.CatmullRomCurve3([
        new T.Vector3(0.02, 1.15, 0),
        new T.Vector3(bx * 0.55, y - 0.6, bz * 0.55),
        new T.Vector3(bx, y, bz),
      ]);
      mesh(
        new T.TubeGeometry(branch, 5, 0.055, 5, false),
        "#796e58",
        0,
        0,
        0,
        g,
      );
      const leaf = mesh(
        new T.IcosahedronGeometry(0.92, 2),
        pink ? (i % 2 ? "#e29ebc" : "#f1bdd2") : i % 2 ? "#39836b" : "#6eac67",
        bx,
        y + 0.12,
        bz,
        g,
      );
      leaf.scale.set(1.1, 0.62, 1);
      for (let j = 0; j < 4; j++) {
        const angle = a + j * 1.57;
        const tuft = mesh(
          new T.IcosahedronGeometry(0.19, 1),
          pink ? "#e8b4c8" : "#5c9966",
          bx + Math.cos(angle) * 0.89,
          y + 0.08 + Math.sin(j) * 0.25,
          bz + Math.sin(angle) * 0.87,
          g,
        );
        tuft.scale.set(1.6, 0.48, 1);
        tuft.rotation.y = -angle;
      }
    }
  }
  for (const t of TREE_SPOTS) tree(t.x, t.z, t.scale, t.pink);
  for (let i = 0; i < 23; i++) {
    const a = i * 2.399,
      r = 24 + rand() * 8;
    const stone = ico(1, "#859c87", Math.cos(a) * r, -0.25, Math.sin(a) * r);
    stone.scale.set(1 + rand(), 0.5 + rand(), 1 + rand());
  }
  // Flower meadows and green ridges frame the open walking ground.
  for (let i = 0; i < 15; i++) {
    const a = i * 2.399,
      r = 32.8;
    const hill = mesh(
      new T.SphereGeometry(1, 20, 12),
      "#729d64",
      Math.cos(a) * r,
      -0.1,
      Math.sin(a) * r,
    );
    hill.scale.set(4.2, 1.7 + (i % 3) * 0.4, 3.5);
  }
  for (const color of ["#d3def9", "#eee4a6", "#f0b4d1"]) {
    const flowers = new T.InstancedMesh(
      new T.SphereGeometry(0.09, 5, 3),
      mat(color),
      300,
    );
    for (let i = 0; i < 300; i++) {
      const a = rand() * 6.28,
        r = 9 + rand() * 19;
      dummy.position.set(
        Math.cos(a) * r,
        0.07 + rand() * 0.08,
        Math.sin(a) * r,
      );
      dummy.scale.set(1, 0.4, 1);
      dummy.rotation.set(0, rand() * 6.28, 0);
      dummy.updateMatrix();
      flowers.setMatrixAt(i, dummy.matrix);
    }
    scene.add(flowers);
  }
  // A luminous ancient-tech observatory provides a strong skyline landmark.
  const shrine = new T.Group();
  shrine.position.set(-16, -0.15, -19);
  shrine.rotation.y = 0.45;
  scene.add(shrine);
  for (const x of [-3.2, 3.2]) {
    box(1.3, 7, 1.3, "#c2ccb0", x, 3.3, 0, shrine);
    box(1.7, 0.35, 1.7, "#e3dec0", x, 6.8, 0, shrine);
    box(0.22, 4.6, 0.07, "#61d9d1", x, 3.7, 0.68, shrine);
  }
  box(7.5, 0.7, 1.55, "#c1ccb2", 0, 7.1, 0, shrine);
  const halo = mesh(
    new T.TorusGeometry(2.1, 0.085, 8, 80),
    new T.MeshBasicMaterial({ color: "#d5edcb" }),
    0,
    4,
    0,
    shrine,
  );
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rune = box(
      0.12,
      0.42,
      0.08,
      "#ecdcad",
      Math.sin(a) * 2.1,
      4 + Math.cos(a) * 2.1,
      0.1,
      shrine,
    );
    rune.rotation.z = -a;
  }
  for (let i = 0; i < 6; i++) {
    const rock = ico(1, "#668d7c", -17 + i * 1.6, -0.1, -21);
    rock.scale.set(0.7, 2 + i * 0.4, 0.9);
    rock.rotation.z = 0.2;
  }
  // Remote islands, sky ruins and clouds provide a horizon with depth.
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.399,
      r = 65 + rand() * 65;
    const g = new T.Group();
    g.position.set(Math.cos(a) * r, -9 + rand() * 10, Math.sin(a) * r);
    g.scale.setScalar(1.2 + rand() * 2.5);
    scene.add(g);
    cyl(5.5, 1, 9, "#73958f", 0, -4.5, 0, g, 7);
    cyl(5.5, 5.3, 0.6, "#98b497", 0, 0.1, 0, g, 9);
    for (let j = 0; j < 3; j++) {
      const spire = box(
        0.55,
        3 + rand() * 4,
        0.6,
        "#cbd5b7",
        j * 1.3 - 1,
        1.5,
        0,
        g,
      );
      spire.rotation.z = 0.12 * j;
    }
  }
  const gardenDetails = addGardenDetails({ scene, mesh, box, cyl, mat, wind });
  // Batch the immutable landscape by material; preserve actors and animated exhibits.
  scene.updateMatrixWorld(true);
  const batches = new Map();
  for (const o of staticMeshes) {
    const key = o.material.uuid + o.castShadow;
    const batch = batches.get(key) || {
      material: o.material,
      cast: o.castShadow,
      items: [],
    };
    batch.items.push(o);
    batches.set(key, batch);
  }
  for (const batch of batches.values()) {
    const geometries = batch.items.map((o) => {
      const g = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      return g;
    });
    const joined = mergeGeometries(geometries);
    geometries.forEach((g) => g.dispose());
    if (joined) {
      const m = new T.Mesh(joined, batch.material);
      m.castShadow = batch.cast;
      m.receiveShadow = true;
      scene.add(m);
      batch.items.forEach((o) => {
        o.removeFromParent();
        o.geometry.dispose();
      });
    }
  }
  staticMeshes.length = 0;
  const cloudMaterial = new T.MeshBasicMaterial({
    color: "#edf3e8",
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  for (let i = 0; i < 27; i++) {
    const g = new T.Group();
    const a = i * 2.399,
      r = 45 + rand() * 80;
    g.position.set(Math.cos(a) * r, -6 + rand() * 16, Math.sin(a) * r);
    for (let j = 0; j < 3; j++) {
      const o = mesh(
        new T.SphereGeometry(1, 12, 8),
        cloudMaterial,
        j * 3,
        0,
        0,
        g,
      );
      o.scale.set(5, 1.2 + j * 0.25, 3);
      o.castShadow = o.receiveShadow = false;
    }
    scene.add(g);
    clouds.push({ g, x: g.position.x, phase: i });
  }
  const animated = [];
  const exhibits = [];
  function ring(radius, color, x, y, z, parent) {
    const o = mesh(
      new T.TorusGeometry(radius, 0.035, 6, 64),
      new T.MeshBasicMaterial({ color }),
      x,
      y,
      z,
      parent,
    );
    o.rotation.x = Math.PI / 2;
    return o;
  }
  function label(text, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#153e45";
    ctx.fillRect(0, 0, 1024, 128);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 9, 128);
    ctx.fillStyle = "#f7f2df";
    ctx.font = "500 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 512, 77);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    resources.add(texture);
    return new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide });
  }
  function screen(image, x, y, z, parent) {
    const texture = new T.TextureLoader().load(assetURL(image), () => {
      dirty = true;
    });
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    resources.add(texture);
    box(5.1, 3.1, 0.22, "#25545b", x, y, z, parent);
    const plane = mesh(
      new T.PlaneGeometry(4.86, 2.78),
      new T.MeshBasicMaterial({ map: texture }),
      x,
      y,
      z + 0.12,
      parent,
    );
    plane.castShadow = false;
  }
  for (const [index, p] of PROJECTS.entries()) {
    const g = new T.Group();
    g.position.fromArray(p.position);
    g.rotation.y = Math.atan2(-p.position[0], -p.position[2]);
    scene.add(g);
    exhibits.push(g);
    cyl(2.1, 2.4, 0.42, "#dedecd", 0, -0.1, 0, g);
    cyl(1.3, 1.45, 0.65, "#406d71", 0, 0.4, 0, g);
    ring(1.47, p.color, 0, 0.76, 0, g);
    const sign = mesh(
      new T.PlaneGeometry(3.4, 0.425),
      label(`${String(index + 1).padStart(2, "0")} / ${p.title}`, p.color),
      0,
      1.1,
      1.37,
      g,
    );
    sign.castShadow = false;
    if (p.images.length) {
      screen(p.images[0][0], 0, 3.05, -0.3, g);
      box(0.16, 1.8, 0.16, "#4c7270", -1.9, 1.05, -0.3, g);
      box(0.16, 1.8, 0.16, "#4c7270", 1.9, 1.05, -0.3, g);
    } else {
      const artifact = new T.Group();
      artifact.position.y = 2.2;
      g.add(artifact);
      animated.push(artifact);
      if (p.id === "depthcloud") {
        const geo = new T.TorusKnotGeometry(0.66, 0.23, 110, 8);
        const points = new T.Points(
          geo,
          new T.PointsMaterial({ color: p.color, size: 0.052 }),
        );
        artifact.add(points);
      } else if (p.id === "urdf") {
        cyl(0.4, 0.5, 0.22, "#dedcc3", 0, -0.65, 0, artifact);
        const shoulder = box(
          0.32,
          1.1,
          0.4,
          "#e9c394",
          -0.22,
          -0.04,
          0,
          artifact,
        );
        shoulder.rotation.z = -0.4;
        const forearm = box(
          0.9,
          0.27,
          0.32,
          "#e7c08c",
          0.15,
          0.54,
          0,
          artifact,
        );
        forearm.rotation.z = 0.25;
        ico(0.22, "#3d727c", -0.43, 0.43, 0, artifact);
        ico(0.17, "#3d727c", 0.58, 0.64, 0, artifact);
        box(0.12, 0.37, 0.12, "#d8e7d3", 0.67, 0.44, -0.13, artifact);
        box(0.12, 0.37, 0.12, "#d8e7d3", 0.67, 0.44, 0.13, artifact);
      } else {
        const core = ico(0.8, p.color, 0, 0, 0, artifact, 0);
        core.rotation.z = 0.5;
        const edges = new T.LineSegments(
          new T.EdgesGeometry(new T.BoxGeometry(1.8, 1.8, 1.8)),
          new T.LineBasicMaterial({ color: "#ebeeff" }),
        );
        artifact.add(edges);
      }
      ring(1.05, p.color, 0, -0.5, 0, artifact);
    }
    // A distinct beacon remains visible above the project from the walking camera.
    const beacon = ico(0.18, p.color, 0, 5.15, 0, g, 0);
    beacon.castShadow = false;
    animated.push(beacon);
  }
  const portal = mesh(
    new T.PlaneGeometry(1.55, 2.1),
    new T.MeshBasicMaterial({
      color: "#a0eaff",
      transparent: true,
      opacity: 0.48,
      side: T.DoubleSide,
    }),
    6.55,
    1.9,
    -1.41,
  );
  const portalRing = ring(0.8, "#d8fff4", 6.55, 1.9, -1.4);
  portalRing.rotation.x = 0;
  // Holograms enliven the small Blender plinths around the pavilion.
  for (const [x, z, c] of [
    [-3.8, 1.4, "#71dce1"],
    [-1.65, 3.42, "#e8b793"],
    [1.1, 3.7, "#c4b0ef"],
    [3.5, 2.35, "#9adcd8"],
  ]) {
    const h = ico(0.36, c, x, 1.28, z, scene, 0);
    animated.push(h);
    ring(0.55, c, x, 0.9, z);
  }
  const reactor = ico(0.29, "#84f2f3", 0.72, 1.66, 0.66, scene, 0);
  animated.push(reactor);
  const particlesGeo = new T.BufferGeometry(),
    particlesPos = new Float32Array(140 * 3);
  for (let i = 0; i < 140; i++) {
    particlesPos[i * 3] = (rand() - 0.5) * 58;
    particlesPos[i * 3 + 1] = rand() * 8 + 0.5;
    particlesPos[i * 3 + 2] = (rand() - 0.5) * 58;
  }
  particlesGeo.setAttribute("position", new T.BufferAttribute(particlesPos, 3));
  const particles = new T.Points(
    particlesGeo,
    new T.PointsMaterial({
      color: "#fff6d0",
      size: 0.055,
      transparent: true,
      opacity: 0.8,
    }),
  );
  scene.add(particles);
  const contact = mesh(
    new T.CircleGeometry(0.31, 32),
    new T.MeshBasicMaterial({
      color: "#233f31",
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
    0,
    0,
    0,
  );
  contact.rotation.x = -Math.PI / 2;
  contact.scale.y = 0.68;
  contact.castShadow = false;
  let player = createMotion(SPAWN),
    mode = "overview",
    yaw = 0.15,
    pitch = 0.27,
    night = false,
    dirty = true,
    disposed = false,
    blocked = false;
  let frame = 0,
    last = 0,
    elapsed = 0,
    near = null,
    drag = null,
    zoom = 8,
    frames = 0,
    statTime = 0,
    jumpQueued = false,
    robotReady = false;
  const keys = new Set(),
    touch = { x: 0, z: 0 },
    target = new T.Vector3(),
    cameraGoal = new T.Vector3(),
    look = new T.Vector3(0, 0, 0),
    robotGoal = new T.Vector3();
  const signal = new AbortController();
  const cameraRay = new T.Raycaster(),
    cameraDirection = new T.Vector3();
  const cameraObstacles = [lab, ...exhibits];
  const events = { signal: signal.signal };
  const neutral = () => {
    keys.clear();
    touch.x = touch.z = 0;
    drag = null;
    jumpQueued = false;
    player.vx = player.vz = player.speed = 0;
  };
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
    schedule();
  }
  function schedule() {
    if (!frame && !disposed && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (disposed || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    // Controls render at display refresh rate; quiet scenery stays at 30 FPS.
    const responsive = mode === "walk" && !blocked;
    if (!responsive && last && now - last < 1000 / 30 - 1) {
      schedule();
      return;
    }
    last = now;
    const ambient = !paused();
    if (ambient) elapsed += dt;
    wind.value = elapsed;
    const input = {
      x:
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
        touch.x,
      z:
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) +
        touch.z,
      sprint: keys.has("shift"),
      jump: jumpQueued,
    };
    if (mode === "walk" && !blocked) {
      player = stepMotion(player, input, dt, yaw);
    } else player = stepMotion(player, { x: 0, z: 0 }, dt, yaw);
    jumpQueued = false;
    const walking = player.speed > 0.01;
    const floor = floorHeight(player.x, player.z);
    hero.rotation.y = player.heading;
    hero.position.set(
      player.x,
      player.ground + soleOffset + player.jump,
      player.z,
    );
    character.update(player, elapsed, floorHeight);
    contact.position.set(player.x, floor + 0.005, player.z);
    contact.material.opacity = 0.18 / (1 + player.jump * 2);
    const blinkPhase = elapsed % 4.7;
    const blink =
      blinkPhase > 4.5 ? Math.sin(((blinkPhase - 4.5) / 0.2) * Math.PI) : 0;
    blinking.forEach(
      (o) => (o.morphTargetInfluences[o.morphTargetDictionary.Blink] = blink),
    );
    robotGoal.set(
      player.x +
        Math.cos(player.heading) * 1.05 -
        Math.sin(player.heading) * 0.55,
      player.ground + 2.45 + Math.sin(elapsed * 2) * 0.08,
      player.z -
        Math.sin(player.heading) * 1.05 -
        Math.cos(player.heading) * 0.55,
    );
    robot.position.lerp(robotGoal, robotReady ? 1 - Math.exp(-dt * 5) : 1);
    robotReady = true;
    robot.rotation.y +=
      Math.atan2(
        Math.sin(player.heading - 0.2 - robot.rotation.y),
        Math.cos(player.heading - 0.2 - robot.rotation.y),
      ) *
      (1 - Math.exp(-dt * 6));
    const found =
      mode === "walk"
        ? Math.hypot(player.x - 6.55, player.z + 1.4) < 2.5
          ? { id: "realm", title: "Enter the repository realm" }
          : nearestProject(player)
        : null;
    if (found?.id !== near?.id) {
      near = found;
      onNear(near);
    }
    const portrait = camera.aspect < 0.8;
    if (mode === "overview") {
      target.set(portrait ? 0 : -6, 1, 0);
      cameraGoal.set(
        portrait ? 32 : 39,
        portrait ? 39 : 29,
        portrait ? 44 : 42,
      );
    } else {
      target.set(player.x, player.ground + 1.6 + player.jump * 0.2, player.z);
      const distance = portrait ? zoom * 1.3 : zoom;
      cameraGoal.set(
        player.x + Math.sin(yaw) * distance,
        player.ground + 2 + Math.sin(pitch) * distance,
        player.z + Math.cos(yaw) * distance,
      );
      cameraDirection.subVectors(cameraGoal, target);
      cameraRay.far = cameraDirection.length();
      cameraRay.set(target, cameraDirection.normalize());
      const obstruction = cameraRay.intersectObjects(cameraObstacles, true)[0];
      if (obstruction)
        cameraGoal
          .copy(target)
          .addScaledVector(
            cameraRay.ray.direction,
            Math.max(0.5, obstruction.distance - 0.35),
          );
    }
    const k = 1 - Math.exp(-dt * (mode === "walk" ? 9 : 4));
    camera.position.lerp(cameraGoal, k);
    look.lerp(target, k);
    if (mode === "walk") {
      cameraDirection.subVectors(camera.position, target);
      cameraRay.far = cameraDirection.length();
      cameraRay.set(target, cameraDirection.normalize());
      const obstruction = cameraRay.intersectObjects(cameraObstacles, true)[0];
      if (obstruction)
        camera.position
          .copy(target)
          .addScaledVector(
            cameraRay.ray.direction,
            Math.max(0.5, obstruction.distance - 0.35),
          );
    }
    camera.lookAt(look);
    if (ambient) {
      gardenDetails.update(elapsed);
      animated.forEach((o, i) => {
        o.rotation.y += dt * (0.35 + i * 0.007);
      });
      clouds.forEach(
        (c) => (c.g.position.x = c.x + Math.sin(elapsed * 0.035 + c.phase) * 4),
      );
      portal.material.opacity = 0.35 + Math.sin(elapsed * 2) * 0.08;
      portalRing.rotation.z = elapsed * 0.25;
      particles.rotation.y = elapsed * 0.008;
    }
    renderer.render(scene, camera);
    dirty = false;
    frames++;
    if (now - statTime > 2500) {
      onStats({
        fps: Math.round((frames * 1000) / (now - statTime)),
        calls: renderer.info.render.calls,
      });
      frames = 0;
      statTime = now;
    }
    // Ambient pause allows input and camera movement, but renders no idle frames.
    if (
      ambient ||
      walking ||
      player.jump > 0 ||
      player.air > 0.01 ||
      player.blend > 0.01 ||
      player.landing > 0.01 ||
      (mode === "walk" && !blocked && (keys.size > 0 || touch.x || touch.z)) ||
      camera.position.distanceTo(cameraGoal) > 0.02 ||
      look.distanceTo(target) > 0.02
    )
      schedule();
  }
  function keydown(e) {
    if (
      document.activeElement !== host ||
      blocked ||
      mode !== "walk" ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    )
      return;
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "shift",
        " ",
      ].includes(e.key.toLowerCase())
    ) {
      e.preventDefault();
      if (e.key === " ") {
        if (!e.repeat) jumpQueued = true;
      } else keys.add(e.key.toLowerCase());
      schedule();
    }
  }
  window.addEventListener("keydown", keydown, events);
  window.addEventListener(
    "keyup",
    (e) => {
      keys.delete(e.key.toLowerCase());
      schedule();
    },
    events,
  );
  window.addEventListener("blur", neutral, events);
  document.addEventListener(
    "visibilitychange",
    () => {
      last = 0;
      neutral();
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    },
    events,
  );
  host.addEventListener(
    "pointerdown",
    (e) => {
      if (mode !== "walk" || blocked || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY };
      host.setPointerCapture(e.pointerId);
      host.focus({ preventScroll: true });
    },
    events,
  );
  host.addEventListener(
    "pointermove",
    (e) => {
      if (!drag) return;
      yaw -= (e.clientX - drag.x) * 0.005;
      pitch = T.MathUtils.clamp(
        pitch + (e.clientY - drag.y) * 0.003,
        0.12,
        0.85,
      );
      drag = { x: e.clientX, y: e.clientY };
      schedule();
    },
    events,
  );
  host.addEventListener(
    "pointerup",
    () => {
      drag = null;
    },
    events,
  );
  host.addEventListener(
    "pointercancel",
    () => {
      drag = null;
    },
    events,
  );
  host.addEventListener(
    "wheel",
    (e) => {
      if (mode === "walk" && !blocked) {
        e.preventDefault();
        zoom = T.MathUtils.clamp(zoom + e.deltaY * 0.008, 5, 13);
        schedule();
      }
    },
    { ...events, passive: false },
  );
  renderer.domElement.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      dispose();
      onFailure();
    },
    events,
  );
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  host.append(renderer.domElement);
  resize();
  camera.position.copy(cameraGoal.set(39, 29, 42));
  schedule();
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    signal.abort();
    observer.disconnect();
    const geos = new Set(),
      mats = new Set();
    scene.traverse((o) => {
      if (o.geometry) geos.add(o.geometry);
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          mats.add(m);
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => {
      for (const value of Object.values(m))
        if (value?.isTexture) resources.add(value);
      m.dispose();
    });
    resources.forEach((r) => r.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  }
  return {
    dispose,
    refresh() {
      dirty = true;
      schedule();
    },
    block(value) {
      blocked = value;
      neutral();
      schedule();
    },
    walk() {
      mode = "walk";
      host.focus({ preventScroll: true });
      schedule();
    },
    overview() {
      mode = "overview";
      neutral();
      onNear(null);
      near = null;
      schedule();
    },
    travel(id) {
      const p = PROJECTS.find((p) => p.id === id);
      if (!p) return;
      yaw = Math.atan2(-p.position[0], -p.position[2]);
      neutral();
      player = createMotion(arrivalPoint(p), yaw + Math.PI);
      robotReady = false;
      mode = "walk";
      near = p;
      onNear(p);
      host.focus({ preventScroll: true });
      schedule();
    },
    input(x, z) {
      touch.x = x;
      touch.z = z;
      schedule();
    },
    setNight(value) {
      night = value;
      gardenDetails.setNight(night);
      skyMaterial.uniforms.top.value.set(night ? "#172d50" : "#77b8e5");
      skyMaterial.uniforms.bottom.value.set(night ? "#4f687a" : "#e9f5f2");
      scene.background.set(night ? "#233d59" : "#a7d2df");
      scene.fog.color.copy(scene.background);
      hemi.intensity = night ? 1.05 : 1.8;
      sun.intensity = night ? 1.1 : 2.5;
      sun.color.set(night ? "#a2c9ff" : "#fff0ce");
      water.material.color.set(night ? "#284e65" : "#9fcdd0");
      cloudMaterial.color.set(night ? "#597c92" : "#edf3e8");
      renderer.toneMappingExposure = night ? 1 : 1.03;
      schedule();
    },
  };
}
