# Privacy Policy — Jira Ticket Manager

**Effective date:** 2026-06-18  
**Extension:** Jira Ticket Manager (Chrome Web Store)

---

## Summary

Jira Ticket Manager does **not** collect, transmit, or sell any personal data to external servers. All data is stored locally on your device or synced via your own Google account through Chrome's built-in sync infrastructure.

---

## Data Stored

| Data | Where | Purpose |
|------|-------|---------|
| Jira ticket info (number, title, URL) | Chrome Storage (sync or local) | Display and copy in popup |
| Copy templates | Chrome Storage (sync) | User-defined format patterns |
| Settings (Jira base URL, git prefix, etc.) | Chrome Storage (sync) | Extension configuration |
| Recently viewed tickets | Chrome Storage (local) | Auto-tracked from Jira page visits |

All data remains on your device. When Chrome Sync is enabled, data is synced via Google's infrastructure under your Google account — this is governed by [Google's Privacy Policy](https://policies.google.com/privacy).

---

## Permissions and Why We Need Them

### `storage`
Used to persist your saved tickets, templates, and settings in Chrome's storage API. No data is sent to any external server.

### `scripting`
Used to dynamically register a content script on Jira pages you visit. The script detects the Jira ticket number and title from the page URL and DOM, and shows a "Save" badge. The script runs only on Jira domains you have authorized.

### `tabs`
Used only when you click the "Add" button in the popup — the extension reads the current tab's URL to pre-fill the ticket number field. Tab URLs are never stored or transmitted.

### `clipboardWrite`
Used when you click a copy button in the popup. The formatted text is written directly to your clipboard. No data is sent externally.

### Optional host permission (`*://*/*`)
Requested at runtime only if you configure a custom (non-atlassian.net) Jira domain in Settings. This allows the content script to run on your self-hosted Jira instance. You will see a Chrome permission dialog before this is granted.

---

## Data We Do NOT Collect

- No analytics or telemetry
- No crash reporting to external services
- No user identifiers, IP addresses, or device fingerprints
- No Jira credentials or authentication tokens

---

## Third-Party Services

This extension does not integrate with any third-party services. The only external interaction is Chrome Sync, which is a Google service tied to your Google account.

---

## Changes to This Policy

If the privacy policy changes in a meaningful way, the extension version will be updated and this document will reflect the new effective date.

---

## Contact

For questions or concerns, please open an issue on [GitHub](https://github.com/hanachan1026/jira-ticket-manager).
