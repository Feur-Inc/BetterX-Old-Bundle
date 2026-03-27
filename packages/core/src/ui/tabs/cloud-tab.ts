import type { SettingsTab, BetterXContext } from "../tab-registry.js";
import type { IStorage } from "../../types/storage.js";
import type { PluginStorageData } from "../../types/plugin.js";
import { logger } from "../../utils/logger.js";
import { BETTERX_VERSION } from "../../utils/constants.js";
import { proxyFetch } from "../../utils/proxy.js";

// ─── Cloud Sync Tab ───────────────────────────────────────────────────────────

const DEFAULT_SERVER = "https://cloud.betterx.mopigames.dev";

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

  ctx.notifications.showSuccess("Config imported - reload the page to apply changes.");
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
  const statusDot = container.querySelector("#cloud-status-dot") as HTMLElement;
  const loginBtn = container.querySelector("#cloud-login-btn") as HTMLElement;
  const logoutBtn = container.querySelector("#cloud-logout-btn") as HTMLElement;
  const userInfo = container.querySelector("#cloud-user-info") as HTMLElement;
  const userPfp = container.querySelector("#cloud-user-pfp") as HTMLImageElement;
  const userName = container.querySelector("#cloud-user-name") as HTMLElement;
  const serverInput = container.querySelector("#cloud-server-url") as HTMLInputElement;

  const server = serverInput?.value.replace(/\/+$/, "") || localStorage.getItem("bx_cloud_server") || DEFAULT_SERVER;

  const setStatus = (label: string, color: string) => {
    statusVal.textContent = label;
    statusVal.style.color = color;
    statusDot.style.background = color;
  };

  const setDisconnected = (label: string) => {
    const color = label === "Not logged in" ? "var(--betterx-danger)" : "var(--betterx-textColorSecondary)";
    setStatus(label, color);
    loginBtn.style.display = "";
    logoutBtn.style.display = "none";
    userInfo.style.display = "none";
  };

  if (!server) { setDisconnected("Not Configured"); return; }

  try {
    const res = await proxyFetch(`${server}/api/config`);
    const data = res.json as any;
    if (res.ok && data && typeof data === "object" && "plugin_states" in data) {
      setStatus("Connected", "var(--betterx-success)");
      loginBtn.style.display = "none";
      logoutBtn.style.display = "";

      proxyFetch(`${server}/api/me`).then((meRes) => {
        const me = meRes.json as { username: string; profile_image_url: string | null } | null;
        if (!meRes.ok || !me) return;
        userName.textContent = `@${me.username}`;
        if (me.profile_image_url) {
          userPfp.src = me.profile_image_url.replace("_normal", "_bigger");
          userPfp.style.display = "";
        } else {
          userPfp.style.display = "none";
        }
        userInfo.style.display = "flex";
      }).catch(() => {});
    } else {
      setDisconnected("Not logged in");
    }
  } catch (e) {
    setDisconnected("Server Offline");
  }
}

async function setupEvents(container: HTMLElement, ctx: BetterXContext) {
  const loginBtn = container.querySelector("#cloud-login-btn") as HTMLButtonElement;
  const logoutBtn = container.querySelector("#cloud-logout-btn") as HTMLButtonElement;
  const pushBtn = container.querySelector("#cloud-push-btn") as HTMLButtonElement;
  const pullBtn = container.querySelector("#cloud-pull-btn") as HTMLButtonElement;
  const exportBtn = container.querySelector("#cloud-export-btn") as HTMLButtonElement;
  const importBtn = container.querySelector("#cloud-import-btn") as HTMLButtonElement;
  const autoSyncToggle = container.querySelector("#cloud-autosync-toggle") as HTMLInputElement;
  const serverInput = container.querySelector("#cloud-server-url") as HTMLInputElement;

  const getServer = () => serverInput.value.replace(/\/+$/, "") || DEFAULT_SERVER;

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
          ctx.notifications.showError("Failed to import config - invalid JSON?");
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
    await proxyFetch(`${getServer()}/auth/logout`).catch(() => {});
    refreshStatus(container, ctx);
  });

  pushBtn.addEventListener("click", async () => {
    pushBtn.disabled = true;
    pushBtn.textContent = "Pushing...";
    try {
      const pluginStates = await ctx.storage.getPluginStates();
      const themeState = await ctx.storage.getThemeState();

      const res = await proxyFetch(`${getServer()}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugin_states: pluginStates, theme_state: themeState }),
      });

      if (res.ok) {
        ctx.notifications.showSuccess("Successfully pushed to cloud.");
      } else {
        ctx.notifications.showError("Failed to push to cloud — are you still logged in?");
      }
    } catch (e) {
      ctx.notifications.showError("Could not reach the cloud server.");
    } finally {
      pushBtn.disabled = false;
      pushBtn.textContent = "Push to Cloud ↑";
    }
  });

  pullBtn.addEventListener("click", async () => {
    pullBtn.disabled = true;
    pullBtn.textContent = "Pulling...";
    try {
      const res = await proxyFetch(`${getServer()}/api/config`);
      if (res.ok) {
        const data = res.json as { plugin_states: Record<string, unknown>; theme_state: Record<string, unknown> } | null;
        if (!data || typeof data !== "object" || !("plugin_states" in data) || !("theme_state" in data)) {
          ctx.notifications.showError("Unexpected response from server — try again.");
          return;
        }
        await ctx.storage.setPluginStates(data.plugin_states as any);
        await ctx.storage.setThemeState(data.theme_state as any);
        ctx.notifications.showSuccess("Pulled from cloud. Reloading…");
        setTimeout(() => location.reload(), 1200);
      } else {
        ctx.notifications.showError(`Pull failed (${res.status}) — are you still logged in?`);
      }
    } catch (e) {
      ctx.notifications.showError(`Pull failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      pullBtn.disabled = false;
      pullBtn.textContent = "Pull from Cloud ↓";
    }
  });

  autoSyncToggle.checked = localStorage.getItem("bx_autosync") === "true";
  autoSyncToggle.addEventListener("change", () => {
    localStorage.setItem("bx_autosync", String(autoSyncToggle.checked));
  });
}

