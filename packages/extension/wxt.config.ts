import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Jira Ticket Manager",
    description:
      "Save Jira ticket info and copy it instantly — branch names, commit prefixes, daily reports.",
    version: "0.1.0",
    permissions: ["storage", "clipboardWrite", "scripting", "tabs"],
    host_permissions: ["*://*.atlassian.net/*"],
    optional_host_permissions: ["*://*/*"],
    action: {
      default_popup: "popup.html",
      default_icon: {
        "16": "icon/16.png",
        "48": "icon/48.png",
        "128": "icon/128.png",
      },
    },
  },
});
