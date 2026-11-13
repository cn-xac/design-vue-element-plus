<script setup lang="ts">
/**
 * 栅格列。封装 Element Plus 的 el-col。
 *
 * 物料定义已上收至 core 的 ec-col（24 栅格 + 响应式断点 + order/flex），
 * 本组件做「扁平 props → el-col」的翻译与能力磨平：
 * - span / offset / xs..xl 原样透传给 el-col（列宽由 span 决定，不再被内容撑开）；
 * - order / flex 是 antd 有别于 EP 的能力，el-col 没有对应 prop，统一用内联 style 补齐；
 * - xxl 是 antd 的第六个断点（≥1600），el-col 仅到 xl，用一次性注入的 media-query 兜底。
 * 响应式数值为 0 表示「沿用通用宽度」，归一为 undefined 不传给 el-col（避免误隐藏）。
 */
import { computed, onMounted } from "vue";

let xxlStyleReady = false;
/** 一次性注入 xxl 断点样式：el-col 没有 xxl，用媒体查询补到 ≥1600 生效 */
function ensureXxlStyle(): void {
  if (xxlStyleReady || typeof document === "undefined") return;
  xxlStyleReady = true;
  const id = "ec-col-xxl-style";
  if (document.getElementById(id)) return;
  let css = "";
  for (let n = 1; n <= 24; n += 1) {
    const pct = ((n / 24) * 100).toFixed(4).replace(/\.?0+$/, "");
    css += `@media (min-width:1600px){.ec-col-xxl-${n}{flex:0 0 ${pct}%;max-width:${pct}%}}\n`;
  }
  const tag = document.createElement("style");
  tag.id = id;
  tag.textContent = css;
  document.head.appendChild(tag);
}

const props = withDefaults(
  defineProps<{
    span?: number;
    offset?: number;
    order?: number;
    flex?: string;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  }>(),
  { span: 24, offset: 0, order: 0, flex: "", xs: 0, sm: 0, md: 0, lg: 0, xl: 0, xxl: 0 },
);

const numOrUndef = (value: number | undefined): number | undefined =>
  value && Number(value) > 0 ? Number(value) : undefined;

const colStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.order && Number(props.order) > 0) style.order = String(props.order);
  if (props.flex) style.flex = String(props.flex);
  return style;
});

const extraClass = computed(() => {
  const xxl = numOrUndef(props.xxl);
  return xxl ? `ec-col-xxl-${xxl}` : undefined;
});

onMounted(() => {
  if (numOrUndef(props.xxl)) ensureXxlStyle();
});
</script>

<template>
  <el-col
    :span="Number(span) || 0"
    :offset="Number(offset) || 0"
    :xs="numOrUndef(xs)"
    :sm="numOrUndef(sm)"
    :md="numOrUndef(md)"
    :lg="numOrUndef(lg)"
    :xl="numOrUndef(xl)"
    :class="extraClass"
    :style="colStyle"
  >
    <slot />
  </el-col>
</template>
