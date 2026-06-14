import React, { useState, useCallback } from "react";
import { ClipboardIcon, CheckIcon } from "lucide-react";
import { Button } from "./ui/Button";
import { buildDailyReport } from "../utils/formatTemplate";
import type { JiraTicket, CopyTemplate, UserSettings } from "../types";

interface DailyReportPanelProps {
  tickets: JiraTicket[];
  preSelectedIds: string[];
  templates: CopyTemplate[];
  settings: UserSettings;
  onClose: () => void;
}

export function DailyReportPanel({
  tickets,
  preSelectedIds,
  templates,
  settings,
  onClose,
}: DailyReportPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelectedIds);
  const [lineTemplateId, setLineTemplateId] = useState("daily");
  const [copied, setCopied] = useState(false);

  const lineTemplate =
    templates.find((t) => t.id === lineTemplateId) ?? templates[0];

  const selectedTickets = tickets.filter((t) => selectedIds.includes(t.id));
  const preview = lineTemplate ? buildDailyReport(selectedTickets, lineTemplate, settings) : "";

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleCopy = async () => {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview);
    } catch {
      const el = document.createElement("textarea");
      el.value = preview;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">📋 日報コピー</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* テンプレート選択 */}
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-600 mb-1 block">フォーマット</label>
        <select
          value={lineTemplateId}
          onChange={(e) => setLineTemplateId(e.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {lineTemplate && (
          <p className="text-xs text-gray-400 font-mono mt-1 truncate">{lineTemplate.pattern}</p>
        )}
      </div>

      {/* チケット選択リスト */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-3 min-h-0">
        {tickets.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">チケットがありません</p>
        ) : (
          tickets.map((ticket) => (
            <label
              key={ticket.id}
              className="flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 select-none"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(ticket.id)}
                onChange={() => toggle(ticket.id)}
                className="mt-0.5 rounded accent-blue-600"
              />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs font-semibold text-blue-600">
                  {ticket.number}
                </span>
                <span className="text-xs text-gray-700 ml-1.5 line-clamp-1">{ticket.title}</span>
              </div>
            </label>
          ))
        )}
      </div>

      {/* プレビュー */}
      {preview && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1">プレビュー</p>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 whitespace-pre-wrap text-gray-700 max-h-24 overflow-y-auto">
            {preview}
          </pre>
        </div>
      )}

      {/* コピーボタン */}
      <Button
        variant="primary"
        onClick={handleCopy}
        disabled={selectedTickets.length === 0}
        className="w-full"
      >
        {copied ? (
          <>
            <CheckIcon size={14} className="mr-1.5" />
            コピーしました
          </>
        ) : (
          <>
            <ClipboardIcon size={14} className="mr-1.5" />
            {selectedTickets.length}件をコピー
          </>
        )}
      </Button>
    </div>
  );
}
