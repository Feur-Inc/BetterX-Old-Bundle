import type { SettingsTab, BetterXContext } from "../tab-registry.js";
import type { IStorage } from "../../types/storage.js";
import type { PluginStorageData } from "../../types/plugin.js";
import { logger } from "../../utils/logger.js";
import { BETTERX_VERSION } from "../../utils/constants.js";

// ─── Cloud Sync Tab ───────────────────────────────────────────────────────────

/** Unified fetch that uses IPC proxy on desktop (bypasses CSP) or direct fetch on extension. */
async function cloudRequest(
  ctx: BetterXContext,
  server: string,
  path: string,
  options?: { method?: string; body?: string },
): Promise<{ ok: boolean; status: number; json: unknown }> {
  if (ctx.cloudFetch) {
    return ctx.cloudFetch(server, path, options);
  }
  const res = await fetch(`${server}${path}`, {
    method: options?.method ?? "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : {},
    body: options?.body ?? null,
  });
  const json = res.ok ? await res.json() : null;
  return { ok: res.ok, status: res.status, json };
}

// ─── Local JSON Config Helpers ──────────────────────────────────────────────

async function exportConfig(storage: IStorage): Promise<string> {
  const pluginStates = await storage.getPluginStates();
  const themeState = await storage.getThemeState();
  const themeIds = await storage.listThemes();
  const themes: Record<string, string> = {};
  for (const id of themeIds) {
    themes[id] = await storage.readTheme(id);
  }
  return JSON.stringify(
    { version: BETTERX_VERSION, pluginStates, themeState, themes },
    null,
    2,
  );
}

async function importConfig(
  storage: IStorage,
  json: string,
  ctx: BetterXContext,
): Promise<void> {
  const data = JSON.parse(json) as {
    pluginStates?: Record<string, PluginStorageData>;
    themeState?: { order: string[]; active: string[] };
    themes?: Record<string, string>;
  };

  if (data.pluginStates) {
    const unavailable = new Set(
      ctx.pluginManager
        .getAll()
        .filter((p) => p.unavailable)
        .map((p) => p.name),
    );

    for (const [name, state] of Object.entries(data.pluginStates)) {
      if (unavailable.has(name)) {
        state.enabled = false;
      }
    }

    await storage.setPluginStates(data.pluginStates);
  }

  if (data.themeState) {
    await storage.setThemeState(data.themeState);
  }

  if (data.themes) {
    for (const [id, css] of Object.entries(data.themes)) {
      await storage.writeTheme(id, css);
    }
  }

  ctx.notifications.showSuccess("Config imported — reload the page to apply changes.");
}

