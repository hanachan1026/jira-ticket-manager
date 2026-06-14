const DEFAULT_PATTERNS = [
  "*://*.atlassian.net/browse/*",
  "*://*.atlassian.net/issues/*",
  "*://*.atlassian.net/jira/*",
];

export function buildMatchPatterns(jiraBaseUrl?: string): string[] {
  if (!jiraBaseUrl) return DEFAULT_PATTERNS;
  try {
    const url = new URL(jiraBaseUrl);
    const basePath = url.pathname.replace(/\/+$/, "");
    return [`*://${url.host}${basePath}/*`];
  } catch {
    return DEFAULT_PATTERNS;
  }
}
