// P04 订单确认页 — PANR-19 C5 high-fidelity
//
// 视觉对齐 issue 附件 p04.html（v2 已 P04 单独 sign-off, 2026-08-30T10:55）。
// 数据来源（MVP demo 数据，无后端依赖）:
//   - goods: 硬编码「会员小程序 SaaS」（PRD §6.1 商品表首期示例）
//   - tiers: 硬编码 M/Y/L 三档（PRD §6.2 档位表；价格字段表留给业务方 §十 #5）
//   - selectedTier 默认 'M'（与 v2 HTML draft 默认选中一致）
//
// 状态机（前端有限状态机，对齐 PRD §5 订单状态机）:
//   loadState = 'ready'              首屏即就绪（无异步加载）
//   loadState = 'error'              onLoad 异常（当前未启用）
//   agreed (boolean)                 协议勾选状态
//
// 支付路径（本迭代砍掉，对齐 metadata c5_guard_order + 后端 5030）:
//   onSubmit → 早返 wx.showToast('支付功能未启用') → 不调 /api/order/create
//   不调 /api/pay/unifiedorder → 后端 WECHAT_PAY_* env 缺失会返 5030
//
// 与 index.ts 同源（DevTools 优先读 .js；be9ba8f .ts 留作 PANR-24 引入构建工具
// 链后的 source of truth）。本 .js 副本确保 DevTools 加载 + 业务方真机预览。

// PRD §6.1 商品表首期示例；副标与 HTML draft 一致
const GOODS = {
  name: '会员小程序 SaaS',
  subtitle: '一键开通会员体系 + 积分商城 + 优惠券',
};

// PRD §6.2 档位表首期示例（M / Y / L）；价格字段表 #5 留给业务方定，本期 demo 占位
const TIERS = [
  { code: 'M', name: '月付版', duration: '30 天 · 首期优惠', price: '99' },
  { code: 'Y', name: '年付版', duration: '365 天 · 折合 2.7 元/天', price: '999' },
  { code: 'L', name: '终身版', duration: '终身可用 · 限量发售', price: '9999' },
];

Page({
  data: {
    goods: GOODS,
    tiers: TIERS,
    selectedTier: 'M',
    agreed: false,
  },

  onLoad(query) {
    // 支持 query 预填（如 P07 续费入口传入 tier=M/Y/L；agreed=1）
    if (query && typeof query === 'object') {
      const updates = {};
      if (query.tier && TIERS.some(t => t.code === query.tier)) {
        updates.selectedTier = query.tier;
      }
      if (query.agreed === '1') {
        updates.agreed = true;
      }
      if (Object.keys(updates).length > 0) {
        this.setData(updates);
      }
    }
  },

  onBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 无上一页时（P04 是入口页）保持不动；未来接入 tabBar 后切到 /pages/index/index
      },
    });
  },

  onTapTier(e) {
    const code = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.code;
    if (!code || !TIERS.some(t => t.code === code)) return;
    this.setData({ selectedTier: code });
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  onSubmit() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选协议', icon: 'none' });
      return;
    }
    // 支付功能本迭代未启用：早返 toast（与后端 5030 message 对齐）
    // 不调用 /api/order/create + /api/pay/unifiedorder（guard 顺序修好后会返
    // 5030 PAY_DISABLED；前端先早返避免无意义往返）
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});