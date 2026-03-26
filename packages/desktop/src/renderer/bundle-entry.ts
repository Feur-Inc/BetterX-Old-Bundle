// ─── BetterX Desktop Bundle Entry ────────────────────────────────────────────
// This is the IIFE bundle injected into X.com via betterx:// protocol.
// Has access to window.electronAPI via contextBridge.

import {
  PluginManager,
  ThemeManager,
  NotificationManager,
  TabRegistry,
  PluginsTab,
  ThemesTab,
  CloudTab,
  DeveloperTab,
  AboutTab,
  SettingsModal,
  type BetterXContext,
  injectNavButton,
  watchNavButton,
  applyAccentColor,
  injectStyle,
  notifications,
  logger,
  setFetchProxy,
  type ProxyFetchInit,
} from "@betterx/core";
import { BETTERX_STYLES } from "@betterx/core";
import { allPlugins } from "@betterx/plugins";
import { DesktopStorage } from "./platform.js";
import { DesktopTab } from "./desktop-tab.js";
import { startPageTracker } from "./page-tracker.js";

let initialized = false;

async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  logger.info("BetterX Desktop bundle initializing...");

  // 1. Inject base styles
  injectStyle(BETTERX_STYLES, "betterx-styles");

  // 2. Storage
  const storage = new DesktopStorage();

  // 3. Managers
  const pluginManager = new PluginManager(storage);
  const themeManager = new ThemeManager(storage);

  // 4. Init themes
  await themeManager.initialize();

  // 5. Init plugins
  await pluginManager.initialize(allPlugins, "desktop");

  // 6. Accent color
  applyAccentColor();

  // Wire up proxy fetch through Electron's main process (bypasses X's CSP)
  setFetchProxy(async (url: string, init?: ProxyFetchInit) => {
    const u = new URL(url);
    return window.electronAPI!.cloudFetch(u.origin, u.pathname + u.search, init);
  });

  // 7. Register tabs
  const logoUrl = "betterx://assets/icon.svg";
  const ctx: BetterXContext = {
    pluginManager,
    themeManager,
    notifications,
    storage,
    logoUrl,
    platform: "desktop",
    openThemesFolder: () => { window.electronAPI?.themes.openFolder(); },
    openOAuth: (url: string) => window.electronAPI!.openOAuth(url),
    onOAuthComplete: (cb: () => void) => window.electronAPI!.onOAuthComplete(cb),
  };
  TabRegistry.register(PluginsTab);
  TabRegistry.register(ThemesTab);
  TabRegistry.register(CloudTab);
  TabRegistry.register(DesktopTab);
  TabRegistry.register(DeveloperTab);
  TabRegistry.register(AboutTab);

  // 8. Modal
  const modal = new SettingsModal(ctx);
  const openModal = (): void => modal.toggle();

  // Expose for tray "Settings" menu item
  (window as typeof window & { __betterx_open_settings?: () => void }).__betterx_open_settings = () => modal.open();

  // 9. Nav button
  injectNavButton(openModal, logoUrl);
  watchNavButton(openModal, logoUrl);

  // 11. Listen for bundle updates from main process
  window.electronAPI?.update?.onBundleApplied(() => {
    notifications.showInfo("BetterX bundle updated. Refreshing...", { duration: 3000 });
    setTimeout(() => window.location.reload(), 3000);
  });

  // 12. Page tracker (Discord RPC)
  startPageTracker();

  logger.info("BetterX Desktop initialized ✓");
}

// Wait for DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init());
} else {
  void init();
}

// Window.electronAPI is declared in ./platform.ts via global augmentation
