<script setup lang="ts">
/**
 * 穿梭框。选项用逗号分隔，key 直接用文字 —— 低代码里没人会去对 key 和 label。
 */
import { computed } from "vue";
import { parseLabels } from "@x-ac/design-core";
import { useFieldModel } from "@x-ac/design-vue/kit";

const props = withDefaults(
  defineProps<{
    modelValue?: unknown;
    options?: string;
    titles?: string;
    buttonTexts?: string;
    filterable?: boolean;
    filterPlaceholder?: string;
    targetOrder?: "original" | "push" | "unshift";
    disabled?: boolean;
  }>(),
  {
    options: "选项一,选项二,选项三,选项四",
    titles: "待选,已选",
    buttonTexts: "",
    filterable: true,
    filterPlaceholder: "请输入搜索内容",
    targetOrder: "original",
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: unknown): void;
  (e: "change", value: unknown): void;
}>();

const data = computed(() => parseLabels(props.options).map((label) => ({ key: label, label })));
const titles = computed(() => {
  const parts = parseLabels(props.titles);
  return parts.length === 2 ? parts : ["待选", "已选"];
});
const buttons = computed(() => {
  const parts = parseLabels(props.buttonTexts);
  return parts.length === 2 ? parts : undefined;
});

const { onUpdate } = useFieldModel(
  () => props.modelValue,
  (value) => emit("update:modelValue", value),
  (value) => emit("change", value),
);
</script>

<template>
  <el-transfer
    :model-value="(Array.isArray(modelValue) ? modelValue : []) as never"
    :data="data"
    :titles="titles"
    :button-texts="buttons"
    :filterable="filterable"
    :filter-placeholder="filterPlaceholder"
    :target-order="targetOrder"
    :disabled="disabled"
    @update:model-value="onUpdate"
  />
</template>
