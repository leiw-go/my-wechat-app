// action-footer 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #5)
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface ComponentData {
  single: boolean;
  noBorder: boolean;
}

Component<ComponentData, Record<string, never>>({
  data: {
    single: false,
    noBorder: false,
  },

  properties: {
    single: { type: Boolean, value: false },
    noBorder: { type: Boolean, value: false },
  },
});