// ─── BetterX Content Script ───────────────────────────────────────────────────
// Runs in MAIN world — same JS context as X.com.

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
} from "@betterx/core";
import { BETTERX_STYLES } from "@betterx/core";
import { allPlugins } from "@betterx/plugins";
import { ExtensionStorage } from "../background/storage.js";

let initialized = false;

async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // 1. Inject base styles
  injectStyle(BETTERX_STYLES, "betterx-styles");

  // 2. Set up storage
  const storage = new ExtensionStorage();

  // 3. Set up managers
  const notifications = new NotificationManager();
  const pluginManager = new PluginManager(storage);
  const themeManager = new ThemeManager(storage);

  // 4. Init themes first (applies CSS before plugins run)
  await themeManager.initialize();

  // 5. Init plugins
  await pluginManager.initialize(allPlugins);

  // 6. Apply accent color
  applyAccentColor();

  // 7. Register built-in tabs
  const logoUrl = chrome.runtime.getURL("icons/icon128.png");
  const ctx = { pluginManager, themeManager, notifications, logoUrl };
  TabRegistry.register(PluginsTab);
  TabRegistry.register(ThemesTab);
  TabRegistry.register(DeveloperTab);
  TabRegistry.register(AboutTab);

  // 8. Create modal
  const modal = new SettingsModal(ctx);

  // 9. Inject nav button + watch for SPA navigation removing it
  const openModal = (): void => modal.toggle();
  injectNavButton(openModal, logoUrl);
  watchNavButton(openModal, logoUrl);

  // 10. Inject footer badge
  injectFooterBadge(openModal);

  console.log("[BetterX] Initialized ✓");
}

// Start on document_idle (DOMContentLoaded already fired)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init());
} else {
  void init();
}
