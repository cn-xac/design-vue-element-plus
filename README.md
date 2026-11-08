# design-vue-element-plus

`@x-ac/design-vue-element-plus`：Element Plus 适配包（物料实现 + 双向绑定通道 + 动作副作用 + 设计器控件）。
从 `web-desgin` 主仓拆出的独立扩展仓，按「核心仓 + 扩展仓」结构维护。

## 在本生态中的位置

| 层 | 仓库 | 职责 |
|---|---|---|
| 内核 | `web-desgin` → `@x-ac/design-core` | Schema、表达式、树操作、校验、导出、物料元数据协议 |
| 框架适配层 | `web-desgin` → `@x-ac/design-vue` / `@x-ac/design-react` | 渲染器、设计器、原生控件兜底；`vue` 依赖 `core`，`react` 依赖 `core` |
| 扩展（本仓） | `design-vue-element-plus` | 实现 core 的 `UiAdapter` 协议：物料、绑定通道、动作副作用、设计器控件 |
| 未来扩展 | `vue-icon-xxx`、`react-ant` … | 同一份 `UiAdapter` 协议；`vue-*` 与 `design-vue` 配套，`react-*` 与 `design-react` 配套 |

本仓只发布一个包，仓库根即包根。不改内核、不改适配层：**适配层是消费方，扩展包是被注入的实现**。

### 真实依赖方向（容易看反）

扩展包**不 import `@x-ac/design-vue` 的任何符号**。`UiAdapter` / `DesignerKit` 协议定义在 `@x-ac/design-core`，扩展包只实现这份协议；`UI_ADAPTER` 注入符号由 `design-vue` 内部持有，宿主用 `createVueDesign({ adapter: elementPlusAdapter })` 把本包产物交给引擎，渲染器与设计器再 `inject` 消费。`dist/index.js` 的外部依赖只有 `vue` / `element-plus` / `@x-ac/design-core`，可直接核验。

因此 `peerDependencies` 里的 `@x-ac/design-vue` 是**版本配套声明**（保证协议与引擎同代），不是运行时 import。真正必须去重的是 `vue` 与 `element-plus`：多副本 Vue 会让 `provide/inject` 静默失效，多副本 Element Plus 会让主题与组件注册分裂。

> 生态约定里「`vue-*` 依赖 `design-vue`」表达的是配套关系；代码层面的方向是 `core 协议 → 扩展实现 → 引擎注入消费`。（此前文档称「扩展包必须 peer 共享 UI_ADAPTER symbol，否则多副本失效」是错的，已更正：扩展包根本不持有该 symbol。）

## 目录

```
src/
  index.ts            # 导出 elementPlusAdapter / elementPlusMaterials / EP_FIELD_PATCHES
  components.ts       # 协议物料名 → Element Plus 组件
  actions.ts          # 消息 / 确认框副作用 + 表单数据绑定通道
  materials/          # 物料元数据（blocks / fields / forms）
  blocks/ fields/     # 物料实现
  designer/           # 设计器自身 UI 的 Element Plus 实现（EpButton 等）
tests/                # 逐物料冒烟渲染与属性对齐用例
scripts/clean-dist.mjs
```

## 依赖与本地联调

```jsonc
// 发布后：消费方从 npm 装「内核 + 对应框架适配层 + UI 库」
"peerDependencies": {
  "@x-ac/design-core": "^0.4.0", "@x-ac/design-vue": "^0.4.0",
  "element-plus": "^2.6.0", "vue": "^3.4.0"
}

// 当前：两者尚未发版，用本地 link 联调
"devDependencies": { "@x-ac/design-core": "link:../project/packages/core",
                     "@x-ac/design-vue": "link:../project/packages/vue" }
```

`react-*` 扩展把上表的 `design-vue` / `vue` 换成 `design-react` / `react` + 目标 UI 库，另有三处差异：

1. 绑定通道用 `{ prop: "value", event: "onChange" }`（`REACT_BINDING`），不是 `modelValue / onUpdate:modelValue`；
2. 注入用 `<ReactDesignProvider adapter>` 或 `createReactDesign(adapter)`，没有 `app.use()`；优先级为 `ui` prop > Provider > 内置 `nativeAdapter`；
3. `design-react` 暂无设计器，`UiAdapter.designer / editors / provider / propAliases` 目前不会被消费，实现 `components / materials / binding / actions` 四件套即可。

因此本地目录约定为两仓并排：

```
F:\web\web-design\
  project\                     # 核心仓（core / vue / react）
  design-vue-element-plus\     # 本仓
```

`tsconfig.json` 的 `paths` 与 `vitest.config.ts` 的 `alias` 都指向 `../project/packages/*/src`，
改核心仓源码 → 本仓用例立刻生效，无需先构建对方的 `dist`。

> 内核与适配层发到 npm 后，把上面两条 `link:` 换成 `"@x-ac/design-core": "^0.4.0"`、
> `"@x-ac/design-vue": "^0.4.0"`，并删掉 `paths` / `alias` 里的三条映射（含本包自引用），即可完全脱离核心仓源码。

## 命令

```bash
pnpm install
pnpm typecheck      # vue-tsc
pnpm test           # vitest run，逐物料冒烟渲染
pnpm build          # 清理 dist → 库模式构建（vue / element-plus / core 全部 external）
pnpm check          # typecheck + test + build
```

产物校验：`dist/index.js` 不含引擎与 Element Plus 本体，`dist/style.css` 由 `package.json#exports` 暴露。

## 版本对齐

内核与扩展共用一条版本线（fixed 单版本组）：本包 `version` 与 `@x-ac/design-core` 同步升号，
`peerDependencies` 的下界只在协议破坏性变更时调整。

## 新增同类扩展仓的清单

1. 复制本仓骨架：`package.json` / `tsconfig.base.json` / `tsconfig.json` / `vite.config.ts` / `vitest.config.ts` / `scripts/clean-dist.mjs` / `.gitignore`。
2. 改 `name`（如 `@x-ac/design-vue-icon-xxx`）、`description`、`keywords`，`version` 与内核对齐。
3. `peerDependencies` 按框架分支写：`vue-*` 写 `@x-ac/design-core` + `@x-ac/design-vue` + `vue` + UI 库；`react-*` 写 `@x-ac/design-core` + `@x-ac/design-react` + `react` + UI 库。`devDependencies` 用 `link:` 指向核心仓对应包。引擎包只作版本配套声明，产物里不应出现对它的 import。
4. `vite.config.ts` 的 `rollupOptions.external` 加目标 UI 库与对应适配层（含子路径正则），产物保持外部化。
5. 只实现「物料实现 + 绑定通道 + 动作副作用」，不复制引擎逻辑；扩展包不 import 引擎包符号，保持单向：`core 协议 → 扩展实现 → 引擎注入消费`。
6. 想让「依赖引擎」名副其实时，可在扩展包导出一个薄封装（例如 `createElementPlusDesign()` 内部调用 `createVueDesign({ adapter })`），但这是可选的宿主便利 API，不是协议要求。
