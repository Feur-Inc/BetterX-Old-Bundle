import { session } from "electron";

// ─── Security ─────────────────────────────────────────────────────────────────

/**
 * Configure Content-Security-Policy to allow the betterx:// script protocol
 * while keeping X.com's existing CSP otherwise intact.
 *
 * We only add `betterx:` to script-src. No `unsafe-eval`, no `unsafe-inline`.
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
          directive.replace("script-src", "script-src betterx:")
        );
      }
    }

    callback({ responseHeaders });
  });
}
