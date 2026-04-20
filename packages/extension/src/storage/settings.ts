import { storage } from "wxt/utils/storage";
import type { UserSettings } from "../types";

export const settingsStorage = storage.defineItem<UserSettings>("sync:settings", {
  fallback: {
    storageArea: "sync",
    defaultPrefix: "feat",
    defaultTemplateId: "branch",
  },
  version: 1,
});
