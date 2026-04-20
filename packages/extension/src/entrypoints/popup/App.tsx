import React, { useState, useMemo } from "react";
import { PlusIcon, ClipboardListIcon, SettingsIcon, SearchIcon, StarIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { TicketCard } from "../../components/TicketCard";
import { TicketForm } from "../../components/TicketForm";
import { DailyReportPanel } from "../../components/DailyReportPanel";
import { SettingsPanel } from "../../components/SettingsPanel";
import { Toast } from "../../components/ui/Toast";
import { useTickets } from "../../hooks/useTickets";
import { useTemplates } from "../../hooks/useTemplates";
import { useSettings } from "../../hooks/useSettings";
import { useDailyStatus } from "../../hooks/useDailyStatus";
import { useClipboard } from "../../hooks/useClipboard";
import type { JiraTicket } from "../../types";

type View = "list" | "add" | "edit" | "daily" | "settings";

export function App() {
  const { tickets, loading, addTicket, updateTicket, deleteTicket } = useTickets();
  const { templates, addTemplate, removeTemplate } = useTemplates();
  const { settings, updateSettings } = useSettings();
  const { dailyStatus, toggleInProgress, isInProgress } = useDailyStatus();
  const { copy, copiedId } = useClipboard();

  const [view, setView] = useState<View>("list");
  const [editingTicket, setEditingTicket] = useState<JiraTicket | null>(null);
  const [search, setSearch] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (todayOnly) result = result.filter((t) => isInProgress(t.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.number.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickets, search, todayOnly, isInProgress]);

  const handleCopy = async (text: string, id: string) => {
    await copy(text, id);
    setToastMsg(`コピーしました: ${text}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const handleAdd = async (data: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">) => {
    await addTicket(data);
    setView("list");
  };

  const handleUpdate = async (data: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">) => {
    if (!editingTicket) return;
    await updateTicket(editingTicket.id, data);
    setEditingTicket(null);
    setView("list");
  };

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* ヘッダー */}
        <div className="px-3 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <SearchIcon
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="チケット番号・タイトルで検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setView("add")}
              title="チケットを追加"
            >
              <PlusIcon size={14} className="mr-1" />
              追加
            </Button>
          </div>

          {/* フィルタ */}
          <button
            onClick={() => setTodayOnly((v) => !v)}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
              todayOnly
                ? "bg-yellow-100 text-yellow-700 font-medium"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <StarIcon size={11} fill={todayOnly ? "currentColor" : "none"} />
            本日作業中のみ
          </button>
        </div>

        {/* チケットリスト */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {loading ? (
            <div className="text-xs text-gray-400 text-center py-8">読み込み中...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-8">
              {search || todayOnly ? "該当するチケットがありません" : "チケットがまだありません"}
              <br />
              {!search && !todayOnly && (
                <button
                  onClick={() => setView("add")}
                  className="mt-2 text-blue-500 hover:underline"
                >
                  最初のチケットを追加する
                </button>
              )}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                templates={templates}
                settings={settings}
                isInProgress={isInProgress(ticket.id)}
                onToggleInProgress={() => toggleInProgress(ticket.id)}
                onEdit={() => {
                  setEditingTicket(ticket);
                  setView("edit");
                }}
                onDelete={() => deleteTicket(ticket.id)}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            ))
          )}
        </div>

        {/* フッター */}
        <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{tickets.length} チケット</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setView("daily")} title="日報コピー">
              <ClipboardListIcon size={14} className="mr-1" />
              日報
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView("settings")} title="設定">
              <SettingsIcon size={14} className="mr-1" />
              設定
            </Button>
          </div>
        </div>

        <Toast message={toastMsg} show={showToast} />
      </div>
    );
  }

  // ── Add view ───────────────────────────────────────────────────────────────
  if (view === "add") {
    return (
      <div className="p-3 h-full bg-white overflow-y-auto">
        <TicketForm onSave={handleAdd} onCancel={() => setView("list")} />
      </div>
    );
  }

  // ── Edit view ──────────────────────────────────────────────────────────────
  if (view === "edit" && editingTicket) {
    return (
      <div className="p-3 h-full bg-white overflow-y-auto">
        <TicketForm
          initialData={editingTicket}
          onSave={handleUpdate}
          onCancel={() => {
            setEditingTicket(null);
            setView("list");
          }}
        />
      </div>
    );
  }

  // ── Daily Report view ──────────────────────────────────────────────────────
  if (view === "daily") {
    return (
      <div className="p-3 h-full bg-white overflow-y-auto">
        <DailyReportPanel
          tickets={tickets}
          preSelectedIds={dailyStatus.inProgressIds}
          templates={templates}
          settings={settings}
          onClose={() => setView("list")}
        />
      </div>
    );
  }

  // ── Settings view ──────────────────────────────────────────────────────────
  if (view === "settings") {
    return (
      <div className="p-3 h-full bg-white overflow-y-auto">
        <SettingsPanel
          settings={settings}
          templates={templates}
          onUpdateSettings={updateSettings}
          onAddTemplate={addTemplate}
          onRemoveTemplate={removeTemplate}
          onClose={() => setView("list")}
        />
      </div>
    );
  }

  return null;
}
