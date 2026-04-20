import { storage } from "wxt/utils/storage";
import type { DailyStatus } from "../types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const dailyStatusStorage = storage.defineItem<DailyStatus>("local:dailyStatus", {
  fallback: { date: todayStr(), inProgressIds: [] },
  version: 1,
});
