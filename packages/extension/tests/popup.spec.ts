import { test, expect } from "./fixtures";

const popupUrl = (extensionId: string) =>
  `chrome-extension://${extensionId}/popup.html`;

async function openPopup(context: Parameters<typeof test>[1] extends { context: infer C } ? C : never, extensionId: string) {
  const page = await context.newPage();
  await page.goto(popupUrl(extensionId));
  return page;
}

async function addTicket(
  page: Awaited<ReturnType<typeof openPopup>>,
  number: string,
  title: string
) {
  await page.getByTitle("チケットを追加").click();
  await page.getByPlaceholder("例: PROJ-123").fill(number);
  await page.getByPlaceholder("例: Fix login bug").fill(title);
  await page.getByText("保存").click();
  // list view に戻るのを待つ
  await expect(page.getByPlaceholder("チケット番号・タイトルで検索...")).toBeVisible();
}

// ── list view ──────────────────────────────────────────────────────────────

test.describe("popup – list view", () => {
  test("shows empty state when no tickets", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);

    await expect(page.getByText("チケットがまだありません")).toBeVisible();
    await expect(page.getByTitle("最近見たチケット")).toBeVisible();
    await expect(page.getByTitle("日報コピー")).toBeVisible();
    await expect(page.getByTitle("設定")).toBeVisible();
  });

  test("footer shows ticket count", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await expect(page.getByText("0 チケット")).toBeVisible();
  });
});

// ── add ticket ─────────────────────────────────────────────────────────────

test.describe("popup – add ticket", () => {
  test("added ticket appears in list and count increments", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);

    await addTicket(page, "PROJ-1", "Fix login bug");

    await expect(page.getByText("PROJ-1")).toBeVisible();
    await expect(page.getByText("Fix login bug")).toBeVisible();
    await expect(page.getByText("1 チケット")).toBeVisible();
  });

  test("validation rejects empty number", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await page.getByTitle("チケットを追加").click();
    await page.getByText("保存").click();

    await expect(page.getByText("チケット番号は必須です")).toBeVisible();
  });

  test("validation rejects invalid number format", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await page.getByTitle("チケットを追加").click();
    await page.getByPlaceholder("例: PROJ-123").fill("INVALID");
    await page.getByPlaceholder("例: Fix login bug").fill("Some title");
    await page.getByText("保存").click();

    await expect(page.getByText(/PROJ-123/)).toBeVisible();
  });

  test("cancel returns to list without saving", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await page.getByTitle("チケットを追加").click();
    await page.getByPlaceholder("例: PROJ-123").fill("PROJ-999");
    await page.getByText("キャンセル").click();

    await expect(page.getByPlaceholder("チケット番号・タイトルで検索...")).toBeVisible();
    await expect(page.getByText("PROJ-999")).not.toBeVisible();
  });
});

// ── edit ticket ────────────────────────────────────────────────────────────

test.describe("popup – edit ticket", () => {
  test("edited title is reflected in list", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await addTicket(page, "EDIT-1", "Original title");

    await page.getByTitle("編集").click();
    await page.getByPlaceholder("例: Fix login bug").fill("Updated title");
    await page.getByText("保存").click();

    await expect(page.getByText("Updated title")).toBeVisible();
    await expect(page.getByText("Original title")).not.toBeVisible();
  });
});

// ── delete ticket ──────────────────────────────────────────────────────────

test.describe("popup – delete ticket", () => {
  test("requires double click and removes ticket", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await addTicket(page, "DEL-1", "To be deleted");

    // 1回目: 確認状態になるだけ
    await page.getByTitle("削除").click();
    await expect(page.getByText("To be deleted")).toBeVisible();

    // 2回目: 実際に削除
    await page.getByTitle("もう一度クリックで削除").click();
    await expect(page.getByText("To be deleted")).not.toBeVisible();
    await expect(page.getByText("0 チケット")).toBeVisible();
  });
});

// ── search ─────────────────────────────────────────────────────────────────

test.describe("popup – search", () => {
  test("filters by ticket number", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await addTicket(page, "ALPHA-1", "First ticket");
    await addTicket(page, "BETA-2", "Second ticket");

    await page.getByPlaceholder("チケット番号・タイトルで検索...").fill("ALPHA");

    await expect(page.getByText("ALPHA-1")).toBeVisible();
    await expect(page.getByText("BETA-2")).not.toBeVisible();
  });

  test("filters by title keyword", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await addTicket(page, "SRCH-1", "Fix login bug");
    await addTicket(page, "SRCH-2", "Add dark mode");

    await page.getByPlaceholder("チケット番号・タイトルで検索...").fill("dark");

    await expect(page.getByText("Add dark mode")).toBeVisible();
    await expect(page.getByText("Fix login bug")).not.toBeVisible();
  });

  test("shows no-results message when query matches nothing", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await addTicket(page, "NOPE-1", "Some ticket");

    await page.getByPlaceholder("チケット番号・タイトルで検索...").fill("zzz");

    await expect(page.getByText("該当するチケットがありません")).toBeVisible();
  });
});

// ── WIP filter ─────────────────────────────────────────────────────────────

test.describe("popup – WIP filter", () => {
  test("作業中フィルタでWIPチケットのみ表示", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await addTicket(page, "WIP-1", "In progress task");
    await addTicket(page, "WIP-2", "Not in progress");

    // WIP-1 が含まれるカードの星ボタンをクリック
    const wip1Card = page.locator(".rounded-lg.border").filter({ hasText: "WIP-1" });
    await wip1Card.getByTitle("WIPにセット").click();

    // 作業中フィルタON
    await page.getByText("作業中").click();

    await expect(page.getByText("WIP-1")).toBeVisible();
    await expect(page.getByText("WIP-2")).not.toBeVisible();
  });
});

// ── recently viewed panel ──────────────────────────────────────────────────

test.describe("popup – recently viewed panel", () => {
  test("opens from footer button", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);

    await page.getByTitle("最近見たチケット").click();

    await expect(page.getByText("最近見たチケット")).toBeVisible();
    await expect(
      page.getByText("Jira ページを開くと自動で記録されます")
    ).toBeVisible();
  });

  test("clear button is hidden when list is empty", async ({
    context,
    extensionId,
  }) => {
    const page = await openPopup(context, extensionId);
    await page.getByTitle("最近見たチケット").click();

    await expect(page.getByText("クリア")).not.toBeVisible();
  });

  test("back button returns to list view", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await page.getByTitle("最近見たチケット").click();

    await page.locator("button").filter({ has: page.locator("svg") }).first().click();

    await expect(
      page.getByPlaceholder("チケット番号・タイトルで検索...")
    ).toBeVisible();
  });
});

// ── copy toast ─────────────────────────────────────────────────────────────

test.describe("popup – copy", () => {
  test("clicking copy button shows toast", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await addTicket(page, "CPY-1", "Copy test ticket");

    // number テンプレートのコピーボタン（完全一致で他テンプレートと区別）
    await page.getByTitle("コピー: CPY-1", { exact: true }).click();

    await expect(page.getByText(/コピーしました/)).toBeVisible();
  });
});
