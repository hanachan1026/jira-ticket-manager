import React from "react";
import {
  ChevronLeftIcon,
  HelpCircleIcon,
  PlusIcon,
  CopyIcon,
  StarIcon,
  ClockIcon,
  ClipboardListIcon,
  GlobeIcon,
  SettingsIcon,
  GitBranchIcon,
  ZapIcon,
} from "lucide-react";

interface Props {
  onClose: () => void;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-blue-500">{icon}</span>
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="space-y-2.5 pl-1">{children}</div>
    </div>
  );
}

function Item({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-100 text-gray-600 rounded px-1 py-0.5 font-mono text-[10px]">
      {children}
    </code>
  );
}

function UrlPattern({ pattern }: { pattern: string }) {
  return (
    <div className="mt-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono text-[10px] text-gray-500 break-all">
      {pattern}
    </div>
  );
}

export function HelpPanel({ onClose }: Props) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex items-center gap-1.5">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <HelpCircleIcon size={13} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">使い方</span>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto px-3 py-3 text-xs">

        <Section title="基本操作" icon={<PlusIcon size={13} />}>
          <Item icon={<PlusIcon size={12} />} label="チケットを追加">
            右上の「追加」ボタンからチケット番号（例: <Code>PROJ-123</Code>）とタイトルを入力して保存します。
          </Item>
          <Item icon={<CopyIcon size={12} />} label="コピー">
            チケットカード下部の Branch / Commit / Number ボタンで各フォーマットをクリップボードにコピーします。
          </Item>
          <Item icon={<StarIcon size={12} />} label="作業中（WIP）マーク">
            ★ボタンで作業中フラグを付けられます。フッターの「作業中」フィルタで絞り込み可能です。
          </Item>
          <Item icon={<ClipboardListIcon size={12} />} label="日報コピー">
            フッターの「日報」から作業中チケットをまとめてコピーできます。
          </Item>
        </Section>

        <Section title="Jira との連携" icon={<GlobeIcon size={13} />}>
          <Item icon={<ZapIcon size={12} />} label="連携されるデフォルト URL">
            <p>設定なしの場合、以下の atlassian.net URL パターンで自動連携が有効です。</p>
            <UrlPattern pattern="*.atlassian.net/browse/PROJ-123" />
            <UrlPattern pattern="*.atlassian.net/issues/PROJ-123" />
            <UrlPattern pattern="*.atlassian.net/jira/...?selectedIssue=PROJ-123" />
            <p className="mt-1 text-gray-400">チケット番号が URL に含まれないページ（ダッシュボードなど）を開いても何も起きません。</p>
          </Item>

          <Item icon={<ClockIcon size={12} />} label="ページを開いたときの動作">
            <p>対象 URL のページを開くと自動で次の処理が実行されます：</p>
            <ol className="mt-1 space-y-0.5 list-decimal list-inside text-gray-500">
              <li>URL からチケット番号を検出</li>
              <li>ページタイトルを取得（SPA のため最大 3 秒リトライ）</li>
              <li>「履歴」に自動記録（最新 20 件）</li>
              <li>画面に「保存」バッジを表示</li>
            </ol>
            <p className="mt-1">Jira 内のページ遷移（リロードなし）にも追従します。</p>
          </Item>

          <Item icon={<PlusIcon size={12} />} label="「保存」バッジ">
            Jira ページ内に表示されるバッジをクリックすると、チケットリストに手動追加できます。「履歴」への記録はバッジを押さなくても自動で行われます。
          </Item>
        </Section>

        <Section title="設定" icon={<SettingsIcon size={13} />}>
          <Item icon={<GlobeIcon size={12} />} label="自社 Jira の URL 設定">
            <p>社内ホスティングの Jira を使う場合はベース URL を設定します。</p>
            <p className="mt-1">設定例と連携される範囲：</p>
            <UrlPattern pattern="https://jira.mycompany.com → jira.mycompany.com/* すべて" />
            <UrlPattern pattern="https://mycompany.com/jira → mycompany.com/jira/* 以下" />
            <p className="mt-1">設定を保存した直後から有効になります（再起動不要）。ただし設定時点で既に開いているタブは対象外で、次回開いたときから有効です。</p>
          </Item>

          <Item icon={<GitBranchIcon size={12} />} label="Git プレフィックス">
            ブランチ名やコミットメッセージのデフォルトプレフィックスを設定します（例: <Code>feat</Code>）。コピーテンプレートの <Code>{"{prefix}"}</Code> トークンで使用されます。
          </Item>

          <Item icon={<CopyIcon size={12} />} label="コピーテンプレート">
            <Code>{"{number}"}</Code> <Code>{"{title}"}</Code> <Code>{"{slug}"}</Code> <Code>{"{prefix}"}</Code> <Code>{"{date}"}</Code> などのトークンを組み合わせて独自のコピー形式を定義できます。
          </Item>
        </Section>

      </div>
    </div>
  );
}
