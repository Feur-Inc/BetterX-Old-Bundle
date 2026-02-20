import { Tray, Menu, nativeImage, BrowserWindow } from "electron";
import { join } from "path";

// ─── System Tray ──────────────────────────────────────────────────────────────

let tray: Tray | null = null;

export function createTray(iconPath: string, win: BrowserWindow): void {
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("BetterX Desktop");

  const menu = Menu.buildFromTemplate([
    {
      label: "Show BetterX",
      click: () => {
        win.show();
        win.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        win.destroy();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on("double-click", () => {
    win.show();
    win.focus();
  });
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}
