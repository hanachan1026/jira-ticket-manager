import { useState, useCallback } from "react";

export function useClipboard(resetDelay = 1500) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // MV3 service worker では navigator.clipboard が使えない場合があるため
        // document.execCommand をフォールバックとして使用
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), resetDelay);
    },
    [resetDelay]
  );

  return { copy, copiedId };
}
