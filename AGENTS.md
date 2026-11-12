# AGENTS.md — @x-ac/web-design-vue-element-plus

> 本项目级 AI 记忆。任何 AI 代理在本仓库工作前先读此文件，优先于通用推断。
> 用户级跨项目约定（GPG 签名提交、不推送/不打 tag、红线例外等）见全局 `MEMORY.md`。
> 本文件**不得被任何清理/整理动作搬走或改名**。

## 1. 项目身份

- 包名：`@x-ac/web-design-vue-element-plus`（npm scope `@x-ac`，owner：`xyj2156`）。
- 定位：**Element Plus 适配包**——基于 `@x-ac/web-design-vue/kit` 组件作者 SDK，把「协议物料名（`ec-input`）→ Element Plus 组件」的映射、物料元数据、绑定通道、动作副作用、设计器控件，打包成一个独立扩展仓。
- 仓库：`cn-xac/web-design-vue-element-plus`（已改名；GitHub Pages 基路径 `/web-design-vue-element-plus/`）。
- 仓库根即包根：`package.json` 在根，`dist/` 为库构建产物。

## 2. 生态分层

| 层 | 包 | 职责 |
|---|---|---|
| 内核 | `@x-ac/web-design-core` | 框架无关：Schema 协议、`UiAdapter`/`DesignerKit` 契约、解析工具（`parseOptions` 等）、动作注册表 |
| Vue 适配层 | `@x-ac/web-design-vue` | Vue 引擎（渲染器 `SchemaRenderer` + 设计器 `SchemaDesigner`）+ `/kit` 组件作者 SDK |
| 本仓（扩展） | `@x-ac/web-design-vue-element-plus` | Element Plus 的物料实现 + 绑定 + 动作副作用 + 设计器控件 |

原则：**框架无关协议进 `core`；框架相关但 UI 库无关的引擎进适配层；只有具体 UI 库的物料实现放扩展仓。**

## 3. AI 直接使用本包（现成配方）

> 本段让 AI 在本仓库或宿主项目里**直接构建功能**，不依赖先看源码。所有符号均来自已发布包，可复制运行。

### 3.1 符号从哪个包 import（速查）

| 用途 | 符号 | 来源包 |
|---|---|---|
| 应用级注入 / 渲染器 / 工具 | `createVueDesign` `SchemaRenderer`（别名 `SchemaPage`）`toJSON` `validatePage` `createEmptyPage` `materialKey` `getMaterial` `MATERIALS` `toHtml` `migratePage` `resolveDefaults` | `@x-ac/web-design-vue` |
| 设计器 / 仓储 | `SchemaDesigner`（别名 `DesignerView`）`createMemoryRepository` `getPageRepository` `setPageRepository` `useDesignerStore` `PageRepository` | `@x-ac/web-design-vue/designer` |
| 本包适配包 | `elementPlusAdapter` `elementPlusMaterials` `COMPONENT_MAP` `designerKit` `elementAdapter` `EP_FIELD_PATCHES` | `@x-ac/web-design-vue-element-plus` |
| 类型 / 内核协议 | `PageSchema` `NodeSchema` `UiAdapter` `UiEventPayload` `UiEventHook` | `@x-ac/web-design-core` |
| 扩展仓作者 SDK（改本包源码才用） | `defineVueAdapter` `createDesignerKit` `useFieldModel` `VUE_BINDING` | `@x-ac/web-design-vue/kit` |

### 3.2 最小可跑：注册 + 渲染

```ts
// 应用入口（每个宿主应用只做一次）
import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createVueDesign } from "@x-ac/web-design-vue";
import "@x-ac/web-design-vue/style.css";
import { elementPlusAdapter } from "@x-ac/web-design-vue-element-plus";
import App from "./App.vue";

createApp(App).use(ElementPlus).use(createVueDesign({ adapter: elementPlusAdapter })).mount("#app");
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { SchemaRenderer } from "@x-ac/web-design-vue";
import { createEmptyPage } from "@x-ac/web-design-core";

const page = {
  ...createEmptyPage("示例页"),
  children: [
    { id: "name", component: "ec-input", props: { label: "姓名" },
      rules: [{ type: "required", message: "必填" }] },
    { id: "submit", component: "ec-button", props: { text: "提交", type: "primary" },
      events: { click: [{ action: "submitForm", args: { from: "form", to: "rows" } }] } },
  ],
};
const data = ref({ form: {} }); // 表单值落在 data.form.<id>
</script>
<template>
  <SchemaRenderer :page="page" v-model:data="data" @submit="(rows) => console.log(rows)" />
</template>
```

