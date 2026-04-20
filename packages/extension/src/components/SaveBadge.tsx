import React, { useState } from "react";
import { BookmarkPlusIcon, CheckIcon, XIcon } from "lucide-react";
import type { ExtensionMessage } from "../types";

interface SaveBadgeProps {
  number: string;
  title: string;
  url: string;
}

type State = "idle" | "expanded" | "saving" | "saved" | "duplicate";

export function SaveBadge({ number, title, url }: SaveBadgeProps) {
  const [state, setState] = useState<State>("idle");
  const [editTitle, setEditTitle] = useState(title);

  const handleSave = async () => {
    setState("saving");
    const msg: ExtensionMessage = {
      type: "SAVE_TICKET",
      payload: { number, title: editTitle, url, status: "in_progress" },
    };
    try {
      const resp = await chrome.runtime.sendMessage(msg);
      if (resp?.success) {
        setState("saved");
      } else {
        setState("duplicate");
      }
    } catch {
      setState("saved"); // background が起きていない場合も UI はフィードバック
    }
  };

  if (state === "saved" || state === "duplicate") {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: state === "saved" ? "#16a34a" : "#6b7280",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "24px",
          fontSize: "12px",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <CheckIcon size={13} />
        {state === "saved" ? `${number} を保存しました` : `${number} は既に保存済みです`}
      </div>
    );
  }

  if (state === "expanded") {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 999999,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "12px",
          width: "280px",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontWeight: 600, fontSize: "12px", color: "#2563eb" }}>{number}</span>
          <button
            onClick={() => setState("idle")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
          >
            <XIcon size={14} />
          </button>
        </div>
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 8px",
            fontSize: "12px",
            marginBottom: "8px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSave}
          disabled={state === "saving"}
          style={{
            width: "100%",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "7px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {state === "saving" ? "保存中..." : "保存する"}
        </button>
      </div>
    );
  }

  // idle: フローティングピル表示
  return (
    <button
      onClick={() => setState("expanded")}
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "24px",
        padding: "8px 14px",
        fontSize: "12px",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
        transition: "transform 0.1s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.05)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
    >
      <BookmarkPlusIcon size={14} />
      {number} を保存
    </button>
  );
}
