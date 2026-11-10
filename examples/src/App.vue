<script setup lang="ts">
import { ref } from "vue";
import FormSection from "./sections/FormSection.vue";
import CatalogSection from "./sections/CatalogSection.vue";
import DesignerSection from "./sections/DesignerSection.vue";

type SectionKey = "form" | "catalog" | "designer";

const active = ref<SectionKey>("form");
const menus: { key: SectionKey; label: string }[] = [
  { key: "form", label: "表单与数据绑定" },
  { key: "catalog", label: "物料总览" },
  { key: "designer", label: "设计器适配（D3）" },
];

function onSelect(key: string): void {
  active.value = key as SectionKey;
}
</script>

<template>
  <div class="layout">
    <aside class="side">
      <div class="brand">
        <div class="brand-name">@x-ac/design-vue-element-plus</div>
        <div class="brand-sub">Element Plus 适配包 · 示例站</div>
      </div>
      <el-menu :default-active="active" class="nav" @select="onSelect">
        <el-menu-item v-for="m in menus" :key="m.key" :index="m.key">{{ m.label }}</el-menu-item>
      </el-menu>
      <div class="side-foot">
        <p>接入仅需一行：</p>
        <code>app.use(createVueDesign({ adapter: elementPlusAdapter }))</code>
      </div>
    </aside>

    <main class="content">
      <FormSection v-show="active === 'form'" />
      <CatalogSection v-show="active === 'catalog'" />
      <DesignerSection v-show="active === 'designer'" />
    </main>
  </div>
</template>
