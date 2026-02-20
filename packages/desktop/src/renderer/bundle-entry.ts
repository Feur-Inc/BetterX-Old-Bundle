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
  DeveloperTab,
  AboutTab,
  SettingsModal,
  injectNavButton,
  watchNavButton,
  injectFooterBadge,
  applyAccentColor,
  injectStyle,
  notifications,
  logger,
} from "@betterx/core";
import { BETTERX_STYLES } from "@betterx/core";
import { allPlugins } from "@betterx/plugins";
import { DesktopStorage } from "./platform.js";

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
  await pluginManager.initialize(allPlugins);

  // 6. Accent color
  applyAccentColor();

  // 7. Register tabs
  const ctx = { pluginManager, themeManager, notifications };
  TabRegistry.register(PluginsTab);
  TabRegistry.register(ThemesTab);
  TabRegistry.register(DeveloperTab);
  TabRegistry.register(AboutTab);

  // 8. Modal
  const modal = new SettingsModal(ctx);
  const openModal = (): void => modal.toggle();

  // 9. Nav button
  injectNavButton(openModal);
  watchNavButton(openModal);

  // 10. Footer
  injectFooterBadge(openModal);

  // 11. Listen for bundle updates from main process
  window.electronAPI?.update?.onBundleApplied(() => {
    notifications.showInfo("BetterX bundle updated. Refreshing...", { duration: 3000 });
    setTimeout(() => window.location.reload(), 3000);
  });

  logger.info("BetterX Desktop initialized ✓");
}

// Wait for DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init());
} else {
  void init();
}

// Window.electronAPI is declared in ./platform.ts via global augmentation
