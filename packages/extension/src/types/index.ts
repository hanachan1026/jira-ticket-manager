export type TicketStatus = "todo" | "in_progress" | "in_review" | "done";

export interface JiraTicket {
  id: string;
  number: string; // "PROJ-123"
  title: string;
  summary?: string; // ユーザーメモ
  url?: string; // Jira URL
  tags?: string[];
  status?: TicketStatus;
  createdAt: number; // Unix ms
  updatedAt: number;
}

// 最近開いたチケット（自動トラッキング用）
export interface RecentlyViewedTicket {
  number: string; // "PROJ-123"
  title: string;
  url: string;
  viewedAt: number; // Unix ms
}

// WIP（作業中）リスト - 永続的、手動リセットのみ
export interface WipStatus {
  inProgressIds: string[];
}

// 後方互換性のため DailyStatus を WipStatus のエイリアスとして残す
/** @deprecated Use WipStatus instead */
export type DailyStatus = WipStatus & { date?: string };

export interface CopyTemplate {
  id: string;
  name: string;
  pattern: string; // "feat/{number}-{slug}"
  isDefault: boolean;
}

export interface UserSettings {
  storageArea: "local" | "sync" | "file";
  defaultPrefix: string; // feat / fix / chore / refactor
  defaultTemplateId: string;
  jiraBaseUrl?: string;
}

// ファイルストレージ用のデータ構造
export interface FileStorageData {
  version: 1;
  exportedAt: number;
  tickets: JiraTicket[];
  templates: CopyTemplate[];
  settings: Omit<UserSettings, "storageArea">;
  wipStatus: WipStatus;
}

// content script → background で使うメッセージ型
export type ExtensionMessage =
  | { type: "SAVE_TICKET"; payload: Omit<JiraTicket, "id" | "createdAt" | "updatedAt"> }
  | { type: "GET_TICKETS" }
  | { type: "TRACK_TICKET_VIEW"; payload: Omit<RecentlyViewedTicket, "viewedAt"> }
  | { type: "PROCESS_FILE_QUEUE" }; // popup にキュー処理を依頼
