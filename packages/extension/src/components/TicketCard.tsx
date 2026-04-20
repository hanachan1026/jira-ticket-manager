import React, { useState } from "react";
import { GitBranchIcon, MessageSquareIcon, HashIcon, StarIcon, PencilIcon, TrashIcon, CheckIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "./ui/Button";
import { applyTemplate } from "../utils/formatTemplate";
import type { JiraTicket, CopyTemplate, UserSettings } from "../types";

interface TicketCardProps {
  ticket: JiraTicket;
  templates: CopyTemplate[];
  settings: UserSettings;
  isInProgress: boolean;
  onToggleInProgress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

const QUICK_TEMPLATES = ["branch", "commit", "number"] as const;
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  branch: <GitBranchIcon size={12} />,
  commit: <MessageSquareIcon size={12} />,
  number: <HashIcon size={12} />,
};

export function TicketCard({
  ticket,
  templates,
  settings,
  isInProgress,
  onToggleInProgress,
  onEdit,
  onDelete,
  onCopy,
  copiedId,
}: TicketCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const quickTemplates = QUICK_TEMPLATES.map((id) => templates.find((t) => t.id === id)).filter(
    Boolean
  ) as CopyTemplate[];

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2000);
    }
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isInProgress
          ? "border-blue-200 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-semibold text-blue-600 shrink-0">
              {ticket.number}
            </span>
            {ticket.url && (
              <a
                href={ticket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLinkIcon size={11} />
              </a>
            )}
          </div>
          <p className="text-xs text-gray-700 mt-0.5 line-clamp-2 leading-relaxed">
            {ticket.title}
          </p>
          {ticket.summary && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ticket.summary}</p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleInProgress}
            title={isInProgress ? "本日作業中を解除" : "本日作業中にセット"}
            className={isInProgress ? "text-yellow-500 hover:text-yellow-600" : ""}
          >
            <StarIcon size={13} fill={isInProgress ? "currentColor" : "none"} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title="編集">
            <PencilIcon size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            title={confirmDelete ? "もう一度クリックで削除" : "削除"}
            className={confirmDelete ? "text-red-500 hover:text-red-600" : ""}
          >
            <TrashIcon size={13} />
          </Button>
        </div>
      </div>

      {/* クイックコピーボタン */}
      <div className="flex gap-1.5 flex-wrap">
        {quickTemplates.map((tmpl) => {
          const text = applyTemplate(tmpl, ticket, settings);
          const copyKey = `${ticket.id}-${tmpl.id}`;
          const copied = copiedId === copyKey;
          return (
            <button
              key={tmpl.id}
              onClick={() => onCopy(text, copyKey)}
              title={`コピー: ${text}`}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {copied ? <CheckIcon size={11} /> : TEMPLATE_ICONS[tmpl.id] ?? <HashIcon size={11} />}
              {tmpl.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
