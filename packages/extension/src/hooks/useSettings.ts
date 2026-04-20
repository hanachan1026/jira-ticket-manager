import { useState, useEffect, useCallback } from "react";
import { settingsStorage } from "../storage";
import type { UserSettings } from "../types";

export function useSettings() {
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
    const next = { ...settings, ...data };
    await settingsStorage.setValue(next);
  }, [settings]);

  return { settings, updateSettings };
}
