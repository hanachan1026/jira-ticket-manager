# Chrome Web Store 申請用テキスト

このファイルはストア申請フォームに貼り付けるためのテキストをまとめたものです。

---

## 短い説明（132文字以内）

```
Save Jira ticket info and copy it instantly — branch names, commit prefixes, daily reports. Supports atlassian.net and self-hosted Jira.
```

---

## 詳細説明

```
Jira Ticket Manager is a Chrome extension for developers who use Jira daily.
The UI is available in English and Japanese (selected automatically based on your browser language).

KEY FEATURES

• Save tickets — A floating button appears on Jira ticket pages. One click saves the ticket number and title.
• One-click copy — Instantly copy branch names (feat/PROJ-123-fix-login), commit prefixes, ticket numbers, and more.
• Daily report generator — Check the tickets you worked on and copy a formatted report in one click.
• Recently viewed — Automatically tracks the last 20 Jira pages you visited.
• WIP tracker — Flag in-progress tickets and filter your list.
• Custom templates — Define your own copy formats using {number}, {title}, {slug}, {prefix}, {date} tokens.
• Chrome Sync — Syncs your saved tickets and settings across devices.

SUPPORTED JIRA

• Atlassian Cloud (*.atlassian.net) — works right after install.
• Self-hosted / Jira Data Center — enter your Jira URL in Settings and grant host permission via Chrome's native dialog.

PRIVACY

All data is stored in Chrome storage on your device. Nothing is sent to external servers.
Privacy policy: https://hanachan1026.github.io/jira-ticket-manager/privacy-policy

---

Jira Ticket Manager は、Jira を日常的に使う開発者のための Chrome 拡張機能です。
UI は英語・日本語に対応しています（ブラウザの言語設定に応じて自動切替）。

【主な機能】

• チケット保存 — Jira のチケットページを開くと右下にフローティングボタンが表示され、ワンクリックで番号とタイトルを保存できます。
• ワンクリックコピー — ブランチ名（feat/PROJ-123-fix-login）、コミットプレフィックス、チケット番号など、よく使うフォーマットをすぐコピーできます。
• 日報ジェネレーター — 作業したチケットにチェックを入れるだけで、日報用テキストをまとめてコピーできます。
• 最近見たチケット — Jira のページを開くと自動記録。保存前のチケットもすぐアクセスできます。
• WIP トラッカー — 作業中のチケットにフラグを立て、リストをフィルタできます。
• カスタムテンプレート — {number}・{title}・{slug}・{prefix}・{date} トークンで独自のコピー形式を登録できます。
• Chrome Sync 対応 — 複数デバイス間でデータを同期します。

【対応 Jira】

• Atlassian Cloud（*.atlassian.net）— インストール後すぐ使えます。
• オンプレミス / Jira Data Center — 設定画面で Jira の URL を入力し、権限を付与するだけで対応できます。

【データについて】

すべてのデータはデバイス上の Chrome ストレージに保存されます。外部サーバーへの送信は一切ありません。
```

---

## 権限の使用理由（審査フォーム記入用）

ストアデベロッパーコンソールの「権限の根拠」欄に記入する文章。

### `storage`
```
Stores the user's saved Jira tickets, copy templates, and settings (Jira base URL, git prefix, default template) in Chrome's sync or local storage. No data is sent to external servers.
```

### `scripting`
```
Dynamically registers a content script on Jira pages (atlassian.net by default, or a user-specified domain). The script detects the ticket number from the URL and title from the page DOM, then shows a floating "Save" button. Registration is done at runtime via chrome.scripting.registerContentScripts so that the manifest host_permissions stay minimal.
```

### `tabs`
```
Reads the current active tab's URL when the user clicks the "Add" button in the popup. This pre-fills the ticket number field with the ticket detected from the current Jira page, saving the user from typing it manually. Tab URLs are never stored or transmitted.
```

### `clipboardWrite`
```
Writes formatted ticket text (branch name, commit message, daily report, etc.) to the clipboard when the user clicks a copy button. No data is read from the clipboard.
```

### Optional host permission `*://*/*`
```
This permission is NOT granted at install time. It is requested at runtime only when the user configures a custom (non-atlassian.net) Jira domain in the extension's Settings panel. The user sees Chrome's native permission dialog before it is granted. This supports self-hosted Jira and Jira Data Center instances.
```

---

## 審査ノート（Notes to Reviewer）

```
This extension supports English and Japanese. The UI language is selected automatically based on the browser's language settings.

To test the core functionality without a Jira account:

1. Install the extension.
2. Open the popup — click the "Add" button to add a ticket manually.
3. Type any ticket number (e.g. "PROJ-123") and title, then save.
4. Use the copy buttons (Branch / Commit / Number) to see formatted output.

To test the Jira page integration (floating Save badge):
- Navigate to any page on *.atlassian.net/browse/* while the extension is installed.
- A blue floating button labeled "Save [ticket-number]" will appear in the bottom-right corner.

A free Atlassian account can be created at https://www.atlassian.com/try/cloud/signup to access a Jira Cloud sandbox if needed for review.
```

---

## プライバシーポリシー URL

GitHub Pages で公開する場合:

```
https://hanachan1026.github.io/jira-ticket-manager/privacy-policy
```

公開手順:
1. GitHub リポジトリの Settings → Pages → Source を `main` ブランチの `/docs` フォルダに設定
2. `docs/privacy-policy.md` が `https://hanachan1026.github.io/jira-ticket-manager/privacy-policy` として配信される
   （GitHub Pages は `.md` を HTML に変換しない場合があるため、`docs/privacy-policy.html` への変換 or Jekyll 設定が必要）
