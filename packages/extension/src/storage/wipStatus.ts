import { storage } from "wxt/utils/storage";
import type { WipStatus } from "../types";

export const wipStatusStorage = storage.defineItem<WipStatus>("local:wipStatus", {
  fallback: { inProgressIds: [] },
  version: 1,
});
