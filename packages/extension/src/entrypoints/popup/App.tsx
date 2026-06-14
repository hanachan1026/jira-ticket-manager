import React, { useState, useMemo, useEffect } from "react";
import { PlusIcon, ClipboardListIcon, SettingsIcon, SearchIcon, StarIcon, ClockIcon, HelpCircleIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { TicketCard } from "../../components/TicketCard";
import { TicketForm } from "../../components/TicketForm";
import { DailyReportPanel } from "../../components/DailyReportPanel";
import { SettingsPanel } from "../../components/SettingsPanel";
import { RecentlyViewedPanel } from "../../components/RecentlyViewedPanel";
import { HelpPanel } from "../../components/HelpPanel";
import { Toast } from "../../components/ui/Toast";
import { useTickets } from "../../hooks/useTickets";
import { useTemplates } from "../../hooks/useTemplates";
import { useSettings } from "../../hooks/useSettings";
import { useWipStatus } from "../../hooks/useWipStatus";
import { useClipboard } from "../../hooks/useClipboard";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { useStorage } from "../../storage/StorageContext";
import { detectTicketNumber } from "../../utils/jiraDetector";
import type { JiraTicket, RecentlyViewedTicket, ExtensionMessage } from "../../types";

type View = "list" | "add" | "edit" | "daily" | "settings" | "recent" | "help";

export function App() {
  const { isReady, mode, tickets: ticketsAdapter } = useStorage();
  const { tickets, loading, addTicket, updateTicket, deleteTicket } = useTickets();
  const { templates, addTemplate, removeTemplate } = useTemplates();
  const {
    settings,
    updateSettings,
    storageMode,
    enableFileStorage,
    disableFileStorage,
    migrateToFile,
    requestFilePermission,
    isFileStorageAvailable,
    needsPermission,
  } = useSettings();
  const { wipStatus, toggleInProgress, isInProgress } = useWipStatus();
  const { copy, copiedId } = useClipboard();
  const { recentlyViewed } = useRecentlyViewed();

  // ファイルモード時のキュー処理
  useEffect(() => {
    if (mode !== "file") return;

    const processPendingQueue = async () => {
      const result = await chrome.storage.local.get("pendingFileSaves");
      const pendingFileSaves: JiraTicket[] = (result.pendingFileSaves as JiraTicket[]) ?? [];
      if (pendingFileSaves.length === 0) return;

      // 現在のチケットを取得してマージ
      const currentTickets = await ticketsAdapter.getValue();
      const newTickets = pendingFileSaves.filter(
        (t) => !currentTickets.some((ct) => ct.number === t.number)
      );

      if (newTickets.length > 0) {
        await ticketsAdapter.setValue([...newTickets, ...currentTickets]);
      }

      // キューをクリア
      await chrome.storage.local.remove("pendingFileSaves");

      // キャッシュを更新（background.ts の GET_TICKETS 用）
      const updatedTickets = await ticketsAdapter.getValue();
      await chrome.storage.local.set({ cachedTickets: updatedTickets });
    };

    processPendingQueue();

    // キュー処理リクエストをリッスン
    const listener = (msg: ExtensionMessage) => {
      if (msg.type === "PROCESS_FILE_QUEUE") {
        processPendingQueue();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [mode, ticketsAdapter]);

  const [view, setView] = useState<View>("list");
  const [editingTicket, setEditingTicket] = useState<JiraTicket | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<JiraTicket> | undefined>();
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

  // 保存済みに含まれない最近見たチケット（最大3件）
  const savedNumbers = useMemo(() => new Set(tickets.map((t) => t.number)), [tickets]);
  const unsavedRecent = useMemo(
    () => recentlyViewed.filter((r) => !savedNumbers.has(r.number)).slice(0, 3),
    [recentlyViewed, savedNumbers]
  );

  // ストレージ初期化待ち
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-xs text-gray-400">読み込み中...</div>
      </div>
    );
  }

  const handleCopy = async (text: string, id: string) => {
    await copy(text, id);
    setToastMsg(`コピーしました: ${text}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const handleOpenAdd = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const number = detectTicketNumber(tab.url);
        setFormInitialData(number ? { number, url: tab.url } : undefined);
      } else {
        setFormInitialData(undefined);
      }
    } catch {
      setFormInitialData(undefined);
    }
    setView("add");
  };

  const handleAdd = async (data: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">) => {
    await addTicket(data);
    setView("list");
  };

  const handleAddRecentAsWip = async (recent: RecentlyViewedTicket) => {
    const ticket = await addTicket({ number: recent.number, title: recent.title, url: recent.url });
    await toggleInProgress(ticket.id);
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
            <button
              onClick={() => setView("help")}
              title="使い方"
              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            >
              <HelpCircleIcon size={15} />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
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
            作業中
          </button>
        </div>

        {/* チケットリスト */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {loading ? (
            <div className="text-xs text-gray-400 text-center py-8">読み込み中...</div>
          ) : filteredTickets.length === 0 ? (
            <>
              <div className="text-xs text-gray-400 text-center pt-4 pb-2">
                {search || todayOnly ? "該当するチケットがありません" : "チケットがまだありません"}
                {!search && !todayOnly && (
                  <>
                    <br />
                    <button
                      onClick={handleOpenAdd}
                      className="mt-2 text-blue-500 hover:underline"
                    >
                      最初のチケットを追加する
                    </button>
                  </>
                )}
              </div>
              {!search && !todayOnly && unsavedRecent.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <ClockIcon size={11} />
                      <span>最近見た</span>
                    </div>
                    <button onClick={() => setView("recent")} className="text-xs text-blue-500 hover:underline">
                      すべて見る
                    </button>
                  </div>
                  {unsavedRecent.map((ticket) => {
                    const copyId = `inline-recent-${ticket.number}`;
                    return (
                      <div key={`${ticket.number}-${ticket.viewedAt}`} className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
                        <span className="text-xs font-mono font-medium text-blue-600 shrink-0">{ticket.number}</span>
                        <span className="text-xs text-gray-500 truncate flex-1">{ticket.title}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => handleAddRecentAsWip(ticket)} title="保存して作業中にセット" aria-label="保存して作業中にセット" className="p-0.5 rounded text-gray-300 hover:text-yellow-500 transition-colors"><StarIcon size={11} /></button>
                          <button onClick={() => handleCopy(ticket.number, copyId)} title="チケット番号をコピー" aria-label="チケット番号をコピー" className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors">{copiedId === copyId ? <CheckIcon size={11} className="text-green-500" /> : <CopyIcon size={11} />}</button>
                          <a href={ticket.url} target="_blank" rel="noopener noreferrer" title="Jira で開く" aria-label="Jira で開く" className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"><ExternalLinkIcon size={11} /></a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
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

        {/* 最近見た（チケットがある場合のみ、未保存最大3件） */}
        {unsavedRecent.length > 0 && !todayOnly && filteredTickets.length > 0 && (
          <div className="px-3 pb-2">
            <div className="border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <ClockIcon size={11} />
                  <span>最近見た</span>
                </div>
                <button
                  onClick={() => setView("recent")}
                  className="text-xs text-blue-500 hover:underline"
                >
                  すべて見る
                </button>
              </div>
              <div className="space-y-1">
                {unsavedRecent.map((ticket) => {
                  const copyId = `inline-recent-${ticket.number}`;
                  return (
                    <div
                      key={`${ticket.number}-${ticket.viewedAt}`}
                      className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-mono font-medium text-blue-600 shrink-0">
                        {ticket.number}
                      </span>
                      <span className="text-xs text-gray-500 truncate flex-1">
                        {ticket.title}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleAddRecentAsWip(ticket)}
                          title="保存して作業中にセット"
                          aria-label="保存して作業中にセット"
                          className="p-0.5 rounded text-gray-300 hover:text-yellow-500 transition-colors"
                        >
                          <StarIcon size={11} />
                        </button>
                        <button
                          onClick={() => handleCopy(ticket.number, copyId)}
                          title="チケット番号をコピー"
                          aria-label="チケット番号をコピー"
                          className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          {copiedId === copyId ? (
                            <CheckIcon size={11} className="text-green-500" />
                          ) : (
                            <CopyIcon size={11} />
                          )}
                        </button>
                        <a
                          href={ticket.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Jira で開く"
                          aria-label="Jira で開く"
                          className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <ExternalLinkIcon size={11} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{tickets.length} チケット</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setView("recent")} title="最近見たチケット">
              <ClockIcon size={14} className="mr-1" />
              履歴
            </Button>
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
        <TicketForm initialData={formInitialData} onSave={handleAdd} onCancel={() => setView("list")} />
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
          preSelectedIds={wipStatus.inProgressIds}
          templates={templates}
          settings={settings}
          onClose={() => setView("list")}
        />
      </div>
    );
  }

  // ── Help view ──────────────────────────────────────────────────────────────
  if (view === "help") {
    return (
      <div className="flex flex-col h-full">
        <HelpPanel onClose={() => setView("list")} />
      </div>
    );
  }

  // ── Recently Viewed view ───────────────────────────────────────────────────
  if (view === "recent") {
    return (
      <div className="flex flex-col h-full">
        <RecentlyViewedPanel
          onClose={() => setView("list")}
          onCopy={handleCopy}
          copiedId={copiedId}
        />
        <Toast message={toastMsg} show={showToast} />
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
          storageMode={storageMode}
          enableFileStorage={enableFileStorage}
          disableFileStorage={disableFileStorage}
          migrateToFile={migrateToFile}
          requestFilePermission={requestFilePermission}
          isFileStorageAvailable={isFileStorageAvailable}
          needsPermission={needsPermission}
        />
      </div>
    );
  }

  return null;
}
