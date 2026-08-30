// action-footer 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #5)
// 2026-08-30 v2：移除 slot，组件内部渲染 button（修复 P04 CTA 不可见 bug）

Component({
  properties: {
    primaryLabel: {
      type: String,
      value: '',
    },
    primaryDisabled: {
      type: Boolean,
      value: true, // 默认 disabled（标注「未上线」/ 支付降级期）
    },
    secondaryLabel: {
      type: String,
      value: '',
    },
    secondaryDisabled: {
      type: Boolean,
      value: false,
    },
    noBorder: {
      type: Boolean,
      value: false,
    },
  },

  data: {},

  methods: {
    onTapPrimary() {
      this.triggerEvent('primary');
    },
    onTapSecondary() {
      this.triggerEvent('secondary');
    },
  },
});