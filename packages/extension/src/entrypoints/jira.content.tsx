import React from "react";
import ReactDOM from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { SaveBadge } from "../components/SaveBadge";
import { detectTicketNumber, detectTicketTitle } from "../utils/jiraDetector";
import type { ExtensionMessage } from "../types";

/**
 * ページ訪問を「最近開いた」リストに記録（fire-and-forget）
 */
function trackPageView(number: string, title: string, url: string): void {
  const msg: ExtensionMessage = {
    type: "TRACK_TICKET_VIEW",
    payload: { number, title, url },
  };
  chrome.runtime.sendMessage(msg).catch(() => {
    // background が準備できていない場合は無視
  });
}

/**
 * detectTicketTitle() が値を返すまで MutationObserver で待機する。
 * ボードモーダルはネットワーク取得後に h1 を描画するため、
 * 固定リトライより DOM 変化駆動の方が確実。
 * signal で中断可能、timeout ms 経過したら null を返す。
 */
function waitForTitle(signal: AbortSignal, timeout = 10_000): Promise<string | null> {
  return new Promise((resolve) => {
    const immediate = detectTicketTitle();
    if (immediate) return resolve(immediate);

    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      const t = detectTicketTitle();
      if (t) { cleanup(); resolve(t); }
    });

    function cleanup() {
      clearTimeout(timer);
      observer.disconnect();
      signal.removeEventListener("abort", onAbort);
    }

    function onAbort() { cleanup(); resolve(null); }

    observer.observe(document.body ?? document.documentElement, {
      childList: true,
      subtree: true,
    });
    timer = setTimeout(() => { cleanup(); resolve(null); }, timeout);
    signal.addEventListener("abort", onAbort);
  });
}

export default defineContentScript({
  matches: ["*://*.atlassian.net/browse/*"],
  registration: "runtime", // background.ts で動的に登録
  cssInjectionMode: "ui",

  async main(ctx) {
    let currentUi: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;
    let mountAbort: AbortController | null = null;

    async function mountBadge() {
      // 前回の待機・バッジをキャンセル（SPA ナビゲーション対応）
      mountAbort?.abort();
      mountAbort = new AbortController();
      const { signal } = mountAbort;

      currentUi?.remove();
      currentUi = null;

      const number = detectTicketNumber(window.location.href);
      if (!number) return;

      // h1 が DOM に現れるまで待つ（最大 10 秒）
      const title = (await waitForTitle(signal)) ?? number;
      if (signal.aborted) return;

      // 最近開いたリストに自動追加
      trackPageView(number, title, window.location.href);

      const ui = await createShadowRootUi(ctx, {
        name: "jtm-save-badge",
        position: "inline",
        anchor: "body",
        onMount(container) {
          const root = ReactDOM.createRoot(container);
          root.render(
            <SaveBadge
              number={number}
              title={title}
              url={window.location.href}
            />
          );
          return root;
        },
        onRemove(root) {
          root?.unmount();
        },
      });

      if (signal.aborted) { ui.remove(); return; }
      ui.mount();
      currentUi = ui;
    }

    // 初回マウント
    void mountBadge();

    // Jira SPA のナビゲーション検知:
    // wxt:locationchange は isolated world → main world の history.pushState を
    // インターセプトできないため、MutationObserver で DOM 変化を監視し
    // window.location.href の差分からナビゲーションを検知する。
    let lastHref = window.location.href;

    function handleUrlChange() {
      const href = window.location.href;
      if (href !== lastHref) {
        lastHref = href;
        mountBadge();
      }
    }

    const urlObserver = new MutationObserver(handleUrlChange);
    urlObserver.observe(document.documentElement, { childList: true, subtree: true });
    ctx.onInvalidated(() => urlObserver.disconnect());

    // back/forward ナビゲーション
    ctx.addEventListener(window, "popstate", handleUrlChange);
  },
});