### 3.3 Schema 构造规则（写错会渲染失败或字段不绑定）

- `PageSchema = { id, schemaVersion?, meta?, state?, children: NodeSchema[] }`；用 `createEmptyPage(title)` 起手最稳。
- `NodeSchema = { id, component: "ec-xxx", props?, rules?, events?, children? }`。**`component` 必须带 `ec-` 前缀**（如 `ec-input`），core 的 `materialKey` 虽会归一，但写全名最稳。
- **自动绑定**：渲染器把表单类物料按 `form.<node.id>` 绑定。所以初始数据 `data.form.<id>` 是回显值，`modelValue` 显式绑定优先。
- **options 格式**（易错点）：
  - 下拉/单选/多选：字符串逗号分隔 `"A,B,C"` 或 `{label,value}[]`；
  - `ec-dict-select` 用 `dict: "status"`（**不是 options**）；
  - `ec-cascader` / `ec-tree-select` 的 `options` 是换行分隔的层级文本 `"华东/上海/浦东\n华南/广州/天河"`；
  - `ec-segmented`：`options: "P4,P5,P6,P7"` + `value: "P5"`；
  - `ec-transfer`：`options: "甲,乙"` + `titles: "待选,已选"`。
- **事件**：`events: { click: [{ action, args }] }`，事件名小写（`camelizeEventName` 已归一）。动作链（core 注册）：`toast` `setState` `submitForm` `resetForm` `resetState` `clearList` `navigate` `confirm`。`confirm` 支持 `then: [...]` 嵌套。
- **表达式绑定**：props 里写 `{{ form.n_name }}` 或 `{{ list }}` 取值（`isBindable`/`resolveValue` 在渲染器层求值）。
- **子表单**：`{ id, component: "ec-subform", props: { itemPath: "orders", addText }, children }`，可两级嵌套 → `form.orders[i].goods`。

### 3.4 渲染器实例 API（`ref` 暴露，命令式用）

```ts
const r = ref();
r.value.getData({ validate?: boolean })   // → { data }，带校验不通过抛错
r.value.validate(): boolean              // 整页校验，错误显示到字段下方
r.value.validateField(node: NodeSchema)  // 单字段校验
r.value.reset()                          // 重置表单 + 清错误
r.value.getErrors(): Record<string,string>
r.value.setData(patch)                  // 主动灌数据
```

Props：`:page`（`PageSchema | string`，字符串走 `migratePage` 迁移）、`v-model:data`（整页作用域）、`mode`（`"view"|"edit"`）、`:on-event`（拦截钩子，返回 `false` 或 `p.preventDefault()` 阻断预设动作）、`:adapter`（组件级覆盖全局注入）。
Emits：`update:data` `submit`（submitForm 校验通过后抛数据行）`nodeEvent`（只读通知，即使被阻断也收到）`navigate`。

### 3.5 设计器（必须 Pinia）

```ts
import { createPinia } from "pinia";
// 顺序：pinia 必须在 mount 前 app.use，设计器 store 依赖它
createApp(App).use(ElementPlus).use(createPinia()).use(createVueDesign({ adapter }));

import { SchemaDesigner, createMemoryRepository } from "@x-ac/web-design-vue/designer";
import { createEmptyPage } from "@x-ac/web-design-core";
const repo = createMemoryRepository([createEmptyPage("草稿")]);
// <SchemaDesigner page-id="draft" :repository="repo" @saved="onSaved" @export-schema="onExport" @preview="onPreview" />
```

- Props：`page-id`、`repository`（`PageRepository`：`list/get/save/remove`，生产可换 localStorage/HTTP 实现）、`preview-url?`、`navigate?`。
- Emits：`saved` `export-schema` `back` `preview`。**`preview()` 内部先 `save()` 再 emit**——所以监听 `preview` 后从同一 `repository.get(pageId)` 读到的就是最新设计。
- 设计器顶栏/属性面板自动用本包 `designerKit` 的 Element Plus 控件，无需重复注册。

### 3.6 常见 AI 任务 → 落地做法

