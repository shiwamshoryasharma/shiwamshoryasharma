import test from "node:test";
import assert from "node:assert/strict";
import {
  createMotion,
  stepMotion,
  strideLength,
  sampleFoot,
} from "../city/sky-motion.js";
import { walkable } from "../city/sky-state.js";

const idle = { x: 0, z: 0 };
function advance(state, input, seconds, hz = 60, yaw = 0) {
  for (let i = 0; i < Math.round(seconds * hz); i++)
    state = stepMotion(state, input, 1 / hz, yaw);
  return state;
}
test("starts progressively and stops promptly without a long skating tail", () => {
  let state = createMotion({ x: 0, z: 10 });
  state = stepMotion(state, { x: 1, z: 0 }, 1 / 60);
  assert.ok(state.speed > 0 && state.speed < 0.5);
  state = advance(state, { x: 1, z: 0 }, 0.5);
  assert.ok(state.speed > 2 && state.speed < 2.5);
  const stopped = advance(state, idle, 0.5);
  assert.equal(stopped.speed, 0);
  assert.ok(stopped.x - state.x < 0.2);
  assert.ok(stopped.blend < 0.03);
});
test("walk distance, stride and turns agree across 30/60/120 Hz", () => {
  const states = [30, 60, 120].map((hz) =>
    advance(createMotion({ x: 0, z: 10 }), { x: 1, z: 0 }, 1, hz),
  );
  for (const state of states.slice(1)) {
    assert.ok(Math.abs(state.x - states[0].x) < 0.015);
    assert.ok(Math.abs(state.phase - states[0].phase) < 0.015);
    assert.ok(Math.abs(state.heading - states[0].heading) < 0.01);
  }
});
test("diagonals do not run faster and heading does not snap ninety degrees", () => {
  const start = createMotion({ x: 0, z: 10 });
  const a = stepMotion(start, { x: 1, z: 0 }, 1 / 60);
  const b = stepMotion(start, { x: 1, z: 1 }, 1 / 60);
  assert.ok(Math.abs(a.speed - b.speed) < 1e-9);
  assert.ok(a.heading > 0 && a.heading < 0.25);
});
test("pushing into a wall stops the gait and never crosses the wall", () => {
  let state = createMotion({ x: -2, z: 2 });
  state = advance(state, { x: 0, z: -1, sprint: true }, 2);
  assert.ok(walkable(state.x, state.z));
  assert.ok(state.z >= 0.55);
  assert.equal(state.speed, 0);
  const phase = state.phase;
  state = advance(state, { x: 0, z: -1 }, 0.5);
  assert.equal(state.phase, phase);
  assert.ok(state.blend < 0.02);
});
test("camera-relative input, long-frame protection and one-shot jump remain deterministic", () => {
  const start = createMotion({ x: 0, z: 10 });
  const state = stepMotion(start, { x: 0, z: -1 }, 0.05, Math.PI / 2);
  assert.ok(state.x < 0);
  assert.deepEqual(stepMotion(start, idle, 8), stepMotion(start, idle, 0.05));
  let jumping = stepMotion(start, { ...idle, jump: true }, 1 / 60);
  assert.ok(jumping.jump > 0);
  jumping = advance(jumping, idle, 1);
  assert.equal(jumping.jump, 0);
  assert.equal(jumping.vertical, 0);
});
test("stance foot cancels forward travel; swing lifts clear and lands continuously", () => {
  const stride = strideLength(0);
  const a = sampleFoot(0.1, 0),
    b = sampleFoot(0.2, 0);
  assert.ok(Math.abs(b.forward - a.forward + 0.1 * stride) < 1e-9);
  assert.equal(a.lift, 0);
  assert.ok(sampleFoot(0.81, 0).lift > 0.12);
  for (const phase of [0.62, 1]) {
    const before = sampleFoot(phase - 1e-6, 0),
      after = sampleFoot(phase + 1e-6, 0);
    assert.ok(Math.abs(before.forward - after.forward) < 0.0001);
    assert.ok(Math.abs(before.lift - after.lift) < 0.0001);
  }
});
