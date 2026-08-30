// banner 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #3)

Component({
  properties: {
    tone: {
      type: String,
      value: 'info', // 'info' | 'warn' | 'success' | 'error'
    },
    text: {
      type: String,
      value: '',
    },
    dot: {
      type: Boolean,
      value: true,
    },
  },

  data: {},
});