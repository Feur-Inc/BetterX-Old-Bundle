import type { PluginManager } from "../plugin/manager.js";
import type { ThemeManager } from "../theme/manager.js";
import type { NotificationManager } from "./notification.js";

// ─── Settings Tab Interface ────────────────────────────────────────────────────

export type BetterXContext = {
  pluginManager: PluginManager;
  themeManager: ThemeManager;
  notifications: NotificationManager;
  /** URL of the BetterX logo image — platform-supplied (betterx:// or chrome-extension://) */
  logoUrl: string;
  /** Opens the themes folder in the system file manager (desktop only). */
  openThemesFolder?: () => void;
};

export interface SettingsTab {
  id: string;
  name: string;
  /** Lower priority = rendered first (leftmost) */
  priority: number;
  initialize(container: HTMLElement, ctx: BetterXContext): void;
  onActivate?(container: HTMLElement, ctx: BetterXContext): void;
}

// ─── Tab Registry ─────────────────────────────────────────────────────────────

const registry: SettingsTab[] = [];

export const TabRegistry = {
  register(tab: SettingsTab): void {
    if (registry.some((t) => t.id === tab.id)) return;
    registry.push(tab);
    registry.sort((a, b) => a.priority - b.priority);
  },

  getTabs(): SettingsTab[] {
    return [...registry];
  },

  getTab(id: string): SettingsTab | undefined {
    return registry.find((t) => t.id === id);
  },
};
