import { createSoundscape } from "./soundscape.js";
import { PROJECTS } from "./sky-state.js";
const $ = (id) => document.getElementById(id);
const sound = createSoundscape();
let soundOn = false;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reduced.matches,
  world = null,
  near = null,
  walking = false;
const motion = $("motion-toggle");
function motionLabel() {
  motion.setAttribute("aria-pressed", String(paused));
  motion.innerHTML = paused
    ? "▷ <span>Resume motion</span>"
    : "Ⅱ <span>Pause motion</span>";
}
motionLabel();
motion.addEventListener("click", () => {
  paused = !paused;
  motionLabel();
  world?.refresh();
});
reduced.addEventListener("change", (e) => {
  paused = e.matches;
  motionLabel();
  world?.refresh();
});
function openDialog(id) {
  sound.effect();
  for (const d of document.querySelectorAll("dialog[open]")) d.close();
  world?.block(true);
  $(id).showModal();
}
for (const dialog of document.querySelectorAll("dialog")) {
  dialog
    .querySelector(".close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    sound.effect("close");
    const anotherDialog = !!document.querySelector("dialog[open]");
    world?.block(anotherDialog);
    if (!anotherDialog && walking) $("world").focus({ preventScroll: true });
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
}
function enter() {
  walking = true;
  document.body.classList.add("walking");
  $("intro").inert = true;
  $("location").hidden = false;
  $("touch-controls").hidden = false;
  $("home").classList.remove("active");
  $("control-hint").textContent = matchMedia("(pointer:coarse)").matches
    ? "Hold arrows to walk · Drag to look"
    : "WASD / arrows · Drag to look · Shift run · Space jump";
}
function travel(id) {
  sound.effect("travel");
  if (!world) {
    showProject(PROJECTS.find((p) => p.id === id));
    return;
  }
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  world.block(false);
  enter();
  world.travel(id);
}
function showProject(p) {
  if (!p) return;
  if (p.id === "realm") {
    location.href = "realm.html";
    return;
  }
  $("project-title").textContent = p.title;
  $("project-label").textContent = p.label;
  $("project-description").textContent = p.description;
  $("project-tags").replaceChildren(
    ...p.tags.map((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      return li;
    }),
  );
  $("project-gallery").replaceChildren(
    ...p.images.map(([src, alt]) => {
      const figure = document.createElement("figure"),
        img = document.createElement("img"),
        caption = document.createElement("figcaption");
      img.src = `assets/${src}`;
      img.alt = alt;
      img.width = 1600;
      img.height = 900;
      img.loading = "lazy";
      caption.textContent = alt;
      figure.append(img, caption);
      return figure;
    }),
  );
  $("project-link").hidden = !p.url;
  if (p.url) $("project-link").href = p.url;
  $("private-note").hidden = p.id !== "factory";
  openDialog("project-dialog");
}
for (const [i, p] of PROJECTS.entries()) {
  const row = document.createElement("div");
  row.className = "directory-row";
  const title = document.createElement("div"),
    name = document.createElement("strong"),
    num = document.createElement("small");
  name.textContent = p.title;
  num.textContent = `0${i + 1}`;
  title.append(name, num);
  const go = document.createElement("button");
  go.textContent = "Fast travel ↗";
  go.addEventListener("click", () => travel(p.id));
  const read = document.createElement("button");
  read.textContent = "Read field notes";
  read.addEventListener("click", () => showProject(p));
  row.append(title, go, read);
  $("project-directory").append(row);
  const pin = document.createElement("button");
  pin.className = "map-pin";
  pin.textContent = `0${i + 1}`;
  pin.setAttribute("aria-label", `Travel to ${p.title}`);
  pin.style.left = `${50 + p.position[0] * 2}%`;
  pin.style.top = `${50 + p.position[2] * 2}%`;
  pin.addEventListener("click", () => travel(p.id));
  $("map-pins").append(pin);
}
$("projects-open").onclick = $("map-open").onclick = () =>
  openDialog("map-dialog");
$("about-open").onclick = () => openDialog("about-dialog");
$("connect-open").onclick = () => openDialog("connect-dialog");
$("explore").onclick = () => {
  if (world) {
    enter();
    world.walk();
  }
};
$("home").onclick = () => {
  walking = false;
  document.body.classList.remove("walking");
  $("intro").inert = false;
  $("location").hidden = true;
  $("touch-controls").hidden = true;
  $("interaction").hidden = true;
  $("home").classList.add("active");
  $("control-hint").textContent = "A portfolio you can wander through.";
  world?.overview();
};
document
  .querySelectorAll("[data-travel]")
  .forEach((button) => (button.onclick = () => travel(button.dataset.travel)));
$("inspect").onclick = () => showProject(near);
window.addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open]")) return;
  if (e.key.toLowerCase() === "e" && near) {
    e.preventDefault();
    showProject(near);
  } else if (e.key === "Escape" && walking) {
    e.preventDefault();
    openDialog("map-dialog");
  }
});
let night = false;
$("light-toggle").onclick = () => {
  night = !night;
  document.body.classList.toggle("night", night);
  $("light-toggle").setAttribute("aria-pressed", String(night));
  $("light-toggle").innerHTML = night
    ? "☀ <span>Daybreak</span>"
    : "☾ <span>Nightfall</span>";
  world?.setNight(night);
};
const held = new Set();
const updateTouch = () =>
  world?.input(
    (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0),
    (held.has("back") ? 1 : 0) - (held.has("forward") ? 1 : 0),
  );
for (const button of document.querySelectorAll("[data-move]")) {
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    held.add(button.dataset.move);
    updateTouch();
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(event, () => {
      held.delete(button.dataset.move);
      updateTouch();
    });
}
window.addEventListener("blur", () => {
  held.clear();
  updateTouch();
});
function failed() {
  document.body.classList.remove("loaded", "walking");
  $("intro").inert = false;
  $("location").hidden = true;
  $("touch-controls").hidden = true;
  $("interaction").hidden = true;
  $("world-status").textContent = "Static view · Projects remain available";
  $("explore").disabled = false;
  $("explore").textContent = "Explore the projects ↗";
  $("explore").onclick = () => openDialog("map-dialog");
  world = null;
}
$("sound-toggle").addEventListener("click", async () => {
  const button = $("sound-toggle");
  button.disabled = true;
  try {
    soundOn = await sound.setEnabled(!soundOn);
    button.setAttribute("aria-pressed", String(soundOn));
    button.innerHTML = soundOn
      ? "♫ <span>Sound on</span>"
      : "♫ <span>Sound off</span>";
    document.body.classList.toggle("sound-on", soundOn);
  } catch {
    button.textContent = "Sound unavailable";
  } finally {
    button.disabled = false;
  }
});
$("sound-volume").addEventListener("input", (event) =>
  sound.setVolume(Number(event.target.value) / 100),
);
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) sound.dispose();
});

try {
  const { createWorld } = await import("./sky-world.js");
  world = await createWorld($("world"), {
    paused: () => paused,
    onNear: (p) => {
      near = p;
      $("interaction").hidden = !p;
      if (p) $("inspect").querySelector("span").textContent = p.title;
    },
    onStats: () => {},
    onFailure: failed,
  });
  document.body.classList.add("loaded");
  $("explore").disabled = false;
  $("explore").innerHTML = "Begin your adventure <span>↗</span>";
  $("world-status").textContent = "Skybound Research Isle";
  world.setNight(night);
  world.block(!!document.querySelector("dialog[open]"));
} catch (error) {
  console.warn(
    "Interactive landscape unavailable; keeping accessible portfolio.",
    error,
  );
  failed();
}
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) world?.dispose();
});
