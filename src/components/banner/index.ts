// banner 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #3)
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface ComponentData {
  tone: 'info' | 'warn' | 'success' | 'error';
  text: string;
  dot: boolean;
}

Component<ComponentData, Record<string, never>>({
  data: {
    tone: 'info',
    text: '',
    dot: true,
  },

  properties: {
    tone: { type: String, value: 'info' },
    text: { type: String, value: '' },
    dot: { type: Boolean, value: true },
  },
});