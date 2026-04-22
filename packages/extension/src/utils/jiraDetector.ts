/**
 * 現在の URL から Jira チケット番号を取得する
 * 対応パターン:
 *   - /browse/PROJ-123
 *   - /issues/PROJ-123
 *   - /issue/PROJ-123
 *   - /PROJ-123 (パス末尾)
 *   - ?selectedIssue=PROJ-123 (クエリパラメータ)
 */
export function detectTicketNumber(url: string = window.location.href): string | null {
  // チケット番号のパターン: 大文字英字 + ハイフン + 数字
  const ticketPattern = /([A-Z][A-Z0-9]*-\d+)/;

  // 1. /browse/, /issues/, /issue/ パスから検出
  const pathPatterns = [
    /\/browse\/([A-Z][A-Z0-9]*-\d+)/,
    /\/issues\/([A-Z][A-Z0-9]*-\d+)/,
    /\/issue\/([A-Z][A-Z0-9]*-\d+)/,
  ];

  for (const pattern of pathPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // 2. クエリパラメータから検出 (selectedIssue, issueKey など)
  try {
    const urlObj = new URL(url);
    const issueParams = ["selectedIssue", "issueKey", "issue"];
    for (const param of issueParams) {
      const value = urlObj.searchParams.get(param);
      if (value) {
        const match = value.match(ticketPattern);
        if (match) return match[1];
      }
    }
  } catch {
    // URL パース失敗は無視
  }

  // 3. パス末尾からチケット番号を検出 (例: /PROJ-123)
  const pathMatch = url.split("?")[0].match(/\/([A-Z][A-Z0-9]*-\d+)\/?$/);
  if (pathMatch) return pathMatch[1];

  return null;
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
