import { definePlugin, Devs, OptionType } from "@betterx/core";

// Oneko - the classic cat that follows your cursor
// Original oneko.js by adryd325, MIT license

const SPRITE_SETS: Record<string, number[][]> = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
  scratchWallN: [[0, 0], [0, -1]],
  scratchWallS: [[-7, -1], [-6, -2]],
  scratchWallE: [[-2, -2], [-2, -3]],
  scratchWallW: [[-4, 0], [-4, -1]],
  tired: [[-3, -2]],
  sleeping: [[-2, 0], [-2, -1]],
  N: [[-1, -2], [-1, -3]],
  NE: [[0, -2], [0, -3]],
  E: [[-3, 0], [-3, -1]],
  SE: [[-5, -1], [-5, -2]],
  S: [[-6, -3], [-7, -2]],
  SW: [[-5, -3], [-6, -1]],
  W: [[-4, -2], [-4, -3]],
  NW: [[-1, 0], [-1, -1]],
};

let onekoEl: HTMLDivElement | null = null;
let onekoRaf: number | null = null;
let onekoCatX = 32;
let onekoCatY = 32;
let onekoMouseX = 0;
let onekoMouseY = 0;
let onekoFrame = 0;
let onekoMouseMoveHandler: ((e: MouseEvent) => void) | null = null;

function setSprite(name: string, frame: number): void {
  if (!onekoEl) return;
  const sprites = SPRITE_SETS[name];
  if (!sprites) return;
  const coords = sprites[frame % sprites.length] ?? [0, 0];
  const sx = coords[0] ?? 0;
  const sy = coords[1] ?? 0;
  onekoEl.style.backgroundPosition = `${sx * 32}px ${sy * 32}px`;
}

function tick(speed: number): void {
  if (!onekoEl) return;
  const dx = onekoMouseX - onekoCatX;
  const dy = onekoMouseY - onekoCatY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < speed) {
    setSprite("idle", 0);
    return;
  }

  const angle = Math.atan2(dy, dx);
  const deg = (angle * 180) / Math.PI;
  let dir: string;
  if (deg > -22.5 && deg <= 22.5) dir = "E";
  else if (deg > 22.5 && deg <= 67.5) dir = "SE";
  else if (deg > 67.5 && deg <= 112.5) dir = "S";
  else if (deg > 112.5 && deg <= 157.5) dir = "SW";
  else if (deg > 157.5 || deg <= -157.5) dir = "W";
  else if (deg > -157.5 && deg <= -112.5) dir = "NW";
  else if (deg > -112.5 && deg <= -67.5) dir = "N";
  else dir = "NE";

  onekoCatX += Math.cos(angle) * speed;
  onekoCatY += Math.sin(angle) * speed;
  onekoFrame = (onekoFrame + 1) % 2;
  setSprite(dir, onekoFrame);

  onekoEl.style.left = `${onekoCatX - 16}px`;
  onekoEl.style.top = `${onekoCatY - 16}px`;
}

export default definePlugin({
  name: "Oneko",
  description: "A cat that follows your cursor around the screen",
  authors: [Devs.Mopi],
  options: {
    speed: {
      type: OptionType.NUMBER,
      default: 10,
      label: "Speed",
      description: "Cat movement speed (1–20)",
    },
  },

  start() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = document.createElement("div");
    el.id = "betterx-oneko";
    el.style.cssText = `
      width:32px;height:32px;
      position:fixed;pointer-events:none;z-index:2147483647;
      image-rendering:pixelated;
      background-image:url('https://raw.githubusercontent.com/adryd325/oneko.js/main/oneko.gif');
    `;
    document.body.appendChild(el);
    onekoEl = el;

    // Reset position
    onekoCatX = 32;
    onekoCatY = 32;
    onekoFrame = 0;

    onekoMouseMoveHandler = (e: MouseEvent): void => {
      onekoMouseX = e.clientX;
      onekoMouseY = e.clientY;
    };
    document.addEventListener("mousemove", onekoMouseMoveHandler);

    const speed = this.settings.store.speed;
    const animate = (): void => {
      tick(speed);
      onekoRaf = requestAnimationFrame(animate);
    };
    onekoRaf = requestAnimationFrame(animate);
  },

  stop() {
    if (onekoRaf !== null) {
      cancelAnimationFrame(onekoRaf);
      onekoRaf = null;
    }
    onekoEl?.remove();
    onekoEl = null;
    if (onekoMouseMoveHandler) {
      document.removeEventListener("mousemove", onekoMouseMoveHandler);
      onekoMouseMoveHandler = null;
    }
  },
});
