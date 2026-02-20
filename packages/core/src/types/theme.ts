// ─── Theme Types ──────────────────────────────────────────────────────────────

export type Theme = {
  id: string;
  name: string;
  css: string;
  enabled: boolean;
};

export type ThemeStorageState = {
  order: string[];
  active: string[];
};
