/** Original procedural score and UI sound design. No recordings or third-party samples. */
export const CHORDS = [
  [48, 55, 62, 64],
  [45, 52, 59, 60],
  [41, 48, 55, 57],
  [43, 50, 57, 59],
];
export const MELODY = [
  76,
  null,
  79,
  null,
  74,
  null,
  72,
  null,
  71,
  null,
  74,
  null,
  69,
  null,
  null,
  null,
];
export const midiFrequency = (note) => 440 * 2 ** ((note - 69) / 12);
export function createSoundscape() {
  let context,
    master,
    music,
    effects,
    filter,
    timer,
    stopTimer,
    disposed = false,
    enabled = false,
    volume = 0.24,
    next = 0,
    step = 0,
    lastEffect = 0;
  const nodes = new Set();
  function initialize() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error("Web Audio is unavailable");
    context = new Audio();
    master = context.createGain();
    master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 20;
    limiter.ratio.value = 4;
    music = context.createGain();
    music.gain.value = 0.28;
    effects = context.createGain();
    effects.gain.value = 0.16;
    filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2300;
    filter.Q.value = 0.3;
    music.connect(filter);
    filter.connect(master);
    effects.connect(master);
    master.connect(limiter);
    limiter.connect(context.destination);
  }
  function tone(
    note,
    start,
    duration,
    amplitude,
    destination = music,
    type = "sine",
  ) {
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = midiFrequency(note);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(
      amplitude,
      start + Math.min(0.6, duration * 0.15),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    nodes.add(oscillator);
    oscillator.onended = () => {
      nodes.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.1);
  }
  function schedule() {
    if (!enabled || document.hidden) return;
    while (next < context.currentTime + 0.3) {
      if (step % 8 === 0) {
        const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
        for (const note of chord) tone(note, next, 8.8, 0.11);
      }
      const note = MELODY[step % MELODY.length];
      if (note !== null) {
        tone(note, next, 3.9, 0.08);
        tone(note + 12, next, 1.7, 0.008);
      }
      next += 1.15;
      step++;
    }
  }
  function stopNotes() {
    for (const node of nodes) {
      try {
        node.stop();
      } catch {}
    }
    nodes.clear();
  }
  async function setEnabled(value) {
    if (disposed) return false;
    if (value && !context) initialize();
    enabled = value;
    clearTimeout(stopTimer);
    clearInterval(timer);
    if (!context) return false;
    if (value) {
      await context.resume();
      if (!enabled) return false;
      next = context.currentTime + 0.12;
      step = 0;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(volume, context.currentTime, 0.35);
      schedule();
      timer = setInterval(schedule, 200);
    } else {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(0, context.currentTime, 0.12);
      stopTimer = setTimeout(() => {
        if (!enabled && !disposed) {
          stopNotes();
          context.suspend();
        }
      }, 800);
    }
    return enabled;
  }
  function setVolume(value) {
    volume = Math.min(0.65, Math.max(0, Number(value) || 0));
    if (context && enabled)
      master.gain.setTargetAtTime(volume, context.currentTime, 0.1);
  }
  function effect(kind = "open") {
    if (
      !enabled ||
      !context ||
      document.hidden ||
      context.currentTime - lastEffect < 0.25
    )
      return;
    lastEffect = context.currentTime;
    if (kind === "travel") {
      [72, 76, 79].forEach((n, i) =>
        tone(n, context.currentTime + i * 0.13, 1.1, 0.11, effects),
      );
    } else
      tone(
        kind === "close" ? 67 : 76,
        context.currentTime,
        0.55,
        0.08,
        effects,
      );
  }
  const visibility = () => {
    if (!context) return;
    clearInterval(timer);
    stopNotes();
    if (document.hidden) context.suspend();
    else if (enabled) {
      context.resume().then(() => {
        if (!enabled || document.hidden) return;
        next = context.currentTime + 0.2;
        step = 0;
        schedule();
        timer = setInterval(schedule, 200);
      });
    }
  };
  document.addEventListener("visibilitychange", visibility);
  return {
    setEnabled,
    setVolume,
    effect,
    dispose() {
      if (disposed) return;
      disposed = true;
      enabled = false;
      clearInterval(timer);
      clearTimeout(stopTimer);
      document.removeEventListener("visibilitychange", visibility);
      stopNotes();
      context?.close();
    },
  };
}
