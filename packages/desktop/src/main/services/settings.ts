import Store from "electron-store";

// ─── Settings Service ─────────────────────────────────────────────────────────

export type DesktopSettings = {
  bundlePath: string;
  currentHash: string | null;
  enableTransparency: boolean;
  startMinimized: boolean;
  autoStart: boolean;
  checkForUpdates: boolean;
};

const DEFAULT_SETTINGS: DesktopSettings = {
  bundlePath: "",
  currentHash: null,
  enableTransparency: false,
  startMinimized: false,
  autoStart: false,
  checkForUpdates: false,
};

export const settingsStore = new Store<DesktopSettings>({
  name: "desktop-settings",
  defaults: DEFAULT_SETTINGS,
});

export function getSetting<K extends keyof DesktopSettings>(key: K): DesktopSettings[K] {
  return settingsStore.get(key);
}

export function setSetting<K extends keyof DesktopSettings>(
  key: K,
  value: DesktopSettings[K]
): void {
  settingsStore.set(key, value);
}

export function getAllSettings(): DesktopSettings {
  return settingsStore.store;
}
