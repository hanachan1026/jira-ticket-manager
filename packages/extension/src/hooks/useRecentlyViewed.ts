import { useState, useEffect } from "react";
import { useStorage } from "../storage/StorageContext";
import type { RecentlyViewedTicket } from "../types";

export function useRecentlyViewed() {
  const { recentlyViewed: adapter } = useStorage();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adapter.getValue().then((v) => {
      setRecentlyViewed(v);
      setLoading(false);
    });
    const unwatch = adapter.watch((v) => {
      if (v) setRecentlyViewed(v);
    });
    return unwatch;
  }, [adapter]);

  return { recentlyViewed, loading };
}
