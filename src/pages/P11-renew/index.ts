// P11 续费下单页 — PANR-19 C5 payment-deferred
//
// 不调用 /api/order/renew，统一早返 toast。
// 文案与后端 5030 (PAY_DISABLED) message 字段一一对应。

interface PageData {
  goodsName: string;
  currentTier: string;
  expireAt: string;
  price: string;
}

Page<PageData>({
  data: {
    goodsName: '',
    currentTier: '',
    expireAt: '',
    price: '0.00',
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      goodsName: query.goodsName ? decodeURIComponent(query.goodsName) : '',
      currentTier: query.currentTier ? decodeURIComponent(query.currentTier) : '',
      expireAt: query.expireAt ? decodeURIComponent(query.expireAt) : '',
      price: query.price || '0.00',
    });
  },

  onSubmit() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});
