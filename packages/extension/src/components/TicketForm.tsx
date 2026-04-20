import React, { useState } from "react";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import type { JiraTicket } from "../types";

interface TicketFormProps {
  initialData?: Partial<JiraTicket>;
  onSave: (data: Omit<JiraTicket, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
}

export function TicketForm({ initialData, onSave, onCancel }: TicketFormProps) {
  const [number, setNumber] = useState(initialData?.number ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!number.trim()) errs.number = "チケット番号は必須です";
    else if (!/^[A-Za-z]+-\d+$/.test(number.trim()))
      errs.number = "例: PROJ-123 の形式で入力してください";
    if (!title.trim()) errs.title = "タイトルは必須です";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        number: number.trim().toUpperCase(),
        title: title.trim(),
        summary: summary.trim() || undefined,
        url: url.trim() || undefined,
        status: initialData?.status ?? "todo",
        tags: initialData?.tags,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex flex-col gap-3" onKeyDown={handleKeyDown}>
      <h2 className="text-sm font-semibold text-gray-800">
        {initialData?.id ? "チケットを編集" : "チケットを追加"}
      </h2>

      <Input
        label="チケット番号 *"
        placeholder="例: PROJ-123"
        value={number}
        onChange={(e) => setNumber(e.target.value.toUpperCase())}
        error={errors.number}
        autoFocus
      />
      <Input
        label="タイトル *"
        placeholder="例: Fix login bug"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />
      <Textarea
        label="メモ (任意)"
        placeholder="作業内容の補足など..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
      />
      <Input
        label="Jira URL (任意)"
        placeholder="https://yourteam.atlassian.net/browse/PROJ-123"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        type="url"
      />

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          キャンセル
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
