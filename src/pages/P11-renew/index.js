// P11 续费下单页 — PANR-19 C5 payment-deferred
// 不调用 /api/order/renew，统一早返 toast 拦截。
// 文案与后端 5030 (PAY_DISABLED) message 字段一一对应。
//
// 与 index.ts 同源（DevTools 不原生编译 .ts；be9ba8f .ts 留作 PANR-24
// 引入构建工具链后的 source of truth。本 .js 副本确保 DevTools 能加载）。

Page({
  data: {
    goodsName: '',
    currentTier: '',
    expireAt: '',
    price: '0.00',
  },

  onLoad(query) {
    this.setData({
      goodsName: query && query.goodsName ? decodeURIComponent(query.goodsName) : '',
      currentTier: query && query.currentTier ? decodeURIComponent(query.currentTier) : '',
      expireAt: query && query.expireAt ? decodeURIComponent(query.expireAt) : '',
      price: (query && query.price) || '0.00',
    });
  },

  onSubmit() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});