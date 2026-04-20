import { storage } from "wxt/utils/storage";
import type { CopyTemplate } from "../types";

export const DEFAULT_TEMPLATES: CopyTemplate[] = [
  { id: "branch", name: "Branch name", pattern: "{prefix}/{number}-{slug}", isDefault: true },
  { id: "commit", name: "Commit prefix", pattern: "{number}: ", isDefault: false },
  { id: "number", name: "Ticket number", pattern: "{number}", isDefault: false },
  { id: "full", name: "Full reference", pattern: "[{number}] {title}", isDefault: false },
  { id: "daily", name: "Daily report line", pattern: "- {number}: {title}", isDefault: false },
];

export const templatesStorage = storage.defineItem<CopyTemplate[]>("sync:templates", {
  fallback: DEFAULT_TEMPLATES,
  version: 1,
});
