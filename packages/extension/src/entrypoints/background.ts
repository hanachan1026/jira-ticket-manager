import { defineBackground } from "wxt/utils/define-background";
import { v4 as uuidv4 } from "uuid";
import { ticketsStorage, dailyStatusStorage } from "../storage";
import type { ExtensionMessage, JiraTicket, DailyStatus } from "../types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextMidnightMs(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default defineBackground(() => {
  // ── メッセージハンドラ (content script → background) ──────────────────────
  chrome.runtime.onMessage.addListener(
    (msg: ExtensionMessage, _sender, sendResponse: (response: unknown) => void) => {
      if (msg.type === "SAVE_TICKET") {
        handleSaveTicket(msg.payload).then(sendResponse);
        return true; // async response
      }
      if (msg.type === "GET_TICKETS") {
        ticketsStorage.getValue().then(sendResponse);
        return true;
      }
    }
  );

  // ── 深夜0時リセット alarm ──────────────────────────────────────────────────
  chrome.alarms.create("dailyReset", {
    when: nextMidnightMs(),
    periodInMinutes: 24 * 60,
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "dailyReset") {
      await resetDailyStatus();
    }
  });

  // ── インストール時の初期化 ─────────────────────────────────────────────────
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === "install") {
      // 既存データがなければ初期化済み (storage.defineItem の fallback に任せる)
      console.log("[JiraTicketManager] Extension installed.");
    }
  });
});

async function handleSaveTicket(
  payload: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; ticket: JiraTicket }> {
  const now = Date.now();
  const ticket: JiraTicket = {
    ...payload,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  const current = await ticketsStorage.getValue();
  // 同じチケット番号が既に存在する場合はスキップ
  if (current.some((t) => t.number === ticket.number)) {
    return { success: false, ticket: current.find((t) => t.number === ticket.number)! };
  }
  await ticketsStorage.setValue([ticket, ...current]);
  return { success: true, ticket };
}

async function resetDailyStatus(): Promise<void> {
  const reset: DailyStatus = { date: todayStr(), inProgressIds: [] };
  await dailyStatusStorage.setValue(reset);
  console.log("[JiraTicketManager] Daily status reset.");
}
