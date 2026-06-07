import { describe, test, expect, vi, beforeEach } from "vitest";
import { applyTemplate, buildDailyReport } from "./formatTemplate";
import type { JiraTicket, CopyTemplate, UserSettings } from "../types";

const baseTicket: JiraTicket = {
  id: "uuid-1",
  number: "PROJ-123",
  title: "Fix Login Bug",
  summary: "Authentication fails on mobile",
  url: "https://team.atlassian.net/browse/PROJ-123",
  status: "todo",
  createdAt: 0,
  updatedAt: 0,
};

const baseSettings: Pick<UserSettings, "defaultPrefix"> = { defaultPrefix: "feat" };

function tmpl(pattern: string): CopyTemplate {
  return { id: "t1", name: "test", pattern };
}

describe("applyTemplate – token substitution", () => {
  const FIXED_DATE = "2026-06-07";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_DATE));
  });

  test.each([
    ["{number}", "PROJ-123"],
    ["{title}", "Fix Login Bug"],
    ["{slug}", "fix-login-bug"],
    ["{summary}", "Authentication fails on mobile"],
    ["{date}", FIXED_DATE],
    ["{prefix}", "feat"],
    ["feat/{number}-{slug}", "feat/PROJ-123-fix-login-bug"],
    ["[{number}] {title}", "[PROJ-123] Fix Login Bug"],
    ["{unknown}", "{unknown}"],
  ])("pattern %j → %j", (pattern, expected) => {
    expect(applyTemplate(tmpl(pattern), baseTicket, baseSettings)).toBe(expected);
  });

  test("summary is empty string when ticket has no summary", () => {
    const ticket = { ...baseTicket, summary: undefined };
    expect(applyTemplate(tmpl("{summary}"), ticket, baseSettings)).toBe("");
  });
});

describe("buildDailyReport", () => {
  test("joins multiple tickets with newline", () => {
    const tickets = [
      { ...baseTicket, id: "1", number: "PROJ-1", title: "First" },
      { ...baseTicket, id: "2", number: "PROJ-2", title: "Second" },
    ];
    const result = buildDailyReport(tickets, tmpl("{number}: {title}"), baseSettings);
    expect(result).toBe("PROJ-1: First\nPROJ-2: Second");
  });

  test("returns empty string for empty ticket list", () => {
    expect(buildDailyReport([], tmpl("{number}"), baseSettings)).toBe("");
  });
});
