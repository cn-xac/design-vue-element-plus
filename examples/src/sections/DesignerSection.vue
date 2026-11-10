<script setup lang="ts">
import type { Component } from "vue";
import { designerKit } from "@x-ac/web-design-vue-element-plus";

// designerKit 是「设计器自身 UI」的 Element Plus 实现（D3）：
// 宿主用哪套 UI 库，低代码设计器的按钮 / 输入框 / 下拉就长什么样，
// 避免「设计时一套、上线时另一套」。
const kit = designerKit as unknown as Record<string, Component>;

const selectOptions = [
  { label: "选项 A", value: "a" },
  { label: "选项 B", value: "b" },
  { label: "选项 C", value: "c" },
];
const segOptions = [
  { label: "日", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
];
</script>

<template>
  <section class="section">
    <header class="section-head">
      <h2>设计器适配（D3）</h2>
      <span class="section-sub">
        适配包额外导出 <code>designerKit</code>：低代码设计器自身的控件也用 Element Plus 实现，
        与「物料总览」里的 <code>ec-*</code> 来自同一套组件，只是用途不同——
        前者服务设计器，后者服务页面。下面是直接从 <code>designerKit</code> 取出来的控件。
      </span>
    </header>

    <div class="kit-grid">
      <div class="kit-card">
        <div class="kit-label">Button（EpButton）</div>
        <component :is="kit.Button" type="primary">主按钮</component>
        <component :is="kit.Button" type="success">成功</component>
        <component :is="kit.Button" type="danger">危险</component>
        <component :is="kit.Button" type="text">文字</component>
      </div>

      <div class="kit-card">
        <div class="kit-label">Input / Switch / Color（ElInput / ElSwitch / ElColorPicker）</div>
        <component :is="kit.Input" placeholder="设计器输入框" />
        <div class="kit-inline"><component :is="kit.Switch" /><span>开关</span></div>
        <div class="kit-inline"><component :is="kit.ColorInput" /><span>颜色</span></div>
      </div>

      <div class="kit-card">
        <div class="kit-label">Select（EpSelect）</div>
        <component :is="kit.Select" :options="selectOptions" placeholder="设计器下拉" />
      </div>

      <div class="kit-card">
        <div class="kit-label">Segmented（EpSegmented）</div>
        <component :is="kit.Segmented" :options="segOptions" />
      </div>
    </div>

    <p class="muted">
      这些控件由 <code>designer/Ep*.vue</code> 实现，被 <code>createDesignerKit</code> 组装进
      <code>designerKit</code>。它们把引擎的归一化语义（如 <code>type: "text"</code> → Element Plus 的主色文字按钮）
      翻译成具体组件属性，是「设计态与上线态同 UI」的关键一环。
    </p>
  </section>
</template>
