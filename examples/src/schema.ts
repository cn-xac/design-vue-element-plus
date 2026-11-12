/**
 * 示例预置 Schema：一份 PageSchema 同时喂给「设计器」与「渲染器」。
 *
 * 与 design-react-antd 的 example/src/schema.ts 对齐，刻意覆盖四类能力：
 * 1. core 通用协议物料（ec-input / ec-select / ec-table / ec-card ...）；
 * 2. Element Plus 专有物料（ec-row / ec-col / ec-tabs / ec-input-tag ...），
 *    这些是 EP 适配包相对其他适配层的增量；
 * 3. 两级嵌套子表单（订单 → 商品明细），演示理论无限级的明细数组；
 * 4. 真实动作链（toast / setState / submitForm / confirm / resetForm）与必填校验。
 *
 * 约定：
 * - Schema 里写协议物料名（ec-xxx），core 的 materialKey 会归一；
 * - Vue 侧自动绑定规则是 `form.<节点 id>`，故 seedData.form 的键就是节点 id；
 * - 事件名写 `click`（Vue 的 v-on 对象键由 camelizeEventName 归一）。
 */
import { createEmptyPage } from "@x-ac/web-design-core";
import type { PageSchema } from "@x-ac/web-design-core";

export const PAGE_ID = "demo";

type Child = PageSchema["children"][number];

