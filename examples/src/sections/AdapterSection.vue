<script setup lang="ts">
/**
 * 「适配包清单」页：对标 design-react-antd 的 AdapterPanel.tsx。
 *
 * 不渲染任何 Schema，只读取适配包导出的注册表，把「引擎只提供架构、
 * 适配包只注册组件与配置」这件事可视化，证明三件事：
 * 1. 组件表：ec-* → Element Plus 组件，一一对应；
 * 2. 物料表：core 通用清单 + EP 专有物料；missingComponents 为空（设计器无置灰项）；
 * 3. designer kit：7 个槽位全部由 Element Plus 控件实现（属性设置面板即用这些组件）。
 *
 * 原先「设计器适配（D3）」页只是把这些控件摆出来看，信息量并入本页的槽位清单，
 * 并补上了组件映射表与启动期自检，和 react-antd 的示例口径一致。
 */
import { computed } from "vue";
import { MATERIALS, DESIGNER_SLOTS, materialKey, missingComponents } from "@x-ac/web-design-core";
import {
  elementPlusAdapter,
  COMPONENT_MAP,
  elementPlusMaterials,
  designerKit,
} from "@x-ac/web-design-vue-element-plus";

const SLOT_LABELS: Record<string, string> = {
  Button: "按钮（顶栏 / 属性面板动作）",
  Input: "文本输入（多数字段）",
  NumberInput: "数字输入（number 字段）",
  Select: "下拉（select / options 字段）",
  Switch: "开关（boolean 字段）",
  Segmented: "分段（顶栏设备档位）",
  ColorInput: "取色（color 字段）",
};

const missing = missingComponents(elementPlusAdapter);

const componentRows = computed(() =>
  Object.entries(COMPONENT_MAP).map(([key, impl]) => ({
    key,
    protocol: key,
    impl:
      typeof impl === "string"
        ? impl
        : ((impl as { name?: string; __name?: string }).name ||
            (impl as { __name?: string }).__name ||
            "Vue 组件"),
    owner: MATERIALS.some((m) => materialKey(m.component) === key) ? "core 协议物料" : "EP 专有",
  })),
);

const extraCount = computed(() => elementPlusMaterials.length - MATERIALS.length);

const kitSlots = computed(() =>
  DESIGNER_SLOTS.map((slot) => ({
    slot,
    impl: (designerKit as unknown as Record<string, unknown>)[slot],
  })),
);

function implName(impl: unknown): string {
  if (!impl) return "未覆盖（回落原生）";
  if (typeof impl === "string") return impl;
  const c = impl as { name?: string; __name?: string };
  return c.name || c.__name || "Vue 组件";
}
</script>

<template>
  <div class="adapter">
    <h2 class="adapter__title">适配包注册清单</h2>
    <p class="adapter__desc">
      <code>@x-ac/web-design-vue</code> 提供设计器与渲染器架构；本包只注册组件实现、物料配置与设计器控件，
      引擎把这些注册项整合成可用的设计器。渲染器不认识任何 UI 库，只消费组件表。
    </p>

    <el-alert
      :type="missing.length ? 'warning' : 'success'"
      :closable="false"
      show-icon
      class="adapter__alert"
    >
      <template #title>
        {{
          missing.length
            ? `还有 ${missing.length} 个物料缺实现：${missing.join(', ')}`
            : `物料实现齐全：${componentRows.length} 个组件全部就位，missingComponents 为空，设计器面板无置灰项`
        }}
      </template>
    </el-alert>

    <el-descriptions border size="small" :column="2" class="adapter__stats">
      <el-descriptions-item label="适配包标识">{{ elementPlusAdapter.name }}</el-descriptions-item>
      <el-descriptions-item label="绑定通道">
        {{ elementPlusAdapter.binding?.prop }} / {{ elementPlusAdapter.binding?.event }}
      </el-descriptions-item>
      <el-descriptions-item label="core 通用物料">{{ MATERIALS.length }} 个</el-descriptions-item>
      <el-descriptions-item label="EP 专有物料">{{ extraCount }} 个</el-descriptions-item>
      <el-descriptions-item label="物料表合计">{{ elementPlusMaterials.length }} 个</el-descriptions-item>
      <el-descriptions-item label="组件映射">{{ componentRows.length }} 个</el-descriptions-item>
    </el-descriptions>

    <h3 class="adapter__subtitle">设计器控件（designer kit · 7 槽位）</h3>
    <div class="adapter__slots">
      <el-tag v-for="item in kitSlots" :key="item.slot" type="primary" effect="plain" disable-transitions>
        {{ item.slot }} → {{ implName(item.impl) }} · {{ SLOT_LABELS[item.slot] ?? '' }}
      </el-tag>
    </div>
    <p class="adapter__hint">
      属性设置面板、物料面板、顶栏用的都是上表这些 Element Plus 控件 —— 属性配置本身也由已注册组件实现，
      这就是「设计态与上线态同 UI」（D3）。
    </p>

    <h3 class="adapter__subtitle">组件映射表</h3>
    <el-table :data="componentRows" size="small" border stripe height="360" row-key="key">
      <el-table-column prop="protocol" label="协议物料名" width="220" />
      <el-table-column prop="impl" label="Element Plus 实现" />
      <el-table-column prop="owner" label="来源" width="150" />
    </el-table>
  </div>
</template>
