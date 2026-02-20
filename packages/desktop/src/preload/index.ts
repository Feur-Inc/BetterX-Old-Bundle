import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI } from "./api.js";

// ─── Preload ──────────────────────────────────────────────────────────────────
// Exposes ONLY typed ipcRenderer calls via contextBridge.
// No raw ipcRenderer access. No modifyCSP. No disable-web-security.

const api: ElectronAPI = {
  themes: {
    list: () => ipcRenderer.invoke("themes:list"),
    read: (id) => ipcRenderer.invoke("themes:read", id),
    write: (id, css) => ipcRenderer.invoke("themes:write", id, css),
    delete: (id) => ipcRenderer.invoke("themes:delete", id),
    onChanged: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, id: string, css: string): void =>
        callback(id, css);
      ipcRenderer.on("themes:changed", handler);
      return () => ipcRenderer.removeListener("themes:changed", handler);
    },
  },

  settings: {
    getAll: () => ipcRenderer.invoke("settings:get-all"),
    get: (key) => ipcRenderer.invoke("settings:get", key),
    set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
    chooseBundlePath: () => ipcRenderer.invoke("settings:choose-bundle-path"),
  },

  update: {
    checkBundle: () => ipcRenderer.invoke("update:check-bundle"),
    applyBundle: (remoteHash) => ipcRenderer.invoke("update:apply-bundle", remoteHash),
    onBundleApplied: (callback) => {
      const handler = (): void => callback();
      ipcRenderer.on("update:bundle-applied", handler);
      return () => ipcRenderer.removeListener("update:bundle-applied", handler);
    },
  },

  captureElement: (rect) => ipcRenderer.invoke("capture:element", rect),

  getVersion: () => ipcRenderer.sendSync("app:get-version") as string,
};

contextBridge.exposeInMainWorld("electronAPI", api);
