import test from "node:test";
import assert from "node:assert/strict";
import {
  PROJECTS,
  SPAWN,
  walkable,
  movePlayer,
  nearestProject,
  arrivalPoint,
  floorHeight,
  GARDEN,
} from "../city/sky-state.js";
test("spawn and all fast-travel arrivals are walkable and in interaction range", () => {
  assert.ok(walkable(SPAWN.x, SPAWN.z));
  for (const project of PROJECTS) {
    const p = arrivalPoint(project);
    assert.ok(walkable(p.x, p.z));
    assert.equal(nearestProject(p)?.id, project.id);
  }
});

test("water garden blocks the pond but its bridge is walkable and follows the arch", () => {
  assert.equal(walkable(GARDEN.x, GARDEN.z + 1), false);
  assert.equal(walkable(GARDEN.x, GARDEN.z), true);
  assert.ok(floorHeight(GARDEN.x, GARDEN.z) > 0.3);
  assert.ok(floorHeight(GARDEN.x + GARDEN.rx, GARDEN.z) < 0.03);
});
test("movement normalizes diagonals and caps long frame gaps", () => {
  const a = movePlayer(SPAWN, { x: 1, z: 0 }, 0.02),
    b = movePlayer(SPAWN, { x: 1, z: 1 }, 0.02);
  assert.ok(
    Math.abs(Math.hypot(a.x, a.z - 7) - Math.hypot(b.x, b.z - 7)) < 1e-10,
  );
  assert.deepEqual(
    movePlayer(SPAWN, { x: 1, z: 0 }, 10),
    movePlayer(SPAWN, { x: 1, z: 0 }, 0.05),
  );
});
test("island edge and lab walls block walking, nearby exhibit is selected by distance", () => {
  assert.equal(walkable(29, 0), false);
  assert.equal(walkable(-2, -1), false);
  assert.equal(walkable(NaN, 0), false);
  const edge = { x: 27.99, z: 0 };
  assert.deepEqual(movePlayer(edge, { x: 1, z: 0 }, 0.05), edge);
  assert.equal(nearestProject({ x: 25, z: 20 }), null);
  assert.equal(nearestProject({ x: 13, z: -4 })?.id, "factory");
});

test("feet follow the grass, raised pavilion and stepping-stone surfaces", () => {
  assert.equal(floorHeight(0, 7), -0.15);
  assert.equal(floorHeight(0, 0), 0.225);
  assert.equal(floorHeight(-10 * 0.6, 11 * 0.6), -0.03);
});
