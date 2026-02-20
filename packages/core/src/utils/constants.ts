import type { Developer } from "../types/plugin.js";

export const Devs = {
  Mopi: { name: "Mopi", handle: "MopigamesYT" },
  TPM28: { name: "TPM28", handle: "tpm_28" },
  IHateSpawn: { name: "KwiatekMiki", handle: "IHateSpawn" },
  Ayaz: { name: "Ayaz", handle: "ayazqv" },
} as const satisfies Record<string, Developer>;

export const BETTERX_VERSION = "3.0.0";
export const BETTERX_STORAGE_KEY_PLUGINS = "betterXPluginStates";
export const BETTERX_STORAGE_KEY_THEMES = "betterXThemeState";
