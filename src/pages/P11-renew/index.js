// P11 续费下单页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 2026-08-30 派活响应（与 P04 同款）：
//   - action-footer v2 (no slot)
//   - CTA 文案「续费下单 · 支付暂未上线」
//   - 点击 toast「支付功能开发中」（PM 规格；purchase CTA 统一口径）

const GOODS_NAME_DEFAULT = '会员小程序 SaaS';
const EXPIRE_LABEL_DEFAULT = '到期时间：2026-12-31 · 续费可叠加时长';
const BANNER_TEXT_DEFAULT = '月付到期前 7 天提醒，届时手动续费';

const TIERS = [
  { code: 'M', name: '月付版', duration: '30 天', price: '99' },
  { code: 'Y', name: '年付版', duration: '365 天 · 折合 2.7 元/天', price: '999' },
  { code: 'L', name: '终身版', duration: '终身可用 · 续费推荐', price: '9999' },
];

Page({
  data: {
    goodsName: GOODS_NAME_DEFAULT,
    expireLabel: EXPIRE_LABEL_DEFAULT,
    bannerText: BANNER_TEXT_DEFAULT,
    tiers: TIERS,
    selectedTier: 'L',
    agreed: false,
  },

  onLoad(query) {
    const updates = {};
    if (query && typeof query === 'object') {
      if (query.goodsName) updates.goodsName = decodeURIComponent(query.goodsName);
      if (query.expireLabel) updates.expireLabel = decodeURIComponent(query.expireLabel);
      if (query.tier && TIERS.some(t => t.code === query.tier)) updates.selectedTier = query.tier;
      if (query.agreed === '1') updates.agreed = true;
    }
    if (Object.keys(updates).length > 0) this.setData(updates);
  },

  onTapTier(e) {
    const code = e && e.detail && e.detail.code;
    if (!code || !TIERS.some(t => t.code === code)) return;
    this.setData({ selectedTier: code });
  },

  onAgreementChange(e) {
    const agreed = !!(e && e.detail && e.detail.checked);
    this.setData({ agreed });
  },

  onPrimary() {
    wx.showToast({ title: '支付功能开发中', icon: 'none' });
  },
});