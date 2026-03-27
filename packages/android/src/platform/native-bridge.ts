type StorageAreaName = "sync" | "local";

type NativeBridge = {
  postMessage(message: string): void;
  onmessage: ((event: { data: string }) => void) | null;
};

export type NativePayload = {
  type: string;
  area?: StorageAreaName | undefined;
  keys?: string[] | undefined;
  items?: Record<string, unknown> | undefined;
  url?: string | undefined;
  method?: string | undefined;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
};

type NativeResponse = {
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
};

const pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>();

let requestSeq = 0;
let hookedNativeBridge = false;

export function getBridge(): NativeBridge | undefined {
  return (globalThis as typeof globalThis & { BetterXAndroid?: NativeBridge }).BetterXAndroid;
}

export async function requestNative<T>(payload: NativePayload): Promise<T> {
  const bridge = getBridge();
  if (!bridge) {
    throw new Error("BetterXAndroid bridge unavailable");
  }

  if (!hookedNativeBridge) {
    hookedNativeBridge = true;
    bridge.onmessage = (event) => {
      let message: NativeResponse | null = null;
      try {
        message = JSON.parse(event.data) as NativeResponse;
      } catch {
        return;
      }

      if (!message?.id) return;
      const pending = pendingRequests.get(message.id);
      if (!pending) return;
      pendingRequests.delete(message.id);

      if (message.ok) {
        pending.resolve(message.result);
      } else {
        pending.reject(new Error(message.error ?? "Native bridge request failed"));
      }
    };
  }

  const id = `${Date.now().toString(36)}-${++requestSeq}`;
  const request = { id, ...payload };

  return await new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`BetterXAndroid request timed out: ${payload.type}`));
    }, 15_000);

    pendingRequests.set(id, {
      resolve: (value) => {
        window.clearTimeout(timeout);
        resolve(value as T);
      },
      reject: (reason) => {
        window.clearTimeout(timeout);
        reject(reason);
      },
    });

    try {
      bridge.postMessage(JSON.stringify(request));
    } catch (error) {
      pendingRequests.delete(id);
      window.clearTimeout(timeout);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
