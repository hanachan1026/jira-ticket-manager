/**
 * IndexedDB で FileSystemFileHandle を永続化
 * ブラウザ再起動後もファイルハンドルを再利用可能にする
 */

const DB_NAME = "jtm-file-storage";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const HANDLE_KEY = "primary";

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const fileHandleStore = {
  /**
   * FileHandle を IndexedDB に保存
   */
  async saveHandle(handle: FileSystemFileHandle): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(handle, HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  /**
   * 保存された FileHandle を取得
   */
  async getHandle(): Promise<FileSystemFileHandle | null> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  },

  /**
   * FileHandle を削除
   */
  async clearHandle(): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  /**
   * 現在の権限状態を確認（ユーザージェスチャー不要）
   */
  async verifyPermission(): Promise<boolean> {
    const handle = await this.getHandle();
    if (!handle) return false;

    const options = { mode: "readwrite" as const };
    try {
      const permission = await handle.queryPermission(options);
      return permission === "granted";
    } catch {
      return false;
    }
  },

  /**
   * 権限を要求（ユーザージェスチャーが必要）
   */
  async requestPermission(): Promise<boolean> {
    const handle = await this.getHandle();
    if (!handle) return false;

    const options = { mode: "readwrite" as const };
    try {
      const permission = await handle.requestPermission(options);
      return permission === "granted";
    } catch {
      return false;
    }
  },
};
