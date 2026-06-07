// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from "vitest";
import { detectTicketNumber, detectTicketTitle } from "./jiraDetector";

describe("detectTicketNumber", () => {
  describe("path-based patterns", () => {
    test.each([
      ["https://team.atlassian.net/browse/PROJ-123", "PROJ-123"],
      ["https://team.atlassian.net/browse/AB-1", "AB-1"],
      ["https://team.atlassian.net/browse/ABC123-456", "ABC123-456"],
      ["https://team.atlassian.net/issues/PROJ-123", "PROJ-123"],
      ["https://team.atlassian.net/issue/PROJ-123", "PROJ-123"],
      ["https://custom.example.com/browse/FEAT-99", "FEAT-99"],
    ])("detects from URL %s", (url, expected) => {
      expect(detectTicketNumber(url)).toBe(expected);
    });
  });

  describe("query parameter patterns", () => {
    test.each([
      ["https://jira.example.com/board?selectedIssue=PROJ-123", "PROJ-123"],
      ["https://jira.example.com/board?issueKey=FEAT-42", "FEAT-42"],
      ["https://jira.example.com/board?issue=BUG-7", "BUG-7"],
    ])("detects from query param in %s", (url, expected) => {
      expect(detectTicketNumber(url)).toBe(expected);
    });
  });

  describe("path-end fallback", () => {
    test.each([
      ["https://example.com/PROJ-123", "PROJ-123"],
      ["https://example.com/path/FEAT-99/", "FEAT-99"],
    ])("detects from path end in %s", (url, expected) => {
      expect(detectTicketNumber(url)).toBe(expected);
    });
  });

  describe("non-matching URLs", () => {
    test.each([
      ["https://example.com/dashboard"],
      ["https://atlassian.net/wiki/spaces/DEV"],
      ["https://example.com/?foo=bar"],
      ["not-a-url"],
    ])("returns null for %s", (url) => {
      expect(detectTicketNumber(url)).toBeNull();
    });
  });
});

describe("detectTicketTitle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(document, "title", { value: "", writable: true, configurable: true });
  });

  test("reads from h1[data-testid='issue-title']", () => {
    document.body.innerHTML = `<h1 data-testid="issue-title">Fix login bug</h1>`;
    expect(detectTicketTitle()).toBe("Fix login bug");
  });

  test("falls back to #summary-val", () => {
    document.body.innerHTML = `<div id="summary-val">Old Jira title</div>`;
    expect(detectTicketTitle()).toBe("Old Jira title");
  });

  test("falls back to .issue-summary", () => {
    document.body.innerHTML = `<span class="issue-summary">Summary text</span>`;
    expect(detectTicketTitle()).toBe("Summary text");
  });

  test("falls back to document.title stripping ' - Jira'", () => {
    Object.defineProperty(document, "title", { value: "PROJ-123 - Jira", writable: true, configurable: true });
    document.body.innerHTML = "";
    expect(detectTicketTitle()).toBe("PROJ-123");
  });

  test("returns null for empty DOM and empty title", () => {
    document.body.innerHTML = "";
    expect(detectTicketTitle()).toBeNull();
  });
});
