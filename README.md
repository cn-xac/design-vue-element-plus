# design-vue-element-plus

`@x-ac/design-vue-element-plus`：基于 `@x-ac/design-vue/kit` 适配层实现的 Element Plus 扩展仓（物料实现 + 绑定通道 + 动作副作用 + 设计器控件）。
从 `web-desgin` 主仓拆出的独立单包仓库，仓库根即包根。

## 在本生态中的位置

| 层 | 仓库 | 职责 |
|---|---|---|
| 内核 | `web-desgin` → `@x-ac/design-core` | 框架无关的协议与通用工具：Schema、`UiAdapter` 契约、解析工具、`defineAdapter` |
| Vue 适配层 | `web-desgin` → `@x-ac/design-vue` | Vue 运行时引擎（渲染器 + 设计器）+ `@x-ac/design-vue/kit` 组件作者 SDK |
| React 适配层 | `web-desgin` → `@x-ac/design-react` | React 运行时引擎 + `@x-ac/design-react/kit` 组件作者 SDK |
| 扩展（本仓） | `design-vue-element-plus` | 基于 `/kit` 组装 Element Plus 适配包，`vue-*` 扩展的参考实现 |
| 未来扩展 | `vue-icon-xxx`、`react-ant` … | `vue-*` 基于 `design-vue/kit`，`react-*` 基于 `design-react/kit`，各自独立仓库 |

**分层原则**：框架无关的协议与工具一律进 `core`；框架相关但 UI 库无关的引擎与组件作者 SDK 在对应适配层；只有具体 UI 库的物料实现放扩展仓。

## 本仓如何基于 design-vue 实现

`dist/index.js` 可直接核验真实依赖，不再是「只声明 peer、零引用」：

```js
import { useFieldModel, createDesignerKit, defineVueAdapter, VUE_BINDING } from "@x-ac/design-vue/kit";
import { parsePairs, parseLabels, parsePaths, parseOptions, prefixedComponents, ... } from "@x-ac/design-core";
import { ... } from "element-plus";
import { ... } from "vue";
```

| 来源 | 本仓用到的能力 |
|---|---|
| `@x-ac/design-core` | `UiAdapter` / `DesignerKit` / `DesignerControlProps` 契约；`parsePairs` / `parseLabels` / `parsePaths` / `parseOptions`；`prefixedComponents` / `defineAdapter` / `bindModel` |
| `@x-ac/design-vue/kit` | `defineVueAdapter`（组装适配包）、`createDesignerKit`（归一化设计器控件）、`useFieldModel`（受控字段通道）、`VUE_BINDING` |
| `element-plus` / `vue` | 具体物料实现 |

`components.ts` 的映射表归一化改走 core 的 `prefixedComponents`；14 个受控字段中的 `FieldSelect` / `FieldRadio` / `FieldCheckbox` 用 `useFieldModel` 收敛 `onChange` 样板；`EpButton` 的 props 契约来自 core 的 `DesignerControlProps`。

> `/kit` 是**纯净子入口**：不 import 任何 `.vue`、CSS、渲染器或 pinia，产物约 0.74 kB。所以扩展仓的物料组件仍可在 jsdom / SSR 里独立挂载，不会被拖进设计器样式与引擎上下文；`UI_ADAPTER` 注入符号依旧由引擎内部持有，宿主用 `createVueDesign({ adapter: elementPlusAdapter })` 注入。

## 目录

```
src/
  index.ts            # defineVueAdapter 组装 elementPlusAdapter / designerKit
  components.ts       # 协议物料名 → Element Plus 组件（prefixedComponents 归一化）
  actions.ts          # 消息 / 确认框副作用
  materials/          # 物料元数据（blocks / fields / forms）
  blocks/ fields/     # 物料实现（解析工具已从 core import）
  designer/           # 设计器自身 UI 的 Element Plus 实现（EpButton 等）
tests/                # 逐物料冒烟渲染与属性对齐用例
scripts/clean-dist.mjs
```

## 依赖与本地联调

