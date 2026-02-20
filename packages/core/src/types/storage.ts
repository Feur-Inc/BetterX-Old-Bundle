import type { PluginStorageData } from "./plugin.js";
import type { ThemeStorageState } from "./theme.js";

// ─── Storage Abstraction ──────────────────────────────────────────────────────

export interface IStorage {
  // Plugin states
  getPluginStates(): Promise<Record<string, PluginStorageData>>;
  setPluginStates(data: Record<string, PluginStorageData>): Promise<void>;

  // Theme metadata (order, active set)
  getThemeState(): Promise<ThemeStorageState>;
  setThemeState(state: ThemeStorageState): Promise<void>;

  // Theme CSS blobs
  listThemes(): Promise<string[]>;
  readTheme(id: string): Promise<string>;
  writeTheme(id: string, css: string): Promise<void>;
  deleteTheme(id: string): Promise<void>;

  // Live theme change notifications (returns unsubscribe fn)
  onThemeChanged(cb: (id: string, css: string) => void): () => void;
}
