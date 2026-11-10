<script setup lang="ts">
import { ref, computed } from "vue";
import { SchemaRenderer } from "@x-ac/web-design-vue";
import type { Material, PageSchema, UiEventPayload } from "@x-ac/web-design-core";
import { buildPage, nodeForMaterial, isModal } from "../helpers";

const props = defineProps<{ material: Material }>();

// material.component 已是 `ec-` 前缀协议名；弹层判定需用裸名比对。
const bare = props.material.component.startsWith("ec-")
  ? props.material.component.slice(3)
  : props.material.component;

const uid = `m_${props.material.component}`;
const data = ref<Record<string, unknown>>({});
const modal = isModal(bare);
const show = ref(false);

const node = computed(() => {
  const n = nodeForMaterial(props.material, uid);
  if (modal) {
    n.props = { ...n.props, visible: show.value, modal: false };
    n.children = [{ id: `${uid}_c`, component: "ec-text", props: { text: `${props.material.title} 内容` } }];
  }
  return n;
});

const page = computed<PageSchema>(() => buildPage(`pg_${uid}`, [node.value], props.material.title));

// 总览卡片不处理交互，仅占位。
function onEvent(_p: UiEventPayload): void {
  /* noop */
}
</script>

<template>
  <div class="mat-card">
    <div class="mat-head">
      <span class="mat-title">{{ material.title }}</span>
      <code class="mat-comp">{{ material.component }}</code>
    </div>
    <div class="mat-body">
      <template v-if="modal">
        <el-button v-if="!show" size="small" @click="show = true">预览{{ material.title }}</el-button>
        <el-button v-else size="small" type="primary" @click="show = false">关闭</el-button>
        <SchemaRenderer v-if="show" :page="page" v-model:data="data" @node-event="onEvent" />
      </template>
      <SchemaRenderer v-else :page="page" v-model:data="data" @node-event="onEvent" />
    </div>
    <p v-if="material.hint" class="mat-hint">{{ material.hint }}</p>
  </div>
</template>
