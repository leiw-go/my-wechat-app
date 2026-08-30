// P04 订单确认页 — PANR-19 C5 payment-deferred
//
// onSubmit 不调用 /api/order/create + /api/pay/unifiedorder，
// 直接拦截并 toast 提示，避免出现"下单成功但支付永远跑不通"的体验断点。
// 文案与后端 5030 (PAY_DISABLED) message 字段一一对应。
//
// 与 index.ts 同源（DevTools 不原生编译 .ts；be9ba8f .ts 留作 PANR-24
// 引入构建工具链后的 source of truth。本 .js 副本确保 DevTools 能加载）。

Page({
  data: {
    goodsName: '',
    tierName: '',
    price: '0.00',
  },

  onLoad(query) {
    this.setData({
      goodsName: query && query.goodsName ? decodeURIComponent(query.goodsName) : '',
      tierName: query && query.tierName ? decodeURIComponent(query.tierName) : '',
      price: (query && query.price) || '0.00',
    });
  },

  onSubmit() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});