/** 图片占位：内联 SVG data URI，离线也能渲染，不依赖任何外网资源 */
const IMAGE_SRC =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120">` +
      `<rect width="100%" height="100%" rx="6" fill="#ecf5ff"/>` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="14" fill="#409eff">ElImage · 240×120</text>` +
      `</svg>`,
  );

/** 选项统一用 {label,value} 数组；value 直接取中文，便于 seedData 肉眼对照 */
const opts = (...labels: string[]) => labels.map((label) => ({ label, value: label }));

/** 分组容器：设计器里能展开看到子节点树 */
const group = (id: string, title: string, children: Child[]): Child =>
  ({ id, component: "ec-card", props: { title, shadow: "never" }, children }) as Child;

/**
 * 两列栅格：EP 专有的 ec-row / ec-col 是真实生效的布局组件
 * （core 的 ec-grid 在 EP 适配包里被映射成 div，columns 只是普通属性），
 * 这里用 EP 自己的栅格，才能让示例展示「适配包专有物料」的价值。
 */
const col = (id: string, child: Child): Child =>
  ({ id, component: "ec-col", props: { span: 12 }, children: [child] }) as Child;

const row = (id: string, children: Child[]): Child =>
  ({
    id,
    component: "ec-row",
    props: { gutter: 16 },
    children: children.map((child, index) => col(`${id}_c${index}`, child)),
  }) as Child;

/** 字段节点：id 即数据键，label 是字段外壳标题 */
const field = (id: string, component: string, props: Record<string, unknown> = {}, extra: Partial<Child> = {}): Child =>
  ({ id, component, props, ...extra } as Child);

export function seedPage(): PageSchema {
  return {
    ...createEmptyPage("Element Plus 适配层完整示例"),
    id: PAGE_ID,
    state: {},
    children: [
      field("n_title", "ec-title", { text: "员工信息登记", level: 3 }),

      field("n_intro", "ec-alert", {
        type: "info",
        title: "本页全部控件来自 @x-ac/web-design-vue-element-plus 注册的 Element Plus 组件",
        description: "渲染器只消费组件表、导出数据、派发事件；设计器与渲染器共用同一份 Schema，保存后即时联动。",
        showIcon: true,
        closable: false,
      }),

      {
        id: "n_toolbar",
        component: "ec-space",
        props: { wrap: true },
        children: [
          field("n_tag_ep", "ec-tag", { text: "element-plus 2.14", type: "primary" }),
          field("n_link", "ec-link", {
            text: "适配层说明",
            href: "https://github.com/cn-xac/web-design-vue-element-plus",
            type: "primary",
          }),
        ],
      } as Child,

      field("n_divider", "ec-divider", { contentPosition: "left" }),

      group("g_basic", "基础信息（core 通用协议物料）", [
        row("n_row_basic", [
          field("n_name", "ec-input", { label: "姓名", placeholder: "请输入姓名", clearable: true, maxlength: 20 }, {
            rules: [{ type: "required", message: "请填写姓名" }],
          }),
          field("n_dept", "ec-select", {
            label: "部门", placeholder: "请选择部门", clearable: true, filterable: true,
            options: opts("技术中心", "产品中心", "设计中心"),
          }),
          field("n_count", "ec-number", { label: "司龄", min: 0, max: 50, precision: 0 }),
          field("n_join", "ec-date", { label: "入职日期", type: "date", valueFormat: "YYYY-MM-DD" }),
          field("n_remark", "ec-textarea", { label: "备注", rows: 3, type: "textarea", showWordLimit: true, maxlength: 100 }),
          field("n_remote", "ec-switch", { label: "远程办公", activeText: "是", inactiveText: "否" }),
          field("n_radio", "ec-radio", { label: "办公方式", options: opts("现场", "混合", "远程") }),
          field("n_checkbox", "ec-checkbox", { label: "技能", options: opts("Vue", "React", "TypeScript") }),
        ]),
      ]),

      group("g_ep", "扩展字段（Element Plus 专有物料）", [
        row("n_row_ep", [
          field("n_time", "ec-time-picker", { label: "上班时间", placeholder: "请选择时间" }),
          field("n_color", "ec-color-picker", { label: "主题色" }),
          field("n_autocomplete", "ec-autocomplete", { label: "城市", placeholder: "输入城市名", options: "北京,上海,广州,深圳,杭州,成都" }),
          field("n_input_tag", "ec-input-tag", { label: "技能标签", placeholder: "回车添加" }),
          field("n_input_otp", "ec-input-otp", { label: "验证码" }),
          field("n_cascader", "ec-cascader", { label: "所在地区", placeholder: "请选择", options: "华东/上海/浦东\n华东/上海/徐汇\n华南/广州/天河" }),
          field("n_tree_select", "ec-tree-select", { label: "所属组织树", placeholder: "请选择", options: "集团总部/技术中心/前端组\n集团总部/技术中心/后端组" }),
          field("n_transfer", "ec-transfer", { label: "可见范围", options: "选项一,选项二,选项三,选项四", titles: "待选,已选" }),
          field("n_upload", "ec-upload", { label: "附件", text: "点击上传", listType: "text" }),
          field("n_segmented", "ec-segmented", { label: "职级", options: "P4,P5,P6,P7", value: "P5" }),
          field("n_rate", "ec-rate", { label: "满意度" }),
          field("n_slider", "ec-slider", { label: "投入占比", min: 0, max: 100, step: 5 }),
        ]),
      ]),

      group("g_business", "业务语义物料", [
        row("n_row_biz", [
          field("n_amount", "ec-amount-input", { label: "预算", precision: 2 }),
          field("n_dict", "ec-dict-select", { label: "字典项", dict: "status", placeholder: "请选择" }),
          field("n_org", "ec-org-picker", { label: "所属组织", placeholder: "请选择组织" }),
        ]),
      ]),

      group("g_display", "展示类物料", [
        field("n_text", "ec-text", { text: "下表数据来自作用域 list，用 {{list}} 绑定；文本也支持变量：当前姓名 {{form.n_name}}。" }),
        field("n_table", "ec-table", {
          columns: [
            { label: "姓名", prop: "name" },
            { label: "部门", prop: "dept" },
            { label: "状态", prop: "status" },
          ],
          data: "{{list}}",
          border: true,
          stripe: true,
        }),
        field("n_image", "ec-image", { src: IMAGE_SRC, alt: "占位图", fit: "cover", width: 240 }),
        field("n_statistic", "ec-statistic", { title: "在册人数", value: 128, suffix: "人" }),
        field("n_progress", "ec-progress", { percentage: 72, textInside: true, strokeWidth: 18 }),
        field("n_badge", "ec-badge", { value: 6, text: "待办" }),
        field("n_timeline", "ec-timeline", { items: "2026-11-01:需求评审,2026-11-03:设计稿确认,2026-11-05:开发联调,2026-11-07:上线发布" }),
      ]),

      {
        id: "orders",
        component: "ec-subform",
        props: { label: "订单（一级子表单）", itemPath: "orders", addText: "添加订单" },
        children: [
          field("o_no", "ec-input", { label: "订单号", placeholder: "如 A001" }),
          field("o_amount", "ec-number", { label: "金额", min: 0, precision: 2 }),
          {
            id: "goods",
            component: "ec-subform",
            props: { label: "商品明细（嵌套二级）", itemPath: "goods", addText: "添加商品" },
            children: [
              field("g_name", "ec-input", { label: "商品名" }),
              field("g_qty", "ec-number", { label: "数量", min: 1, precision: 0 }),
            ],
          } as Child,
        ],
      } as Child,

      {
        id: "n_actions",
        component: "ec-space",
        props: { wrap: true },
        children: [
          field("n_submit", "ec-button", { text: "提交并校验", type: "primary" }, {
            events: {
              click: [
                { action: "toast", args: { text: "正在提交…", type: "info" } },
                { action: "submitForm", args: { from: "form", to: "rows", reset: false, successText: "提交成功，数据已写入 rows" } },
              ],
            },
          }),
          field("n_fill", "ec-button", { text: "写入示例值" }, {
            events: {
              click: [
                { action: "setState", args: { path: "form.n_name", value: "王五" } },
                { action: "toast", args: { text: "已把姓名写为 王五", type: "success" } },
              ],
            },
          }),
          field("n_reset", "ec-button", { text: "重置表单", type: "danger" }, {
            events: {
              click: [
                { action: "confirm", args: { text: "确定要清空表单吗？", then: [
                  { action: "resetForm", args: { path: "form" } },
                ] } },
              ],
            },
          }),
        ],
      } as Child,
    ] as PageSchema["children"],
  };
}

/** 初始数据：form 的键 = 节点 id（自动绑定规则），rows 供 submitForm 追加，list 供表格绑定 */
export const seedData: Record<string, unknown> = {
  form: {
    n_name: "张三",
    n_dept: "技术中心",
    n_count: 3,
    n_join: "2024-03-01",
    n_remark: "Schema 驱动渲染示例",
    n_remote: true,
    n_radio: "混合",
    n_checkbox: ["Vue", "TypeScript"],
    n_time: "09:00",
    n_color: "#409eff",
    n_autocomplete: "上海",
    n_input_tag: ["Vue", "TypeScript"],
    n_input_otp: "",
    n_cascader: ["华东", "上海", "浦东"],
    n_tree_select: "集团总部/技术中心/前端组",
    n_transfer: ["选项一", "选项三"],
    n_upload: [],
    n_segmented: "P5",
    n_rate: 4,
    n_slider: 60,
    n_amount: 12800.5,
    n_dict: "done",
    n_org: "技术中心 / 平台组",
    orders: [
      {
        o_no: "A001",
        o_amount: 899,
        goods: [
          { g_name: "机械键盘", g_qty: 1 },
          { g_name: "显示器", g_qty: 2 },
        ],
      },
    ],
  },
  rows: [],
  list: [
    { name: "张三", dept: "技术中心", status: "在职" },
    { name: "李四", dept: "产品中心", status: "在职" },
    { name: "王五", dept: "设计中心", status: "试用" },
  ],
};
