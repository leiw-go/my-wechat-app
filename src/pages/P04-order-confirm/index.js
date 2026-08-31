// P04 订单确认页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 重构后：所有结构件改用 P0 组件（ADR-007 §二方案 3）
//   - <goods-header-card> 商品头卡
//   - <tier-list>         档位列表
//   - <banner tone="warn"> 提示
//   - <agreement-row>     协议勾选
//   - <action-footer>     底部固定区（v2 内部渲染 button，无 slot）
// 数据契约与原 P04 保持一致；事件绑定方式从内联 bindtap 改为组件事件。
//
// 2026-08-30 派活响应（PM 视觉规格）：
//   - CTA 文案「立即开通 · 支付暂未上线」
//   - 点击 toast「支付功能开发中」（与 PANR-21 PRD v1.1 + 5030 降级一致）
//
// 状态机：
//   selectedTier (string)  当前选中档位 code
//   agreed (boolean)      协议勾选状态

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

  // v3.2 custom nav 返回 — 系统 nav 已禁用，靠 bindtap 兜底
  // 兜底逻辑：优先 wx.navigateBack（保留页面栈）；无栈时 reLaunch 兜底
  onTapBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      // reLaunch 场景（P01 home → P04 直跳）没有可回退页面
      wx.showToast({ title: '已是入口页', icon: 'none' });
    }
  },

  // action-footer 主按钮点击（PM 派活规格：toast「支付功能开发中」）
  onPrimary() {
    wx.showToast({ title: '支付功能开发中', icon: 'none' });
  },
});