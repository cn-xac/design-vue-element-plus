<script setup lang="ts">
import { ref, computed } from "vue";
import { SchemaRenderer, toJSON, validatePage } from "@x-ac/design-vue";
import type { PageSchema, UiEventPayload } from "@x-ac/design-core";
import { elementAdapter } from "@x-ac/design-vue-element-plus";
import { buildPage } from "../helpers";

// 表单数据集中在 data.form 下；v-model:data 把整个 data 作为渲染作用域，
// 因此所有控件的 modelValue 写成 "{{form.xxx}}" 即可双向绑定到这里。
const data = ref<Record<string, unknown>>({ form: {} });
const exported = ref("");
const issues = ref<string[]>([]);
const lastSubmit = ref("");

const page = computed<PageSchema>(() =>
  buildPage("ep-form", [
    {
      id: "card",
      component: "ec-card",
      props: { title: "用户信息表单", shadow: "hover" },
      children: [
        { id: "name", component: "ec-input", props: { label: "姓名", placeholder: "请输入姓名", modelValue: "{{form.name}}", clearable: true } },
        { id: "email", component: "ec-input", props: { label: "邮箱", type: "email", placeholder: "name@example.com", modelValue: "{{form.email}}", clearable: true } },
        { id: "age", component: "ec-number", props: { label: "年龄", placeholder: "请输入年龄", modelValue: "{{form.age}}" } },
        { id: "dept", component: "ec-select", props: { label: "部门", modelValue: "{{form.dept}}", options: [ { label: "技术中心", value: "tech" }, { label: "产品中心", value: "product" }, { label: "运营中心", value: "ops" } ] } },
        { id: "gender", component: "ec-radio", props: { label: "性别", modelValue: "{{form.gender}}", variant: "button", options: [ { label: "男", value: "male" }, { label: "女", value: "female" } ] } },
        { id: "hobby", component: "ec-checkbox", props: { label: "爱好", modelValue: "{{form.hobby}}", options: [ { label: "阅读", value: "read" }, { label: "运动", value: "sport" }, { label: "音乐", value: "music" } ] } },
        { id: "notify", component: "ec-switch", props: { label: "启用通知", modelValue: "{{form.notify}}" } },
        { id: "joinDate", component: "ec-date", props: { label: "入职日期", modelValue: "{{form.joinDate}}", type: "date" } },
        { id: "workTime", component: "ec-time-picker", props: { label: "上班时间", modelValue: "{{form.workTime}}" } },
        { id: "satisfaction", component: "ec-slider", props: { label: "满意度", modelValue: "{{form.satisfaction}}", min: 0, max: 100 } },
        { id: "score", component: "ec-rate", props: { label: "评分", modelValue: "{{form.score}}" } },
        { id: "theme", component: "ec-color-picker", props: { label: "主题色", modelValue: "{{form.theme}}" } },
        { id: "city", component: "ec-autocomplete", props: { label: "城市", modelValue: "{{form.city}}", options: "北京,上海,广州,深圳,杭州,成都" } },
        { id: "skills", component: "ec-input-tag", props: { label: "技能标签", modelValue: "{{form.skills}}", options: "Vue,React,Node,TypeScript" } },
        { id: "region", component: "ec-cascader", props: { label: "所在地区", modelValue: "{{form.region}}", options: "华东/上海/浦东\n华东/上海/徐汇\n华南/广州/天河" } },
        { id: "org", component: "ec-tree-select", props: { label: "所属组织", modelValue: "{{form.org}}", options: "集团总部/技术中心/前端组\n集团总部/技术中心/后端组" } },
        { id: "scope", component: "ec-transfer", props: { label: "可见范围", modelValue: "{{form.scope}}", options: "选项一,选项二,选项三,选项四", titles: "待选,已选" } },
        { id: "remark", component: "ec-textarea", props: { label: "备注", modelValue: "{{form.remark}}", type: "textarea", autosize: true } },
        { id: "avatar", component: "ec-upload", props: { label: "头像", modelValue: "{{form.avatar}}", text: "点击上传", listType: "picture-card" } },
      ],
    },
    { id: "divider", component: "ec-divider", props: {} },
    { id: "submit", component: "ec-button", props: { label: "提交", type: "primary" }, events: { click: [] } },
    { id: "reset", component: "ec-button", props: { label: "重置", type: "default" }, events: { click: [] } },
  ]),
);

function onEvent(p: UiEventPayload): void {
  if (p.name !== "click") return;
  if (p.nodeId === "submit") onSubmit();
  else if (p.nodeId === "reset") onReset();
}

function onSubmit(): void {
  const result = validatePage(page.value);
  issues.value = result.issues.map((i) => i.message);
  if (issues.value.length) {
    elementAdapter.notify(`校验未通过：${issues.value[0]}`, "error");
    return;
  }
  lastSubmit.value = JSON.stringify((data.value as { form?: Record<string, unknown> }).form ?? {}, null, 2);
  elementAdapter.notify("校验通过，提交成功", "success");
}

function onReset(): void {
  const form = (data.value as { form: Record<string, unknown> }).form;
  for (const k of Object.keys(form)) delete form[k];
  issues.value = [];
  lastSubmit.value = "";
  elementAdapter.notify("已重置表单", "info");
}

function exportSchema(): void {
  exported.value = toJSON(page.value);
}
</script>

<template>
  <section class="section">
    <header class="section-head">
      <h2>表单与数据绑定</h2>
      <span class="section-sub">
        一份 Schema 串起 <b>18</b> 类 Element Plus 表单控件，全部通过
        <code>v-model:data</code> 双向绑定到 <code>data.form</code>；
        <b>提交</b> 触发内核 <code>validatePage</code> 校验并调用适配包的
        <code>elementAdapter.notify</code>（即 ElMessage 副作用），<b>重置</b> 清空作用域。
      </span>
    </header>

    <div class="form-layout">
      <div class="form-main">
        <SchemaRenderer :page="page" v-model:data="data" @node-event="onEvent" />
        <div class="toolbar">
          <el-button type="primary" @click="onSubmit">提交（校验 + 通知）</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button @click="exportSchema">导出 Schema JSON</el-button>
          <span v-if="issues.length" class="warn">校验问题：{{ issues.join("；") }}</span>
        </div>
      </div>

      <aside class="form-side">
        <div class="panel">
          <div class="panel-title">实时数据（data.form）</div>
          <pre class="panel-pre">{{ JSON.stringify((data as { form?: Record<string, unknown> }).form ?? {}, null, 2) }}</pre>
        </div>
        <div v-if="lastSubmit" class="panel">
          <div class="panel-title">上次提交</div>
          <pre class="panel-pre">{{ lastSubmit }}</pre>
        </div>
        <div v-if="exported" class="panel">
          <div class="panel-title">导出的 Schema（core.toJSON）</div>
          <pre class="panel-pre">{{ exported }}</pre>
        </div>
      </aside>
    </div>
  </section>
</template>
