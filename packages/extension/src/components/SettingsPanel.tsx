import React, { useState } from "react";
import { PlusIcon, TrashIcon, CheckIcon } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import type { UserSettings, CopyTemplate } from "../types";

const GIT_PREFIXES = ["feat", "fix", "chore", "refactor", "docs", "test"] as const;

interface SettingsPanelProps {
  settings: UserSettings;
  templates: CopyTemplate[];
  onUpdateSettings: (data: Partial<UserSettings>) => Promise<void>;
  onAddTemplate: (data: Omit<CopyTemplate, "id">) => Promise<void>;
  onRemoveTemplate: (id: string) => Promise<void>;
  onClose: () => void;
}

export function SettingsPanel({
  settings,
  templates,
  onUpdateSettings,
  onAddTemplate,
  onRemoveTemplate,
  onClose,
}: SettingsPanelProps) {
  const [newTmplName, setNewTmplName] = useState("");
  const [newTmplPattern, setNewTmplPattern] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleAddTemplate = async () => {
    if (!newTmplName.trim() || !newTmplPattern.trim()) return;
    await onAddTemplate({ name: newTmplName.trim(), pattern: newTmplPattern.trim(), isDefault: false });
    setNewTmplName("");
    setNewTmplPattern("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">⚙️ 設定</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Git プレフィックス */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">デフォルト Git プレフィックス</p>
        <div className="flex gap-1.5 flex-wrap">
          {GIT_PREFIXES.map((p) => (
            <button
              key={p}
              onClick={() => onUpdateSettings({ defaultPrefix: p })}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                settings.defaultPrefix === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p}/
            </button>
          ))}
        </div>
      </div>

      {/* Jira ベース URL */}
      <div>
        <Input
          label="Jira ベース URL (任意)"
          placeholder="https://yourteam.atlassian.net"
          value={settings.jiraBaseUrl ?? ""}
          onChange={(e) => onUpdateSettings({ jiraBaseUrl: e.target.value || undefined })}
        />
        <p className="text-xs text-gray-400 mt-1">
          ※ コンテンツスクリプトによるチケット自動検出に使用します
        </p>
      </div>

      {/* コピーテンプレート管理 */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">コピーテンプレート</p>
        <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 bg-gray-50 rounded px-2.5 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">{t.name}</p>
                <p className="text-xs font-mono text-gray-400 truncate">{t.pattern}</p>
              </div>
              {!["branch", "commit", "number", "full", "daily"].includes(t.id) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveTemplate(t.id)}
                  className="shrink-0 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon size={12} />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 新規テンプレート追加 */}
        <div className="border border-dashed border-gray-300 rounded p-2 space-y-1.5">
          <p className="text-xs text-gray-500">テンプレート追加</p>
          <Input
            placeholder="名前 (例: Slack mention)"
            value={newTmplName}
            onChange={(e) => setNewTmplName(e.target.value)}
          />
          <Input
            placeholder="パターン (例: <{number}|{title}>)"
            value={newTmplPattern}
            onChange={(e) => setNewTmplPattern(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-gray-400">
            使えるトークン: {"{number}"} {"{title}"} {"{slug}"} {"{prefix}"} {"{date}"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddTemplate}
            disabled={!newTmplName.trim() || !newTmplPattern.trim()}
            className="w-full"
          >
            <PlusIcon size={12} className="mr-1" />
            追加
          </Button>
        </div>
      </div>
    </div>
  );
}
