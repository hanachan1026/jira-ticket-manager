import { useState, useEffect, useCallback } from "react";
import { dailyStatusStorage } from "../storage";
import type { DailyStatus } from "../types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyStatus() {
  const [dailyStatus, setDailyStatus] = useState<DailyStatus>({
    date: todayStr(),
    inProgressIds: [],
  });

  useEffect(() => {
    dailyStatusStorage.getValue().then((v) => {
      const today = todayStr();
      // 日付が変わっていたらリセット
      if (v.date !== today) {
        const reset: DailyStatus = { date: today, inProgressIds: [] };
        dailyStatusStorage.setValue(reset);
        setDailyStatus(reset);
      } else {
        setDailyStatus(v);
      }
    });
    const unwatch = dailyStatusStorage.watch((v) => {
      if (v) setDailyStatus(v);
    });
    return unwatch;
  }, []);

  const toggleInProgress = useCallback(
    async (ticketId: string) => {
      const ids = dailyStatus.inProgressIds.includes(ticketId)
        ? dailyStatus.inProgressIds.filter((id) => id !== ticketId)
        : [...dailyStatus.inProgressIds, ticketId];
      const next: DailyStatus = { ...dailyStatus, inProgressIds: ids };
      await dailyStatusStorage.setValue(next);
    },
    [dailyStatus]
  );

  const isInProgress = useCallback(
    (ticketId: string) => dailyStatus.inProgressIds.includes(ticketId),
    [dailyStatus]
  );

  return { dailyStatus, toggleInProgress, isInProgress };
}
