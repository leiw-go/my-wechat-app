// goods-header-card 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #1)

Component({
  properties: {
    name: {
      type: String,
      value: '',
    },
    subtitle: {
      type: String,
      value: '',
    },
    subtitleTone: {
      type: String,
      value: 'gray', // 'gray' | 'warn'
    },
    cover: {
      type: String,
      value: 'SaaS', // SaaS 占位文本（与 P04 cover 一致）
    },
  },

  data: {},
});