// @vitest-environment jsdom
/**
 * 子表单（明细数组）与「按组件ID自动绑定」冒烟测试。
 *
 * 自动绑定约定：未设置 modelValue 的表单控件按 `form.<组件ID>` 自动取值，
 * 与显式 `{{form.x}}` 共用同一套命名空间，宿主数据通过 :data 传入。
 */
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import type { NodeSchema, PageSchema } from "@x-ac/design-core";
import { SchemaRenderer } from "@x-ac/design-vue";

function page(children: NodeSchema[]): PageSchema {
  return {
    schemaVersion: "1.0.0",
    id: "page_subform",
    type: "page",
    meta: { title: "子表单", device: "pc" },
    state: {},
    children,
  };
}

describe("按组件ID自动绑定", () => {
  it("未设置 modelValue 的字段按 form.<id> 自动绑定传入的数据", () => {
    // 自动绑定约定：未设置 modelValue 时按 `form.<组件ID>` 取值，
    // 这里组件 ID 是 n_name，所以宿主数据要按 n_name 传入。
    const wrapper = mount(SchemaRenderer, {
      props: {
        page: page([{ id: "n_name", component: "ec-input", props: { label: "姓名" } }]),
        data: { form: { n_name: "张三" } },
      },
      global: { plugins: [ElementPlus] },
    });

    const scope = (wrapper.vm as unknown as { scope: Record<string, unknown> }).scope as {
      form: { n_name?: string };
    };
    // 数据经绑定通道流入字段：scope 是绑定真值来源
    expect(scope.form.n_name).toBe("张三");

    const input = wrapper.find("input");
    expect(input.element.value).toBe("张三");
    wrapper.unmount();
  });
});

describe("子表单（明细数组）", () => {
  const subform = (children: NodeSchema[], props: Record<string, unknown> = {}): NodeSchema => ({
    id: "n_items",
    component: "ec-subform",
    props: { label: "明细", itemPath: "items", addText: "添加一项", ...props },
    children,
  });

  it("点击添加生成一组，数据写入 form.items；可删除", async () => {
    const wrapper = mount(SchemaRenderer, {
      props: {
        page: page([subform([{ id: "n_item_name", component: "ec-input", props: { label: "名称" } }])]),
        data: { form: { items: [] } },
      },
      global: { plugins: [ElementPlus] },
    });
    const scope = (wrapper.vm as unknown as { scope: Record<string, unknown> }).scope as {
      form: { items: unknown[] };
    };

    expect(scope.form.items).toHaveLength(0);

    await wrapper.find(".wb-subform__add").trigger("click");
    expect(scope.form.items).toHaveLength(1);
    // 默认项按子字段「组件ID」构造空值，这里子字段 ID 是 n_item_name
    expect(scope.form.items[0]).toHaveProperty("n_item_name");

    await wrapper.find(".wb-subform__add").trigger("click");
    expect(scope.form.items).toHaveLength(2);

    await wrapper.find(".wb-subform__btn").trigger("click");
    expect(scope.form.items).toHaveLength(1);
    wrapper.unmount();
  });

  it("子表单可无限嵌套，数据落在 form.items[i].items", async () => {
    const wrapper = mount(SchemaRenderer, {
      props: {
        page: page([
          subform([
            { id: "n_title", component: "ec-input", props: { label: "标题" } },
            subform([{ id: "n_child_name", component: "ec-input", props: { label: "子名称" } }], {
              itemPath: "children",
            }),
          ]),
        ]),
        data: { form: { items: [] } },
      },
      global: { plugins: [ElementPlus] },
    });
    const scope = (wrapper.vm as unknown as { scope: Record<string, unknown> }).scope as {
      form: { items: Array<{ title?: string; children?: unknown[] }> };
    };

    // 外层添加一组：外层子表单的 add 按钮是其根 .wb-subform 的直接子节点
    const outerAdd = wrapper.find(".wb-subform > .wb-subform__add");
    await outerAdd.trigger("click");
    expect(scope.form.items).toHaveLength(1);
    // 外层子字段 ID 为 n_title
    expect(scope.form.items[0]).toHaveProperty("n_title");

    // 内层嵌套子表单的 add 按钮位于某个分组内的子表单里
    const innerAdd = wrapper.find(".wb-subform__group .wb-subform__add");
    await innerAdd.trigger("click");
    expect(scope.form.items[0].children).toHaveLength(1);
    // 内层子字段 ID 为 n_child_name，数据落在 form.items[0].children[0]
    expect(scope.form.items[0].children?.[0]).toHaveProperty("n_child_name");
    wrapper.unmount();
  });
});
