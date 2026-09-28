import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as T from "../city/vendor/three.core.js";
import { createCharacterAnimator } from "../city/sky-character.js";
import { createMotion } from "../city/sky-motion.js";

const bytes = readFileSync(
  new URL("../assets/anime-explorer.glb", import.meta.url),
);
const jsonSize = bytes.readUInt32LE(12);
const asset = JSON.parse(bytes.subarray(20, 20 + jsonSize));
const binary = bytes.subarray(28 + jsonSize);
function accessor(index) {
  const a = asset.accessors[index],
    view = asset.bufferViews[a.bufferView];
  const Type = { 5126: Float32Array, 5123: Uint16Array, 5121: Uint8Array }[
    a.componentType
  ];
  const size = { VEC3: 3, VEC4: 4, MAT4: 16 }[a.type];
  const offset = (view.byteOffset || 0) + (a.byteOffset || 0);
  const values = binary.subarray(
    offset,
    offset + a.count * size * Type.BYTES_PER_ELEMENT,
  );
  return {
    values: new Type(
      values.buffer.slice(
        values.byteOffset,
        values.byteOffset + values.byteLength,
      ),
    ),
    size,
  };
}
function fixture() {
  const nodes = asset.nodes.map((n) => {
    const o = new T.Bone();
    o.name = n.name || "";
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    return o;
  });
  asset.nodes.forEach((n, i) =>
    n.children?.forEach((c) => nodes[i].add(nodes[c])),
  );
  const hero = nodes.find((n) => n.name === "AnimeExplorer");
  hero.updateMatrixWorld(true);
  return { hero, nodes, animator: createCharacterAnimator(hero) };
}
const position = (o) => o.getWorldPosition(new T.Vector3());
test("idle stance separates feet, lowers arms and bends elbows without lifting the soles", () => {
  const { hero, animator } = fixture();
  const left = hero.getObjectByName("J_Bip_L_Foot"),
    right = hero.getObjectByName("J_Bip_R_Foot");
  const hand = hero.getObjectByName("J_Bip_L_Hand");
  const originalHand = position(hand),
    originalFoot = position(left);
  animator.update(createMotion({ x: 0, z: 7 }), 0, () => -0.15);
  const separation = position(left).distanceTo(position(right));
  assert.ok(
    separation > 0.16 && separation < 0.35,
    `foot separation ${separation}`,
  );
  assert.ok(
    position(hand).x < originalHand.x - 0.04,
    "arm rests closer to the torso",
  );
  assert.ok(
    Math.abs(position(left).y - originalFoot.y) < 0.02,
    "ankle stays grounded",
  );
  assert.ok(
    hero
      .getObjectByName("J_Bip_L_LowerArm")
      .quaternion.angleTo(new T.Quaternion()) > 0.1,
  );
});
test("walking lifts one foot, flexes the knee and alternates the supporting leg", () => {
  const { hero, animator } = fixture();
  const state = {
    ...createMotion({ x: 0, z: 7 }),
    speed: 2.2,
    blend: 1,
    phase: 0.81,
  };
  const left = hero.getObjectByName("J_Bip_L_Foot"),
    right = hero.getObjectByName("J_Bip_R_Foot");
  animator.update(state, 1, () => -0.15);
  assert.ok(
    position(left).y - position(right).y > 0.1,
    "left foot clears ground",
  );
  const knee = hero.getObjectByName("J_Bip_L_LowerLeg");
  assert.ok(
    knee.quaternion.angleTo(new T.Quaternion()) > 0.35,
    "knee visibly flexes",
  );
  animator.update({ ...state, phase: 0.31 }, 1, () => -0.15);
  assert.ok(
    position(right).y - position(left).y > 0.1,
    "right foot clears ground next",
  );
});
test("the same-side hand swings back while its foot steps forward", () => {
  const { hero, animator } = fixture();
  const state = {
    ...createMotion({ x: 0, z: 7 }),
    speed: 2.2,
    blend: 1,
    phase: 0.08,
  };
  animator.update(state, 1, () => -0.15);
  const foot = position(hero.getObjectByName("J_Bip_L_Foot"));
  const hand = position(hero.getObjectByName("J_Bip_L_Hand"));
  const shoulder = position(hero.getObjectByName("J_Bip_L_UpperArm"));
  assert.ok(foot.z > 0.25);
  assert.ok(hand.z < shoulder.z - 0.04, "arm and leg counter-swing");
});
test("the actual GLB skin deforms with the animated bones, not only helper transforms", () => {
  const { hero, nodes, animator } = fixture();
  const body = asset.nodes.find((n) => n.name === "Body");
  const primitive = asset.meshes[body.mesh].primitives.find(
    (p) => p.attributes.JOINTS_0 !== undefined,
  );
  const geometry = new T.BufferGeometry();
  for (const [key, name] of [
    ["POSITION", "position"],
    ["JOINTS_0", "skinIndex"],
    ["WEIGHTS_0", "skinWeight"],
  ]) {
    const data = accessor(primitive.attributes[key]);
    geometry.setAttribute(name, new T.BufferAttribute(data.values, data.size));
  }
  const skin = asset.skins[body.skin],
    inverse = accessor(skin.inverseBindMatrices).values;
  const skeleton = new T.Skeleton(
    skin.joints.map((i) => nodes[i]),
    skin.joints.map((_, i) => new T.Matrix4().fromArray(inverse, i * 16)),
  );
  const mesh = new T.SkinnedMesh(geometry, new T.MeshBasicMaterial());
  mesh.bind(skeleton, new T.Matrix4());
  const state = { ...createMotion({ x: 0, z: 7 }), speed: 2.2, blend: 1 };
  const sample = () =>
    Array.from(
      { length: Math.ceil(geometry.attributes.position.count / 17) },
      (_, i) =>
        mesh.applyBoneTransform(
          i * 17,
          new T.Vector3().fromBufferAttribute(
            geometry.attributes.position,
            i * 17,
          ),
        ),
    );
  animator.update({ ...state, phase: 0.16 }, 1, () => -0.15);
  hero.updateMatrixWorld(true);
  const a = sample();
  animator.update({ ...state, phase: 0.66 }, 1, () => -0.15);
  hero.updateMatrixWorld(true);
  const b = sample();
  const displacement = Math.max(...a.map((v, i) => v.distanceTo(b[i])));
  assert.ok(
    displacement > 0.2,
    `weighted vertices visibly move between strides: ${displacement}`,
  );
  geometry.dispose();
  mesh.material.dispose();
});
