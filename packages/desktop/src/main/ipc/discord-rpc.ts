import { ipcMain } from "electron";
import { getSetting } from "../services/settings.js";
import { updateActivity } from "../services/discord-rpc.js";

// ─── Discord RPC IPC Handlers ────────────────────────────────────────────────

export function registerDiscordRPCHandlers(): void {
  ipcMain.on("discord-rpc:update-activity", (_event, details: string, state: string) => {
    if (!getSetting("enableDiscordRPC")) return;
    void updateActivity(details, state);
  });
}
