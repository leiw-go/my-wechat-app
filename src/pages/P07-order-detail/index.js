// P07 订单详情页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 视觉对齐 issue 附件 p07-order-detail.html (v3 batch)
// payment-deferred 期间默认 loadState='error'，直展示 error 空态；
// loaded 态逻辑保留供 PANR-24 接入（GET /api/order/detail/:order_no → utils/request）。
//
// 状态机（前端有限状态机，对齐 PRD §5）：
//   loadState = 'idle'     初始态
//   loadState = 'loading'  加载中（保留 PANR-24）
//   loadState = 'error'    加载失败 / 订单不存在（默认）
//   loadState = 'loaded'   已加载订单（PANR-24 接入后命中）

Page({
  data: {
    loadState: 'idle',
    order: null,
  },

  onLoad(query) {
    // payment-deferred：默认 error 态；PANR-24 接入后按 query.orderNo 拉真实数据
    this.setData({ loadState: 'error', order: null });
  },

  onRetry() {
    // PANR-24 接入：调 GET /api/order/detail/:order_no；走 utils/request
    // 当前 payment-deferred：早返 toast，与 5030 对齐
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },

  // auth-code-card 广播事件：复制授权码
  onCopyAuthCode(e) {
    const detail = (e && e.detail) || {};
    const code = detail.code || (this.data.order && this.data.order.authCode) || '';
    if (!code) {
      wx.showToast({ title: '授权码为空', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '已复制到剪贴板', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' }),
    });
  },

  // auth-code-card 广播事件：重新激活（失效态）
  onReactivate() {
    // 跳 P04 续费下单
    wx.navigateTo({ url: '/pages/P04-order-confirm/index' });
  },

  // Footer: 查看授权码 (payment-deferred 期间早返 toast)
  onViewAuthCode() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },

  // Footer: 申请售后 (跳 P12)
  onApplyAfterSales() {
    wx.navigateTo({ url: '/pages/P12-after-sales/index' });
  },
});