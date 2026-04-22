import { useState, useEffect, useCallback } from "react";
import { useStorage } from "../storage/StorageContext";
import type { WipStatus } from "../types";

export function useWipStatus() {
  const { wipStatus: wipStatusAdapter } = useStorage();
  const [wipStatus, setWipStatus] = useState<WipStatus>({
    inProgressIds: [],
  });

  useEffect(() => {
    wipStatusAdapter.getValue().then(setWipStatus);
    const unwatch = wipStatusAdapter.watch((v) => {
      if (v) setWipStatus(v);
    });
    return unwatch;
  }, [wipStatusAdapter]);

  const toggleInProgress = useCallback(
    async (ticketId: string) => {
      const current = await wipStatusAdapter.getValue();
      const ids = current.inProgressIds.includes(ticketId)
        ? current.inProgressIds.filter((id) => id !== ticketId)
        : [...current.inProgressIds, ticketId];
      const next: WipStatus = { inProgressIds: ids };
      await wipStatusAdapter.setValue(next);
    },
    [wipStatusAdapter]
  );

  const isInProgress = useCallback(
    (ticketId: string) => wipStatus.inProgressIds.includes(ticketId),
    [wipStatus]
  );

  const clearAll = useCallback(async () => {
    await wipStatusAdapter.setValue({ inProgressIds: [] });
  }, [wipStatusAdapter]);

  return { wipStatus, toggleInProgress, isInProgress, clearAll };
}
