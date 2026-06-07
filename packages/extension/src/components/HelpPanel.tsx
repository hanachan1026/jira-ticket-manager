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
} from "lucide-react";

interface Props {
  onClose: () => void;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-blue-500">{icon}</span>
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="space-y-1.5 pl-1">{children}</div>
    </div>
  );
}

function Item({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
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
          <Item
            icon={<PlusIcon size={12} />}
            label="チケットを追加"
            desc="右上の「追加」ボタンからチケット番号とタイトルを入力して保存します。"
          />
          <Item
            icon={<CopyIcon size={12} />}
            label="コピー"
            desc="チケットカード下部の Branch / Commit / Number ボタンで、各フォーマットをクリップボードにコピーします。"
          />
          <Item
            icon={<StarIcon size={12} />}
            label="作業中（WIP）マーク"
            desc="★ボタンで作業中フラグを付けられます。フッターの「作業中」フィルタで絞り込み可能です。"
          />
          <Item
            icon={<ClipboardListIcon size={12} />}
            label="日報コピー"
            desc="フッターの「日報」から作業中チケットをまとめてコピーできます。"
          />
        </Section>

        <Section title="Jira との連携" icon={<GlobeIcon size={13} />}>
          <Item
            icon={<ClockIcon size={12} />}
            label="自動トラッキング"
            desc="Jira のチケットページを開くと自動で「履歴」に記録されます。手動操作は不要です。"
          />
          <Item
            icon={<PlusIcon size={12} />}
            label="ページから直接保存"
            desc="Jira ページに表示される「保存」バッジをクリックするとチケットリストに追加されます。"
          />
        </Section>

        <Section title="設定" icon={<SettingsIcon size={13} />}>
          <Item
            icon={<GitBranchIcon size={12} />}
            label="Git プレフィックス"
            desc="ブランチ名やコミットメッセージに付くデフォルトのプレフィックスを設定します（例: feat）。"
          />
          <Item
            icon={<GlobeIcon size={12} />}
            label="Jira ベース URL"
            desc="自社 Jira を使う場合はベース URL を設定してください。設定後、そのドメインの Jira ページで自動トラッキングが有効になります。"
          />
          <Item
            icon={<CopyIcon size={12} />}
            label="コピーテンプレート"
            desc="{number} / {title} / {slug} / {prefix} / {date} などのトークンを使って独自のコピー形式を定義できます。"
          />
        </Section>

      </div>
    </div>
  );
}
