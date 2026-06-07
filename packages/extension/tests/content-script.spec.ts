import { test, expect } from "./fixtures";

const JIRA_BASE = "https://test.atlassian.net/browse";

function jiraHtml(ticketId: string, title: string) {
  return [
    "<!DOCTYPE html><html><head>",
    `<title>${ticketId} - Jira</title>`,
    "</head><body>",
    `<h1 data-testid="issue-title">${title}</h1>`,
    "</body></html>",
  ].join("");
}

async function visitJira(page: Awaited<ReturnType<typeof import("@playwright/test").chromium["launch"]>>["newPage"] extends (...args: unknown[]) => infer R ? Awaited<R> : never, ticketId: string) {
  await page.goto(`${JIRA_BASE}/${ticketId}`);
  await page.waitForSelector("jtm-save-badge", { timeout: 5000, state: "attached" });
  await page.waitForTimeout(300);
}

test.describe("content script – auto tracking", () => {
  test.beforeEach(async ({ context }) => {
    await context.route(`${JIRA_BASE}/**`, (route) => {
      const url = new URL(route.request().url());
      const ticketId = url.pathname.split("/").pop() ?? "UNKNOWN";
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: jiraHtml(ticketId, `${ticketId} summary`),
      });
    });

    // content script 登録完了 (background の onInstalled) を待つ
    await new Promise((r) => setTimeout(r, 1000));
  });

  test("Jira ページ訪問で最近見たリストに記録される", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await visitJira(page, "TEST-123");
    await page.waitForTimeout(200);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByTitle("最近見たチケット").click();

    await expect(popup.getByText("TEST-123", { exact: true })).toBeVisible();
    await expect(popup.getByText("TEST-123 summary")).toBeVisible();
  });

  test("同じチケットを再訪問するとリスト先頭に移動する", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();

    for (const ticketId of ["PROJ-100", "PROJ-200", "PROJ-100"]) {
      await visitJira(page, ticketId);
    }

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByTitle("最近見たチケット").click();

    const numbers = popup.locator(".font-mono");
    await expect(numbers.nth(0)).toHaveText("PROJ-100");
    await expect(numbers.nth(1)).toHaveText("PROJ-200");
  });

  test("「クリア」ボタンで履歴が消える", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await visitJira(page, "CLEAR-001");
    await page.waitForTimeout(200);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByTitle("最近見たチケット").click();

    await expect(popup.getByText("CLEAR-001", { exact: true })).toBeVisible();
    await popup.getByText("クリア").click();

    await expect(
      popup.getByText("Jira ページを開くと自動で記録されます")
    ).toBeVisible();
    await expect(popup.getByText("CLEAR-001", { exact: true })).not.toBeVisible();
  });

  test("最大 20 件を超えると古いエントリが押し出される", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();

    // 21 件訪問（LIMIT-01 ～ LIMIT-21）
    for (let i = 1; i <= 21; i++) {
      const id = `LIMIT-${String(i).padStart(2, "0")}`;
      await visitJira(page, id);
    }

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByTitle("最近見たチケット").click();

    const rows = popup.locator(".font-mono");
    await expect(rows).toHaveCount(20);

    // 最初に訪問した LIMIT-01 は消えている
    await expect(popup.getByText("LIMIT-01", { exact: true })).not.toBeVisible();
    // 最後に訪問した LIMIT-21 が先頭
    await expect(rows.nth(0)).toHaveText("LIMIT-21");
  });

  test("Jira 以外の URL は追跡しない", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto("about:blank");
    await page.waitForTimeout(500);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByTitle("最近見たチケット").click();

    await expect(
      popup.getByText("Jira ページを開くと自動で記録されます")
    ).toBeVisible();
  });

  test("クエリパラメータ付きの Jira URL でも記録される", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`${JIRA_BASE}/QPARAM-1?atlOrigin=eyJpIjoiYWJjIn0`);
    await page.waitForSelector("jtm-save-badge", { timeout: 5000, state: "attached" });
    await page.waitForTimeout(500);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByTitle("最近見たチケット").click();

    await expect(popup.getByText("QPARAM-1", { exact: true })).toBeVisible();
  });
});
