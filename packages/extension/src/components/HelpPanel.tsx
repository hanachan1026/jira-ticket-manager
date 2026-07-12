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
  ZapIcon,
} from "lucide-react";
import { t } from "../utils/i18n";

interface Props {
  onClose: () => void;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-blue-500">{icon}</span>
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="space-y-2.5 pl-1">{children}</div>
    </div>
  );
}

function Item({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-100 text-gray-600 rounded px-1 py-0.5 font-mono text-[10px]">
      {children}
    </code>
  );
}

function UrlPattern({ pattern }: { pattern: string }) {
  return (
    <div className="mt-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono text-[10px] text-gray-500 break-all">
      {pattern}
    </div>
  );
}

export function HelpPanel({ onClose }: Props) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex items-center gap-1.5">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <HelpCircleIcon size={13} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{t("helpTitle")}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 text-xs">

        <Section title={t("helpBasicsTitle")} icon={<PlusIcon size={13} />}>
          <Item icon={<PlusIcon size={12} />} label={t("helpAddLabel")}>
            {t("helpAddDesc")}
          </Item>
          <Item icon={<CopyIcon size={12} />} label={t("helpCopyLabel")}>
            {t("helpCopyDesc")}
          </Item>
          <Item icon={<StarIcon size={12} />} label={t("helpWipLabel")}>
            {t("helpWipDesc")}
          </Item>
          <Item icon={<ClipboardListIcon size={12} />} label={t("helpDailyLabel")}>
            {t("helpDailyDesc")}
          </Item>
        </Section>

        <Section title={t("helpJiraTitle")} icon={<GlobeIcon size={13} />}>
          <Item icon={<ZapIcon size={12} />} label={t("helpDefaultUrlLabel")}>
            <p>{t("helpDefaultUrlDesc")}</p>
            <UrlPattern pattern="*.atlassian.net/browse/PROJ-123" />
            <UrlPattern pattern="*.atlassian.net/issues/PROJ-123" />
            <UrlPattern pattern="*.atlassian.net/jira/...?selectedIssue=PROJ-123" />
            <p className="mt-1 text-gray-400">{t("helpDefaultUrlNote")}</p>
          </Item>

          <Item icon={<ClockIcon size={12} />} label={t("helpPageOpenLabel")}>
            <p>{t("helpPageOpenDesc")}</p>
            <ol className="mt-1 space-y-0.5 list-decimal list-inside text-gray-500">
              <li>{t("helpPageOpenStep1")}</li>
              <li>{t("helpPageOpenStep2")}</li>
              <li>{t("helpPageOpenStep3")}</li>
              <li>{t("helpPageOpenStep4")}</li>
            </ol>
            <p className="mt-1">{t("helpPageOpenNote")}</p>
          </Item>

          <Item icon={<PlusIcon size={12} />} label={t("helpBadgeLabel")}>
            {t("helpBadgeDesc")}
          </Item>
        </Section>

        <Section title={t("helpSettingsTitle")} icon={<SettingsIcon size={13} />}>
          <Item icon={<GlobeIcon size={12} />} label={t("helpCustomJiraLabel")}>
            <p>{t("helpCustomJiraDesc")}</p>
            <p className="mt-1">{t("helpCustomJiraExamples")}</p>
            <UrlPattern pattern="https://jira.mycompany.com → jira.mycompany.com/* すべて" />
            <UrlPattern pattern="https://mycompany.com/jira → mycompany.com/jira/* 以下" />
            <p className="mt-1">{t("helpCustomJiraNote")}</p>
          </Item>

          <Item icon={<GitBranchIcon size={12} />} label={t("helpGitPrefixLabel")}>
            {t("helpGitPrefixDesc").split("{prefix}").map((part, i) =>
              i === 0 ? part : <React.Fragment key={i}><Code>{"{prefix}"}</Code>{part}</React.Fragment>
            )}
          </Item>

          <Item icon={<CopyIcon size={12} />} label={t("helpTemplateLabel")}>
            {t("helpTemplateDesc").split(/(\{[^}]+\})/).map((part, i) =>
              /^\{[^}]+\}$/.test(part) ? <Code key={i}>{part}</Code> : part
            )}
          </Item>
        </Section>

      </div>
    </div>
  );
}
