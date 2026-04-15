import { session } from "electron";

// ─── Security ─────────────────────────────────────────────────────────────────

/**
 * Configure Content-Security-Policy to allow the betterx:// script protocol
 * while keeping X.com's existing CSP otherwise intact.
 *
 * Twitter's CSP already includes 'unsafe-inline' in script-src, but that
 * directive is suppressed whenever a nonce is present in the list. We strip
 * the nonce so 'unsafe-inline' becomes active again - this lets the preload
 * inject its sensitive-media patch script without fighting the nonce system.
 * All other CSP directives (connect-src, frame-src, etc.) are kept intact.
 */
export function setupCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    // Only patch X.com / Twitter CSP
    const url = details.url;
    if (!url.includes("x.com") && !url.includes("twitter.com")) {
      callback({ responseHeaders });
      return;
    }

    const cspKey = Object.keys(responseHeaders).find(
      (k) => k.toLowerCase() === "content-security-policy"
    );

    if (cspKey) {
      const existing = responseHeaders[cspKey];
      if (Array.isArray(existing)) {
        responseHeaders[cspKey] = existing.map((directive) =>
          directive
            .replace("script-src", "script-src betterx:")
            // Strip the per-load nonce - 'unsafe-inline' is already present but
            // is ignored by browsers when any nonce/hash is in the list.
            .replace(/'nonce-[^']+'\s*/g, "")
            // Allow any HTTPS image - plugins load from GitHub, cataas, unavatar, etc.
            .replace("img-src", "img-src betterx: https:")
            // Allow plugins to reach external APIs (e.g. bsky.social for BlueSkyFeed).
            .replace(/\bconnect-src\b/, "connect-src https://bsky.social")
        );
      }
    }

    callback({ responseHeaders });
  });
}
