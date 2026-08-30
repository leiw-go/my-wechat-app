// P07 订单详情页 — PANR-19 C5 payment-deferred
//
// onViewAuthCode 不 navigateTo /pages/P08-auth-code-detail/index，
// 改为 toast 兜底，避免误触空页面。
// 文案与后端 5030 (PAY_DISABLED) message 字段一一对应。
//
// 与 index.ts 同源（DevTools 不原生编译 .ts；be9ba8f .ts 留作 PANR-24
// 引入构建工具链后的 source of truth。本 .js 副本确保 DevTools 能加载）。

Page({
  data: {
    loadState: 'idle',
    order: null,
  },

  onLoad() {
    // 本迭代无可呈现订单详情，error 态直接命中 empty 分支。
    this.setData({ loadState: 'error', order: null });
  },

  onViewAuthCode() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});