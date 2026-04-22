import { defineBackground } from "wxt/utils/define-background";
import { v4 as uuidv4 } from "uuid";
import { ticketsStorage, settingsStorage, recentlyViewedStorage, RECENTLY_VIEWED_LIMIT } from "../storage";
import type { ExtensionMessage, JiraTicket, RecentlyViewedTicket } from "../types";

const CONTENT_SCRIPT_ID = "jira-content-script";
const DEFAULT_JIRA_PATTERN = "*://*.atlassian.net/browse/*";

/**
 * jiraBaseUrl から match pattern を生成
 * 例: "https://myjira.example.com" → "*://myjira.example.com/*"
 * 例: "https://myjira.example.com/jira" → "*://myjira.example.com/jira/*"
 */
function buildMatchPattern(jiraBaseUrl: string | undefined): string[] {
  if (!jiraBaseUrl) {
    return [DEFAULT_JIRA_PATTERN];
  }

  try {
    const url = new URL(jiraBaseUrl);
    // プロトコルを * に、パス以下すべてにマッチ
    const basePath = url.pathname.replace(/\/+$/, ""); // 末尾スラッシュ除去
    const pattern = `*://${url.host}${basePath}/*`;
    return [pattern];
  } catch {
    // 無効な URL の場合はデフォルトにフォールバック
    return [DEFAULT_JIRA_PATTERN];
  }
}

/**
 * Content script を動的に登録/更新
 */
async function registerContentScript(jiraBaseUrl: string | undefined): Promise<void> {
  const matches = buildMatchPattern(jiraBaseUrl);

  // 既存の登録を解除
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  } catch {
    // 未登録の場合は無視
  }

  // 新しいパターンで登録
  await chrome.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_ID,
      matches,
      js: ["content-scripts/jira.js"],
      runAt: "document_idle",
    },
  ]);

  console.log(`[JiraTicketManager] Content script registered for: ${matches.join(", ")}`);
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
        handleGetTickets().then(sendResponse);
        return true;
      }
      if (msg.type === "TRACK_TICKET_VIEW") {
        handleTrackTicketView(msg.payload).then(sendResponse);
        return true;
      }
    }
  );

  // ── インストール/更新時の初期化 ─────────────────────────────────────────────
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    console.log(`[JiraTicketManager] Extension ${reason}.`);
    // Content script を初期登録
    const settings = await settingsStorage.getValue();
    await registerContentScript(settings.jiraBaseUrl);
  });

  // ── 設定変更時に Content script を再登録 ────────────────────────────────────
  settingsStorage.watch((newSettings) => {
    if (newSettings) {
      registerContentScript(newSettings.jiraBaseUrl);
    }
  });
});

async function handleSaveTicket(
  payload: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; ticket: JiraTicket }> {
  const settings = await settingsStorage.getValue();
  const now = Date.now();
  const ticket: JiraTicket = {
    ...payload,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  // ファイルモードの場合はキューに保存して popup に処理を委譲
  if (settings.storageArea === "file") {
    return handleSaveTicketToQueue(ticket);
  }

  // Chrome Storage モード
  const current = await ticketsStorage.getValue();
  // 同じチケット番号が既に存在する場合はスキップ
  if (current.some((t) => t.number === ticket.number)) {
    return { success: false, ticket: current.find((t) => t.number === ticket.number)! };
  }
  await ticketsStorage.setValue([ticket, ...current]);
  return { success: true, ticket };
}

/**
 * ファイルモード時: キューに保存して popup に処理を依頼
 */
async function handleSaveTicketToQueue(
  ticket: JiraTicket
): Promise<{ success: boolean; ticket: JiraTicket }> {
  // chrome.storage.local のキューに追加
  const result = await chrome.storage.local.get("pendingFileSaves");
  const pendingFileSaves: JiraTicket[] = (result.pendingFileSaves as JiraTicket[]) ?? [];
  pendingFileSaves.push(ticket);
  await chrome.storage.local.set({ pendingFileSaves });

  // popup が開いていれば通知（失敗しても問題ない）
  try {
    await chrome.runtime.sendMessage({ type: "PROCESS_FILE_QUEUE" });
  } catch {
    // popup が開いていない場合は無視
  }

  return { success: true, ticket };
}

/**
 * チケット取得（ファイルモード時はキャッシュを返す）
 */
async function handleGetTickets(): Promise<JiraTicket[]> {
  const settings = await settingsStorage.getValue();

  if (settings.storageArea === "file") {
    // ファイルモード時は popup がファイルから読み込んでキャッシュを保持
    // ここでは chrome.storage.local のキャッシュを返す
    const result = await chrome.storage.local.get("cachedTickets");
    return (result.cachedTickets as JiraTicket[]) ?? [];
  }

  return ticketsStorage.getValue();
}

/**
 * チケットページ訪問を記録（最近開いたリスト）
 */
async function handleTrackTicketView(
  payload: Omit<RecentlyViewedTicket, "viewedAt">
): Promise<{ success: boolean }> {
  const current = await recentlyViewedStorage.getValue();
  const now = Date.now();

  // 同じチケットが既にある場合は削除（再追加で先頭に移動）
  const filtered = current.filter((t) => t.number !== payload.number);

  // 新しいエントリを先頭に追加
  const newEntry: RecentlyViewedTicket = {
    ...payload,
    viewedAt: now,
  };

  // 最大件数に制限
  const updated = [newEntry, ...filtered].slice(0, RECENTLY_VIEWED_LIMIT);

  await recentlyViewedStorage.setValue(updated);
  return { success: true };
}
