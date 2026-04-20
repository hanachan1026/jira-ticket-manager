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

export interface DailyStatus {
  date: string; // "2026-04-17"
  inProgressIds: string[];
}

export interface CopyTemplate {
  id: string;
  name: string;
  pattern: string; // "feat/{number}-{slug}"
  isDefault: boolean;
}

export interface UserSettings {
  storageArea: "local" | "sync";
  defaultPrefix: string; // feat / fix / chore / refactor
  defaultTemplateId: string;
  jiraBaseUrl?: string;
}

// content script → background で使うメッセージ型
export type ExtensionMessage =
  | { type: "SAVE_TICKET"; payload: Omit<JiraTicket, "id" | "createdAt" | "updatedAt"> }
  | { type: "GET_TICKETS" }
  | { type: "DAILY_RESET" };
