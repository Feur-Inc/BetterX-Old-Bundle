import { ipcMain, dialog } from "electron";
import { getAllSettings, getSetting, setSetting } from "../services/settings.js";
import type { DesktopSettings } from "../services/settings.js";

// ─── Settings IPC Handlers ────────────────────────────────────────────────────

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get-all", () => getAllSettings());

  ipcMain.handle("settings:get", (_event, key: keyof DesktopSettings) => getSetting(key));

  ipcMain.handle(
    "settings:set",
    (_event, key: keyof DesktopSettings, value: DesktopSettings[typeof key]) => {
      setSetting(key, value);
    }
  );

  ipcMain.handle("settings:choose-bundle-path", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select BetterX bundle.js",
      filters: [{ name: "JavaScript", extensions: ["js"] }],
      properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const path = result.filePaths[0];
    setSetting("bundlePath", path);
    return path;
  });
}
