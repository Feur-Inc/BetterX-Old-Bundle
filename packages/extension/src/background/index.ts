// ─── Extension Service Worker ─────────────────────────────────────────────────

// Listen for install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[BetterX] Extension installed");
  } else if (details.reason === "update") {
    console.log("[BetterX] Extension updated to", chrome.runtime.getManifest().version);
  }
});

// Keep service worker alive during development
// (Production: onMessage handlers keep it alive)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "BETTERX_PING") {
    sendResponse({ type: "BETTERX_PONG" });
  }
  return true;
});

export {};
