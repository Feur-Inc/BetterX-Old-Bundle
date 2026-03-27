import type {
  Plugin,
  PluginDefinition,
  PluginOptionDefs,
  PluginPlatform,
  PluginStorageData,
} from "../types/plugin.js";
import type { IStorage } from "../types/storage.js";
import { notifications } from "../ui/notification.js";
import { logger } from "../utils/logger.js";

// ─── Plugin Manager ───────────────────────────────────────────────────────────

export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private storage: IStorage;
  private initialized = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Initialize all plugins from the barrel export.
   * Reads persisted states, merges with defaults, starts enabled plugins.
   *
   * Accepts PluginDefinition<any>[] because each plugin has a unique options
   * generic that is invariant due to the typed `this` parameter.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async initialize(
    definitions: ReadonlyArray<PluginDefinition<any>>,
    platform?: PluginPlatform
  ): Promise<void> {
    const saved = await this.storage.getPluginStates();

    for (const def of definitions) {
      const incompatible = !!(def.platform && platform && def.platform !== platform);
      const plugin = this.hydratePlugin(def, saved[def.name]);
      plugin.hidden = !!def.hidden;

      if (incompatible) {
        plugin.unavailable = true;
        plugin.enabled = false;
      }

      this.plugins.set(def.name, plugin);
    }

    this.initialized = true;

    // Start enabled plugins only after all are hydrated, so a failing
    // start() can never persist a partial plugin map.
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        this.safeCall(plugin, "start");
      }
    }

    logger.info(`PluginManager: ${this.plugins.size} plugins loaded`);
  }

  /** Hydrate a definition into a full Plugin with settings.store. */
  private hydratePlugin<O extends PluginOptionDefs>(
    def: PluginDefinition<O>,
    saved?: PluginStorageData
  ): Plugin<O> {
    const store = {} as Record<string, unknown>;

    if (def.options) {
      for (const [key, opt] of Object.entries(def.options)) {
        store[key] = saved?.settings?.[key] ?? opt.default;
      }
    }

    return {
      ...def,
      enabled: saved?.enabled ?? false,
      isUserPlugin: false,
      settings: {
        store: store as never,
        persist: () => this.persist(),
      },
    };
  }

  getStorage(): IStorage {
    return this.storage;
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values()).filter((plugin) => !plugin.hidden);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  async toggle(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin || plugin.unavailable) return;

    if (plugin.enabled) {
      plugin.enabled = false;
      this.safeCall(plugin, "stop");
    } else {
      plugin.enabled = true;
      this.safeCall(plugin, "start");
    }

    await this.persist();

    if (plugin.requiresRestart) {
      notifications.showWarning(`"${plugin.name}" requires a page refresh to fully apply.`, {
        duration: 0,
        actions: [
          {
            label: "Refresh now",
            callback: () => location.reload(),
          },
        ],
      });
    }
  }

  async updateOption(pluginName: string, key: string, value: unknown): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;

    const optDef = plugin.options?.[key];
    if (!optDef) return;

    const oldValue = (plugin.settings.store as Record<string, unknown>)[key];
    (plugin.settings.store as Record<string, unknown>)[key] = value;

    const onChange = (optDef as { onChange?: (n: unknown, o: unknown) => void }).onChange;
    if (onChange) {
      try {
        onChange(value, oldValue);
      } catch (err) {
        logger.error(`Plugin "${pluginName}" onChange for "${key}" threw:`, err);
      }
    }

    await this.persist();
  }

  private safeCall(plugin: Plugin, method: "start" | "stop"): void {
    const fn = plugin[method];
    if (typeof fn !== "function") return;
    try {
      fn.call(plugin);
    } catch (err) {
      logger.error(`Plugin "${plugin.name}" threw during ${method}():`, err);
      if (method === "start") {
        plugin.enabled = false;
        this.persist().catch(() => undefined);
      }
    }
  }

  private async persist(): Promise<void> {
    if (!this.initialized) return;

    const states: Record<string, PluginStorageData> = {};
    for (const [name, plugin] of this.plugins) {
      states[name] = {
        enabled: plugin.enabled,
        settings: { ...(plugin.settings.store as Record<string, unknown>) },
      };
    }
    await this.storage.setPluginStates(states);
  }
}