| 任务 | 做法 |
|---|---|
| 加一个表单字段 | 在 `page.children` 加 `{ id, component:"ec-xxx", props:{label}, rules? }`，`id` 即 `data.form.<id>` |
| 加校验 | 节点加 `rules: [{ type:"required"\|"pattern"\|"email", message }]` |
| 读取提交数据 | `@submit` 行数据，或 `ref.getData()`，`v-model:data` 实时 |
| 自定义按钮动作 | `events.click` 动作链 |
| 拦截某事件做副作用 | `:on-event="(p)=>{ if(...) return false }"` |
| 嵌套明细 | `ec-subform` + `itemPath` |
| 用设计器搭建 | `SchemaDesigner` + Pinia + `createMemoryRepository` |
| 校验「有无未注册物料」 | `missingComponents(elementPlusAdapter)` 应为空数组 |

## 4. 仓库布局

```
.                                 # 包根，pnpm workspace 成员（"."）
├─ package.json                   # 库元数据；scripts: build/typecheck/test/check/dev/preview
├─ vite.config.ts                 # 库模式构建，external: vue/element-plus/@x-ac/web-design-core|vue|vue/kit
├─ vitest.config.ts               # 测试（tests/）
├─ src/                           # 适配包源码
│  ├─ index.ts                    # defineVueAdapter → elementPlusAdapter；导出 materials/map/kit/actions
│  ├─ components.ts               # COMPONENT_TABLE → prefixedComponents() → COMPONENT_MAP
│  ├─ actions.ts                  # elementAdapter（ElMessage / ElMessageBox 副作用）
│  ├─ materials/                  # blocks.ts(30) / fields.ts(补丁) / forms.ts(9) → elementPlusMaterials
│  ├─ blocks/ fields/            # 物料实现（EP 专有 / 字段组件）
│  ├─ designer/                  # designerKit 的 EP 控件（EpButton / EpSelect / EpSegmented）
│  └─ styles.css
├─ tests/                         # ep-materials.spec.ts / subform.spec.ts / setup.ts
├─ examples/                      # 演示站（私有包 ep-example）
│  ├─ src/App.vue                 # 顶部 4 页签：设计器 / 渲染器 / 物料总览 / 适配包清单
│  ├─ src/schema.ts               # 预置 PageSchema（设计器与渲染器共用）
│  ├─ src/sections/*.vue
│  ├─ vite.config.ts              # 直接消费源码；alias 顺序敏感；pinia dedupe
│  └─ package.json                # dev / build / preview / typecheck
└─ .github/workflows/
   ├─ publish.yml                 # npm 发布（Trusted Publishing / OIDC，tag 触发）
   └─ pages.yml                   # GitHub Pages 部署 examples/dist
```

- `pnpm-workspace.yaml`：`packages: [".", "examples"]`。
- 本地联调：`devDependencies` 用 `link:../project/packages/{core,vue}` 指向上游源码（`../project` 与 `../web-design-vue-element-plus` 并排）。上游仓坏了会直接拖垮本仓类型检查与构建。

## 5. 命令

```bash
pnpm install
pnpm dev                    # 根目录直接起示例站（= pnpm --filter ep-example dev），端口 5174
pnpm typecheck              # vue-tsc -p tsconfig.json --noEmit（库）
pnpm test                   # vitest run
pnpm build                  # 库模式构建到 dist/
pnpm check                  # typecheck + test + build
pnpm --filter ep-example build      # 示例站产物 examples/dist（Pages 用）
pnpm --filter ep-example typecheck
```

> ⚠️ **红线**：默认不要为验证而启动 dev server（监听端口）或拉浏览器。本仓 dev 属用户批准的例外，**仅当用户明确要求本地预览**时方可起。

## 6. 适配包契约（4 件套）

`elementPlusAdapter = defineVueAdapter({ name, components, materials, designer, binding, actions })`：

1. **components**（`COMPONENT_MAP`）：裸名表 `COMPONENT_TABLE` → `prefixedComponents()` 统一加 `ec-` 前缀。新增物料只改 `COMPONENT_TABLE`。
2. **materials**（`elementPlusMaterials`）：`core MATERIALS` + `EP_FIELD_PATCHES`（补丁，同名键覆盖）+ `EP_BLOCK_MATERIALS`/`EP_FORM_MATERIALS`（EP 专有，`portable:false`）。
3. **binding**：`VUE_BINDING`（`modelValue` / `onUpdate:modelValue`），来自 `/kit`，**不要重写**。
4. **actions**（`elementAdapter`）：提供 `notify`(ElMessage) / `confirm`(ElMessageBox)；动作逻辑在 core。

设计器 UI：`designerKit = createDesignerKit({ Button:EpButton, Input, NumberInput, Select:EpSelect, Switch, Segmented:EpSegmented, ColorInput, notify })`。

