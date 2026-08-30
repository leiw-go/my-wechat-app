// P04 订单确认页 — PANR-19 C5 payment-deferred
//
// 本迭代支付功能砍掉：onSubmit 不调用 /api/order/create + /api/pay/unifiedorder，
// 直接拦截并提示用户，避免出现"下单成功但支付永远跑不通"的体验断点。
// 文案与后端 5030 (PAY_DISABLED) message 字段一一对应。

interface PageData {
  goodsName: string;
  tierName: string;
  price: string;
}

Page<PageData>({
  data: {
    goodsName: '',
    tierName: '',
    price: '0.00',
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      goodsName: query.goodsName ? decodeURIComponent(query.goodsName) : '',
      tierName: query.tierName ? decodeURIComponent(query.tierName) : '',
      price: query.price || '0.00',
    });
  },

  onSubmit() {
    // 后端若 WECHAT_PAY_* env 留空会返 5030；前端先早返，避免任何下单/支付副作用。
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});
