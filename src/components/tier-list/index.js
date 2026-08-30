// tier-list 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #2)
// 内部自渲染 tier-row，避免嵌套组件

Component({
  data: {},

  properties: {
    tiers: {
      type: Array,
      value: [],
    },
    selectedCode: {
      type: String,
      value: 'M',
    },
  },

  methods: {
    onTapRow(e) {
      const code = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.code;
      if (!code) return;
      this.triggerEvent('select', { code });
    },
  },
});