# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the monorepo root (`jira-ticket-manager/`).

```bash
pnpm dev          # Hot-reload dev build (launches Chrome via WXT)
pnpm build        # Production build → packages/extension/.output/chrome-mv3/

# From packages/extension/ directly:
pnpm --filter extension exec wxt zip          # Create .zip for Chrome Web Store
pnpm --filter extension exec tsc --noEmit     # Type-check only
pnpm --filter extension exec wxt prepare      # Regenerate .wxt/ type stubs (run after wxt.config.ts changes)
```

There are no tests yet.

## Architecture

### Monorepo layout

```
jira-ticket-manager/
├── packages/extension/     # The only package (Phase 3 will add packages/backend/)
└── pnpm-workspace.yaml
```

### Extension entrypoints (`src/entrypoints/`)

WXT picks up files in `src/entrypoints/` by convention:

| File | Role |
|---|---|
| `popup/` | React app rendered in the extension popup (380×560 px) |
| `background.ts` | MV3 service worker — registers `chrome.alarms` for midnight DailyStatus reset, handles `SAVE_TICKET` / `GET_TICKETS` messages from the content script |
| `jira.content.tsx` | Content script injected on `*.atlassian.net/browse/*` — detects ticket number from the URL path and title from the DOM, mounts a `SaveBadge` React component via Shadow Root UI |

### Data flow

```
Jira page
  └─ jira.content.tsx  ──SAVE_TICKET message──▶  background.ts
                                                       │
                                                       ▼
                                               chrome.storage.sync
                                                       │
                                          (WXT storage.watch)
                                                       ▼
                                              popup/App.tsx (React state)
```

### Storage layer (`src/storage/`)

Each file calls `storage.defineItem()` from `wxt/utils/storage` (not `wxt/storage` — that path does not exist in WXT 0.20.x):

| Item key | Type | Notes |
|---|---|---|
| `sync:tickets` | `JiraTicket[]` | Main ticket list, synced across Chrome devices |
| `sync:templates` | `CopyTemplate[]` | User copy-format templates, seeded with 5 defaults |
| `sync:settings` | `UserSettings` | Git prefix, default template, Jira base URL |
| `local:dailyStatus` | `DailyStatus` | Today's in-progress ticket IDs; reset at midnight by background alarm |

### Copy template engine (`src/utils/formatTemplate.ts`)

`applyTemplate(template, ticket, settings)` replaces `{token}` placeholders in a pattern string. Available tokens: `{number}`, `{title}`, `{slug}`, `{summary}`, `{date}`, `{prefix}`. `slugify()` converts a title to a branch-safe lowercase-hyphenated string.

### Popup state machine (`src/entrypoints/popup/App.tsx`)

Single `view` state string drives screen transitions — no router:
`"list"` → `"add"` | `"edit"` | `"daily"` | `"settings"`

### WXT import paths

WXT 0.20.x does **not** export `wxt/sandbox` or `wxt/client` as resolvable Node paths. Use:
- `wxt/utils/define-background` for `defineBackground`
- `wxt/utils/define-content-script` for `defineContentScript`
- `wxt/utils/content-script-ui/shadow-root` for `createShadowRootUi`
- `wxt/utils/storage` for `storage`
