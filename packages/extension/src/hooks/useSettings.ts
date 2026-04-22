import { useState, useEffect, useCallback } from "react";
import { settingsStorage } from "../storage";
import { useStorage } from "../storage/StorageContext";
import type { UserSettings } from "../types";

export function useSettings() {
  const {
    mode,
    enableFileStorage,
    disableFileStorage,
    migrateToFile,
    requestFilePermission,
    isFileStorageAvailable,
    needsPermission,
  } = useStorage();

  const [settings, setSettings] = useState<UserSettings>({
    storageArea: "sync",
    defaultPrefix: "feat",
    defaultTemplateId: "branch",
  });

  useEffect(() => {
    settingsStorage.getValue().then(setSettings);
    const unwatch = settingsStorage.watch((v) => {
      if (v) setSettings(v);
    });
    return unwatch;
  }, []);

  const updateSettings = useCallback(async (data: Partial<UserSettings>) => {
    const current = await settingsStorage.getValue();
    const next = { ...current, ...data };
    await settingsStorage.setValue(next);
  }, []);

  return {
    settings,
    updateSettings,
    // ファイルストレージ関連
    storageMode: mode,
    enableFileStorage,
    disableFileStorage,
    migrateToFile,
    requestFilePermission,
    isFileStorageAvailable,
    needsPermission,
  };
}
