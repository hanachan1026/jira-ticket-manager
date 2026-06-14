import type { RecentlyViewedTicket } from "../types";

export const RECENTLY_VIEWED_LIMIT = 20;

export function updateRecentlyViewed(
  current: RecentlyViewedTicket[],
  payload: Omit<RecentlyViewedTicket, "viewedAt">,
  now: number
): RecentlyViewedTicket[] {
  const filtered = current.filter((t) => t.number !== payload.number);
  return [{ ...payload, viewedAt: now }, ...filtered].slice(0, RECENTLY_VIEWED_LIMIT);
}
