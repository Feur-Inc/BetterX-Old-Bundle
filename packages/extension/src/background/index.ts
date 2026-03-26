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
  const msg = message as { type?: string; url?: string };

  if (msg.type === "BETTERX_PING") {
    return Promise.resolve({ type: "BETTERX_PONG" });
  }

  if (msg.type === "PROXY_IMAGE" && msg.url) {
    return fetch(msg.url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => ({ dataUrl }))
      .catch(() => ({ dataUrl: null }));
  }

  if (msg.type === "PROXY_FETCH" && msg.url) {
    const { url, method, headers, body } = msg as {
      type: string; url: string;
      method?: string; headers?: Record<string, string>; body?: string;
    };
    return fetch(url, { method, headers, body, credentials: "include" })
      .then(async (res) => {
        const text = await res.text();
        let json: unknown = null;
        try { json = JSON.parse(text); } catch { /* not JSON */ }
        return { ok: res.ok, status: res.status, text, json };
      })
      .catch((err) => ({ ok: false, status: 0, text: String(err), json: null }));
  }

  return undefined;
});

export {};
