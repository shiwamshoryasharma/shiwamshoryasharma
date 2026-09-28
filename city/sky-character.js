import { Vector3, Quaternion, Euler, MathUtils } from "./vendor/three.core.js";
import { sampleFoot } from "./sky-motion.js";

/** Poses the shipped VRoid skeleton; no asset replacement or animation downloads. */
export function createCharacterAnimator(hero) {
  const joint = (name) => {
    const bone = hero.getObjectByName(`J_Bip_${name}`);
    if (!bone) throw new Error(`Missing explorer joint: ${name}`);
    return bone;
  };
  const hips = joint("C_Hips"),
    chest = joint("C_Chest"),
    head = joint("C_Head");
  const hipsRest = hips.position.clone();
  const rest = new Map();
  hero.traverse((o) => {
    if (o.name.startsWith("J_Bip_")) rest.set(o, o.quaternion.clone());
  });
  hero.updateMatrixWorld(true);
  const legs = ["L", "R"].map((side, index) => {
    const upper = joint(`${side}_UpperLeg`),
      lower = joint(`${side}_LowerLeg`),
      foot = joint(`${side}_Foot`);
    const ankle = hero.worldToLocal(foot.getWorldPosition(new Vector3()));
    const footRotation = hero
      .getWorldQuaternion(new Quaternion())
      .invert()
      .multiply(foot.getWorldQuaternion(new Quaternion()));
    return { upper, lower, foot, ankle, footRotation, index };
  });
  const arms = ["L", "R"].map((side, index) => ({
    upper: joint(`${side}_UpperArm`),
    lower: joint(`${side}_LowerArm`),
    hand: joint(`${side}_Hand`),
    sign: index ? -1 : 1,
    index,
  }));
  const fingers = ["L", "R"].flatMap((side, index) =>
    ["Index", "Middle", "Ring", "Little"].flatMap((finger, f) =>
      [1, 2, 3].map((segment) => ({
        bone: joint(`${side}_${finger}${segment}`),
        sign: index ? -1 : 1,
        bend: (segment === 2 ? 0.27 : 0.15) + f * 0.025,
      })),
    ),
  );
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3(),
    axis = new Vector3(),
    bend = new Vector3(),
    knee = new Vector3();
  const from = new Vector3(),
    to = new Vector3(),
    target = new Vector3(),
    pole = new Vector3();
  const parentQ = new Quaternion(),
    worldQ = new Quaternion(),
    deltaQ = new Quaternion(),
    heroQ = new Quaternion();
  const euler = new Euler();
  function offset(bone, x = 0, y = 0, z = 0) {
    // Apply offsets in the joint's parent frame; upper arms have a rotated A-pose basis.
    bone.quaternion
      .copy(rest.get(bone))
      .premultiply(deltaQ.setFromEuler(euler.set(x, y, z)));
  }
  function aim(bone, child, destination) {
    bone.getWorldPosition(a);
    child.getWorldPosition(b);
    from.subVectors(b, a).normalize();
    to.subVectors(destination, a).normalize();
    deltaQ.setFromUnitVectors(from, to);
    bone.getWorldQuaternion(worldQ).premultiply(deltaQ);
    bone.parent.getWorldQuaternion(parentQ).invert();
    bone.quaternion.copy(parentQ.multiply(worldQ));
    bone.updateWorldMatrix(false, true);
  }
  function solveLeg(leg, destination) {
    leg.upper.getWorldPosition(a);
    leg.lower.getWorldPosition(b);
    leg.foot.getWorldPosition(c);
    const thigh = a.distanceTo(b),
      shin = b.distanceTo(c);
    axis.subVectors(destination, a);
    const distance = MathUtils.clamp(
      axis.length(),
      Math.abs(thigh - shin) + 0.001,
      thigh + shin - 0.001,
    );
    axis.normalize();
    bend.copy(pole).addScaledVector(axis, -pole.dot(axis)).normalize();
    const along =
      (thigh * thigh - shin * shin + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, thigh * thigh - along * along));
    knee.copy(a).addScaledVector(axis, along).addScaledVector(bend, height);
    aim(leg.upper, leg.lower, knee);
    aim(leg.lower, leg.foot, destination);
    leg.lower.getWorldQuaternion(parentQ).invert();
    leg.foot.quaternion
      .copy(parentQ)
      .multiply(heroQ)
      .multiply(leg.footRotation);
    leg.foot.updateWorldMatrix(false, true);
  }
  return {
    update(motion, time, groundAt) {
      const { phase, blend, run, air, landing } = motion;
      const cycle = phase * Math.PI * 2;
      const stride = blend * (1 - air);
      // A small weight shift and soft knees replace the straight exported A-pose.
      hips.position.copy(hipsRest);
      hips.position.y -=
        0.035 +
        stride * (0.018 + 0.014 * Math.cos(cycle * 2)) +
        landing * 0.055 +
        Math.sin(time * 1.6) * 0.002;
      hips.position.x += Math.sin(cycle) * 0.014 * stride;
      offset(
        hips,
        0,
        Math.sin(cycle) * 0.035 * stride,
        Math.sin(cycle) * 0.012 * stride,
      );
      offset(
        chest,
        -0.025 - 0.075 * run * blend - 0.06 * air,
        -Math.sin(cycle) * 0.055 * stride,
        MathUtils.clamp(motion.turn * 0.012, -0.065, 0.065) * blend,
      );
      offset(
        head,
        Math.sin(time * 1.4) * 0.009,
        Math.sin(time * 0.65) * 0.025,
        0,
      );
      for (const arm of arms) {
        const swing = Math.cos(cycle + arm.index * Math.PI);
        offset(
          arm.upper,
          -swing * (0.23 + run * 0.25) * stride - 0.12 * air,
          0,
          arm.sign * (0.22 - 0.07 * run * blend - 0.14 * air),
        );
        offset(
          arm.lower,
          0,
          -arm.sign *
            (0.16 +
              0.6 * run * blend +
              0.13 * stride * Math.max(0, -swing) +
              0.3 * air),
          0,
        );
        offset(arm.hand, 0, arm.sign * 0.05, 0);
      }
      for (const finger of fingers)
        offset(
          finger.bone,
          0,
          -finger.sign * (finger.bend + run * blend * 0.12),
          0,
        );
      hero.updateMatrixWorld(true);
      hero.getWorldQuaternion(heroQ);
      pole.set(0, 0, 1).applyQuaternion(heroQ);
      const scale = hero.getWorldScale(c).y;
      for (const leg of legs) {
        leg.upper.quaternion.copy(rest.get(leg.upper));
        leg.lower.quaternion.copy(rest.get(leg.lower));
        leg.foot.quaternion.copy(rest.get(leg.foot));
        leg.upper.updateWorldMatrix(false, true);
        const step = sampleFoot(phase + leg.index * 0.5, run);
        target.copy(leg.ankle);
        target.x += Math.sign(leg.ankle.x) * 0.06 * (1 - blend * 0.25);
        target.z +=
          (step.forward * stride) / scale + air * (leg.index ? -0.13 : 0.1);
        target.y +=
          (step.lift * stride) / scale + air * (leg.index ? 0.22 : 0.12);
        hero.localToWorld(target);
        // Sample under each foot so standing across grass/stone edges does not float.
        target.y +=
          MathUtils.clamp(
            groundAt(target.x, target.z) - motion.ground,
            -0.3,
            0.3,
          ) *
          (1 - air);
        solveLeg(leg, target);
      }
    },
  };
}
