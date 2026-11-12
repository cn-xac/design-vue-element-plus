# @x-ac/web-design-vue-element-plus

基于 [@x-ac/web-design-vue](https://github.com/cn-xac) 适配层的 **Element Plus 扩展包**：把「协议物料名（`ec-input`）→ Element Plus 组件」的映射、物料元数据、双向绑定通道、动作副作用、设计器控件，打包成一个独立仓库。装好它，你的 Vue 应用就能用一份 JSON（Schema）渲染出完整表单/页面，并自带可视化设计器。

---

## 快速上手（怎么用）

### 1. 安装

本包把 `core` / `vue` / `element-plus` / `vue` 声明为 **peerDependencies**，需要宿主自行安装（npm 不会自动装 peer）：

```bash
pnpm add @x-ac/web-design-vue-element-plus \
         @x-ac/web-design-core @x-ac/web-design-vue \
         element-plus vue
```

### 2. 注册适配包（应用入口，一次即可）

```ts
// main.ts
import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createVueDesign } from "@x-ac/web-design-vue";
import "@x-ac/web-design-vue/style.css";
import { elementPlusAdapter } from "@x-ac/web-design-vue-element-plus";
import App from "./App.vue";

createApp(App)
  .use(ElementPlus)
  .use(createVueDesign({ adapter: elementPlusAdapter })) // 全局注入适配包
  .mount("#app");
```

### 3. 渲染一个页面

页面就是一份 `PageSchema`（JSON）。物料用协议名 `ec-xxx`，表单字段的 `id` 即数据键，渲染器会自动把值绑到 `form.<id>`。

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { SchemaRenderer } from "@x-ac/web-design-vue";
import { createEmptyPage } from "@x-ac/web-design-core";

const page = {
  ...createEmptyPage("员工登记"),
  children: [
    { id: "name", component: "ec-input", props: { label: "姓名", clearable: true },
      rules: [{ type: "required", message: "请填写姓名" }] },
    { id: "dept", component: "ec-select", props: { label: "部门", options: "技术中心,产品中心,设计中心" } },
    { id: "submit", component: "ec-button", props: { text: "提交", type: "primary" },
      events: { click: [{ action: "submitForm", args: { from: "form", to: "rows" } }] } },
  ],
};

// v-model:data 是整页作用域；表单值落在 data.form.<字段id>
const data = ref({ form: {} });
</script>

<template>
  <SchemaRenderer :page="page" v-model:data="data" @submit="(rows) => console.log('提交:', rows)" />
</template>
```

打开页面即可看到 Element Plus 的输入框、下拉、按钮，填完点「提交」会触发校验并 `@submit` 抛出数据行。

### 4. 读取 / 导出数据

三种方式任选：

```ts
// (a) v-model 双向同步 —— data.form 始终是最新值
// (b) submitForm 动作后，@submit 拿到组装好的数据行
// (c) 命令式主动导出（可带校验）
const rendererRef = ref();
function exportData() {
  const { data } = rendererRef.value.getData({ validate: true }); // 校验不通过抛错
  console.log(data.form); // { name, dept }
}
```

```vue
<SchemaRenderer ref="rendererRef" :page="page" v-model:data="data" @submit="onSubmit" />
```

---

## 核心概念

| 概念 | 是什么 | 来自 |
|---|---|---|
| **Schema（PageSchema）** | 描述页面的 JSON：`children` 是一棵节点树，节点 `{ id, component:"ec-xxx", props, rules?, events? }` | `core` |
| **适配包（adapter）** | 把协议名映射到真实组件、提供绑定通道与动作副作用（消息框）的插件 | 本包 `elementPlusAdapter` |
| **SchemaRenderer** | 消费 Schema 画出真实页面、双向绑定数据、派发事件 | `@x-ac/web-design-vue` |
| **SchemaDesigner** | 拖拽搭建 Schema 的可视化设计器（需 Pinia） | `@x-ac/web-design-vue/designer` |
| **动作链（events）** | 节点事件（如 `click`）触发一串预设动作：`toast` / `setState` / `submitForm` / `resetForm` / `confirm` | `core` 注册，本包提供副作用 |

---

## 常见场景配方

### 渲染一个字段集合（栅格 + 校验）

```ts
const page = {
  ...createEmptyPage("信息录入"),
  children: [
    { id: "row", component: "ec-row", props: { gutter: 16 }, children: [
      { id: "name", component: "ec-col", props: { span: 12 }, children: [
        { id: "name", component: "ec-input", props: { label: "姓名" },
          rules: [{ type: "required", message: "必填" }] },
      ]},
      { id: "age", component: "ec-col", props: { span: 12 }, children: [
        { id: "age", component: "ec-number", props: { label: "年龄", min: 0, max: 120 } },
      ]},
    ]},
  ],
};
```

### 下拉 / 单选 / 多选的选项

`options` 支持两种写法，二选一：

```ts
// 逗号分隔字符串（value 即文案本身）
props: { options: "技术中心,产品中心,设计中心" }
// 或 { label, value } 数组（可让 value 与展示文案不同）
props: { options: [{ label: "技术中心", value: "tech" }, { label: "产品中心", value: "pm" }] }
```

特殊物料写法：
- 字典选择：`ec-dict-select` 用 `dict: "status"`（不是 options）
- 级联 / 树选择：`ec-cascader` / `ec-tree-select` 的 `options` 用换行分隔的层级文本 `"华东/上海/浦东\n华南/广州/天河"`
- 分段器：`ec-segmented` 用 `options: "P4,P5,P6,P7"` 加 `value: "P5"`
- 穿梭框：`ec-transfer` 用 `options: "甲,乙,丙"` + `titles: "待选,已选"`

### 按钮动作链

```ts
{ id: "save", component: "ec-button", props: { text: "保存" },
  events: { click: [
    { action: "toast", args: { text: "正在保存…", type: "info" } },
    { action: "submitForm", args: { from: "form", to: "rows", successText: "保存成功" } },
  ] } }
```

`confirm` 可嵌套后续动作（用户确认后才执行）：

```ts
{ id: "reset", component: "ec-button", props: { text: "重置", type: "danger" },
  events: { click: [
    { action: "confirm", args: { text: "确定清空？", then: [
      { action: "resetForm", args: { path: "form" } },
    ] } },
  ] } }
```

### 拦截事件（宿主副作用）

```vue
<script setup lang="ts">
import type { UiEventPayload } from "@x-ac/web-design-core";
function onEvent(p: UiEventPayload) {
  // 返回 false 或 p.preventDefault() 可阻断该节点的预设动作
  if (p.nodeId === "save") console.log("即将执行保存动作");
}
</script>
<template>
  <SchemaRenderer :page="page" v-model:data="data" :on-event="onEvent" @node-event="onNotify" />
</template>
```

### 子表单（可嵌套明细数组）

```ts
{ id: "orders", component: "ec-subform", props: { label: "订单", itemPath: "orders", addText: "添加订单" },
  children: [
    { id: "o_no", component: "ec-input", props: { label: "订单号" } },
    { id: "o_amount", component: "ec-number", props: { label: "金额" } },
    // 第二层子表单：form.orders[i].goods 为数组
    { id: "goods", component: "ec-subform", props: { label: "商品明细", itemPath: "goods", addText: "添加商品" },
      children: [
        { id: "g_name", component: "ec-input", props: { label: "商品名" } },
      ] },
  ] }
```

### 用设计器搭建页面（需 Pinia）

```ts
// main.ts 额外挂载 Pinia（设计器 store 依赖它）
import { createPinia } from "pinia";
createApp(App).use(ElementPlus).use(createPinia()).use(createVueDesign({ adapter }));
```

```vue
<script setup lang="ts">
import { SchemaDesigner, createMemoryRepository } from "@x-ac/web-design-vue/designer";
import { createEmptyPage } from "@x-ac/web-design-core";

const repo = createMemoryRepository([createEmptyPage("草稿页")]);
</script>
<template>
  <SchemaDesigner page-id="draft" :repository="repo"
    @saved="() => console.log('已保存')"
    @export-schema="(s) => console.log('Schema:', s)" />
</template>
```

设计器的顶栏/属性面板自动使用本包的 Element Plus 控件（`designerKit`）。`repository` 是框架无关的仓储接口（`list` / `get` / `save` / `remove`），生产环境可换成 localStorage 或 HTTP 实现。

---

## 可用物料清单

本包在 core 通用物料之外，补齐了 Element Plus 专有的 `ec-*` 组件。完整、可交互的清单见**示例站的「物料总览」页签**（每张卡片即时渲染）。常用分类：

| 分类 | 协议物料（`ec-` 前缀） |
|---|---|
| 输入 | `input` `textarea` `number` `input-tag` `input-otp` `autocomplete` `color-picker` |
| 选择 | `select` `radio` `checkbox` `switch` `cascader` `tree-select` `transfer` `segmented` |
| 日期 | `date` `time-picker` |
| 业务 | `amount-input`（金额）`dict-select`（字典）`org-picker`（组织） |
| 布局 | `row` `col` `card` `space` `divider` `tabs` `grid` `subform` |
| 展示 | `title` `text` `alert` `link` `tag` `badge` `image` `table` `timeline` `steps` `progress` `statistic` |
| 交互 | `button` `dialog` `drawer` |

> 每张物料卡片的渲染用的是同一套 `SchemaRenderer`，所见即所得。

---

## 本地示例站

`examples/` 是一个可运行演示站（Vite + Vue3 + Element Plus），顶部四个页签覆盖了适配包主要能力：

```bash
pnpm install
pnpm dev                            # 仓库根目录直接起示例站（端口 5174）
pnpm --filter ep-example build     # 产物到 examples/dist
```

四个页签：
1. **设计器**：真 `SchemaDesigner`，点「保存」写回内存仓储，点「预览」直接切到「渲染器」页签渲染当前设计。
2. **渲染器**：`SchemaRenderer` 消费同一份预置 `PageSchema`，展示实时作用域、事件派发、提交校验、`ref.getData()` 导出。
3. **物料总览**：把本包实现的全部门物料逐张实时渲染预览（该实现是另一任务 `web-design-react-antd` 的参考样板）。
4. **适配包清单**：可视化组件映射表、物料统计、`missingComponents(adapter)` 自检、设计器控件。

---

## 架构与生态位置（背景）

| 层 | 包 | 职责 |
|---|---|---|
| 内核 | `@x-ac/web-design-core` | 框架无关：Schema 协议、`UiAdapter`/`DesignerKit` 契约、解析工具、动作注册表 |
| Vue 适配层 | `@x-ac/web-design-vue` | Vue 引擎（渲染器 `SchemaRenderer` + 设计器 `SchemaDesigner`）+ `/kit` 组件作者 SDK |
| 本仓（扩展） | `@x-ac/web-design-vue-element-plus` | Element Plus 的物料实现 + 绑定 + 动作副作用 + 设计器控件 |

**本仓如何基于 `/kit` 实现**：`src/index.ts` 用 `defineVueAdapter` 组装出 `elementPlusAdapter`，映射表由 `prefixedComponents()` 归一；受控字段用 `useFieldModel` 收敛样板；动作副作用由 `elementAdapter`（ElMessage / ElMessageBox）提供。设计器 UI 由 `designerKit`（EpButton / EpSelect / EpSegmented …）兜底 Element Plus 控件，保证「设计时与上线态同 UI」。库构建时把 `vue` / `element-plus` / `@x-ac/web-design-core|vue|vue/kit` 全部 external，`dist` 不含引擎与 EP 本体。

---

## 命令与依赖

```bash
pnpm install
pnpm typecheck      # vue-tsc
pnpm test           # vitest run，逐物料冒烟渲染
pnpm build          # 库模式构建到 dist/
pnpm check          # typecheck + test + build
```

```jsonc
"peerDependencies": {
  "@x-ac/web-design-core": "^1.0.0",
  "@x-ac/web-design-vue": "^1.0.0",
  "element-plus": "^2.6.0",
  "vue": "^3.4.0"
}
```

> 在线示例站通过 GitHub Pages 自动部署（`.github/workflows/pages.yml`：推 `main` 且示例 / 源码 / 工作流 / 锁文件有改动即发布，基路径 `/web-design-vue-element-plus/`）。

## 版本对齐

内核、适配层与扩展共用一条版本线（fixed 单版本组）：本包 `version` 与 `@x-ac/web-design-core` 同步升号；`peerDependencies` 下界只在协议破坏性变更时调整。发布顺序 `core → vue → 扩展`。
