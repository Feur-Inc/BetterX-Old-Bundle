// ─── Extension Service Worker ─────────────────────────────────────────────────

import browser from "webextension-polyfill";

// Listen for install/update
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[BetterX] Extension installed");
  } else if (details.reason === "update") {
    console.log("[BetterX] Extension updated to", browser.runtime.getManifest().version);
  }
});

// Keep service worker alive during development
// (Production: onMessage handlers keep it alive)
browser.runtime.onMessage.addListener((message, _sender) => {
  if ((message as { type?: string })?.type === "BETTERX_PING") {
    return Promise.resolve({ type: "BETTERX_PONG" });
  }
  return undefined;
});

export {};
