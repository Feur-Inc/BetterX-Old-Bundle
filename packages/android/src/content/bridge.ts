// ─── Main-world bridge - extension side ───────────────────────────────────────
// Registers the CustomEvent transport with @betterx/core so that any plugin
// calling `callMainWorld()` or `dispatchReactState()` is routed through the
// main-world shim (main-world.ts) automatically.

import { setMainWorldBridge } from "@betterx/core";

export function registerMainWorldBridge(): void {
  setMainWorldBridge((action, args) =>
    new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      const timer = setTimeout(
        () => reject(new Error(`[BetterX] callMainWorld timeout: ${action}`)),
        5_000,
      );
      document.addEventListener(
        `betterx:result:${id}`,
        (e) => { clearTimeout(timer); resolve((e as CustomEvent).detail); },
        { once: true },
      );
      document.dispatchEvent(
        new CustomEvent("betterx:call", { detail: { id, action, args } }),
      );
    }),
  );
}
