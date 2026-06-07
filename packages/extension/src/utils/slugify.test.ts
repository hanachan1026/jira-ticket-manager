import { describe, test, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  test.each([
    ["Fix Login Bug!", "fix-login-bug"],
    ["  leading and trailing  ", "leading-and-trailing"],
    ["multiple   spaces", "multiple-spaces"],
    ["already-hyphenated", "already-hyphenated"],
    ["連続ハイフン---test", "-test"],
    ["Café résumé", "cafe-resume"],
    ["UPPERCASE TITLE", "uppercase-title"],
    ["special!@#chars", "special-chars"],
    ["trailing-", "trailing"],
    ["a".repeat(60), "a".repeat(50)],
  ])('slugify(%j) → %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  test("respects custom maxLength", () => {
    expect(slugify("fix login bug", 5)).toBe("fix-l");
  });

  test("does not end with a hyphen after truncation", () => {
    // "fix-" truncated at 4 chars → trailing hyphen removed
    const result = slugify("fix login", 4);
    expect(result).not.toMatch(/-$/);
  });
});
