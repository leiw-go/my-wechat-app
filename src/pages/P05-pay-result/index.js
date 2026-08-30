// P05 支付结果页 — PANR-19 C5 payment-deferred
// result 字段默认 'unknown' → 渲染 unknown 分支，与 5030 message 对齐。
// 真实支付结果链路（P05 由 /api/pay/notify 回调 + 客户端轮询更新）属 PANR-24。

Page({
  data: {
    result: 'unknown',
  },

  onLoad(query) {
    const allowed = ['success', 'pending', 'failed', 'unknown'];
    if (query && allowed.indexOf(query.result) !== -1) {
      this.setData({ result: query.result });
    }
  },
});