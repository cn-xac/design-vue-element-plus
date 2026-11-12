<script setup lang="ts">
/**
 * 「设计器」页：对标 design-react-antd 的 App.tsx designer 分支。
 *
 * 用 Vue 引擎自带的真设计器（@x-ac/web-design-vue/designer），而不是本包早期
 * 「只把 designerKit 控件摆出来看」的静态展示 —— 后者移到了「适配包清单」页。
 *
 * 关键链路：设计器通过 repository 读写 PageSchema；点「保存 / 导出」后通知父级
 * 从同一个仓储重新读取，交给「渲染器」页，直观看到「设计时搭的 Schema → 运行时
 * 画出真实页面」这条链路。
 *
 * 设计器自身的顶栏/属性面板用的也是 elementPlusAdapter.designer（designerKit），
 * 由 main.ts 的 createVueDesign 全局注入，这里无需重复注册。
 */
import { ElMessage } from "element-plus";
import { SchemaDesigner } from "@x-ac/web-design-vue/designer";
import type { PageRepository } from "@x-ac/web-design-core";

defineProps<{ pageId: string; repository: PageRepository }>();

const emit = defineEmits<{ saved: []; preview: [] }>();

/** 示例站没有页面列表，给个明确提示，避免 back 按钮点了没反应 */
function onBack(): void {
  ElMessage.info("示例站没有页面列表；设计器已嵌在当前页签内");
}

/**
 * 预览：DesignerView.preview() 已先 save() 把当前设计写入仓储再 emit，
 * 这里只上抛事件，切页签与提示交给 App 统一处理。
 */
function onPreview(): void {
  emit("preview");
}
</script>

<template>
  <section class="demo__panel demo__panel--designer">
    <div class="demo__tip">
      左侧拖入物料 → 右侧属性面板（Element Plus 输入框 / 下拉 / 开关 / 取色）配置 → 点顶栏「保存」，再切到「渲染器」查看效果。
      预置 Schema 已覆盖 core 通用物料、EP 专有物料与两级嵌套子表单；保存后渲染器会重新读取同一份仓储。
    </div>
    <div class="demo__designer">
      <SchemaDesigner
        :page-id="pageId"
        :repository="repository"
        @saved="emit('saved')"
        @export-schema="emit('saved')"
        @back="onBack"
        @preview="onPreview"
      />
    </div>
  </section>
</template>
