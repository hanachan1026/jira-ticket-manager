import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ticketsStorage } from "../storage";
import type { JiraTicket } from "../types";

export function useTickets() {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsStorage.getValue().then((v) => {
      setTickets(v);
      setLoading(false);
    });

    const unwatch = ticketsStorage.watch((v) => setTickets(v ?? []));
    return unwatch;
  }, []);

  const addTicket = useCallback(
    async (data: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">): Promise<JiraTicket> => {
      const now = Date.now();
      const ticket: JiraTicket = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
      const updated = [ticket, ...tickets];
      await ticketsStorage.setValue(updated);
      return ticket;
    },
    [tickets]
  );

  const updateTicket = useCallback(
    async (id: string, data: Partial<Omit<JiraTicket, "id" | "createdAt">>) => {
      const updated = tickets.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t
      );
      await ticketsStorage.setValue(updated);
    },
    [tickets]
  );

  const deleteTicket = useCallback(
    async (id: string) => {
      await ticketsStorage.setValue(tickets.filter((t) => t.id !== id));
    },
    [tickets]
  );

  return { tickets, loading, addTicket, updateTicket, deleteTicket };
}
