import type { Material, NodeSchema, PageSchema } from "@x-ac/design-core";

/** 构建一份最小可用的 PageSchema（SchemaRenderer 接收的就是它）。 */
export function buildPage(id: string, children: NodeSchema[], title = id): PageSchema {
  return {
    schemaVersion: "1.0.0",
    id,
    type: "page",
    meta: { title, device: "pc" },
    state: {},
    children,
  };
}

/** 需要显式给选项（options）的表单物料。 */
const OPTION_COMPONENTS = new Set([
  "select",
  "radio",
  "checkbox",
  "autocomplete",
  "input-tag",
  "transfer",
  "cascader",
  "tree-select",
]);

export function needsOptions(component: string): boolean {
  return OPTION_COMPONENTS.has(component);
}

/** 给各选项类物料一个合理的默认选项，保证总览卡片能直接渲染。 */
export function defaultOptions(component: string): unknown {
  switch (component) {
    case "transfer":
      return "选项一,选项二,选项三,选项四";
    case "autocomplete":
      return "北京,上海,广州,深圳,杭州,成都";
    case "input-tag":
      return "Vue,React,Node,TypeScript";
    case "cascader":
      return "华东/上海/浦东\n华东/上海/徐汇\n华南/广州/天河";
    case "tree-select":
      return "集团总部/技术中心/前端组\n集团总部/技术中心/后端组";
    default:
      return [
        { label: "选项一", value: "1" },
        { label: "选项二", value: "2" },
        { label: "选项三", value: "3" },
      ];
  }
}

/** 表单类物料（参与数据收集），需要补 label 与 modelValue 绑定。 */
export function isFieldMaterial(m: Material): boolean {
  return m.kind === "field" || (m as unknown as { isFormControl?: boolean }).isFormControl === true;
}

/** 弹层类物料（对话框 / 抽屉）需要单独控制 visible，不能随总览直接铺开。 */
const MODAL_COMPONENTS = new Set(["dialog", "drawer"]);
export function isModal(component: string): boolean {
  return MODAL_COMPONENTS.has(component);
}

/** 把一份物料元数据翻译成一个可直接被 SchemaRenderer 渲染的节点。 */
export function nodeForMaterial(m: Material, uid: string): NodeSchema {
  // m.component 已是 `ec-` 前缀的协议名（如 ec-card），直接作为渲染键即可；
  // 裸名（card）仅用于和裸名集合（needsOptions / MODAL_COMPONENTS）比对。
  const bare = m.component.startsWith("ec-") ? m.component.slice(3) : m.component;
  const props: Record<string, unknown> = { ...(m.defaultProps ?? {}) };
  if (isFieldMaterial(m)) {
    props.label = m.title;
    props.modelValue = `{{${uid}}}`;
    if (needsOptions(bare)) props.options = defaultOptions(bare);
  }
  const node: NodeSchema = { id: uid, component: m.component, props };
  if (m.acceptsChildren && !isModal(bare)) {
    node.children = [{ id: `${uid}_child`, component: "ec-text", props: { text: `${m.title} 的内容区域` } }];
  }
  return node;
}
