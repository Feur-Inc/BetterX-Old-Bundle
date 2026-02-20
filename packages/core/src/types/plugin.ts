// ─── Option Types ─────────────────────────────────────────────────────────────

export const OptionType = {
  BOOLEAN: "BOOLEAN",
  SELECT: "SELECT",
  STRING: "STRING",
  NUMBER: "NUMBER",
} as const;

export type OptionTypeKey = (typeof OptionType)[keyof typeof OptionType];

export type OptionValueMap = {
  BOOLEAN: boolean;
  SELECT: string;
  STRING: string;
  NUMBER: number;
};

export type SelectOption = { label: string; value: string };

export type PluginOptionDef<T extends OptionTypeKey = OptionTypeKey> = {
  type: T;
  default: OptionValueMap[T];
  label?: string;
  description?: string;
  options?: T extends "SELECT" ? SelectOption[] : never;
  onChange?: (newValue: OptionValueMap[T], oldValue: OptionValueMap[T]) => void;
};

export type PluginOptionDefs = Record<string, PluginOptionDef>;

// Maps option defs to their runtime store type
export type InferredStore<O extends PluginOptionDefs> = {
  [K in keyof O]: OptionValueMap[O[K]["type"]];
};

// ─── Author ───────────────────────────────────────────────────────────────────

export type Developer = {
  name: string;
  handle: string;
};

// ─── Plugin Definition ────────────────────────────────────────────────────────

export type PluginDefinition<O extends PluginOptionDefs = Record<string, never>> = {
  name: string;
  description?: string;
  authors?: Developer[];
  version?: string;
  options?: O;
  requiresRestart?: boolean;
  start: (this: Plugin<O>) => void;
  stop?: (this: Plugin<O>) => void;
  renderSettings?: (container: HTMLElement) => void;
};

export type Plugin<O extends PluginOptionDefs = Record<string, never>> = PluginDefinition<O> & {
  enabled: boolean;
  isUserPlugin: boolean;
  settings: {
    store: InferredStore<O>;
  };
};

// ─── Storage data shape (what gets persisted) ─────────────────────────────────

export type PluginStorageData = {
  enabled: boolean;
  settings: Record<string, unknown>;
};

// ─── definePlugin helper ──────────────────────────────────────────────────────

export function definePlugin<O extends PluginOptionDefs>(
  definition: PluginDefinition<O>
): PluginDefinition<O> {
  return definition;
}
