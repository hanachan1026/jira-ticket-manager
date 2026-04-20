import React from "react";
import ReactDOM from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { SaveBadge } from "../components/SaveBadge";
import { detectTicketNumber, detectTicketTitle } from "../utils/jiraDetector";

export default defineContentScript({
  matches: ["*://*.atlassian.net/browse/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    function mountBadge() {
      const number = detectTicketNumber(window.location.href);
      if (!number) return null;

      // タイトルの取得をリトライ (Jira SPA は DOM の準備が遅い場合がある)
      let attempts = 0;
      const tryMount = async (): Promise<void> => {
        const title = detectTicketTitle() ?? number;

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

        ui.mount();
      };

      // Jira の SPA がタイトルを描画するまで最大 3 秒待つ
      const retryId = setInterval(() => {
        if (detectTicketTitle() || ++attempts >= 6) {
          clearInterval(retryId);
          tryMount();
        }
      }, 500);
    }

    // 初回マウント
    mountBadge();

    // Jira SPA のナビゲーション (ブラウザ履歴変更) に追従
    ctx.addEventListener(window, "wxt:locationchange" as keyof WindowEventMap, () => {
      mountBadge();
    });
  },
});
