/**
 * 用例全局装配。
 *
 * 引擎不认识任何 UI 库：渲染必须由适配包提供组件实现。
 * 本仓的用例都跑在 jsdom 下，统一在这里把本包提供的 adapter 注入，
 * 用例文件只关心 Schema 与断言。
 */
import { config } from "@vue/test-utils";

if (typeof document !== "undefined") {
  const [{ elementPlusAdapter }, { UI_ADAPTER }] = await Promise.all([
    import("@x-ac/web-design-vue-element-plus"),
    import("@x-ac/web-design-vue"),
  ]);
  config.global.provide = {
    ...(config.global.provide ?? {}),
    [UI_ADAPTER as symbol]: elementPlusAdapter,
  };
}
