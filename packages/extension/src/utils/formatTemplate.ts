import { slugify } from "./slugify";
import type { JiraTicket, CopyTemplate, UserSettings } from "../types";

export interface TemplateTokens {
  number: string;
  title: string;
  slug: string;
  summary: string;
  date: string;
  prefix: string;
}

function buildTokens(ticket: JiraTicket, prefix: string): TemplateTokens {
  return {
    number: ticket.number,
    title: ticket.title,
    slug: slugify(ticket.title),
    summary: ticket.summary ?? "",
    date: new Date().toISOString().slice(0, 10),
    prefix,
  };
}

/**
 * テンプレートのパターン文字列にトークンを埋め込んで返す
 * 例: "feat/{number}-{slug}" → "feat/PROJ-123-fix-login-bug"
 */
export function applyTemplate(
  template: CopyTemplate,
  ticket: JiraTicket,
  settings: Pick<UserSettings, "defaultPrefix">
): string {
  const tokens = buildTokens(ticket, settings.defaultPrefix);
  return template.pattern.replace(
    /\{(\w+)\}/g,
    (_, key) => (tokens as Record<string, string>)[key] ?? `{${key}}`
  );
}

/**
 * 複数チケットをまとめて日報フォーマットで返す
 */
export function buildDailyReport(
  tickets: JiraTicket[],
  lineTemplate: CopyTemplate,
  settings: Pick<UserSettings, "defaultPrefix">
): string {
  return tickets.map((t) => applyTemplate(lineTemplate, t, settings)).join("\n");
}
