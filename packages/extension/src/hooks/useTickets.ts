import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStorage } from "../storage/StorageContext";
import type { JiraTicket } from "../types";

export function useTickets() {
  const { tickets: ticketsAdapter } = useStorage();
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsAdapter.getValue().then((v) => {
      setTickets(v);
      setLoading(false);
    });

    const unwatch = ticketsAdapter.watch((v) => setTickets(v ?? []));
    return unwatch;
  }, [ticketsAdapter]);

  const addTicket = useCallback(
    async (data: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">): Promise<JiraTicket> => {
      const now = Date.now();
      const ticket: JiraTicket = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
      const current = await ticketsAdapter.getValue();
      const updated = [ticket, ...current];
      await ticketsAdapter.setValue(updated);
      return ticket;
    },
    [ticketsAdapter]
  );

  const updateTicket = useCallback(
    async (id: string, data: Partial<Omit<JiraTicket, "id" | "createdAt">>) => {
      const current = await ticketsAdapter.getValue();
      const updated = current.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t
      );
      await ticketsAdapter.setValue(updated);
    },
    [ticketsAdapter]
  );

  const deleteTicket = useCallback(
    async (id: string) => {
      const current = await ticketsAdapter.getValue();
      await ticketsAdapter.setValue(current.filter((t) => t.id !== id));
    },
    [ticketsAdapter]
  );

  return { tickets, loading, addTicket, updateTicket, deleteTicket };
}
