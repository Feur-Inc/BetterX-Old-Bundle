declare module "node-emoji" {
  export function get(name: string): string | undefined;
  export function which(emoji: string): string | undefined;
  export function find(emoji: string): { key: string; emoji: string } | undefined;
  export function hasEmoji(str: string): boolean;
  export function strip(str: string): string;
  export function replace(str: string, replacement: string | ((emoji: string, name: string) => string)): string;
  export function unemojify(str: string): string;
  export function emojify(str: string, missingFn?: (name: string) => string): string;
}
