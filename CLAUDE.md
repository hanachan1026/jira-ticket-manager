# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 開発スタイル

- TDD で開発する（探索 → Red → Green → Refactoring）
- KPI やカバレッジ目標が与えられたら、達成するまで試行する
- 不明瞭な指示は質問して明確にする

## コード設計

- 関心の分離を保つ
- 状態とロジックを分離する
- 可読性と保守性を重視する
- コントラクト層（API/型）を厳密に定義し、実装層は再生成可能に保つ
- 静的検査可能なルールはプロンプトではなく、linter か ast-grep で記述する


## コミットルール

- Conventional commit

## ツール

- タスクランナー: justfile
- Node.js: pnpm, v24+
- E2E: Playwright

## 言語

- 公開リポジトリではドキュメントやコミットメッセージを英語で記述する

## コマンド

すべてのコマンドはモノレポルート (`jira-ticket-manager/`) から実行します。

```bash
pnpm dev          # ホットリロード開発ビルド（WXT 経由で Chrome 起動）
pnpm build        # 本番ビルド → packages/extension/.output/chrome-mv3/

# packages/extension/ から直接実行:
pnpm --filter extension exec wxt zip          # Chrome Web Store 用 .zip 作成
pnpm --filter extension exec tsc --noEmit     # 型チェックのみ
pnpm --filter extension exec wxt prepare      # .wxt/ 型スタブ再生成（wxt.config.ts 変更後に実行）
```

テストはまだありません。

## アーキテクチャ

### モノレポ構成

```
jira-ticket-manager/
├── packages/extension/     # 唯一のパッケージ（Phase 3 で packages/backend/ 追加予定）
└── pnpm-workspace.yaml
```

### Extension エントリーポイント (`src/entrypoints/`)

WXT は `src/entrypoints/` 内のファイルを規約で認識します:

| ファイル | 役割 |
|---|---|
| `popup/` | 拡張機能ポップアップでレンダリングされる React アプリ（380×560 px） |
| `background.ts` | MV3 サービスワーカー — `jiraBaseUrl` 設定に基づいて content script を動的登録、`SAVE_TICKET` / `GET_TICKETS` / `TRACK_TICKET_VIEW` メッセージを処理 |
| `jira.content.tsx` | Content script（ランタイム登録）— URL からチケット番号、DOM からタイトルを検出、ページ訪問を最近開いたリストに自動トラッキング、Shadow Root UI で `SaveBadge` をマウント |

### データフロー

```
Jira ページ
  └─ jira.content.tsx  ──SAVE_TICKET メッセージ──▶  background.ts
                                                          │
                                                          ▼
                                                  chrome.storage.sync
                                                          │
                                             (WXT storage.watch)
                                                          ▼
                                                 popup/App.tsx (React state)
```

### ストレージ層 (`src/storage/`)

各ファイルは `wxt/utils/storage` から `storage.defineItem()` を呼び出します（`wxt/storage` ではない — WXT 0.20.x にはそのパスは存在しません）:

| アイテムキー | 型 | 備考 |
|---|---|---|
| `sync:tickets` | `JiraTicket[]` | メインチケットリスト、Chrome デバイス間で同期 |
| `sync:templates` | `CopyTemplate[]` | ユーザーコピーフォーマットテンプレート、5 つのデフォルトで初期化 |
| `sync:settings` | `UserSettings` | Git プレフィックス、デフォルトテンプレート、Jira ベース URL |
| `local:wipStatus` | `WipStatus` | 作業中（WIP）チケット ID、永続的、手動リセットのみ |
| `local:recentlyViewed` | `RecentlyViewedTicket[]` | 自動トラッキングされた最近開いたチケット（最大 20 件） |

### コピーテンプレートエンジン (`src/utils/formatTemplate.ts`)

`applyTemplate(template, ticket, settings)` はパターン文字列内の `{token}` プレースホルダーを置換します。利用可能なトークン: `{number}`, `{title}`, `{slug}`, `{summary}`, `{date}`, `{prefix}`。`slugify()` はタイトルをブランチ名に適した小文字ハイフン区切り文字列に変換します。

### ポップアップ状態マシン (`src/entrypoints/popup/App.tsx`)

単一の `view` 状態文字列が画面遷移を駆動 — ルーターなし:
`"list"` → `"add"` | `"edit"` | `"daily"` | `"settings"`

### WXT インポートパス

WXT 0.20.x は `wxt/sandbox` や `wxt/client` を解決可能な Node パスとしてエクスポート**しません**。以下を使用:
- `defineBackground` には `wxt/utils/define-background`
- `defineContentScript` には `wxt/utils/define-content-script`
- `createShadowRootUi` には `wxt/utils/content-script-ui/shadow-root`
- `storage` には `wxt/utils/storage`