```jsonc
"peerDependencies": {
  "@x-ac/design-core": "^1.0.0", "@x-ac/design-vue": "^1.0.0",
  "element-plus": "^2.6.0", "vue": "^3.4.0"
}

// 本地联调仍用 link 指向上游源码（与 CI 同构）
"devDependencies": { "@x-ac/design-core": "link:../project/packages/core",
                     "@x-ac/design-vue": "link:../project/packages/vue" }
```

本地两仓并排，`/kit` 子入口需要单独挂别名（Vite alias 是前缀匹配，顺序必须在包别名之前）：

```
F:\web\web-design\
  project\                     # 核心仓（core / vue / react）
  design-vue-element-plus\     # 本仓
```

- `tsconfig.json#paths`：`@x-ac/design-vue/kit` → `../project/packages/vue/src/kit.ts`
- `vitest.config.ts#alias`：同上，并配 `dedupe: ["vue", "element-plus"]`
- `vite.config.ts#external`：列出 `@x-ac/design-vue/kit`，产物保持外部化
- `tsconfig.json#paths` 里把 `vue` / `element-plus` 强制指向本仓 `node_modules`，避免跨仓两份 `@vue/runtime-core` 导致 `Component` 类型互不兼容

> 发版后把两条 `link:` 换成版本范围，删掉 `paths` / `alias` 里的源码映射即可解绑。

`react-*` 扩展把上表的 `design-vue` / `vue` 换成 `design-react` / `react` + 目标 UI 库，另有四处差异：

1. SDK 子入口是 `@x-ac/design-react/kit`，用 `defineReactAdapter`；
2. 绑定通道用 `{ prop: "value", event: "onChange" }`（`REACT_BINDING`），不是 `modelValue / onUpdate:modelValue`；
3. 注入用 `<ReactDesignProvider adapter>` 或 `createReactDesign(adapter)`，优先级 `ui` prop > Provider > `nativeAdapter`；
4. `design-react` 暂无设计器，`UiAdapter.designer / editors / provider / propAliases` 暂不消费，实现 `components / materials / binding / actions` 四件套即可。

## 使用示例（Examples）

`examples/` 是一个可运行的演示站（Vite + Vue3 + Element Plus），源码驱动、直接消费本仓 `src` 与上游 `@x-ac/design-core` / `@x-ac/design-vue` 的源码，等价于「克隆即跑」。站内分三个栏目，覆盖适配包的主要能力：

```bash
pnpm install
pnpm --filter ep-example dev      # 本地预览 http://127.0.0.1:5174
pnpm --filter ep-example build    # 产物到 examples/dist
```

三个栏目演示了：

1. **表单与数据绑定**：一份 Schema 串起 18 类 Element Plus 表单控件，全部经 `v-model:data` 双向绑定到 `data.form`；提交触发内核 `validatePage` 校验并调用适配包的 `elementAdapter.notify`（ElMessage 副作用），重置清空作用域，`toJSON(page)` 导出 Schema。覆盖 `ec-input` / `ec-number` / `ec-select` / `ec-radio` / `ec-checkbox` / `ec-switch` / `ec-date` / `ec-time-picker` / `ec-slider` / `ec-rate` / `ec-color-picker` / `ec-autocomplete` / `ec-input-tag` / `ec-cascader` / `ec-tree-select` / `ec-transfer` / `ec-textarea` / `ec-upload` 等。
2. **物料总览**：用 `elementPlusMaterials` 按分类聚合，把本包实现的**全部**协议物料（`ec-card` / `ec-tabs` / `ec-steps` / `ec-timeline` / `ec-table` / `ec-progress` / `ec-statistic` / `ec-dialog` / `ec-drawer` …）逐张实时渲染预览，每张卡片即一份最小 Schema。
3. **设计器适配（D3）**：直接取出适配包导出的 `designerKit`，渲染设计器自身的 Element Plus 控件（按钮 / 输入 / 下拉 / 分段器 / 颜色 / 开关），说明「设计态与上线态同 UI」。

