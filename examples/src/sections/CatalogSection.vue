<script setup lang="ts">
import { computed } from "vue";
import { elementPlusMaterials } from "@x-ac/web-design-vue-element-plus";
import type { Material } from "@x-ac/web-design-core";
import MaterialCard from "./MaterialCard.vue";

// 按物料分类聚合，分类顺序：表单 → 布局 → 展示 → 导航 → 交互 → 业务。
const ORDER = ["表单", "布局", "展示", "导航", "交互", "业务", "其他"];

const grouped = computed<[string, Material[]][]>(() => {
  const map = new Map<string, Material[]>();
  for (const m of elementPlusMaterials) {
    const cat = m.category || "其他";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(m);
  }
  const entries = Array.from(map.entries());
  entries.sort((a, b) => {
    const ia = ORDER.indexOf(a[0]);
    const ib = ORDER.indexOf(b[0]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return entries;
});

const total = computed(() => elementPlusMaterials.length);
</script>

<template>
  <section class="section">
    <header class="section-head">
      <h2>物料总览</h2>
      <span class="section-sub">
        本适配包共实现 <b>{{ total }}</b> 个 Element Plus 协议物料，全部由
        <code>elementPlusMaterials</code> 驱动。每张卡片都是用同一套
        <code>&lt;SchemaRenderer&gt;</code> + 物料默认属性实时渲染的预览。
      </span>
    </header>

    <div v-for="[cat, items] in grouped" :key="cat" class="cat-group">
      <h3 class="cat-title">{{ cat }}<span class="cat-count">{{ items.length }}</span></h3>
      <div class="mat-grid">
        <MaterialCard v-for="m in items" :key="m.component" :material="m" />
      </div>
    </div>
  </section>
</template>
