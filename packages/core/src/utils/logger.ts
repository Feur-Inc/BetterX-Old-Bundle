// ─── Logger ───────────────────────────────────────────────────────────────────

const PREFIX = "[BetterX]";
const PLUGIN_COLOR = "#7c4dff";
const DEBUG_COLOR = "#888";
const INFO_COLOR = "#00bcd4";
const WARN_COLOR = "#ff9800";
const ERROR_COLOR = "#f44336";

function makeStyled(color: string): string {
  return `color: ${color}; font-weight: bold;`;
}

export const logger = {
  plugin(name: string, ...args: unknown[]): void {
    console.log(`%c${PREFIX} [${name}]`, makeStyled(PLUGIN_COLOR), ...args);
  },

  debug(...args: unknown[]): void {
    console.debug(`%c${PREFIX} [debug]`, makeStyled(DEBUG_COLOR), ...args);
  },

  info(...args: unknown[]): void {
    console.info(`%c${PREFIX}`, makeStyled(INFO_COLOR), ...args);
  },

  warn(...args: unknown[]): void {
    console.warn(`%c${PREFIX}`, makeStyled(WARN_COLOR), ...args);
  },

  error(...args: unknown[]): void {
    console.error(`%c${PREFIX}`, makeStyled(ERROR_COLOR), ...args);
  },
};
