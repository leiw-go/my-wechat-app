// P06 我的订单页 — PANR-19 C5 payment-deferred
// orders 默认空数组 → 渲染 empty 分支（"暂无订单"）。
// 真实订单拉取（GET /api/order/list）属 PANR-24。

Page({
  data: {
    orders: [],
  },

  onLoad() {
    // 本迭代无可呈现订单，empty 态直接命中
  },

  onShow() {
    // 留作占位，未来支付恢复时拉真实订单
  },
});