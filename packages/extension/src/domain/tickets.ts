import type { JiraTicket } from "../types";

export function buildNewTicket(
  payload: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">,
  id: string,
  now: number
): JiraTicket {
  return { ...payload, id, createdAt: now, updatedAt: now };
}

export type AddTicketResult =
  | { added: true; tickets: JiraTicket[] }
  | { added: false; existing: JiraTicket };

export function addTicketIfNew(current: JiraTicket[], ticket: JiraTicket): AddTicketResult {
  const existing = current.find((t) => t.number === ticket.number);
  if (existing) return { added: false, existing };
  return { added: true, tickets: [ticket, ...current] };
}
