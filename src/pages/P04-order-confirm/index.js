// P04 订单确认页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 重构后：所有结构件改用 P0 组件（ADR-007 §二方案 3）
//   - <goods-header-card> 商品头卡
//   - <tier-list>         档位列表
//   - <banner tone="warn"> 提示
//   - <agreement-row>     协议勾选
//   - <action-footer>     底部固定区
// 数据契约与原 P04 保持一致；事件绑定方式从内联 bindtap 改为组件事件。
//
// 视觉对齐 issue 附件 p04.html（v2 已 P04 单独 sign-off, 2026-08-30T10:55）。
//
// 状态机：
//   selectedTier (string)  当前选中档位 code
//   agreed (boolean)      协议勾选状态（来自 agreement-row change 事件）
//
// 支付路径（payment-deferred）：
//   onSubmit → 早返 wx.showToast('支付功能未启用')

const GOODS = {
  name: '会员小程序 SaaS',
  subtitle: '一键开通会员体系 + 积分商城 + 优惠券',
};

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
    const updates = {};
    if (query && typeof query === 'object') {
      if (query.tier && TIERS.some(t => t.code === query.tier)) {
        updates.selectedTier = query.tier;
      }
      if (query.agreed === '1') updates.agreed = true;
    }
    if (Object.keys(updates).length > 0) this.setData(updates);
  },

  // tier-list 组件广播事件
  onTapTier(e) {
    const code = e && e.detail && e.detail.code;
    if (!code || !TIERS.some(t => t.code === code)) return;
    this.setData({ selectedTier: code });
  },

  // agreement-row 组件广播事件
  onAgreementChange(e) {
    const agreed = !!(e && e.detail && e.detail.checked);
    this.setData({ agreed });
  },

  onSubmit() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选协议', icon: 'none' });
      return;
    }
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});