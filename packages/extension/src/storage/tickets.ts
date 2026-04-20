import { storage } from "wxt/utils/storage";
import type { JiraTicket } from "../types";

export const ticketsStorage = storage.defineItem<JiraTicket[]>("sync:tickets", {
  fallback: [],
  version: 1,
});
