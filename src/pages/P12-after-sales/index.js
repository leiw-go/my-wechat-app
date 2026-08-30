// P12 售后页 — PANR-19 C5 payment-deferred
// mode 默认 'after-sales' → 渲染 banner + aftersales 分支。
// 法务条款展示（mode=agreement）属 PANR-24 真实落地。

Page({
  data: {
    mode: 'after-sales',
    agreementText: '',
  },

  onLoad(query) {
    if (query && (query.mode === 'after-sales' || query.mode === 'agreement')) {
      this.setData({
        mode: query.mode,
        agreementText: query.agreementText
          ? decodeURIComponent(query.agreementText)
          : '',
      });
    }
  },

  onContactCs() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});