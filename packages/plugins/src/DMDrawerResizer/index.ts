import { definePlugin, Devs } from "@betterx/core";

const STORAGE_KEY = "betterx_dm_drawer_size";

let dmObserver: MutationObserver | null = null;
let dmCleanupFns: (() => void)[] = [];

function makeResizable(drawer: HTMLElement): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const { width } = JSON.parse(saved) as { width: number };
      if (width) drawer.style.width = `${width}px`;
    } catch {
      // ignore
    }
  }

  const handle = document.createElement("div");
  handle.setAttribute("data-betterx-resizer", "1");
  handle.style.cssText = `
    position:absolute;width:10px;height:100%;left:-5px;top:0;
    cursor:col-resize;z-index:1000;
  `;
  drawer.style.position = "relative";
  drawer.appendChild(handle);

  let startX = 0;
  let startW = 0;

  const onMouseMove = (e: MouseEvent): void => {
    const dx = startX - e.clientX;
    const newW = Math.min(900, Math.max(300, startW + dx));
    drawer.style.width = `${newW}px`;
  };

  const onMouseUp = (): void => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.style.userSelect = "";
    const w = parseInt(getComputedStyle(drawer).width, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ width: w }));
  };

  const onMouseDown = (e: MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    startX = e.clientX;
    startW = parseInt(getComputedStyle(drawer).width, 10);
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  handle.addEventListener("mousedown", onMouseDown);

  dmCleanupFns.push(() => {
    handle.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  });
}

export default definePlugin({
  name: "DMDrawerResizer",
  description: "Makes the DM drawer resizable with draggable handles",
  authors: [Devs.Mopi],

  start() {
    const tryInit = (): void => {
      const drawer = document.querySelector<HTMLElement>('[data-testid="DMDrawer"]');
      if (!drawer || drawer.dataset["bxResizable"]) return;
      drawer.dataset["bxResizable"] = "1";
      makeResizable(drawer);
    };

    dmObserver = new MutationObserver(tryInit);
    dmObserver.observe(document.body, { childList: true, subtree: true });
    tryInit();
  },

  stop() {
    dmObserver?.disconnect();
    dmObserver = null;
    for (const fn of dmCleanupFns) fn();
    dmCleanupFns = [];

    document.querySelectorAll<HTMLElement>('[data-betterx-resizer]').forEach((el) => el.remove());
    const drawer = document.querySelector<HTMLElement>('[data-testid="DMDrawer"]');
    if (drawer) {
      drawer.style.width = "";
      delete drawer.dataset["bxResizable"];
    }
  },
});
