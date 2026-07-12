import React, { useState } from "react";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { t } from "../utils/i18n";
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
    if (!number.trim()) errs.number = t("formNumberRequired");
    else if (!/^[A-Za-z]+-\d+$/.test(number.trim()))
      errs.number = t("formNumberFormat");
    if (!title.trim()) errs.title = t("formTitleRequired");
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
        {initialData?.id ? t("formEditTitle") : t("formAddTitle")}
      </h2>

      <Input
        label={t("formNumberLabel")}
        placeholder="PROJ-123"
        value={number}
        onChange={(e) => setNumber(e.target.value.toUpperCase())}
        error={errors.number}
        autoFocus
      />
      <Input
        label={t("formTitleLabel")}
        placeholder="Fix login bug"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />
      <Textarea
        label={t("formNoteLabel")}
        placeholder={t("formNotePlaceholder")}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
      />
      <Input
        label={t("formJiraUrlLabel")}
        placeholder="https://yourteam.atlassian.net/browse/PROJ-123"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        type="url"
      />

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          {t("cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
