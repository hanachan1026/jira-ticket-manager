import { defineBackground } from "wxt/utils/define-background";
import { v4 as uuidv4 } from "uuid";
import { ticketsStorage, settingsStorage, recentlyViewedStorage } from "../storage";
import { buildNewTicket, addTicketIfNew } from "../domain/tickets";
import { updateRecentlyViewed } from "../domain/recentlyViewed";
import { buildMatchPatterns } from "../domain/contentScript";
import type { ExtensionMessage, JiraTicket, RecentlyViewedTicket } from "../types";

const CONTENT_SCRIPT_ID = "jira-content-script";

async function registerContentScript(jiraBaseUrl: string | undefined): Promise<void> {
  const matches = buildMatchPatterns(jiraBaseUrl);
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  } catch {
    // not registered yet
  }
  try {
    await chrome.scripting.registerContentScripts([
      { id: CONTENT_SCRIPT_ID, matches, js: ["content-scripts/jira.js"], runAt: "document_idle" },
    ]);
    console.log(`[JiraTicketManager] Content script registered for: ${matches.join(", ")}`);
  } catch (err) {
    console.error("[JiraTicketManager] Failed to register content script:", err);
  }
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (msg: ExtensionMessage, sender, sendResponse: (response: unknown) => void) => {
      // Only accept messages from this extension's own pages and content scripts
      if (sender.id !== chrome.runtime.id) return;
      if (msg.type === "SAVE_TICKET") {
        handleSaveTicket(msg.payload).then(sendResponse);
        return true;
      }
      if (msg.type === "GET_TICKETS") {
        handleGetTickets().then(sendResponse);
        return true;
      }
      if (msg.type === "TRACK_TICKET_VIEW") {
        handleTrackTicketView(msg.payload).then(sendResponse);
        return true;
      }
      if (msg.type === "RE_REGISTER_CONTENT_SCRIPT") {
        settingsStorage.getValue().then((settings) => registerContentScript(settings.jiraBaseUrl)).then(() => sendResponse({ success: true }));
        return true;
      }
    }
  );

  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    console.log(`[JiraTicketManager] Extension ${reason}.`);
    const settings = await settingsStorage.getValue();
    await registerContentScript(settings.jiraBaseUrl);
  });

  settingsStorage.watch((newSettings) => {
    if (newSettings) registerContentScript(newSettings.jiraBaseUrl);
  });
});

async function handleSaveTicket(
  payload: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; ticket: JiraTicket }> {
  const settings = await settingsStorage.getValue();
  const ticket = buildNewTicket(payload, uuidv4(), Date.now());

  if (settings.storageArea === "file") {
    return handleSaveTicketToQueue(ticket);
  }

  const current = await ticketsStorage.getValue();
  const result = addTicketIfNew(current, ticket);
  if (!result.added) return { success: false, ticket: result.existing };
  await ticketsStorage.setValue(result.tickets);
  return { success: true, ticket };
}

async function handleSaveTicketToQueue(
  ticket: JiraTicket
): Promise<{ success: boolean; ticket: JiraTicket }> {
  const result = await chrome.storage.local.get("pendingFileSaves");
  const pendingFileSaves: JiraTicket[] = (result.pendingFileSaves as JiraTicket[]) ?? [];
  pendingFileSaves.push(ticket);
  await chrome.storage.local.set({ pendingFileSaves });
  try {
    await chrome.runtime.sendMessage({ type: "PROCESS_FILE_QUEUE" });
  } catch {
    // popup not open
  }
  return { success: true, ticket };
}

async function handleGetTickets(): Promise<JiraTicket[]> {
  const settings = await settingsStorage.getValue();
  if (settings.storageArea === "file") {
    const result = await chrome.storage.local.get("cachedTickets");
    return (result.cachedTickets as JiraTicket[]) ?? [];
  }
  return ticketsStorage.getValue();
}

async function handleTrackTicketView(
  payload: Omit<RecentlyViewedTicket, "viewedAt">
): Promise<{ success: boolean }> {
  const current = await recentlyViewedStorage.getValue();
  const updated = updateRecentlyViewed(current, payload, Date.now());
  await recentlyViewedStorage.setValue(updated);
  return { success: true };
}