let _unsubOAuth: (() => void) | null = null;

function init(container: HTMLElement, ctx: BetterXContext): void {
  const savedServer = localStorage.getItem("bx_cloud_server") || DEFAULT_SERVER;

  container.innerHTML = `
    <div class="bx-cloud-grid">

      <!-- Account / Status -->
      <div class="bx-cloud-card bx-cloud-account-card">
        <div class="bx-cloud-card-title">Account</div>
        <div class="bx-cloud-status-row">
          <span id="cloud-status-dot" class="bx-cloud-status-dot"></span>
          <span id="cloud-status" class="bx-cloud-status-text">Checking…</span>
        </div>
        <div id="cloud-user-info" style="display:none;" class="bx-cloud-user-row">
          <img id="cloud-user-pfp" src="" alt="" class="bx-cloud-pfp">
          <span id="cloud-user-name" class="bx-cloud-username"></span>
        </div>
        <div class="bx-cloud-auth-actions">
          <button id="cloud-login-btn" class="betterx-button betterx-button-primary" style="display:none;">Login with Twitter</button>
          <button id="cloud-logout-btn" class="betterx-button betterx-button-danger" style="display:none;">Logout</button>
        </div>
      </div>

      <!-- Connection -->
      <div class="bx-cloud-card bx-cloud-connection-card">
        <div class="bx-cloud-card-title">Connection</div>
        <div class="bx-cloud-field">
          <label class="bx-cloud-field-label">Server URL</label>
          <div class="bx-cloud-field-desc">The URL of your BetterX cloud-sync instance.</div>
          <input type="text" id="cloud-server-url" class="betterx-input-text bx-cloud-url-input" value="${savedServer}" placeholder="${DEFAULT_SERVER}">
        </div>
      </div>

      <!-- Ops row -->
      <div class="bx-cloud-ops-row">

        <div class="bx-cloud-card bx-cloud-op-card">
          <div class="bx-cloud-card-title">Cloud Sync</div>
          <p class="betterx-help-text">Overwrite cloud ↔ local settings.</p>
          <div class="bx-cloud-op-actions">
            <button id="cloud-push-btn" class="betterx-button betterx-button-primary bx-full-btn">Push to Cloud ↑</button>
            <button id="cloud-pull-btn" class="betterx-button bx-full-btn">Pull from Cloud ↓</button>
          </div>
        </div>

        <div class="bx-cloud-card bx-cloud-op-card">
          <div class="bx-cloud-card-title">Local Backup</div>
          <p class="betterx-help-text">Export or import settings as a JSON file.</p>
          <div class="bx-cloud-op-actions">
            <button id="cloud-export-btn" class="betterx-button bx-full-btn">Export JSON</button>
            <button id="cloud-import-btn" class="betterx-button bx-full-btn">Import JSON</button>
          </div>
        </div>

        <div class="bx-cloud-card bx-cloud-op-card">
          <div class="bx-cloud-card-title">Preferences</div>
          <div class="betterx-option" style="border:none;padding:0;margin-top:8px;">
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
    </div>
  `;

  setupEvents(container, ctx);
  refreshStatus(container, ctx);

  // Replace any previous listener so re-inits don't stack callbacks
  _unsubOAuth?.();
  _unsubOAuth = ctx.onOAuthComplete?.(() => refreshStatus(container, ctx)) ?? null;
}

export const CloudTab: SettingsTab = {
  id: "cloud",
  name: "Cloud Sync",
  priority: 35,

  initialize(container: HTMLElement, ctx: BetterXContext): void {
    init(container, ctx);
  },

  onActivate(container: HTMLElement, ctx: BetterXContext): void {
    refreshStatus(container, ctx);
  },
};
