<script setup lang="ts">
/**
 * 自动补全。建议列表来自 `options`（逗号分隔），按输入内容做前缀过滤。
 *
 * 真实项目里建议通常来自接口，但 Schema 存不了函数；
 * 需要远程搜索时用「下拉选择 + 开启 filterable」或者自定义物料。
 */
import { computed } from "vue";
import { parseLabels } from "@x-ac/design-core";

const props = withDefaults(
  defineProps<{
    modelValue?: unknown;
    options?: string;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    debounce?: number;
    placement?: "top" | "bottom" | "top-start" | "bottom-start";
    valueKey?: string;
  }>(),
  {
    options: "北京,上海,广州,深圳",
    placeholder: "请输入",
    clearable: true,
    disabled: false,
    debounce: 300,
    placement: "bottom-start",
    valueKey: "value",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: unknown): void;
  (e: "change", value: unknown): void;
}>();

const suggestions = computed(() => parseLabels(props.options));

/** cb 拿到的是对象数组，展示字段固定为 value（EP 的约定） */
function fetchSuggestions(query: string, callback: (items: Array<Record<string, unknown>>) => void): void {
  const keyword = query.trim();
  const matched = keyword
    ? suggestions.value.filter((item) => item.includes(keyword))
    : suggestions.value;
  callback(matched.map((item) => ({ value: item })));
}

/**
 * 受控逻辑保留手写实现、不套用 useFieldModel 的原因：
 * 本组件 change 与模型回写不是同一条通道 —— @update:model-value 每次输入都会触发，
 * 只负责回写 modelValue；change 则来自独立的 @select 事件，且取 item[valueKey]
 * 做转换。useFieldModel 的 onUpdate 把回写与 change 绑在同一个值上一起触发，
 * 直接套用会让每次按键都多抛一次 change、并丢掉 @select 的转换值，行为发生变化。
 */
function onInput(value: unknown): void {
  emit("update:modelValue", value);
}
</script>

<template>
  <el-autocomplete
    :model-value="String(modelValue ?? '')"
    :fetch-suggestions="fetchSuggestions"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :debounce="Number(debounce) || 300"
    :placement="placement"
    :value-key="valueKey"
    @update:model-value="onInput"
    @select="(item: Record<string, unknown>) => emit('change', item[valueKey])"
  />
</template>
