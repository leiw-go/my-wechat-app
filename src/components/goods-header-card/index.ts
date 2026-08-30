// goods-header-card 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #1)
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface ComponentData {
  name: string;
  subtitle: string;
  subtitleTone: 'gray' | 'warn';
  cover: string;
}

Component<ComponentData, Record<string, never>>({
  data: {
    name: '',
    subtitle: '',
    subtitleTone: 'gray',
    cover: 'SaaS',
  },

  properties: {
    name: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    subtitleTone: { type: String, value: 'gray' },
    cover: { type: String, value: 'SaaS' },
  },
});