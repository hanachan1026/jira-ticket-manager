# Jira Ticket Manager

A Chrome extension for developers who use Jira daily. Save ticket info and copy it instantly — branch names, commit prefixes, and daily reports.

> **Note:** This extension's UI is in Japanese only.

---

## Features

- **Save tickets** — A floating button appears on Jira pages. One click saves the ticket number and title.
- **Copy in one click** — Branch names (`feat/PROJ-123-fix-login`), commit prefixes (`PROJ-123:`), ticket numbers, and custom formats.
- **Daily report generator** — Check the tickets you worked on and copy a formatted list for standups.
- **Recently viewed** — Automatically tracks the last 20 Jira pages you visited.
- **WIP tracker** — Flag in-progress tickets and filter your list.
- **Custom templates** — Define your own copy format using `{number}`, `{title}`, `{slug}`, `{prefix}`, `{date}` tokens.
- **Chrome Sync** — Tickets and settings sync across devices via your Google account.
- **Self-hosted Jira** — Enter your Jira base URL in Settings; the extension requests host permission via Chrome's native dialog.

---

## Supported Jira Instances

| Type | Support |
|------|---------|
| Atlassian Cloud (`*.atlassian.net`) | Works out of the box |
| Self-hosted / Data Center | Configure via Settings → Grant permission |

---

## Installation

[Chrome Web Store](https://chrome.google.com/webstore) *(coming soon)*

Or install manually (developer mode):

```bash
git clone https://github.com/hanachan1026/jira-ticket-manager.git
cd jira-ticket-manager
pnpm install
pnpm build
```

Then load `packages/extension/.output/chrome-mv3/` as an unpacked extension in Chrome.

---

## Development

```bash
pnpm install          # install dependencies
pnpm dev              # hot-reload dev build (opens Chrome via WXT)
pnpm build            # production build → packages/extension/.output/chrome-mv3/
pnpm test             # run unit tests (Vitest)
```

All commands run from the monorepo root (`jira-ticket-manager/`).

### Architecture

```
jira-ticket-manager/
├── packages/extension/
│   ├── src/
│   │   ├── domain/          # Pure functions (Functional Core)
│   │   ├── entrypoints/     # background.ts, popup/App.tsx, jira.content.tsx
│   │   ├── components/      # React UI components
│   │   ├── hooks/           # React hooks
│   │   ├── storage/         # Chrome Storage adapters
│   │   └── utils/           # Shared utilities
│   └── wxt.config.ts
└── pnpm-workspace.yaml
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture notes.

---

## Privacy

All data is stored locally in Chrome Storage on your device. No data is sent to external servers.

See the full [Privacy Policy](https://hanachan1026.github.io/jira-ticket-manager/privacy-policy).

---

## License

MIT
