import { describe, test, expect } from "vitest";
import { buildMatchPatterns } from "./contentScript";

const DEFAULT = [
  "*://*.atlassian.net/browse/*",
  "*://*.atlassian.net/issues/*",
  "*://*.atlassian.net/jira/*",
];

describe("buildMatchPatterns", () => {
  test.each([
    { label: "undefined → defaults", input: undefined, expected: DEFAULT },
    { label: "empty string → defaults", input: "", expected: DEFAULT },
    { label: "invalid URL → defaults", input: "not-a-url", expected: DEFAULT },
    {
      label: "root URL → wildcard path",
      input: "https://myteam.atlassian.net",
      expected: ["*://myteam.atlassian.net/*"],
    },
    {
      label: "URL with subpath → scoped wildcard",
      input: "https://myteam.atlassian.net/jira",
      expected: ["*://myteam.atlassian.net/jira/*"],
    },
    {
      label: "trailing slash stripped",
      input: "https://myteam.atlassian.net/jira/",
      expected: ["*://myteam.atlassian.net/jira/*"],
    },
    {
      label: "custom domain",
      input: "https://jira.mycompany.com",
      expected: ["*://jira.mycompany.com/*"],
    },
  ])("$label", ({ input, expected }) => {
    expect(buildMatchPatterns(input)).toEqual(expected);
  });
});
