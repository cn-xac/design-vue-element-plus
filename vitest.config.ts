import { fileURLToPath, URL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Vite 8 起 SSR 环境不自动注入 fs，defineProps<ImportedType>() 需要显式提供 */
const sfcFs = {
  fileExists: (file: string) => existsSync(file),
  readFile: (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : undefined),
};

/**
 * 扩展仓用例配置。
 *
 * 适配包本身不认识引擎，但冒烟用例必须借渲染器证明「注册的物料真的画得出来」，
 * 因此这里把核心仓 / 引擎仓的源码直接挂到别名上：
 * 两仓并排开发时改完即刻生效，不依赖对方是否已构建 dist。
 */
export default defineConfig({
  plugins: [vue({ script: { fs: sfcFs } })],
  resolve: {
    // 引擎源码来自兄弟仓，运行时也必须去重到本仓的 vue / element-plus，
    // 否则 provide/inject 与 reactivity 会跨副本静默失效
    dedupe: ["vue", "element-plus"],
    alias: [
      // 自引用走源码，避免用例依赖已构建的 dist
      { find: "@x-ac/design-vue-element-plus", replacement: r("./src/index.ts") },
      { find: "@x-ac/design-core", replacement: r("../project/packages/core/src/index.ts") },
      // 顺序敏感：子路径必须先于包别名，否则会被拼成 index.ts/kit
      { find: "@x-ac/design-vue/kit", replacement: r("../project/packages/vue/src/kit.ts") },
      { find: "@x-ac/design-vue", replacement: r("../project/packages/vue/src/index.ts") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    setupFiles: ["tests/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    fsModuleCache: false,
  },
});
