<script setup lang="ts">
/**
 * 栅格行。封装 Element Plus 的 el-row。
 *
 * 物料定义已上收至 core 的 ec-row（24 栅格 + justify/align/wrap + 双向 gutter），
 * 本组件只做「扁平 props → el-row」的翻译与能力磨平：
 * - 水平间距：走 el-row 原生 gutter（仅支持 Number，即水平方向）。
 * - 垂直间距：element-plus 2.x 的 el-row 没有垂直 gutter 能力，
 *   用 flex 容器的 row-gap 兜底（多行换行时生效，单行无副作用）。
 * - align=stretch 是 antd 有别于 EP 的能力，el-row 没有该取值，
 *   这里降级为 undefined 并在外层补 align-items:stretch（其余取值原样透传）。
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    gutter?: number;
    gutterVertical?: number;
    justify?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly";
    align?: "top" | "middle" | "bottom" | "stretch";
    wrap?: boolean;
  }>(),
  { gutter: 0, gutterVertical: 0, justify: "start", align: "top", wrap: true },
);

// el-row 原生 align 仅支持 top/middle/bottom，stretch 需降级
const rowAlign = computed(() => (props.align === "stretch" ? undefined : props.align));

const rowStyle = computed(() => {
  const style: Record<string, string> = {};
  // stretch 用 alignItems 补齐（el-row 无该取值）
  if (props.align === "stretch") style.alignItems = "stretch";
  // 垂直间距：el-row 不支持垂直 gutter，用 row-gap 兜底
  if (props.gutterVertical) style.rowGap = `${props.gutterVertical}px`;
  return Object.keys(style).length ? style : undefined;
});
</script>

<template>
  <el-row
    :gutter="Number(gutter) || 0"
    :justify="justify"
    :align="rowAlign"
    :wrap="wrap"
    :style="rowStyle"
  >
    <slot />
  </el-row>
</template>
