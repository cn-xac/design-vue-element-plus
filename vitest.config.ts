import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 扩展仓用例配置。
 *
 * 适配包本身不认识引擎，但冒烟用例必须借渲染器证明「注册的物料真的画得出来」，
 * 因此这里把核心仓 / 引擎仓的源码直接挂到别名上：
 * 两仓并排开发时改完即刻生效，不依赖对方是否已构建 dist。
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // 自引用走源码，避免用例依赖已构建的 dist
      { find: "@x-ac/design-vue-element-plus", replacement: r("./src/index.ts") },
      { find: "@x-ac/design-core", replacement: r("../project/packages/core/src/index.ts") },
      { find: "@x-ac/design-vue", replacement: r("../project/packages/vue/src/index.ts") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    setupFiles: ["tests/setup.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
