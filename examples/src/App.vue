<script setup lang="ts">
import { ref } from "vue";
import { SchemaRenderer, toJSON, validatePage } from "@x-ac/design-vue";
import type { PageSchema, UiEventPayload } from "@x-ac/design-core";

// 一份最小 PageSchema：标题 + 输入框 + 下拉 + 开关 + 按钮。
// 绑定不是 bind 字段，而是 props.modelValue 写成 "{{name}}" 表达式（指向 data.name）。
const page = ref<PageSchema>({
  schemaVersion: "1.0.0",
  id: "ep-demo",
  type: "page",
  meta: { title: "Element Plus 适配包示例", device: "pc" },
  state: {},
  children: [
    { id: "title", component: "ec-title", props: { text: "Element Plus 表单示例", level: 2 } },
    { id: "name", component: "ec-input", props: { placeholder: "请输入姓名", modelValue: "{{name}}" } },
    {
      id: "gender",
      component: "ec-select",
      props: {
        modelValue: "{{gender}}",
        options: [
          { label: "男", value: "male" },
          { label: "女", value: "female" },
        ],
      },
    },
    { id: "agree", component: "ec-switch", props: { modelValue: "{{agree}}" } },
    {
      id: "submit",
      component: "ec-button",
      props: { label: "提交", type: "primary" },
      events: { click: [] },
    },
  ],
});

const data = ref<Record<string, unknown>>({});
const exported = ref("");
const issues = ref<string[]>([]);

// node-event：只读通知，拿到完整的 UiEventPayload（事件名、节点、物料、scope…）。
function onNodeEvent(payload: UiEventPayload) {
  if (payload.name === "click") {
    issues.value = validatePage(page.value).issues.map((i) => i.message);
    window.alert(`提交数据：\n${JSON.stringify(data.value, null, 2)}`);
  }
}

function exportSchema() {
  // 内核导出能力：toJSON 序列化 PageSchema（含旧版本自动迁移）。
  exported.value = toJSON(page.value);
}
</script>

<template>
  <main class="page">
    <SchemaRenderer :page="page" v-model:data="data" @node-event="onNodeEvent" />

    <div class="row">
      <strong>表单数据（data）：</strong>
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>

    <div class="row">
      <button class="ep-btn" @click="exportSchema">导出 Schema JSON（core.toJSON）</button>
      <span v-if="issues.length" class="warn">校验问题：{{ issues.join("；") }}</span>
    </div>

    <pre v-if="exported" class="export">{{ exported }}</pre>

    <footer class="foot">
      <p>
        本页由 <code>@x-ac/design-vue-element-plus</code> 的
        <code>elementPlusAdapter</code> 驱动：以 Element Plus 组件实现协议物料（ec-*），并复用内核的
        绑定通道与事件协议。仅需 <code>app.use(createVueDesign({ adapter: elementPlusAdapter }))</code> 一行接入。
      </p>
    </footer>
  </main>
</template>
