import { createHash } from "crypto";
import { createWriteStream, renameSync, unlinkSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

// ─── Bundle Updater ───────────────────────────────────────────────────────────
// Fixed update system: uses bundle.js.sha256 sidecar file to avoid
// the original bug where stream hash ≠ decompressed file hash.

const BASE_URL = "https://feur-inc.github.io/BetterX/desktop/v2";
const BUNDLE_URL = `${BASE_URL}/bundle.js`;
const HASH_URL = `${BASE_URL}/bundle.js.sha256`;

export type BundleUpdateResult =
  | { updateAvailable: false }
  | { updateAvailable: true; remoteHash: string };

/**
 * Fetch the remote SHA-256 hash from the sidecar file.
 * Does NOT hash the bundle stream — just reads the tiny text file.
 */
export async function checkForBundleUpdate(
  currentHash: string | null
): Promise<BundleUpdateResult> {
  const remoteHash = await fetchText(HASH_URL);
  if (!remoteHash) throw new Error("Failed to fetch remote bundle hash");

  if (remoteHash.trim() === currentHash) {
    return { updateAvailable: false };
  }
  return { updateAvailable: true, remoteHash: remoteHash.trim() };
}

/**
 * Download bundle.js to a temp file, verify its SHA-256 against the remote hash,
 * then atomically rename it into place.
 */
export async function applyBundleUpdate(
  bundlePath: string,
  remoteHash: string
): Promise<void> {
  const tempPath = bundlePath + ".tmp";

  // Download to temp file
  await downloadFile(BUNDLE_URL, tempPath);

  // Hash the downloaded file from disk (decompressed)
  const downloadedHash = await hashFileFromDisk(tempPath);

  if (downloadedHash !== remoteHash) {
    try {
      unlinkSync(tempPath);
    } catch {
      // ignore cleanup error
    }
    throw new Error(
      `Bundle hash mismatch: expected ${remoteHash}, got ${downloadedHash}`
    );
  }

  // Atomic rename
  renameSync(tempPath, bundlePath);

  // Persist hash for next launch
  await writeFile(bundlePath + ".sha256", remoteHash, "utf-8");
}

/**
 * Read the persisted bundle hash from disk (written by applyBundleUpdate).
 */
export async function readPersistedHash(bundlePath: string): Promise<string | null> {
  try {
    const hash = await readFile(bundlePath + ".sha256", "utf-8");
    return hash.trim() || null;
  } catch {
    return null;
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading bundle`);
  if (!res.body) throw new Error("No response body");

  const writeStream = createWriteStream(destPath);
  await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), writeStream);
}

async function hashFileFromDisk(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}
