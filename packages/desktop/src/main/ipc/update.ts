import { ipcMain, BrowserWindow } from "electron";
import {
  checkForBundleUpdate,
  applyBundleUpdate,
} from "../services/bundle-updater.js";
import { getSetting, setSetting } from "../services/settings.js";

// ─── Update IPC Handlers ──────────────────────────────────────────────────────

export function registerUpdateHandlers(): void {
  ipcMain.handle("update:check-bundle", async () => {
    const currentHash = getSetting("currentHash");
    const bundlePath = getSetting("bundlePath");
    if (!bundlePath) return { updateAvailable: false };

    return checkForBundleUpdate(currentHash);
  });

  ipcMain.handle("update:apply-bundle", async (_event, remoteHash: string) => {
    const bundlePath = getSetting("bundlePath");
    if (!bundlePath) throw new Error("Bundle path not configured");

    await applyBundleUpdate(bundlePath, remoteHash);
    setSetting("currentHash", remoteHash);

    // Notify all renderers to reload
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("update:bundle-applied");
    });
  });
}
