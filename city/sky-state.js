/** World coordinates, project content, and deterministic walking rules. */
export const PROJECTS = [
  {
    id: "factory",
    title: "Autonomous Factory",
    label: "SIMULATION DISTRICT",
    position: [13, 0, -7],
    color: "#91d6ff",
    tags: ["Digital twins", "Isaac Sim", "Interactive UI"],
    description:
      "A company project exploring industrial digital twins, robot workcells, and an integrated factory interface. These selected screenshots show the simulation and control surfaces; the source repository is private.",
    images: [
      [
        "factory-dashboard.webp",
        "Factory dashboard with task controls and a live simulation view",
      ],
      [
        "factory-isaac.webp",
        "Isaac Sim robot workcell and shared camera controls",
      ],
    ],
    url: null,
  },
  {
    id: "robotics",
    title: "Robotics & virtual labs",
    label: "ROBOTICS GARDEN",
    position: [-13, 0, -6],
    color: "#f6bc85",
    tags: ["Robot controls", "Simulation", "3D interfaces"],
    description:
      "Robot joint controls, a conveyor workcell, and an interactive virtual laboratory. A selection of my work across simulation and 3D interfaces.",
    images: [
      ["robot-controls.webp", "Robot joint control interface"],
      [
        "conveyor-simulation.webp",
        "Industrial conveyor surrounded by robot arms",
      ],
      [
        "virtual-lab.webp",
        "Virtual lab with robot arms, CNC machines and 3D printers",
      ],
    ],
    url: null,
  },
  {
    id: "depthcloud",
    title: "DepthCloud",
    label: "PERCEPTION OBSERVATORY",
    position: [-10, 0, 11],
    color: "#87efdc",
    tags: ["Python", "Computer vision", "Three.js"],
    description:
      "A local webcam reconstruction studio for collecting steady views, aligning cameras, and inspecting an estimated 3D surface.",
    images: [],
    url: "https://github.com/shiwamshoryasharma/DepthCloud",
  },
  {
    id: "urdf",
    title: "URDF Builder 2.0",
    label: "ROBOT AUTHORING",
    position: [3, 0, 15],
    color: "#ffd19a",
    tags: ["Robotics", "TypeScript", "Electron"],
    description:
      "Author, validate, and visualize robot models with synchronized XML and 3D views in a desktop workspace.",
    images: [],
    url: "https://github.com/shiwamshoryasharma/URDF-BUILDER-2.0",
  },
  {
    id: "geometry",
    title: "AnishapeGeometry",
    label: "GEOMETRY SANCTUARY",
    position: [15, 0, 7],
    color: "#c9b2ff",
    tags: ["CAD", "Geometry", "Open source"],
    description:
      "Experiments in geometry and CAD: building tools for exploring, creating, and understanding shapes.",
    images: [],
    url: "https://github.com/shiwamshoryasharma/AnishapeGeometry",
  },
];
export const SPAWN = { x: 0, z: 7 };
export const WORLD_RADIUS = 28;
export const TREE_SPOTS = Array.from({ length: 27 }, (_, i) => {
  const a = i * 2.399,
    r = 22 + ((i * 17) % 9);
  return {
    x: Math.cos(a) * r,
    z: Math.sin(a) * r,
    scale: 0.85 + (i % 4) * 0.23,
    pink: i % 4 === 0,
  };
}).concat([
  { x: -9, z: 2, scale: 1.1, pink: true },
  { x: 8, z: -11, scale: 1.25, pink: true },
  { x: 9, z: 14, scale: 0.8, pink: true },
]);
// Lab shell, exhibit plinths and original Blender display bases.
const circles = [
  ...TREE_SPOTS.map((t) => ({ x: t.x, z: t.z, r: 0.26 * t.scale })),
  ...PROJECTS.map((p) => ({ x: p.position[0], z: p.position[2], r: 1.7 })),
  ...[
    [-3.8, 1.4],
    [-1.65, 3.42],
    [1.1, 3.7],
    [3.5, 2.35],
    [0.72, 0.66],
  ].map(([x, z]) => ({ x, z, r: 0.8 })),
];
export function floorHeight(x, z) {
  if (
    Math.hypot(x, z) < 5.65 ||
    Math.hypot(x - 6.55, z + 1.4) < 1.82 ||
    Math.hypot(x + 7, z) < 1.68
  )
    return 0.225;
  for (const p of PROJECTS) {
    const [px, , pz] = p.position,
      r = Math.hypot(px, pz),
      along = (x * px + z * pz) / r,
      across = Math.abs(x * pz - z * px) / r;
    if (along > 5.9 && along < r - 1.8 && across < 0.9) return -0.03;
  }
  return -0.15;
}
export function walkable(x, z) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    Math.hypot(x, z) < WORLD_RADIUS &&
    !(x > -4.45 && x < 1.1 && z > -3.4 && z < 0.55) &&
    !circles.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 0.25)
  );
}
export function movePlayer(player, input, dt, yaw = 0) {
  const length = Math.hypot(input.x, input.z);
  if (!length) return { ...player };
  const step = Math.min(Math.max(dt, 0), 0.05) * (input.sprint ? 6 : 3.8);
  const dx =
    ((input.x * Math.cos(yaw) + input.z * Math.sin(yaw)) / length) * step;
  const dz =
    ((-input.x * Math.sin(yaw) + input.z * Math.cos(yaw)) / length) * step;
  let { x, z } = player;
  if (walkable(x + dx, z)) x += dx;
  if (walkable(x, z + dz)) z += dz;
  return { x, z };
}
export function nearestProject(player, maxDistance = 4.4) {
  let closest = null,
    distance = maxDistance;
  for (const p of PROJECTS) {
    const d = Math.hypot(player.x - p.position[0], player.z - p.position[2]);
    if (d < distance) {
      closest = p;
      distance = d;
    }
  }
  return closest;
}
export function arrivalPoint(project) {
  const [x, , z] = project.position;
  const r = Math.hypot(x, z);
  return { x: x - (x / r) * 3, z: z - (z / r) * 3 };
}
