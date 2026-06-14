import { describe, test, expect } from "vitest";
import { buildNewTicket, addTicketIfNew } from "./tickets";
import type { JiraTicket } from "../types";

const NOW = 1_000_000;
const ID = "uuid-fixed";

const basePayload: Omit<JiraTicket, "id" | "createdAt" | "updatedAt"> = {
  number: "PROJ-1",
  title: "Fix login bug",
  url: "https://jira.example.com/browse/PROJ-1",
};

function ticket(overrides: Partial<JiraTicket> = {}): JiraTicket {
  return { id: "id-1", number: "PROJ-1", title: "Fix login bug", createdAt: 0, updatedAt: 0, ...overrides };
}

describe("buildNewTicket", () => {
  test("stamps id, createdAt, updatedAt from arguments", () => {
    expect(buildNewTicket(basePayload, ID, NOW)).toEqual({
      ...basePayload,
      id: ID,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  test("preserves optional fields from payload", () => {
    const withExtras = { ...basePayload, summary: "memo", tags: ["auth"] };
    const result = buildNewTicket(withExtras, ID, NOW);
    expect(result.summary).toBe("memo");
    expect(result.tags).toEqual(["auth"]);
  });
});

describe("addTicketIfNew", () => {
  test.each([
    {
      label: "adds to empty list",
      current: [],
      incoming: ticket({ id: "id-1", number: "PROJ-1" }),
      expected: { added: true, tickets: [ticket({ id: "id-1", number: "PROJ-1" })] },
    },
    {
      label: "prepends before existing tickets",
      current: [ticket({ id: "id-2", number: "PROJ-2" })],
      incoming: ticket({ id: "id-1", number: "PROJ-1" }),
      expected: {
        added: true,
        tickets: [
          ticket({ id: "id-1", number: "PROJ-1" }),
          ticket({ id: "id-2", number: "PROJ-2" }),
        ],
      },
    },
    {
      label: "rejects duplicate by ticket number",
      current: [ticket({ id: "id-1", number: "PROJ-1" })],
      incoming: ticket({ id: "id-new", number: "PROJ-1" }),
      expected: { added: false, existing: ticket({ id: "id-1", number: "PROJ-1" }) },
    },
  ])("$label", ({ current, incoming, expected }) => {
    expect(addTicketIfNew(current, incoming)).toEqual(expected);
  });

  test("does not mutate the input array", () => {
    const current = [ticket()];
    addTicketIfNew(current, ticket({ id: "id-2", number: "PROJ-2" }));
    expect(current).toHaveLength(1);
  });
});
