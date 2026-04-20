/**
 * 現在の URL から Jira チケット番号を取得する
 * /browse/PROJ-123 や /browse/PROJ-123?... の形式に対応
 */
export function detectTicketNumber(url: string = window.location.href): string | null {
  const match = url.match(/\/browse\/([A-Z]+-\d+)/);
  return match?.[1] ?? null;
}

/**
 * Jira ページからチケットタイトルを取得する
 * Jira Cloud の DOM に依存するため fallback あり
 */
export function detectTicketTitle(): string | null {
  // Jira Cloud (2023~): data-testid を使用
  const h1 = document.querySelector<HTMLElement>('h1[data-testid="issue-title"]');
  if (h1?.textContent?.trim()) return h1.textContent.trim();

  // 旧 Jira Cloud: summary フィールド
  const summary = document.querySelector<HTMLElement>("#summary-val, .issue-summary");
  if (summary?.textContent?.trim()) return summary.textContent.trim();

  // Fallback: document.title から " - Jira" などを除去
  const title = document.title.split(" - ")[0].trim();
  return title || null;
}
