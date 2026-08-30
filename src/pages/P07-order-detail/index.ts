// P07 订单详情页 — PANR-19 C5 payment-deferred
//
// onViewAuthCode 不再 navigateTo /pages/P08-auth-code-detail/index，
// 改为 toast 兜底，避免误触空页面。
// 文案与后端 5030 (PAY_DISABLED) message 字段一一对应。

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

interface Order {
  orderNo: string;
  statusLabel: string;
}

interface PageData {
  loadState: LoadState;
  order: Order | null;
}

Page<PageData>({
  data: {
    loadState: 'idle',
    order: null,
  },

  onLoad(_query: Record<string, string | undefined>) {
    // 本迭代无可呈现订单详情，error 态直接命中 empty 分支。
    this.setData({ loadState: 'error', order: null });
  },

  onViewAuthCode() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});
