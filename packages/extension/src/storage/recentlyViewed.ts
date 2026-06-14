import { storage } from "wxt/utils/storage";
import type { RecentlyViewedTicket } from "../types";

export const recentlyViewedStorage = storage.defineItem<RecentlyViewedTicket[]>(
  "local:recentlyViewed",
  {
    fallback: [],
    version: 1,
  }
);