核心接入仍是一行：`app.use(createVueDesign({ adapter: elementPlusAdapter }))`；渲染用 `<SchemaRenderer :page="page" v-model:data="data" />`，事件通过 `@node-event` 收到框架无关的 `UiEventPayload`。

最小用法：

```ts
import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createVueDesign } from "@x-ac/design-vue";
import "@x-ac/design-vue/style.css";
import { elementPlusAdapter } from "@x-ac/design-vue-element-plus";

createApp(App)
  .use(ElementPlus)
  .use(createVueDesign({ adapter: elementPlusAdapter }))
  .mount("#app");
```

> 在线示例站通过 GitHub Pages 自动部署（`.github/workflows/pages.yml`：推 `main` 且示例 / 源码 / 工作流 / 锁文件有改动即发布，基路径 `/design-vue-element-plus/`）。需先在仓库 **Settings → Pages → Source 选 GitHub Actions**。

## 命令

```bash
pnpm install
pnpm typecheck      # vue-tsc
pnpm test           # vitest run，逐物料冒烟渲染
pnpm build          # 清理 dist → 库模式构建
pnpm check          # typecheck + test + build
```

产物校验：`dist/index.js` 不含引擎本体、core 与 Element Plus（全部 external），`dist/*.d.ts` 不含本地相对路径。

## 版本对齐

内核、适配层与扩展共用一条版本线（fixed 单版本组）：本包 `version` 与 `@x-ac/design-core` 同步升号；`peerDependencies` 下界只在协议破坏性变更时调整。发布顺序 `core → vue/react → 扩展`。

## 新增同类扩展仓的清单

1. 复制本仓骨架：`package.json` / `tsconfig.base.json` / `tsconfig.json` / `vite.config.ts` / `vitest.config.ts` / `scripts/clean-dist.mjs` / `.gitignore`。
2. 改 `name`（如 `@x-ac/design-vue-icon-xxx`）、`description`、`keywords`，`version` 与内核对齐。
3. `peerDependencies` 按框架分支写：`vue-*` 写 `@x-ac/design-core` + `@x-ac/design-vue` + `vue` + UI 库；`react-*` 写 `@x-ac/design-core` + `@x-ac/design-react` + `react` + UI 库。`devDependencies` 用 `link:` 指向核心仓对应包。
4. 入口用 `defineVueAdapter` / `defineReactAdapter` 组装，不要手写 `UiAdapter` 字面量；通用工具一律从 `@x-ac/design-core` 取，不要在扩展仓复制解析函数。
5. `vite.config.ts` 的 `rollupOptions.external` 加目标 UI 库与对应 `/kit` 子路径；`tsconfig#paths` 与 `vitest#alias` 把 `/kit` 挂在包别名之前。
6. 只实现「物料实现 + 绑定通道 + 动作副作用」，不复制引擎逻辑；组件内不要调用 `inject` / `useUiAdapter`，保持可独立单测。
7. **事件参数归一化（可选）**：若目标 UI 库派发的事件参数形状与其它库差异较大，在 adapter 上实现 `onEvent` 钩子统一形状，宿主拿到的 `UiEventPayload` 就与框架无关：

   ```ts
   import { defineVueAdapter } from "@x-ac/design-vue/kit";
   import type { UiEventPayload } from "@x-ac/design-core";

   const adapter = defineVueAdapter({
     name: "my-ui",
     components: COMPONENT_MAP,
     materials: myMaterials,
     onEvent: (p: UiEventPayload) => {
       // 例如把 (value, event) 统一成 { value, nativeEvent }，或直接改写 p.args
       p.args[0] = { value: p.value };
     },
   });
   ```

   引擎已把组件派发的**全部原始参数**放进 `p.args`，并提供 `p.value` / `p.nativeEvent` / `p.node` / `p.material` / `p.page` / `p.scope` / `p.actions`。钩子在预设动作之前执行，返回 `false` 或 `p.preventDefault()` 可阻断动作。`vue-*` 与 `react-*` 拿到的是同一份 payload 形状，无需分别适配。