function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function refreshStatus(container: HTMLElement, ctx: BetterXContext) {
  const statusVal = container.querySelector("#cloud-status") as HTMLElement;
  const loginBtn = container.querySelector("#cloud-login-btn") as HTMLElement;
  const logoutBtn = container.querySelector("#cloud-logout-btn") as HTMLElement;
  const serverInput = container.querySelector("#cloud-server-url") as HTMLInputElement;

  const server = serverInput?.value.replace(/\/+$/, "") || localStorage.getItem("bx_cloud_server") || "http://localhost:3000";

  if (!server) {
    statusVal.textContent = "Not Configured";
    statusVal.style.color = "var(--betterx-textColorSecondary)";
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    return;
  }

  try {
    const res = await cloudRequest(ctx, server, "/api/config");
    if (res.ok) {
      statusVal.textContent = "Connected";
      statusVal.style.color = "var(--betterx-success)";
      loginBtn.style.display = "none";
      logoutBtn.style.display = "block";
    } else {
      statusVal.textContent = "Not logged in";
      statusVal.style.color = "var(--betterx-danger)";
      loginBtn.style.display = "block";
      logoutBtn.style.display = "none";
    }
  } catch (e) {
    statusVal.textContent = "Server Offline";
    statusVal.style.color = "var(--betterx-textColorSecondary)";
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
}

async function setupDesktopEvents(container: HTMLElement, ctx: BetterXContext) {
  const loginBtn = container.querySelector("#cloud-login-btn") as HTMLButtonElement;
  const logoutBtn = container.querySelector("#cloud-logout-btn") as HTMLButtonElement;
  const pushBtn = container.querySelector("#cloud-push-btn") as HTMLButtonElement;
  const pullBtn = container.querySelector("#cloud-pull-btn") as HTMLButtonElement;
  const exportBtn = container.querySelector("#cloud-export-btn") as HTMLButtonElement;
  const importBtn = container.querySelector("#cloud-import-btn") as HTMLButtonElement;
  const autoSyncToggle = container.querySelector("#cloud-autosync-toggle") as HTMLInputElement;
  const serverInput = container.querySelector("#cloud-server-url") as HTMLInputElement;

  const getServer = () => serverInput.value.replace(/\/+$/, "") || "http://localhost:3000";

  serverInput.addEventListener("change", () => {
    localStorage.setItem("bx_cloud_server", getServer());
    refreshStatus(container, ctx);
  });

  exportBtn.addEventListener("click", () => {
    exportConfig(ctx.storage)
      .then((json) => downloadJson(json, "betterx-config.json"))
      .catch((err) => {
        logger.error("Config export failed", err);
        ctx.notifications.showError("Failed to export config");
      });
  });

  importBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      file
        .text()
        .then((text) => importConfig(ctx.storage, text, ctx))
        .catch((err) => {
          logger.error("Config import failed", err);
          ctx.notifications.showError("Failed to import config — invalid JSON?");
        });
    });
    input.click();
  });

  loginBtn.addEventListener("click", () => {
    const url = `${getServer()}/auth/twitter`;
    if (ctx.openOAuth) {
      ctx.openOAuth(url).catch(console.error);
    } else {
      window.open(url, "_blank");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    if (ctx.cloudLogout) {
      await ctx.cloudLogout(getServer());
    }
    localStorage.removeItem("bx_cloud_token");
    refreshStatus(container, ctx);
  });

  pushBtn.addEventListener("click", async () => {
    pushBtn.disabled = true;
    pushBtn.textContent = "Pushing...";
    try {
      const pluginStates = await ctx.storage.getPluginStates();
      const themeState = await ctx.storage.getThemeState();

      const res = await cloudRequest(ctx, getServer(), "/api/config", {
        method: "POST",
        body: JSON.stringify({ plugin_states: pluginStates, theme_state: themeState }),
      });

      if (res.ok) alert("Successfully pushed to cloud!");
      else alert("Failed to push to cloud. Are you logged in?");
    } catch (e) {
      alert("Error connecting to cloud server.");
    } finally {
      pushBtn.disabled = false;
      pushBtn.textContent = "Push to Cloud";
    }
  });

  pullBtn.addEventListener("click", async () => {
    pullBtn.disabled = true;
    pullBtn.textContent = "Pulling...";
    try {
      const res = await cloudRequest(ctx, getServer(), "/api/config");
      if (res.ok) {
        const data = res.json as { plugin_states: Record<string, unknown>; theme_state: Record<string, unknown> };
        await ctx.storage.setPluginStates(data.plugin_states as any);
        await ctx.storage.setThemeState(data.theme_state as any);
        alert("Successfully pulled from cloud! Page will reload to apply changes.");
        location.reload();
      } else {
        alert("Failed to pull from cloud. Are you logged in?");
      }
    } catch (e) {
      alert("Error connecting to cloud server.");
    } finally {
      pullBtn.disabled = false;
      pullBtn.textContent = "Pull from Cloud";
    }
  });

  autoSyncToggle.checked = localStorage.getItem("bx_autosync") === "true";
  autoSyncToggle.addEventListener("change", () => {
    localStorage.setItem("bx_autosync", String(autoSyncToggle.checked));
  });
}

