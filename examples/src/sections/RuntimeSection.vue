<script setup lang="ts">
/**
 * 「渲染器」页：对标 design-react-antd 的 App.tsx runtime 分支。
 *
 * SchemaRenderer 消费与设计器同一份 PageSchema，只做「用组件渲染 + 导出数据 + 派发事件」。
 * 右侧面板把几条链路全部可视化：
 * - @update:data：scope 每次变化的深拷贝（等价于 react 的 onDataChange）；
 * - @node-event：只读通知，即使 onEvent 阻断也照常收到，适合埋点；
 * - :on-event：拦截钩子，返回 false / preventDefault() 可阻断预设动作；
 * - @submit：submitForm 动作校验通过后的数据行；
 * - ref.getData()：宿主主动导出的命令式 API。
 *
 * 动作（toast / setState / submitForm / confirm / resetForm）由 core 执行，
 * 宿主能力（ElMessage / ElMessageBox）由本适配包的 elementAdapter 提供。
 */
import { ref } from "vue";
import { SchemaRenderer } from "@x-ac/web-design-vue";
import type { PageSchema, UiEventPayload } from "@x-ac/web-design-core";

const props = defineProps<{ page: PageSchema; data: Record<string, unknown> }>();

type EventKind = "hook" | "notify" | "submit" | "blocked";
interface EventLine {
  kind: EventKind;
  text: string;
}

/** defineExpose 暴露的命令式句柄，单独声明避免依赖 SFC 类型推导 */
type RendererHandle = {
  getData: (options?: { validate?: boolean }) => { data: Record<string, unknown> };
};

const rendererRef = ref<InstanceType<typeof SchemaRenderer> | null>(null);

// 右侧面板初值与渲染器 scope 的 seed 对齐；用快照而非同一引用，避免 v-model 回环
const liveData = ref<Record<string, unknown>>(JSON.parse(JSON.stringify(props.data)) as Record<string, unknown>);
const events = ref<EventLine[]>([]);
const submitted = ref<Record<string, unknown> | null>(null);

function pushEvent(line: EventLine): void {
  events.value = [line, ...events.value].slice(0, 10);
}

/** scope → 宿主：v-model:data 的等价手写形式，便于顺手记录一条变更 */
function onDataChange(next: Record<string, unknown>): void {
  liveData.value = next;
  pushEvent({ kind: "notify", text: "onDataChange · scope 已更新" });
}

/** 拦截钩子：可阻断预设动作；这里演示对事件做二次记录，返回 undefined 表示放行 */
function onEvent(payload: UiEventPayload): void {
  pushEvent({
    kind: "hook",
    text: `onEvent 拦截 · ${payload.name} · ${payload.nodeId} · 动作 ${payload.actions.map((a) => a.action).join(",") || "无"}`,
  });
}

/** 只读通知：即使被 preventDefault 也会收到 */
function onNodeEvent(payload: UiEventPayload): void {
  pushEvent({
    kind: "notify",
    text: `onNodeEvent 通知 · ${payload.name} · ${payload.nodeId} · value=${String(payload.value ?? "")}`,
  });
}

function onSubmit(payload: Record<string, unknown>): void {
  submitted.value = payload;
  pushEvent({ kind: "submit", text: `onSubmit 回调 · 收到 ${Object.keys(payload).length} 个字段` });
}

function exportNow(): void {
  const handle = rendererRef.value as unknown as RendererHandle | null;
  const result = handle?.getData({ validate: false });
  if (!result) return;
  liveData.value = result.data;
  pushEvent({ kind: "hook", text: "手动调用 ref.getData()" });
}
</script>

<template>
  <section class="demo__panel demo__panel--runtime">
    <div class="demo__runtime">
      <SchemaRenderer
        ref="rendererRef"
        :page="page"
        :data="data"
        :on-event="onEvent"
        @update:data="onDataChange"
        @node-event="onNodeEvent"
        @submit="onSubmit"
      />
    </div>

    <aside class="demo__side">
      <div class="demo__side-head">
        <h3 class="demo__side-title">实时 scope / 导出数据</h3>
        <el-button size="small" @click="exportNow">导出</el-button>
      </div>
      <pre class="demo__code">{{ JSON.stringify(liveData, null, 2) }}</pre>

      <template v-if="submitted">
        <h3 class="demo__side-title">最近一次提交</h3>
        <pre class="demo__code">{{ JSON.stringify(submitted, null, 2) }}</pre>
      </template>

      <h3 class="demo__side-title">事件派发（最近 10 条）</h3>
      <ul v-if="events.length" class="demo__events">
        <li v-for="(item, index) in events" :key="`${item.text}-${index}`" :data-kind="item.kind">
          <span class="demo__event-kind">{{ item.kind }}</span> {{ item.text }}
        </li>
      </ul>
      <el-empty v-else description="修改字段或点击按钮后会在这里出现" :image-size="60" />

      <p class="demo__side-note">
        说明：onEvent 可阻断动作，@node-event 是只读通知；动作（toast / setState / submitForm /
        confirm / resetForm）由 core 执行，宿主能力（ElMessage / ElMessageBox）由本适配包提供。
      </p>
    </aside>
  </section>
</template>
