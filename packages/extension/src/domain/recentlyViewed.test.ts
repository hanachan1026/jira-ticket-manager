import { describe, test, expect } from "vitest";
import { updateRecentlyViewed, RECENTLY_VIEWED_LIMIT } from "./recentlyViewed";
import type { RecentlyViewedTicket } from "../types";

const NOW = 1_000_000;

function entry(number: string, viewedAt = 0): RecentlyViewedTicket {
  return { number, title: `Title ${number}`, url: `https://jira.example.com/browse/${number}`, viewedAt };
}

const payload = (number: string) => ({
  number,
  title: `Title ${number}`,
  url: `https://jira.example.com/browse/${number}`,
});

describe("updateRecentlyViewed", () => {
  test.each([
    {
      label: "empty list → single entry at head",
      current: [],
      payload: payload("PROJ-1"),
      expected: [{ ...payload("PROJ-1"), viewedAt: NOW }],
    },
    {
      label: "new ticket prepended, others shifted",
      current: [entry("PROJ-1", 500)],
      payload: payload("PROJ-2"),
      expected: [{ ...payload("PROJ-2"), viewedAt: NOW }, entry("PROJ-1", 500)],
    },
    {
      label: "re-visit moves existing entry to head",
      current: [entry("PROJ-1", 500), entry("PROJ-2", 300)],
      payload: payload("PROJ-2"),
      expected: [{ ...payload("PROJ-2"), viewedAt: NOW }, entry("PROJ-1", 500)],
    },
    {
      label: "re-visit updates title and url",
      current: [{ number: "PROJ-1", title: "Old Title", url: "https://old.url", viewedAt: 500 }],
      payload: { number: "PROJ-1", title: "New Title", url: "https://new.url" },
      expected: [{ number: "PROJ-1", title: "New Title", url: "https://new.url", viewedAt: NOW }],
    },
  ])("$label", ({ current, payload: p, expected }) => {
    expect(updateRecentlyViewed(current, p, NOW)).toEqual(expected);
  });

  test(`trims list to ${RECENTLY_VIEWED_LIMIT} entries`, () => {
    const current = Array.from({ length: RECENTLY_VIEWED_LIMIT }, (_, i) => entry(`PROJ-${i}`));
    const result = updateRecentlyViewed(current, payload("NEW-1"), NOW);
    expect(result).toHaveLength(RECENTLY_VIEWED_LIMIT);
    expect(result[0].number).toBe("NEW-1");
  });

  test("does not mutate the input array", () => {
    const current = [entry("PROJ-1")];
    updateRecentlyViewed(current, payload("PROJ-2"), NOW);
    expect(current).toHaveLength(1);
  });
});
