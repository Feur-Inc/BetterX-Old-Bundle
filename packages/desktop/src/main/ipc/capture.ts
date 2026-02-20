import { ipcMain, nativeImage, clipboard } from "electron";
import type { BrowserWindow } from "electron";

// ─── Capture IPC Handlers ─────────────────────────────────────────────────────

export function registerCaptureHandlers(getWin: () => BrowserWindow | null): void {
  ipcMain.handle(
    "capture:element",
    async (_event, rect: { x: number; y: number; width: number; height: number }) => {
      const win = getWin();
      if (!win) throw new Error("Window not available");

      const zoomFactor = win.webContents.getZoomFactor();
      const scaledRect = {
        x: Math.round(rect.x * zoomFactor),
        y: Math.round(rect.y * zoomFactor),
        width: Math.round(rect.width * zoomFactor),
        height: Math.round(rect.height * zoomFactor),
      };

      const image = await win.webContents.capturePage(scaledRect);
      const dataUrl = image.toDataURL();

      // Also copy to clipboard
      clipboard.writeImage(nativeImage.createFromDataURL(dataUrl));

      return dataUrl;
    }
  );
}
