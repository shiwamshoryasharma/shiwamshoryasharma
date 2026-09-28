import { floorHeight, walkable } from "./sky-state.js";

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const damp = (a, b, rate, dt) => b + (a - b) * Math.exp(-rate * dt);
export const strideLength = (run) => 1.9 + run;

export function createMotion(position, heading = 0) {
  return {
    ...position,
    vx: 0,
    vz: 0,
    speed: 0,
    heading,
    phase: 0,
    blend: 0,
    run: 0,
    jump: 0,
    vertical: 0,
    air: 0,
    landing: 0,
    ground: floorHeight(position.x, position.z),
    turn: 0,
  };
}

/** Small simulation steps make acceleration and collisions independent of refresh rate. */
export function stepMotion(previous, input, delta, yaw = 0) {
  const state = { ...previous };
  const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, 0.05);
  if (!dt) return state;
  const steps = Math.ceil(dt / (1 / 120)),
    h = dt / steps;
  const length = Math.hypot(input.x, input.z);
  const magnitude = Math.min(1, length);
  const speed = input.sprint ? 4.6 : 2.2;
  const dx = length
    ? (input.x * Math.cos(yaw) + input.z * Math.sin(yaw)) / length
    : 0;
  const dz = length
    ? (-input.x * Math.sin(yaw) + input.z * Math.cos(yaw)) / length
    : 0;
  if (input.jump && state.jump === 0) state.vertical = 4.4;
  for (let i = 0; i < steps; i++) {
    const vx = dx * speed * magnitude,
      vz = dz * speed * magnitude;
    const gap = Math.hypot(vx - state.vx, vz - state.vz);
    const braking = !length || vx * state.vx + vz * state.vz < 0;
    const change = gap ? Math.min(1, ((braking ? 20 : 13) * h) / gap) : 1;
    state.vx += (vx - state.vx) * change;
    state.vz += (vz - state.vz) * change;
    const oldX = state.x,
      oldZ = state.z;
    if (walkable(state.x + state.vx * h, state.z)) state.x += state.vx * h;
    else state.vx = 0;
    if (walkable(state.x, state.z + state.vz * h)) state.z += state.vz * h;
    else state.vz = 0;
    const distance = Math.hypot(state.x - oldX, state.z - oldZ);
    state.speed = distance / h;
    if (state.speed < 0.00001) state.speed = 0;
    let turn = 0;
    if (state.speed > 0.025) {
      const desired = Math.atan2(state.x - oldX, state.z - oldZ);
      const error = Math.atan2(
        Math.sin(desired - state.heading),
        Math.cos(desired - state.heading),
      );
      turn = clamp(error * (1 - Math.exp(-18 * h)), -9 * h, 9 * h);
      state.heading += turn;
    }
    state.turn = damp(state.turn, turn / h, 10, h);
    state.run = damp(state.run, clamp((state.speed - 2.2) / 2.4, 0, 1), 10, h);
    state.blend = damp(state.blend, clamp(state.speed / 1.2, 0, 1), 14, h);
    if (state.jump === 0)
      state.phase = (state.phase + distance / strideLength(state.run)) % 1;
    state.landing = damp(state.landing, 0, 16, h);
    if (state.jump > 0 || state.vertical > 0) {
      state.vertical -= 13 * h;
      state.jump += state.vertical * h;
      if (state.jump <= 0) {
        state.jump = 0;
        state.landing = clamp(-state.vertical / 6, 0, 1);
        state.vertical = 0;
      }
    }
    state.air = damp(state.air, state.jump > 0 ? 1 : 0, 18, h);
    state.ground = damp(state.ground, floorHeight(state.x, state.z), 20, h);
  }
  return state;
}

/** During stance, the foot moves backwards at ground speed; only swing lifts it. */
export function sampleFoot(phase, run) {
  const p = ((phase % 1) + 1) % 1;
  const stance = 0.62 - run * 0.17,
    stride = strideLength(run);
  const reach = (stride * stance) / 2;
  if (p < stance) return { forward: reach - stride * p, lift: 0, swing: false };
  const u = (p - stance) / (1 - stance),
    smooth = u * u * (3 - 2 * u);
  const tangent = -stride * (1 - stance);
  return {
    forward:
      reach * (2 * smooth - 1) + tangent * (2 * u * u * u - 3 * u * u + u),
    lift: (0.17 + 0.13 * run) * Math.sin(Math.PI * u) ** 2,
    swing: true,
  };
}
