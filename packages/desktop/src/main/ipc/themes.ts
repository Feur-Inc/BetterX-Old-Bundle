import { ipcMain, BrowserWindow, shell } from "electron";
import { join } from "path";
import { mkdir, readdir, readFile, writeFile, unlink } from "fs/promises";
import { THEMES_DIR } from "../paths.js";

// ─── Theme IPC Handlers ───────────────────────────────────────────────────────

async function ensureThemesDir(): Promise<void> {
  await mkdir(THEMES_DIR, { recursive: true });
}

export function registerThemeHandlers(): void {
  ipcMain.handle("themes:list", async () => {
    await ensureThemesDir();
    const files = await readdir(THEMES_DIR);
    return files.filter((f) => f.endsWith(".css"));
  });

  ipcMain.handle("themes:read", async (_event, id: string) => {
    await ensureThemesDir();
    const filePath = join(THEMES_DIR, id);
    try {
      return await readFile(filePath, "utf-8");
    } catch {
      return "";
    }
  });

  ipcMain.handle("themes:write", async (_event, id: string, css: string) => {
    await ensureThemesDir();
    const filePath = join(THEMES_DIR, id);
    await writeFile(filePath, css, "utf-8");

    // Notify all renderer windows of the change
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("themes:changed", id, css);
    });
  });

  ipcMain.handle("themes:delete", async (_event, id: string) => {
    await ensureThemesDir();
    try {
      await unlink(join(THEMES_DIR, id));
    } catch {
      // ignore
    }
  });

  ipcMain.handle("themes:openFolder", async () => {
    await ensureThemesDir();
    void shell.openExternal(`file://${THEMES_DIR}`);
  });
}
