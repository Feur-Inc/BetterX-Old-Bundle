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

    // Start enabled plugins in dependency order so deps are running before dependents.
    this.startInOrder();

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
      enabled: def.isMeta ? true : (saved?.enabled ?? false),
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
    if (!plugin || plugin.unavailable || plugin.isLibrary || plugin.isMeta) return;

    if (plugin.enabled) {
      const disabled = this.disableWithDependents(name);
      this.disableOrphanedLibraries();
      const cascade = disabled.filter((n) => n !== name);
      if (cascade.length > 0) {
        notifications.showWarning(
          `Also disabled: ${cascade.join(", ")} (depend on "${plugin.name}")`,
        );
      }
    } else {
      const enabled = this.enableWithDependencies(name);
      const auto = enabled.filter((n) => n !== name);
      if (auto.length > 0) {
        notifications.showWarning(
          `Also enabled: ${auto.join(", ")} (required by "${plugin.name}")`,
        );
      }
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

  /** Returns names of plugins that directly depend on the given plugin. */
  getDependents(name: string): string[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.dependencies?.includes(name))
      .map((p) => p.name);
  }

  /** Enable a plugin after enabling its dependencies. Returns all newly-enabled names. */
  private enableWithDependencies(name: string, visited = new Set<string>()): string[] {
    if (visited.has(name)) return [];
    visited.add(name);

    const plugin = this.plugins.get(name);
    if (!plugin || plugin.unavailable || plugin.enabled) return [];

    const enabled: string[] = [];

    for (const depName of plugin.dependencies ?? []) {
      const dep = this.plugins.get(depName);
      if (!dep || dep.unavailable || dep.enabled) continue;
      enabled.push(...this.enableWithDependencies(depName, visited));
    }

    plugin.enabled = true;
    this.safeCall(plugin, "start");
    enabled.push(name);
    return enabled;
  }

  /** Disable a plugin and cascade to anything that depends on it. Returns all disabled names. */
  private disableWithDependents(name: string, visited = new Set<string>()): string[] {
    if (visited.has(name)) return [];
    visited.add(name);

    const plugin = this.plugins.get(name);
    if (!plugin || !plugin.enabled) return [];

    plugin.enabled = false;
    this.safeCall(plugin, "stop");
    const disabled = [name];

    for (const [depName, dep] of this.plugins) {
      if (dep.enabled && dep.dependencies?.includes(name)) {
        disabled.push(...this.disableWithDependents(depName, visited));
      }
    }

    return disabled;
  }

  /** Disable any library plugin that has no enabled dependents. Iterates until stable. */
  private disableOrphanedLibraries(): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (const [name, plugin] of this.plugins) {
        if (!plugin.isLibrary || !plugin.enabled) continue;
        const hasActiveDependents = Array.from(this.plugins.values()).some(
          (p) => p.enabled && p.dependencies?.includes(name),
        );
        if (!hasActiveDependents) {
          plugin.enabled = false;
          this.safeCall(plugin, "stop");
          changed = true;
        }
      }
    }
  }

  /** Start all enabled plugins respecting dependency order. */
  private startInOrder(): void {
    const started = new Set<string>();

    const start = (name: string, visiting = new Set<string>()): void => {
      if (started.has(name) || visiting.has(name)) return;
      visiting.add(name);
      const plugin = this.plugins.get(name);
      if (!plugin || !plugin.enabled) return;
      for (const depName of plugin.dependencies ?? []) {
        start(depName, visiting);
      }
      started.add(name);
      this.safeCall(plugin, "start");
    };

    for (const name of this.plugins.keys()) start(name);
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
