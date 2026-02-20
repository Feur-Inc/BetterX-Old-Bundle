import { app, BrowserWindow } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { logger } from "@betterx/core";

import {
  registerBetterxProtocol,
  handleBetterxProtocol,
  createMainWindow,
  setBundlePath,
} from "./window.js";
import { setupCSP } from "./security.js";
import { createTray } from "./tray.js";
import { registerThemeHandlers } from "./ipc/themes.js";
import { registerSettingsHandlers } from "./ipc/settings.js";
import { registerUpdateHandlers } from "./ipc/update.js";
import { registerCaptureHandlers } from "./ipc/capture.js";
import { getSetting, setSetting } from "./services/settings.js";
import {
  checkForBundleUpdate,
  applyBundleUpdate,
  readPersistedHash,
} from "./services/bundle-updater.js";

// ─── App Paths ────────────────────────────────────────────────────────────────

const BETTERX_DIR = join(app.getPath("userData"), "BetterX");
// Default to the locally-built bundle; overridden by userData path once a remote update is applied
const BUNDLE_PATH = join(__dirname, "../bundle/bundle.iife.js");

// ─── Single Instance Lock ─────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// Register protocol BEFORE app is ready
registerBetterxProtocol();

// ─── App Ready ────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(async () => {
  // Ensure BetterX directory exists
  await mkdir(BETTERX_DIR, { recursive: true });

  // Set up betterx:// protocol handler
  handleBetterxProtocol();

  // Set up CSP
  setupCSP();

  // Configure bundle path — fall back to local build if stored path no longer exists
  const storedPath = getSetting("bundlePath");
  const bundlePath = (storedPath && existsSync(storedPath)) ? storedPath : BUNDLE_PATH;
  setSetting("bundlePath", bundlePath);
  setBundlePath(bundlePath);

  // Check/update bundle
  if (getSetting("checkForUpdates")) {
    try {
      const currentHash = await readPersistedHash(savedPath) ?? getSetting("currentHash");
      const result = await checkForBundleUpdate(currentHash);
      if (result.updateAvailable) {
        logger.info("BetterX bundle update available, downloading...");
        await applyBundleUpdate(savedPath, result.remoteHash);
        setSetting("currentHash", result.remoteHash);
        logger.info("Bundle updated successfully");
      }
    } catch (err) {
      logger.warn("Bundle update check failed:", err);
      // Non-fatal: use existing bundle if available
    }
  }

  // Register IPC handlers
  registerThemeHandlers();
  registerSettingsHandlers();
  registerUpdateHandlers();

  // Create main window
  const preloadPath = join(__dirname, "../preload/preload.js");
  const enableTransparency = getSetting("enableTransparency");
  mainWindow = createMainWindow(preloadPath, enableTransparency);

  registerCaptureHandlers(() => mainWindow);

  // Tray
  const iconPath = join(__dirname, "../../assets/icon.png");
  if (existsSync(iconPath)) {
    createTray(iconPath, mainWindow);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Start minimized?
  if (getSetting("startMinimized")) {
    mainWindow.minimize();
  }
});

// Focus existing window on second instance
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    // Re-create window on macOS
  }
});
