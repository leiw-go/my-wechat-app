// action-footer 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #5)
// 使用 slot 提供 primary + secondary 按钮，父页面自定义 button className

Component({
  properties: {
    single: {
      type: Boolean,
      value: false,
    },
    noBorder: {
      type: Boolean,
      value: false,
    },
  },

  data: {},
});