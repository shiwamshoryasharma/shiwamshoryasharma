import * as T from "three";
import { GARDEN, floorHeight } from "./sky-state.js";

/** Hand-composed details for the observatory garden; static parts use the world's batches. */
export function addGardenDetails({ scene, mesh, box, cyl, mat, wind }) {
  const brass = "#b89558",
    timber = "#655146",
    jade = "#245b60",
    paper = "#f7e5b7";
  const glow = new T.MeshStandardMaterial({
    color: "#ffedba",
    emissive: "#ffc477",
    emissiveIntensity: 0.45,
    roughness: 0.7,
  });
  const tube = (points, radius, material, parent = scene) =>
    mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
        Math.max(8, points.length * 5),
        radius,
        5,
        false,
      ),
      material,
      0,
      0,
      0,
      parent,
    );
  const circle = (radius, thickness, color, x, y, z, parent = scene) => {
    const m = mesh(
      new T.TorusGeometry(radius, thickness, 5, 64),
      color,
      x,
      y,
      z,
      parent,
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  };
  function lantern(x, y, z, scale = 1) {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.scale.setScalar(scale);
    scene.add(g);
    cyl(0.055, 0.08, 1.95, timber, 0, 0.975, 0, g, 8);
    box(0.65, 0.06, 0.09, brass, 0.21, 1.88, 0, g);
    cyl(0.012, 0.012, 0.22, timber, 0.42, 1.75, 0, g, 5);
    const body = mesh(
      new T.SphereGeometry(0.24, 12, 10),
      glow,
      0.42,
      1.43,
      0,
      g,
    );
    body.scale.y = 1.4;
    for (const h of [1.14, 1.25, 1.43, 1.61, 1.72])
      circle(
        h === 1.14 || h === 1.72 ? 0.1 : 0.23,
        0.012,
        brass,
        0.42,
        h,
        0,
        g,
      );
    cyl(0.06, 0.065, 0.12, jade, 0.42, 1.08, 0, g, 8);
    tube(
      [
        [0.42, 1.04, 0],
        [0.41, 0.84, 0],
        [0.47, 0.73, 0.03],
      ],
      0.012,
      "#c58072",
      g,
    );
    const tag = box(0.13, 0.22, 0.008, paper, 0.47, 0.68, 0.03, g);
    tag.rotation.z = -0.15;
    box(0.045, 0.07, 0.012, jade, 0.47, 0.7, 0.039, g);
    cyl(0.2, 0.26, 0.12, "#b5bda3", 0, 0.04, 0, g);
  }
  // Lanterns lead into the grove and frame the pavilion instead of filling the walkways.
  for (const [x, z, s] of [
    [-5.7, 4, 1.1],
    [5.3, 4.2, 1.1],
    [-8, 8, 0.85],
    [7, 11, 0.85],
    [-17.8, 0.5, 0.9],
    [-10.2, 5.5, 0.9],
    [11, -4, 0.85],
  ])
    lantern(x, floorHeight(x, z), z, s);

  // Inlaid brass and jade circuits give the central platform an engineered identity.
  for (const radius of [4.95, 5.17]) circle(radius, 0.018, brass, 0, 0.239, 0);
  for (let i = 0; i < 40; i++) {
    const a = (i * Math.PI) / 20,
      r = 5.05;
    const tick = box(
      0.018,
      0.009,
      i % 5 === 0 ? 0.21 : 0.08,
      brass,
      Math.sin(a) * r,
      0.245,
      Math.cos(a) * r,
    );
    tick.rotation.y = a;
  }
  for (const a of [-1.0, -0.35, 0.45, 1.0]) {
    const points = [];
    for (let i = 0; i < 13; i++) {
      const t = a + i * 0.027;
      points.push([Math.sin(t) * 4.63, 0.247, Math.cos(t) * 4.63]);
    }
    tube(points, 0.021, jade);
  }
  // Insulators, braided cable and copper vents around the existing lab machinery.
  tube(
    [
      [-4, 0.31, 0.2],
      [-4.6, 0.34, -0.8],
      [-4.4, 0.35, -2.9],
      [-1.3, 0.35, -3.7],
      [1.5, 0.35, -2.6],
    ],
    0.065,
    jade,
  );
  tube(
    [
      [-4, 0.42, 0.2],
      [-4.55, 0.43, -0.8],
      [-4.35, 0.43, -2.9],
      [-1.3, 0.43, -3.6],
      [1.5, 0.43, -2.6],
    ],
    0.016,
    brass,
  );
  for (const x of [-4.3, 1.5]) {
    box(0.46, 0.64, 0.52, jade, x, 0.57, -2.8);
    for (let i = 0; i < 5; i++)
      box(0.34, 0.025, 0.035, brass, x, 0.36 + i * 0.1, -2.52);
    cyl(0.09, 0.09, 0.12, glow, x, 0.97, -2.8, scene, 10);
  }
  // An armillary instrument: intersecting engraved hoops and a polished navigation lens.
  const astrolabe = new T.Group();
  astrolabe.position.set(-6.2, 0.18, -3.9);
  scene.add(astrolabe);
  cyl(0.45, 0.6, 0.18, "#c7c5ac", 0, 0.02, 0, astrolabe);
  cyl(0.09, 0.18, 1.05, timber, 0, 0.56, 0, astrolabe, 12);
  for (let i = 0; i < 3; i++) {
    const hoop = mesh(
      new T.TorusGeometry(0.72 - i * 0.08, 0.025, 6, 72),
      brass,
      0,
      1.28,
      0,
      astrolabe,
    );
    hoop.rotation.set(0.55 + i * 0.5, 0.7 * i, 0.4 * i);
  }
  mesh(new T.SphereGeometry(0.18, 16, 12), glow, 0, 1.28, 0, astrolabe);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const tick = box(
      0.04,
      0.12,
      0.04,
      jade,
      Math.cos(a) * 0.74,
      1.28 + Math.sin(a) * 0.74,
      0,
      astrolabe,
    );
    tick.rotation.z = a - Math.PI / 2;
  }

  // Water garden and a low arched bridge, with the same dimensions used by collision.
  const { x: gx, z: gz, rx, rz } = GARDEN;
  const bank = mesh(new T.CircleGeometry(1, 80), "#9da88c", gx, -0.137, gz);
  bank.rotation.x = -Math.PI / 2;
  bank.scale.set(rx + 0.42, rz + 0.42, 1);
  const waterMaterial = new T.MeshStandardMaterial({
    color: "#3b9d9d",
    roughness: 0.24,
    metalness: 0.32,
    transparent: true,
    opacity: 0.9,
  });
  const pond = mesh(new T.CircleGeometry(1, 80), waterMaterial, gx, -0.122, gz);
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(rx, rz, 1);
  pond.castShadow = false;
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36;
    const rock = mesh(
      new T.IcosahedronGeometry(0.23, 1),
      i % 2 ? "#a9af96" : "#c6c4a7",
      gx + Math.cos(a) * (rx + 0.18),
      -0.04,
      gz + Math.sin(a) * (rz + 0.16),
    );
    rock.scale.set(1.6, 0.75, 1);
    rock.rotation.y = a;
  }
  for (let i = 0; i < 29; i++) {
    const x = gx - rx - 0.18 + (i * (rx * 2 + 0.36)) / 28;
    box(0.245, 0.1, 1.28, timber, x, floorHeight(x, gz) - 0.05, gz);
    box(0.21, 0.013, 0.018, brass, x, floorHeight(x, gz) + 0.008, gz - 0.5);
    box(0.21, 0.013, 0.018, brass, x, floorHeight(x, gz) + 0.008, gz + 0.5);
  }
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i < 9; i++) {
      const x = gx - rx + (i * rx) / 4,
        y = floorHeight(x, gz);
      cyl(0.034, 0.045, 0.62, jade, x, y + 0.31, gz + side * 0.7, scene, 6);
      mesh(
        new T.SphereGeometry(0.065, 8, 6),
        brass,
        x,
        y + 0.63,
        gz + side * 0.7,
      );
      points.push([x, y + 0.54, gz + side * 0.7]);
    }
    tube(points, 0.033, jade);
  }
  for (let i = 0; i < 11; i++) {
    const a = i * 2.399,
      r = 0.6 + (i % 4) * 0.22;
    const x = gx + Math.cos(a) * r * 2,
      z = gz + Math.sin(a) * r * 1.3;
    if (Math.abs(z - gz) < 0.75) continue;
    const pad = mesh(
      new T.CircleGeometry(0.17 + (i % 3) * 0.045, 16, 0, Math.PI * 1.84),
      "#497c62",
      x,
      -0.107,
      z,
    );
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = a;
    for (let j = 0; j < 5; j++) {
      const petal = mesh(
        new T.SphereGeometry(0.067, 6, 4),
        "#f3b4c3",
        x + Math.cos(j * 1.257) * 0.06,
        -0.05,
        z + Math.sin(j * 1.257) * 0.06,
      );
      petal.scale.set(1, 0.45, 1.6);
      petal.rotation.y = -j * 1.257;
    }
  }
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const ripple = new T.Mesh(
      new T.RingGeometry(0.44, 0.453, 64),
      new T.MeshBasicMaterial({
        color: "#c0e4c9",
        transparent: true,
        opacity: 0.35,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(gx - 1.7 + i * 1.4, -0.104, gz + (i % 2 ? 1.2 : -1.1));
    scene.add(ripple);
    ripples.push(ripple);
  }

  // A suspended celestial computer crowns the station: a distinctive brass orbit atlas.
  const atlas = new T.Group();
  atlas.position.set(-1.2, 5.8, -5.3);
  atlas.rotation.set(0.12, 0.12, -0.18);
  scene.add(atlas);
  for (let i = 0; i < 3; i++) {
    const orbit = mesh(
      new T.TorusGeometry(1.9 - i * 0.22, 0.027, 6, 96),
      brass,
      0,
      0,
      0,
      atlas,
    );
    orbit.rotation.set(i * 0.45, i * 0.75, 0);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const tick = box(
      0.035,
      i % 3 === 0 ? 0.2 : 0.09,
      0.04,
      jade,
      Math.cos(a) * 1.9,
      Math.sin(a) * 1.9,
      0,
      atlas,
    );
    tick.rotation.z = a - Math.PI / 2;
  }
  mesh(new T.OctahedronGeometry(0.37), glow, 0, 0, 0, atlas);
  const satellite = new T.Mesh(new T.OctahedronGeometry(0.14), glow);
  scene.add(satellite);
  tube(
    [
      [-3.1, 4.5, -5.2],
      [-2.6, 5, -5.3],
      [-2.9, 6, -5.3],
    ],
    0.04,
    jade,
  );
  tube(
    [
      [0.8, 4.5, -5.2],
      [0.3, 5, -5.3],
      [0.6, 6, -5.3],
    ],
    0.04,
    jade,
  );

  // Low fern beds and flowering stalks leave the paths legible.
  const leafGeo = new T.SphereGeometry(1, 5, 3),
    leafMat = mat("#397560");
  const leaves = new T.InstancedMesh(leafGeo, leafMat, 700),
    dummy = new T.Object3D();
  let index = 0;
  for (let cluster = 0; cluster < 35; cluster++) {
    const a = cluster * 2.399,
      r = cluster < 16 ? 6.8 : 19 + (cluster % 5);
    const x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    for (let j = 0; j < 20; j++) {
      const angle = j * 2.399,
        spread = 0.13 + (j % 5) * 0.07;
      dummy.position.set(
        x + Math.cos(angle) * spread,
        -0.02 + (j % 4) * 0.07,
        z + Math.sin(angle) * spread,
      );
      dummy.rotation.set(Math.sin(angle) * 0.65, angle, Math.cos(angle) * 0.65);
      dummy.scale.set(0.045, 0.08, 0.2 + (j % 3) * 0.05);
      dummy.updateMatrix();
      leaves.setMatrixAt(index++, dummy.matrix);
    }
  }
  scene.add(leaves);

  // Pennants use a restrained wind shader; their tassels and frames are real geometry.
  const clothMaterial = new T.MeshStandardMaterial({
    color: "#dcd7b1",
    side: T.DoubleSide,
    roughness: 1,
  });
  clothMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = "uniform float uWind;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n transformed.z += sin(uWind*1.6+position.y*3.)*.1*pow(clamp(-position.y/2.,0.,1.),1.4);",
    );
  };
  for (const [x, z, turn] of [
    [-5, -5, 0.2],
    [3, -5, -0.15],
    [-18, -17, 0.4],
    [-13, -18, -0.35],
  ]) {
    cyl(0.045, 0.07, 4.8, timber, x, 2.2, z, scene, 8);
    const cross = box(1.2, 0.055, 0.06, brass, x, 4.32, z);
    cross.rotation.y = turn;
    const geo = new T.PlaneGeometry(0.87, 2.15, 4, 14);
    geo.translate(0, -1.075, 0);
    const banner = new T.Mesh(geo, clothMaterial);
    banner.position.set(x, 4.29, z);
    banner.rotation.y = turn;
    scene.add(banner);
    // A brass observatory emblem floats just in front of the woven pennant.
    const emblem = mesh(
      new T.TorusGeometry(0.18, 0.016, 5, 32),
      brass,
      x,
      3.76,
      z + 0.035,
    );
    emblem.rotation.y = turn;
    box(0.015, 0.46, 0.02, jade, x, 3.76, z + 0.05);
  }
  // Falling sakura petals are instanced; one draw call regardless of petal count.
  const petals = new T.InstancedMesh(
    new T.SphereGeometry(1, 5, 3),
    new T.MeshStandardMaterial({
      color: "#f1bdcd",
      roughness: 1,
      side: T.DoubleSide,
    }),
    96,
  );
  petals.instanceMatrix.setUsage(T.DynamicDrawUsage);
  petals.frustumCulled = false;
  scene.add(petals);
  const update = (time) => {
    satellite.position.set(
      -1.2 + Math.cos(time * 0.18) * 1.9,
      5.8 + Math.sin(time * 0.18) * 1.9,
      -5.25,
    );
    satellite.rotation.y = time * 0.3;
    for (let i = 0; i < 96; i++) {
      const cycle = (time * 0.16 + i * 0.618) % 1,
        a = i * 2.399;
      const center = i % 2 ? [-9, 2] : [8, -11];
      dummy.position.set(
        center[0] + Math.cos(a) * 2.2 + Math.sin(time * 0.3 + i) * 0.6,
        3.8 - cycle * 3.8,
        center[1] + Math.sin(a) * 2 + cycle * 1.6,
      );
      dummy.rotation.set(time * 0.6 + i, i, time * 0.8 + i * 0.3);
      dummy.scale.set(0.045, 0.009, 0.075);
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
    ripples.forEach((r, i) => {
      const t = (time * 0.23 + i * 0.33) % 1;
      r.scale.setScalar(0.5 + t * 1.7);
      r.material.opacity = (1 - t) * 0.3;
    });
  };
  update(0);
  return {
    update,
    setNight(value) {
      glow.emissiveIntensity = value ? 1.8 : 0.45;
      waterMaterial.color.set(value ? "#225f73" : "#3b9d9d");
    },
  };
}
