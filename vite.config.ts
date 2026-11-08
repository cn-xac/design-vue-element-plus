import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

/**
 * 适配包库模式构建：单入口，宿主依赖全部 external。
 * 产物只含「物料实现 + 绑定通道 + 动作副作用」，不含引擎，也不含 Element Plus 本体。
 */
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: "./tsconfig.json",
      entryRoot: "src",
      include: ["src/**/*.ts", "src/**/*.vue"],
      insertTypesEntry: false,
      copyDtsFiles: false,
      // tsconfig 的 paths 是本地联调用的（指向兄弟仓源码），
      // 不能让它被改写进 d.ts —— 产物里的模块说明符必须是包名
      pathsToAliases: false,
      beforeWriteFile: (filePath, content) => ({
        filePath,
        content: content.replace(
          /(?:\.\.\/)+[\w./-]*project\/packages\/(core|vue)\/src/g,
          (_match, name: string) => `@x-ac/design-${name}`,
        ),
      }),
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es"],
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: false,
    rollupOptions: {
      external: ["vue", "element-plus", /^element-plus\//, "@x-ac/design-core", "@x-ac/design-vue"],
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "style.css",
      },
    },
  },
});
