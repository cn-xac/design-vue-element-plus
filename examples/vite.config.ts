import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// 示例直接消费源码：本包（../src）、内核与适配层（../../project/packages/*/src）。
// 顺序敏感：/style.css、/kit 等子路径必须排在 @x-ac/web-design-vue 包别名之前，
// 否则会被拼成 src/index.ts/style.css。
const isPages = process.env.NODE_ENV === "production";

export default defineConfig({
  // 本地 dev 走根路径；构建产物部署到 GitHub Pages 项目页（仓库 web-design-vue-element-plus）时基路径为 /web-design-vue-element-plus/。
  base: isPages ? "/web-design-vue-element-plus/" : "/",
  plugins: [vue()],
  resolve: {
    dedupe: ["vue", "element-plus", "@x-ac/web-design-core", "@x-ac/web-design-vue"],
    alias: [
      { find: "@x-ac/web-design-vue/style.css", replacement: r("../../project/packages/vue/src/styles/tokens.css") },
      { find: "@x-ac/web-design-vue/kit", replacement: r("../../project/packages/vue/src/kit.ts") },
      { find: "@x-ac/web-design-vue", replacement: r("../../project/packages/vue/src/index.ts") },
      { find: "@x-ac/web-design-vue-element-plus", replacement: r("../src/index.ts") },
      { find: "@x-ac/web-design-core", replacement: r("../../project/packages/core/src/index.ts") },
    ],
  },
  server: { port: 5174, host: "127.0.0.1" },
  build: { chunkSizeWarningLimit: 1200 },
});
