import { Tray, Menu, nativeImage, BrowserWindow, app } from "electron";
import { getSetting } from "./services/settings.js";

// ─── System Tray ──────────────────────────────────────────────────────────────

let tray: Tray | null = null;

function buildMenu(win: BrowserWindow): Menu {
  return Menu.buildFromTemplate([
    {
      label: "Open BetterX",
      click: () => {
        win.show();
        win.focus();
      },
    },
    {
      label: "Settings",
      click: () => {
        win.show();
        win.focus();
        win.webContents.executeJavaScript(
          "window.__betterx_open_settings && window.__betterx_open_settings()"
        ).catch(() => {});
      },
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: () => {
        win.webContents.send("betterx:check-updates");
      },
    },
    { type: "separator" },
    {
      label: "Restart",
      click: () => {
        app.relaunch();
        app.exit(0);
      },
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);
}

export function createTray(iconPath: string, win: BrowserWindow): void {
  if (tray) return;

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("BetterX V3");
  tray.setContextMenu(buildMenu(win));

  // Click toggles show/hide (Linux/Windows — macOS shows context menu)
  tray.on("click", () => {
    if (win.isVisible() && win.isFocused()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  // Minimize to tray instead of closing (when setting is enabled)
  win.on("close", (e) => {
    if (!(app as typeof app & { isQuitting?: boolean }).isQuitting && getSetting("minimizeToTray")) {
      e.preventDefault();
      win.hide();
    }
  });
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

export function getTray(): Tray | null {
  return tray;
}
