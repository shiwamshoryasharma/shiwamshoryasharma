import test from "node:test";
import assert from "node:assert/strict";
import { createSoundscape } from "../city/soundscape.js";
test("audio is opt-in, gain-limited, suspended when hidden, and closed on disposal", async () => {
  const oldWindow = globalThis.window,
    oldDocument = globalThis.document;
  let created = 0,
    started = 0,
    resumed = 0,
    suspended = 0,
    closed = 0;
  const handlers = new Map(),
    gains = [];
  const parameter = () => ({
    value: 0,
    cancelScheduledValues() {},
    setValueAtTime(v) {
      this.value = v;
    },
    linearRampToValueAtTime(v) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v) {
      this.value = v;
    },
    setTargetAtTime(v) {
      this.value = v;
    },
  });
  const node = () => ({ connect() {}, disconnect() {} });
  class AudioContext {
    constructor() {
      created++;
      this.currentTime = 1;
      this.destination = {};
    }
    createGain() {
      const n = { ...node(), gain: parameter() };
      gains.push(n);
      return n;
    }
    createDynamicsCompressor() {
      return {
        ...node(),
        threshold: parameter(),
        knee: parameter(),
        ratio: parameter(),
      };
    }
    createBiquadFilter() {
      return { ...node(), frequency: parameter(), Q: parameter() };
    }
    createOscillator() {
      return {
        ...node(),
        frequency: parameter(),
        start() {
          started++;
        },
        stop() {
          this.onended?.();
        },
      };
    }
    async resume() {
      resumed++;
    }
    async suspend() {
      suspended++;
    }
    async close() {
      closed++;
    }
  }
  globalThis.window = { AudioContext };
  globalThis.document = {
    hidden: false,
    addEventListener(k, f) {
      handlers.set(k, f);
    },
    removeEventListener(k) {
      handlers.delete(k);
    },
  };
  let audio;
  try {
    audio = createSoundscape();
    assert.equal(created, 0);
    assert.equal(started, 0);
    await audio.setEnabled(true);
    assert.equal(created, 1);
    assert.ok(started > 0);
    audio.setVolume(99);
    assert.equal(gains[0].gain.value, 0.65);
    document.hidden = true;
    handlers.get("visibilitychange")();
    assert.equal(suspended, 1);
    document.hidden = false;
    handlers.get("visibilitychange")();
    await Promise.resolve();
    assert.ok(resumed >= 2);
    audio.dispose();
    assert.equal(closed, 1);
    audio.dispose();
    assert.equal(closed, 1);
    assert.equal(handlers.size, 0);
    assert.equal(await audio.setEnabled(true), false);
  } finally {
    audio?.dispose();
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
