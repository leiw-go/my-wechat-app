// P06 我的订单页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 视觉对齐 issue 附件 p06-my-orders.html (v3 batch)
// 3 tabs: 全部 / 进行中 / 已完成
// 状态机（前端有限状态机，对齐 PRD §5）：
//   loadState = 'empty'   默认态（本迭代无订单 → 渲染 empty）
//   loadState = 'loading' 骨架屏（保留 PANR-24）
//   loadState = 'error'   网络异常 → error 空态 + 重新加载
//   loadState = 'ready'   已拉取到数据 → 渲染 order-row 列表
//
// payment-deferred 期间：
//   默认 loadState='empty'；真实拉取 (GET /api/order/list?tab=…) 属 PANR-24。
//   onSwitchTab 切 tab 时仅切 currentTab，不重拉（payment-deferred 期间）。

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

Page({
  data: {
    tabs: TABS,
    currentTab: 'all',
    loadState: 'empty', // 'empty' | 'loading' | 'error' | 'ready'
    orders: [],
  },

  onLoad() {
    // 本迭代无可呈现订单，empty 态直接命中。
    // 真实拉取 (GET /api/order/list?tab=all) 走 utils/request；PANR-24 接入。
    this.setData({ loadState: 'empty', orders: [] });
  },

  onSwitchTab(e) {
    const key = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.key;
    if (!key || TABS.some(t => t.key === key) === false) return;
    if (key === this.data.currentTab) return;
    this.setData({ currentTab: key });
    // payment-deferred 期间不重拉；PANR-24 接入 request.js 后补 fetch
  },

  onTapOrder(e) {
    const orderNo = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.orderNo;
    if (!orderNo) return;
    wx.navigateTo({ url: `/pages/P07-order-detail/index?orderNo=${orderNo}` });
  },

  onBrowseGoods() {
    // payment-deferred：浏览商品 → 跳 P04（与 PRD §US-01 主路径一致）
    wx.navigateTo({ url: '/pages/P04-order-confirm/index' });
  },

  onRetry() {
    // 重试逻辑占位（PANR-24 接入 request.js 后补 fetch）
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});