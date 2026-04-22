import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { StorageAdapter } from "./adapters/types";
import type { JiraTicket, CopyTemplate, UserSettings, WipStatus, RecentlyViewedTicket, FileStorageData } from "../types";
import { createChromeAdapter } from "./adapters/chromeAdapter";
import { createFileAdapter, clearFileCache } from "./adapters/fileAdapter";
import { ticketsStorage, templatesStorage, settingsStorage, wipStatusStorage, recentlyViewedStorage, DEFAULT_TEMPLATES } from "./index";
import { fileHandleStore } from "./fileHandleStore";

const DEFAULT_SETTINGS: Omit<UserSettings, "storageArea"> = {
  defaultPrefix: "feat",
  defaultTemplateId: "branch",
};

interface StorageContextValue {
  mode: "chrome" | "file";
  isReady: boolean;
  tickets: StorageAdapter<JiraTicket[]>;
  templates: StorageAdapter<CopyTemplate[]>;
  settings: StorageAdapter<UserSettings>;
  wipStatus: StorageAdapter<WipStatus>;
  recentlyViewed: StorageAdapter<RecentlyViewedTicket[]>;
  enableFileStorage: () => Promise<boolean>;
  disableFileStorage: () => Promise<void>;
  migrateToFile: () => Promise<void>;
  requestFilePermission: () => Promise<boolean>;
  isFileStorageAvailable: boolean;
  needsPermission: boolean;
}

const StorageContext = createContext<StorageContextValue | null>(null);

// Chrome アダプター（静的に作成）
const chromeAdapters = {
  tickets: createChromeAdapter(ticketsStorage),
  templates: createChromeAdapter(templatesStorage),
  settings: createChromeAdapter(settingsStorage),
  wipStatus: createChromeAdapter(wipStatusStorage),
  recentlyViewed: createChromeAdapter(recentlyViewedStorage),
};

// File アダプター（静的に作成）
// recentlyViewed はローカル専用なので chrome アダプターを使用
const fileAdapters = {
  tickets: createFileAdapter("tickets", []),
  templates: createFileAdapter("templates", DEFAULT_TEMPLATES),
  settings: createFileAdapter("settings", DEFAULT_SETTINGS) as StorageAdapter<UserSettings>,
  wipStatus: createFileAdapter("wipStatus", { inProgressIds: [] }),
  recentlyViewed: createChromeAdapter(recentlyViewedStorage), // ローカル専用
};

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"chrome" | "file">("chrome");
  const [isReady, setIsReady] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  // モードに応じたアダプターを返す
  const adapters = useMemo(() => {
    return mode === "file" ? fileAdapters : chromeAdapters;
  }, [mode]);

  // 起動時にストレージモードを確認
  useEffect(() => {
    (async () => {
      const settings = await settingsStorage.getValue();

      if (settings.storageArea === "file") {
        const hasPermission = await fileHandleStore.verifyPermission();
        if (hasPermission) {
          setMode("file");
        } else {
          // 権限がない場合は再要求が必要
          const hasHandle = await fileHandleStore.getHandle();
          if (hasHandle) {
            setNeedsPermission(true);
            setMode("file"); // 一旦ファイルモードで、権限要求を促す
          } else {
            // ハンドルもない場合は Chrome Storage にフォールバック
            await settingsStorage.setValue({ ...settings, storageArea: "sync" });
          }
        }
      }
      setIsReady(true);
    })();
  }, []);

  /**
   * ファイルストレージを有効化（ファイルピッカー表示）
   */
  const enableFileStorage = useCallback(async (): Promise<boolean> => {
    try {
      // ファイルピッカーを表示
      const handle = await window.showSaveFilePicker({
        suggestedName: "jira-tickets.json",
        types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }],
      });

      await fileHandleStore.saveHandle(handle);

      // 初期データでファイルを作成
      const initialData: FileStorageData = {
        version: 1,
        exportedAt: Date.now(),
        tickets: [],
        templates: DEFAULT_TEMPLATES,
        settings: DEFAULT_SETTINGS,
        wipStatus: { inProgressIds: [] },
      };

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(initialData, null, 2));
      await writable.close();

      // 設定を更新
      const currentSettings = await settingsStorage.getValue();
      await settingsStorage.setValue({ ...currentSettings, storageArea: "file" });

      clearFileCache();
      setMode("file");
      setNeedsPermission(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * ファイルストレージを無効化して Chrome Storage に戻る
   */
  const disableFileStorage = useCallback(async (): Promise<void> => {
    await fileHandleStore.clearHandle();
    const currentSettings = await settingsStorage.getValue();
    await settingsStorage.setValue({ ...currentSettings, storageArea: "sync" });
    clearFileCache();
    setMode("chrome");
    setNeedsPermission(false);
  }, []);

  /**
   * 既存の Chrome Storage データをファイルに移行
   */
  const migrateToFile = useCallback(async (): Promise<void> => {
    // ファイルが設定されていなければ先に設定
    const hasHandle = await fileHandleStore.getHandle();
    if (!hasHandle) {
      const success = await enableFileStorage();
      if (!success) return;
    }

    // 現在の Chrome Storage データを取得
    const [tickets, templates, settings, wipStatus] = await Promise.all([
      ticketsStorage.getValue(),
      templatesStorage.getValue(),
      settingsStorage.getValue(),
      wipStatusStorage.getValue(),
    ]);

    // ファイルに書き込み
    const fileData: FileStorageData = {
      version: 1,
      exportedAt: Date.now(),
      tickets,
      templates,
      settings: {
        defaultPrefix: settings.defaultPrefix,
        defaultTemplateId: settings.defaultTemplateId,
        jiraBaseUrl: settings.jiraBaseUrl,
      },
      wipStatus,
    };

    const handle = await fileHandleStore.getHandle();
    if (!handle) throw new Error("No file handle");

    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(fileData, null, 2));
    await writable.close();

    // 設定を更新
    await settingsStorage.setValue({ ...settings, storageArea: "file" });

    clearFileCache();
    setMode("file");
    setNeedsPermission(false);
  }, [enableFileStorage]);

  /**
   * ファイルアクセス権限を要求（ユーザージェスチャー必要）
   */
  const requestFilePermission = useCallback(async (): Promise<boolean> => {
    const granted = await fileHandleStore.requestPermission();
    if (granted) {
      setNeedsPermission(false);
    }
    return granted;
  }, []);

  const contextValue: StorageContextValue = {
    mode,
    isReady,
    ...adapters,
    enableFileStorage,
    disableFileStorage,
    migrateToFile,
    requestFilePermission,
    isFileStorageAvailable: typeof window !== "undefined" && "showSaveFilePicker" in window,
    needsPermission,
  };

  return <StorageContext.Provider value={contextValue}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within StorageProvider");
  return ctx;
}
