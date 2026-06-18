import React, { useState } from "react";
import { PlusIcon, TrashIcon, CloudIcon, HardDriveIcon, FileIcon, AlertTriangleIcon, CheckCircleIcon, KeyIcon } from "lucide-react";
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
  // ファイルストレージ関連
  storageMode: "chrome" | "file";
  enableFileStorage: () => Promise<boolean>;
  disableFileStorage: () => Promise<void>;
  migrateToFile: () => Promise<void>;
  requestFilePermission: () => Promise<boolean>;
  isFileStorageAvailable: boolean;
  needsPermission: boolean;
  // カスタムドメイン権限
  requestCustomDomainPermission?: () => Promise<boolean>;
  hasCustomDomainPermission?: boolean;
}

function isCustomDomain(url?: string): boolean {
  if (!url) return false;
  try { return !new URL(url).hostname.endsWith(".atlassian.net"); }
  catch { return false; }
}

export function SettingsPanel({
  settings,
  templates,
  onUpdateSettings,
  onAddTemplate,
  onRemoveTemplate,
  onClose,
  storageMode,
  enableFileStorage,
  disableFileStorage,
  migrateToFile,
  requestFilePermission,
  isFileStorageAvailable,
  needsPermission,
  requestCustomDomainPermission,
  hasCustomDomainPermission,
}: SettingsPanelProps) {
  const [newTmplName, setNewTmplName] = useState("");
  const [newTmplPattern, setNewTmplPattern] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  const handleAddTemplate = async () => {
    if (!newTmplName.trim() || !newTmplPattern.trim()) return;
    await onAddTemplate({ name: newTmplName.trim(), pattern: newTmplPattern.trim(), isDefault: false });
    setNewTmplName("");
    setNewTmplPattern("");
  };

  const handleEnableFileStorage = async () => {
    setFileError(null);
    const success = await enableFileStorage();
    if (!success) {
      setFileError("ファイルの選択がキャンセルされました");
    }
  };

  const handleMigrateToFile = async () => {
    setFileError(null);
    setMigrating(true);
    try {
      await migrateToFile();
    } catch {
      setFileError("移行に失敗しました");
    }
    setMigrating(false);
  };

  const handleRequestPermission = async () => {
    setFileError(null);
    const granted = await requestFilePermission();
    if (!granted) {
      setFileError("権限が付与されませんでした");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">設定</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* データ保存先 */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">データ保存先</p>
        <div className="space-y-1.5">
          {/* Chrome Sync */}
          <button
            onClick={() => {
              if (storageMode === "file") {
                disableFileStorage();
              } else {
                onUpdateSettings({ storageArea: "sync" });
              }
            }}
            className={`w-full flex items-center gap-2 p-2 rounded border text-left transition-colors ${
              settings.storageArea === "sync" && storageMode !== "file"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <CloudIcon size={14} className={settings.storageArea === "sync" && storageMode !== "file" ? "text-blue-600" : "text-gray-400"} />
            <div className="flex-1">
              <p className="text-xs font-medium">Chrome Sync</p>
              <p className="text-xs text-gray-400">デバイス間で同期</p>
            </div>
            {settings.storageArea === "sync" && storageMode !== "file" && (
              <CheckCircleIcon size={14} className="text-blue-600" />
            )}
          </button>

          {/* ローカル */}
          <button
            onClick={() => {
              if (storageMode === "file") {
                disableFileStorage();
              }
              onUpdateSettings({ storageArea: "local" });
            }}
            className={`w-full flex items-center gap-2 p-2 rounded border text-left transition-colors ${
              settings.storageArea === "local" && storageMode !== "file"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <HardDriveIcon size={14} className={settings.storageArea === "local" && storageMode !== "file" ? "text-blue-600" : "text-gray-400"} />
            <div className="flex-1">
              <p className="text-xs font-medium">ローカル</p>
              <p className="text-xs text-gray-400">このブラウザのみ</p>
            </div>
            {settings.storageArea === "local" && storageMode !== "file" && (
              <CheckCircleIcon size={14} className="text-blue-600" />
            )}
          </button>

          {/* ローカルファイル */}
          {isFileStorageAvailable && (
            <div
              className={`w-full p-2 rounded border ${
                storageMode === "file" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileIcon size={14} className={storageMode === "file" ? "text-blue-600" : "text-gray-400"} />
                <div className="flex-1">
                  <p className="text-xs font-medium">ローカルファイル</p>
                  <p className="text-xs text-gray-400">JSONファイルに保存</p>
                </div>
                {storageMode === "file" ? (
                  <div className="flex items-center gap-1">
                    {needsPermission ? (
                      <Button variant="secondary" size="sm" onClick={handleRequestPermission}>
                        <KeyIcon size={10} className="mr-1" />
                        権限を付与
                      </Button>
                    ) : (
                      <CheckCircleIcon size={14} className="text-green-600" />
                    )}
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={handleEnableFileStorage}>
                    設定
                  </Button>
                )}
              </div>

              {storageMode !== "file" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMigrateToFile}
                  disabled={migrating}
                  className="w-full mt-2 text-xs"
                >
                  {migrating ? "移行中..." : "現在のデータをファイルに移行"}
                </Button>
              )}

              {storageMode === "file" && !needsPermission && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircleIcon size={10} />
                  ファイルストレージ有効
                </p>
              )}

              {fileError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangleIcon size={10} />
                  {fileError}
                </p>
              )}
            </div>
          )}
        </div>
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
        {isCustomDomain(settings.jiraBaseUrl) && (
          hasCustomDomainPermission ? (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1.5">
              <CheckCircleIcon size={10} /> カスタムドメインへのアクセスが許可されています
            </p>
          ) : (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <AlertTriangleIcon size={10} className="text-amber-500" />
              <span className="text-xs text-amber-600">このドメインへのアクセス権限が必要です</span>
              {requestCustomDomainPermission && (
                <Button variant="secondary" size="sm" onClick={requestCustomDomainPermission}>
                  <KeyIcon size={10} className="mr-1" />権限を付与
                </Button>
              )}
            </div>
          )
        )}
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
