// ─── CSS Processor ────────────────────────────────────────────────────────────
// Adds `!important` to all CSS declarations while preserving @keyframes.

const ANIMATION_PROPS = new Set([
  "animation",
  "animation-name",
  "animation-duration",
  "animation-timing-function",
  "animation-delay",
  "animation-iteration-count",
  "animation-direction",
  "animation-fill-mode",
  "animation-play-state",
]);

/**
 * Post-processes CSS to add `!important` to all declarations,
 * except those inside @keyframes which must not have it.
 */
export function processCSS(css: string): string {
  const lines = css.split("\n");
  const result: string[] = [];
  let inKeyframes = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/@keyframes\s/i.test(trimmed)) {
      inKeyframes++;
      result.push(line);
      continue;
    }

    if (inKeyframes > 0) {
      if (trimmed === "{") inKeyframes++;
      if (trimmed === "}") {
        inKeyframes--;
        result.push(line);
        continue;
      }
      result.push(line);
      continue;
    }

    // Add !important to property: value declarations
    if (trimmed.includes(":") && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
      const colonIdx = trimmed.indexOf(":");
      const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();

      if (!ANIMATION_PROPS.has(prop) && !trimmed.endsWith("{")) {
        // Strip existing !important, then re-add
        const withoutImportant = line.replace(/\s*!important\s*;?\s*$/, "");
        const hasTrailingSemi = withoutImportant.trimEnd().endsWith(";");
        result.push(
          hasTrailingSemi
            ? withoutImportant.replace(/;(\s*)$/, " !important;$1")
            : withoutImportant + " !important;"
        );
        continue;
      }
    }

    result.push(line);
  }

  return result.join("\n");
}
