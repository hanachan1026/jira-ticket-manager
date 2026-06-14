import React from "react";
import {
  ChevronLeftIcon,
  ClockIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "./ui/Button";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { useStorage } from "../storage/StorageContext";
import type { RecentlyViewedTicket } from "../types";

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
}

interface Props {
  onClose: () => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

export function RecentlyViewedPanel({ onClose, onCopy, copiedId }: Props) {
  const { recentlyViewed, loading } = useRecentlyViewed();
  const { recentlyViewed: adapter } = useStorage();
  const [confirmClear, setConfirmClear] = React.useState(false);

  const handleClearClick = () => {
    if (confirmClear) {
      adapter.setValue([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <ClockIcon size={13} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">最近見たチケット</span>
        </div>
        {recentlyViewed.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearClick}
            className={`text-xs transition-colors ${confirmClear ? "text-red-500 hover:text-red-600" : "text-gray-400"}`}
          >
            <Trash2Icon size={12} className="mr-1" />
            {confirmClear ? "本当にクリア？" : "クリア"}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {loading ? (
          <div className="text-xs text-gray-400 text-center py-8">読み込み中...</div>
        ) : recentlyViewed.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-8">
            Jira ページを開くと自動で記録されます
          </div>
        ) : (
          recentlyViewed.map((ticket) => (
            <RecentlyViewedRow
              key={`${ticket.number}-${ticket.viewedAt}`}
              ticket={ticket}
              onCopy={onCopy}
              copiedId={copiedId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RecentlyViewedRow({
  ticket,
  onCopy,
  copiedId,
}: {
  ticket: RecentlyViewedTicket;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const copyId = `recent-${ticket.number}-${ticket.viewedAt}`;
  return (
    <div className="group flex items-start gap-2 p-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-mono font-medium text-blue-600">
            {ticket.number}
          </span>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(ticket.viewedAt)}
          </span>
        </div>
        <p className="text-xs text-gray-700 truncate">{ticket.title}</p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onCopy(ticket.number, copyId)}
          title="チケット番号をコピー"
          aria-label="チケット番号をコピー"
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {copiedId === copyId ? (
            <CheckIcon size={12} className="text-green-500" />
          ) : (
            <CopyIcon size={12} />
          )}
        </button>
        <a
          href={ticket.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Jira で開く"
          aria-label="Jira で開く"
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ExternalLinkIcon size={12} />
        </a>
      </div>
    </div>
  );
}
