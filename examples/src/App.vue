<script setup lang="ts">
/**
 * 完整 Vue 实例：一个适配包，两个引擎能力，一个物料总览，一个自检面板。
 *
 * - 「设计器」：SchemaDesigner 用 elementPlusAdapter，属性面板/顶栏/物料面板全是 Element Plus 组件；
 * - 「渲染器」：SchemaRenderer 消费同一份 PageSchema，只做「用组件渲染 + 导出数据 + 派发事件」；
 * - 「物料总览」：本包特色的分类卡片网格（另一任务里 web-design-react-antd 会参考它实现）；
 * - 「适配包清单」：可视化本包注册了哪些组件与配置，印证架构分层。
 *
 * 布局策略：视口固定（html/body/#app overflow hidden），页签常驻头部，各区域在自身容器内滚动，
 * 不产生文档级滚动 —— 与 design-react-antd 示例一致，避免整页上下翻导致组件难以定位。
 *
 * 设计器与渲染器通过内存仓储共享 Schema：设计器保存后渲染器重新读取，
 * 直观看到「设计时搭的 Schema → 运行时画出真实页面」这条链路。
 */
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { createMemoryRepository } from "@x-ac/web-design-core";
import type { PageSchema } from "@x-ac/web-design-core";
import { PAGE_ID, seedPage, seedData } from "./schema";
import DesignerSection from "./sections/DesignerSection.vue";
import RuntimeSection from "./sections/RuntimeSection.vue";
import CatalogSection from "./sections/CatalogSection.vue";
import AdapterSection from "./sections/AdapterSection.vue";

type TabKey = "designer" | "runtime" | "catalog" | "adapter";

const active = ref<TabKey>("designer");
const tabs: { label: string; value: TabKey }[] = [
  { label: "设计器", value: "designer" },
  { label: "渲染器", value: "runtime" },
  { label: "物料总览", value: "catalog" },
  { label: "适配包清单", value: "adapter" },
];

/** 设计器与渲染器共用同一份仓储；seed 一份预置页面 */
const repository = createMemoryRepository([seedPage()]);
const schema = ref<PageSchema>(seedPage());
const data = ref<Record<string, unknown>>(seedData);

/** 设计器保存 / 导出 Schema 后，把最新 Schema 交给渲染器 */
function reloadSchema(): void {
  const record = repository.get(PAGE_ID);
  if (record) schema.value = JSON.parse(JSON.stringify(record.schema)) as PageSchema;
}

/**
 * 设计器「预览」回调：DesignerView.preview() 先 save() 入仓储再 emit，
 * 所以这里先 reload 拿到最新设计，再切到「渲染器」页签并提示已切换。
 */
function goPreview(): void {
  reloadSchema();
  active.value = "runtime";
  ElMessage.success("已切换到「渲染器」页签，正在渲染当前设计");
}
</script>

<template>
  <main class="demo">
    <header class="demo__head">
      <div class="demo__head-row">
        <h1 class="demo__title">@x-ac/web-design-vue-element-plus</h1>
        <el-segmented v-model="active" :options="tabs" class="demo__tabs" />
      </div>
      <p class="demo__desc">
        引擎只提供架构；适配包注册组件与组件配置，引擎整合成设计器与渲染器。属性设置面板用的也是这里注册的 Element Plus 组件。
        接入只需一行：<code>app.use(createVueDesign({ adapter: elementPlusAdapter }))</code>
      </p>
    </header>

    <DesignerSection
      v-show="active === 'designer'"
      :page-id="PAGE_ID"
      :repository="repository"
      @saved="reloadSchema"
      @preview="goPreview"
    />

    <RuntimeSection
      v-show="active === 'runtime'"
      :page="schema"
      :data="data"
    />

    <!-- 物料总览：保持本包原实现不变，仅换一个可滚动的容器 -->
    <section v-show="active === 'catalog'" class="demo__panel demo__panel--catalog">
      <CatalogSection />
    </section>

    <section v-show="active === 'adapter'" class="demo__panel demo__panel--adapter">
      <div class="demo__runtime">
        <AdapterSection />
      </div>
    </section>
  </main>
</template>
