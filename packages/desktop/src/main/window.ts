import { BrowserWindow, protocol, app, shell } from "electron";
import { join } from "path";
import { readFile, access } from "fs/promises";
import { logger } from "@betterx/core";

// ─── Window Management ────────────────────────────────────────────────────────

const BUNDLE_PATH_KEY = "betterx_bundle_path";
let bundlePath: string | null = null;

export function setBundlePath(path: string): void {
  bundlePath = path;
}

/**
 * Register the betterx:// custom protocol.
 * Serves bundle.js from disk — no executeJavaScript with raw bundle string.
 */
export function registerBetterxProtocol(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "betterx",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        bypassCSP: false,
      },
    },
  ]);
}

export function handleBetterxProtocol(): void {
  protocol.handle("betterx", async (request) => {
    const url = new URL(request.url);
    if (url.hostname === "bundle" && url.pathname === "/bundle.js") {
      if (!bundlePath) {
        return new Response("// BetterX bundle not found", {
          status: 404,
          headers: { "Content-Type": "application/javascript" },
        });
      }
      try {
        await access(bundlePath);
        const content = await readFile(bundlePath);
        return new Response(new Uint8Array(content), {
          status: 200,
          headers: { "Content-Type": "application/javascript" },
        });
      } catch {
        return new Response("// BetterX bundle read error", {
          status: 500,
          headers: { "Content-Type": "application/javascript" },
        });
      }
    }
    return new Response("Not found", { status: 404 });
  });
}

export function createMainWindow(preloadPath: string, enableTransparency: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "BetterX Desktop",
    autoHideMenuBar: true,
    transparent: enableTransparency,
    backgroundColor: enableTransparency ? "#00000000" : "#000000",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // No disable-web-security, no contextBridge bypass
    },
  });

  // Inject BetterX bundle after page load via custom protocol
  win.webContents.on("did-finish-load", () => {
    if (!bundlePath) return;
    win.webContents
      .executeJavaScript(`
        (function() {
          if (document.getElementById('__betterx__')) return;
          const s = document.createElement('script');
          s.id = '__betterx__';
          s.src = 'betterx://bundle/bundle.js';
          document.head.appendChild(s);
        })();
      `)
      .catch((err) => logger.error("Failed to inject BetterX script:", err));
  });

  // Prevent navigation to external URLs
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadURL("https://x.com");
  return win;
}
