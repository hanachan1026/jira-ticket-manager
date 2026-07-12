import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    default_locale: "en",
    version: "0.1.2",
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
