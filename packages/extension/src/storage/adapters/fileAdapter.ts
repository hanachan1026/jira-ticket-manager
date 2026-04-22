import type { StorageAdapter } from "./types";
import type { FileStorageData } from "../../types";
import { fileHandleStore } from "../fileHandleStore";

const BROADCAST_CHANNEL_NAME = "jtm-file-storage";

// In-memory cache of file data
let cachedData: FileStorageData | null = null;

// Mutex for serializing file writes
let writeLock: Promise<void> = Promise.resolve();

/**
 * ファイルからデータを読み込み
 */
async function readFile(): Promise<FileStorageData> {
  const handle = await fileHandleStore.getHandle();
  if (!handle) throw new Error("No file handle available");

  const file = await handle.getFile();
  const text = await file.text();
  cachedData = JSON.parse(text);
  return cachedData!;
}

/**
 * ファイルにデータを書き込み（排他制御あり）
 */
async function writeFile(data: FileStorageData): Promise<void> {
  const handle = await fileHandleStore.getHandle();
  if (!handle) throw new Error("No file handle available");

  // 排他制御: 前の書き込みが完了するまで待機
  const previousLock = writeLock;
  let releaseLock: () => void;
  writeLock = new Promise((resolve) => {
    releaseLock = resolve;
  });

  try {
    await previousLock;
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    cachedData = data;
  } finally {
    releaseLock!();
  }
}

/**
 * File System Access API ベースのストレージアダプターを作成
 * BroadcastChannel で複数タブ間の変更を通知
 */
export function createFileAdapter<K extends keyof Omit<FileStorageData, "version" | "exportedAt">>(
  key: K,
  fallback: FileStorageData[K]
): StorageAdapter<FileStorageData[K]> {
  const listeners = new Set<(v: FileStorageData[K] | undefined) => void>();
  const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

  // 他のタブからの変更を受信
  channel.onmessage = (event) => {
    if (event.data.key === key) {
      listeners.forEach((cb) => cb(event.data.value));
    }
  };

  return {
    async getValue(): Promise<FileStorageData[K]> {
      try {
        const data = cachedData ?? (await readFile());
        return data[key] ?? fallback;
      } catch {
        return fallback;
      }
    },

    async setValue(value: FileStorageData[K]): Promise<void> {
      let data: FileStorageData;
      try {
        data = cachedData ?? (await readFile());
      } catch {
        // ファイルが読めない場合は初期データを使用
        data = {
          version: 1,
          exportedAt: Date.now(),
          tickets: [],
          templates: [],
          settings: { defaultPrefix: "feat", defaultTemplateId: "branch" },
          wipStatus: { inProgressIds: [] },
        };
      }

      const newData = { ...data, [key]: value, exportedAt: Date.now() };
      await writeFile(newData);

      // 他のタブに通知
      channel.postMessage({ key, value });
      // ローカルのリスナーにも通知
      listeners.forEach((cb) => cb(value));
    },

    watch(callback: (v: FileStorageData[K] | undefined) => void): () => void {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
        // 最後のリスナーが解除されたらチャンネルを閉じる
        if (listeners.size === 0) {
          channel.close();
        }
      };
    },
  };
}

/**
 * キャッシュをクリア（ストレージモード切り替え時に使用）
 */
export function clearFileCache(): void {
  cachedData = null;
}