`src/index.ts` 导出：`elementPlusAdapter`、`elementPlusMaterials`、`COMPONENT_MAP`、`resolveComponent`、`designerKit`、`elementAdapter`、`runActions`、`EP_FIELD_PATCHES`。

## 7. 关键约定与坑

- **Vite alias 顺序（examples/vite.config.ts）**：`@x-ac/web-design-vue/style.css`、`/kit`、`/designer` 必须排在 `@x-ac/web-design-vue` 基础别名**之前**，否则被拼成 `src/index.ts/style.css`。`/designer` 是含 pinia store 的设计器子入口。
- **Pinia 单例**：示例站 `main.ts` 必须 `app.use(createPinia())` 且 `vite dedupe` 含 `pinia`，因为设计器 store 基于 pinia。改示例站若引入真设计器，别漏这步。
- **peerDependencies 不是 dependencies**：core / vue / element-plus / vue 只在 `peerDependencies`，**不要**加进 `dependencies`（用户曾要求移除误加的 dependency）。宿主装本包时自行提供这些。
- **库构建 external**：`vite.config.ts` 把 `vue` / `element-plus` / `@x-ac/web-design-core|vue|vue/kit` 全部 external，`dist` 不含引擎与 EP 本体。
- **dts 路径改写**：`vite-plugin-dts` 的 `beforeWriteFile` 把 `../project/packages/(core|vue)/src...` 重写回包名（`@x-ac/web-design-core`），`pathsToAliases:false` 防止 local 路径泄漏进 `.d.ts`。
- **`ec-subform` 特殊**：不在 `COMPONENT_MAP`，渲染器按 `material.kind === "subform"` 走 `SchemaSubForm.vue`。新增物料若 `kind:"subform"` 无需加映射。
- **examples 的「物料总览」样板**（`CatalogSection.vue` / `MaterialCard.vue` / `helpers.ts`）：是另一任务 `web-design-react-antd` 的参考实现，**保持组件层零改动**；调布局只改 `examples/src/styles.css`（如 `:has()` 宽物料跨列、`@container` 防窄屏溢出）。

## 8. 如何新增一个物料

1. 在 `src/blocks/` 或 `src/fields/` 新建组件（props 能一对一喂 `ElXxx` 就直连，否则包一层 Block/Field）。
2. 在 `src/components.ts` 的 `COMPONENT_TABLE` 加一行 `裸名: 组件`；导出键自动加 `ec-`。
3. 若需 EP 专有属性补丁：`src/materials/fields.ts` 的 `EP_FIELD_PATCHES` 按裸名加字段（用 `mergeFields`，勿重复同名键）。
4. 若 EP 专有且跨库不存在：在 `src/materials/blocks.ts`（展示/导航）或 `forms.ts`（业务）登记，`portable:false` 自动标。
5. 跑 `pnpm test` 看 `tests/ep-materials.spec.ts` 是否仍全绿（含 `missingComponents` 自检）。
6. **不要**在组件内 `inject`/`useUiAdapter`，保持可独立单测；通用解析函数一律从 `@x-ac/web-design-core` 取。

## 9. CI / 发布

- `.github/workflows/publish.yml`：`push: tags: ["v*"]` + `workflow_dispatch`，npm **Trusted Publishing / OIDC**（`permissions: id-token: write`），`pnpm publish --provenance`。首版包需先在 npm 上以手动/占位存在，Trusted Publisher 先在 npm 后台绑定。
- `.github/workflows/pages.yml`：推 `main` 且 `examples/**`、`src/**`、工作流、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`package.json` 有改动时，构建 `ep-example` 并部署 `examples/dist` 到 Pages（基路径 `/web-design-vue-element-plus/`）。手动 `workflow_dispatch` 也可。
- 发布顺序：`core → vue → 扩展`；版本线 fixed 单版本组，本包 `version` 与 core 同步。

## 10. 提交与发布约定

- 按用户开发方式：**本地逐笔 GPG 签名提交**（`git commit -S -s`，`type(scope): 中文描述`），**不推送、不打 tag、不发 Release**（推送/发版由用户执行）。
- 若签名失败 / 提交 `%G?` 为 `N` / 报 `lockfile disappeared`：**先跑 `gpg-unlock`**（已安装 `D:\software\bin\gpg-unlock`，Windows 侧直接敲），再 `git rebase --force-rebase --gpg-sign <base>` 补签。详见全局 `MEMORY.md`。
- 不可逆动作（push、打 tag、npm publish）一律先授权。