function initDesktop(container: HTMLElement, ctx: BetterXContext): void {
  const savedServer = localStorage.getItem("bx_cloud_server") || "http://localhost:3000";

  container.innerHTML = `
    <div class="betterx-cloud-container">
      <div class="betterx-cloud-header">
        <h2>Cloud Sync</h2>
        <p>Sync your BetterX settings across devices.</p>
      </div>

      <div class="betterx-cloud-settings card">
        <h3>Connection</h3>
        <div class="betterx-option">
          <div class="betterx-option-label-group">
            <div class="betterx-option-label">Server URL</div>
            <div class="betterx-option-description">The URL of your BetterX cloud-sync instance.</div>
          </div>
          <div class="betterx-option-control">
            <input type="text" id="cloud-server-url" class="betterx-input-text" value="${savedServer}" placeholder="http://localhost:3000">
          </div>
        </div>
      </div>

      <div class="betterx-cloud-status-card">
        <div class="betterx-cloud-status-info">
          <span class="betterx-status-label">Status:</span>
          <span id="cloud-status" class="betterx-status-value">Checking...</span>
        </div>
        <div class="betterx-cloud-actions">
          <button id="cloud-login-btn" class="betterx-button betterx-button-primary" style="display: none;">Login with Twitter</button>
          <button id="cloud-logout-btn" class="betterx-button betterx-button-danger" style="display: none;">Logout</button>
        </div>
      </div>

      <div class="betterx-cloud-sync-ops card">
        <h3>Manual Sync</h3>
        <div class="betterx-sync-buttons">
          <button id="cloud-push-btn" class="betterx-button">Push to Cloud</button>
          <button id="cloud-pull-btn" class="betterx-button">Pull from Cloud</button>
        </div>
        <p class="betterx-help-text">Pushing will overwrite your cloud settings. Pulling will overwrite your local settings.</p>
      </div>

      <div class="betterx-cloud-sync-ops card">
        <h3>Local Sync</h3>
        <div class="betterx-sync-buttons">
          <button id="cloud-export-btn" class="betterx-button">Export JSON</button>
          <button id="cloud-import-btn" class="betterx-button">Import JSON</button>
        </div>
        <p class="betterx-help-text">Export or import your settings from a local JSON file.</p>
      </div>

      <div class="betterx-cloud-settings card">
        <h3>Preferences</h3>
        <div class="betterx-option">
          <div class="betterx-option-label-group">
            <div class="betterx-option-label">Auto-Sync</div>
            <div class="betterx-option-description">Automatically sync changes to the cloud.</div>
          </div>
          <div class="betterx-option-control">
            <label class="betterx-toggle">
              <input type="checkbox" id="cloud-autosync-toggle">
              <span class="betterx-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;

  setupDesktopEvents(container, ctx);
  refreshStatus(container, ctx);

  if (ctx.onOAuthComplete) {
    ctx.onOAuthComplete(() => refreshStatus(container, ctx));
  }
}

function initExtension(container: HTMLElement, ctx: BetterXContext): void {
  const render = () => {
    const savedServer = localStorage.getItem("bx_cloud_server");
    const isConfigured = !!savedServer;

    container.innerHTML = `
      <div class="betterx-cloud-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:24px;padding:20px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">
          ${isConfigured ? `
            <button id="cloud-open-panel" class="betterx-button betterx-button-primary" style="padding:16px 40px;font-size:18px;border-radius:9999px;font-weight:bold;">
              Open Cloud Sync Panel
            </button>
            <div style="display:flex;align-items:center;gap:8px;">
              <p style="color:var(--betterx-textColorSecondary);font-size:13px;opacity:0.8;margin:0;">
                ${savedServer}
              </p>
              <button id="cloud-edit-server" class="betterx-button betterx-button-secondary" style="padding:4px 8px;font-size:11px;height:auto;line-height:1;">Change</button>
            </div>
          ` : `
            <h3 style="margin:0;">Cloud Sync</h3>
            <p style="color:var(--betterx-textColorSecondary);font-size:14px;text-align:center;max-width:300px;">Enter your BetterX cloud server URL to get started.</p>
            <div style="display:flex;gap:8px;width:100%;max-width:320px;">
              <input type="text" id="cloud-server-input" class="betterx-input-text" placeholder="http://localhost:3000" style="flex:1;">
              <button id="cloud-save-server" class="betterx-button betterx-button-primary">Save</button>
            </div>
          `}
        </div>

        <div style="width:100%;height:1px;background:var(--betterx-borderColor);opacity:0.3;"></div>

        <div class="betterx-cloud-sync-ops card" style="width:100%;max-width:400px;margin:0;">
          <h3 style="margin-top:0;">Local Sync</h3>
          <div class="betterx-sync-buttons" style="display:flex;gap:12px;">
            <button id="cloud-export-btn" class="betterx-button" style="flex:1;">Export JSON</button>
            <button id="cloud-import-btn" class="betterx-button" style="flex:1;">Import JSON</button>
          </div>
          <p class="betterx-help-text" style="margin-bottom:0;">Export or import your settings from a local JSON file.</p>
        </div>
      </div>
    `;

    // Event listeners for Cloud section
    if (isConfigured) {
      container.querySelector("#cloud-open-panel")?.addEventListener("click", () => {
        window.open(savedServer, "_blank");
      });
      container.querySelector("#cloud-edit-server")?.addEventListener("click", () => {
        // Just empty it to trigger the setup UI
        localStorage.removeItem("bx_cloud_server");
        render();
      });
    } else {
      const input = container.querySelector("#cloud-server-input") as HTMLInputElement;
      const saveBtn = container.querySelector("#cloud-save-server");
      const save = () => {
        const val = input.value.trim().replace(/\/+$/, "");
        if (val) {
          localStorage.setItem("bx_cloud_server", val);
          render();
        }
      };
      saveBtn?.addEventListener("click", save);
      input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") save();
      });
    }

    // Local sync buttons (always present)
    container.querySelector("#cloud-export-btn")?.addEventListener("click", () => {
      exportConfig(ctx.storage)
        .then((json) => downloadJson(json, "betterx-config.json"))
        .catch((err) => {
          logger.error("Config export failed", err);
          ctx.notifications.showError("Failed to export config");
        });
    });

    container.querySelector("#cloud-import-btn")?.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json,application/json";
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        file
          .text()
          .then((text) => importConfig(ctx.storage, text, ctx))
          .catch((err) => {
            logger.error("Config import failed", err);
            ctx.notifications.showError("Failed to import config — invalid JSON?");
          });
      });
      fileInput.click();
    });
  };

  render();
}

export const CloudTab: SettingsTab = {
  id: "cloud",
  name: "Cloud Sync",
  priority: 35,

  initialize(container: HTMLElement, ctx: BetterXContext): void {
    // Desktop has cloudFetch (IPC proxy) — show full UI
    // Extension can't reach the server due to CSP — show link to web panel
    if (ctx.platform === "desktop") {
      initDesktop(container, ctx);
    } else {
      initExtension(container, ctx);
    }
  }
};
