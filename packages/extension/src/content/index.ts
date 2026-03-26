// ─── BetterX Content Script ───────────────────────────────────────────────────
// Runs in ISOLATED world — has browser.* API access while still sharing the DOM.

import browser from "webextension-polyfill";
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
  setImageProxy,
  setFetchProxy,
  type ProxyFetchInit,
} from "@betterx/core";
import { BETTERX_STYLES } from "@betterx/core";
import { allPlugins } from "@betterx/plugins";
import { ExtensionStorage } from "../background/storage.js";
import { registerMainWorldBridge } from "./bridge.js";

let initialized = false;

async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // 0. Wire up main-world bridge (must be early so plugins can use it)
  registerMainWorldBridge();

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
  await pluginManager.initialize(allPlugins, "extension");

  // 6. Apply accent color
  applyAccentColor();

  const logoUrl = browser.runtime.getURL("icons/icon.svg");

  // 7. Register image proxy so plugins can bypass X's CSP
  const proxyImageFn = async (url: string): Promise<string> => {
    try {
      const res = await browser.runtime.sendMessage({ type: "PROXY_IMAGE", url }) as { dataUrl?: string };
      return res?.dataUrl ?? url;
    } catch {
      return url;
    }
  };
  setImageProxy(proxyImageFn);
  setFetchProxy(async (url: string, init?: ProxyFetchInit) => {
    try {
      return await browser.runtime.sendMessage({ type: "PROXY_FETCH", url, ...init }) as
        { ok: boolean; status: number; text: string; json: unknown };
    } catch {
      return { ok: false, status: 0, text: "Extension messaging failed", json: null };
    }
  });

  TabRegistry.register(PluginsTab);
  TabRegistry.register(ThemesTab);
  TabRegistry.register(CloudTab);
  TabRegistry.register(DeveloperTab);
  TabRegistry.register(AboutTab);

  const ctx: BetterXContext = {
    pluginManager,
    themeManager,
    notifications,
    storage,
    logoUrl,
    platform: "extension",
    proxyImage: proxyImageFn,
  };

  // 8. Create modal
  const modal = new SettingsModal(ctx);

  // 9. Inject nav button + watch for SPA navigation removing it
  const openModal = (): void => modal.toggle();
  injectNavButton(openModal, logoUrl);
  watchNavButton(openModal, logoUrl);

  console.log("[BetterX] Initialized ✓");
}

// Start on document_idle (DOMContentLoaded already fired)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init());
} else {
  void init();
}
