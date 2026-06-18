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
Jira Ticket Manager is a Chrome extension for software developers who use Jira daily.

** Note: This extension's UI is entirely in Japanese. **

KEY FEATURES

• Save tickets instantly — visit any Jira ticket page and click the floating "Save" badge to store the ticket number and title.
• Copy in one click — format tickets as branch names (feat/PROJ-123-my-feature), commit messages, or custom patterns.
• Daily report generator — select tickets and copy a formatted list for standup or daily reports.
• Recently viewed — automatically tracks the last 20 Jira pages you visited.
• WIP tracker — mark tickets as "in progress" and filter your list to today's work.
• Custom templates — define your own copy format using tokens: {number}, {title}, {slug}, {prefix}, {date}.
• Chrome Sync support — your saved tickets and settings sync across devices via your Google account.

SUPPORTED JIRA INSTANCES

• Atlassian Cloud (*.atlassian.net) — works out of the box.
• Self-hosted / Jira Data Center — enter your Jira base URL in Settings; the extension will request host permission via Chrome's native dialog.

PRIVACY

No data is sent to any external server. All ticket data is stored in Chrome Storage on your device (or synced via your own Google account). See the full privacy policy at: https://hanachan1026.github.io/jira-ticket-manager/privacy-policy

HOW TO USE

1. Install the extension.
2. Open your Jira instance and navigate to a ticket page.
3. Click the blue floating badge ("Save") to save the ticket.
4. Open the extension popup to copy, manage, or generate reports.

For self-hosted Jira: open the extension popup → Settings → enter your Jira base URL → click "Grant permission".
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
This extension's UI is in Japanese only. To test the core functionality without a Jira account:

1. Install the extension.
2. Open the popup — you can add tickets manually using the "追加" (Add) button.
3. Type any ticket number (e.g. "PROJ-123") and title, then save.
4. Use the copy buttons to see formatted output.

To test the Jira page integration (floating Save badge):
- Navigate to any page on *.atlassian.net/browse/* while the extension is installed.
- A blue floating button labeled "[ticket-number] を保存" will appear in the bottom-right corner.

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
