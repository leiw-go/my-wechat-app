// P11 续费下单页 — PANR-19 C5 high-fidelity
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface Tier {
  code: 'M' | 'Y' | 'L';
  name: string;
  duration: string;
  price: string;
}

interface PageData {
  goodsName: string;
  expireLabel: string;
  bannerText: string;
  tiers: Tier[];
  selectedTier: 'M' | 'Y' | 'L';
  agreed: boolean;
}

const TIERS: Tier[] = [
  { code: 'M', name: '月付版', duration: '30 天', price: '99' },
  { code: 'Y', name: '年付版', duration: '365 天 · 折合 2.7 元/天', price: '999' },
  { code: 'L', name: '终身版', duration: '终身可用 · 续费推荐', price: '9999' },
];

Page<PageData, Record<string, never>>({
  data: {
    goodsName: '会员小程序 SaaS',
    expireLabel: '到期时间：2026-12-31 · 续费可叠加时长',
    bannerText: '月付到期前 7 天提醒，届时手动续费',
    tiers: TIERS,
    selectedTier: 'L',
    agreed: false,
  },

  onLoad(query) {
    const updates: Partial<PageData> = {};
    if (query && typeof query === 'object') {
      if (query.goodsName) updates.goodsName = decodeURIComponent(query.goodsName);
      if (query.expireLabel) updates.expireLabel = decodeURIComponent(query.expireLabel);
      if (query.tier && TIERS.some(t => t.code === query.tier)) {
        updates.selectedTier = query.tier as 'M' | 'Y' | 'L';
      }
      if (query.agreed === '1') updates.agreed = true;
    }
    if (Object.keys(updates).length > 0) this.setData(updates);
  },

  onTapTier(e: WechatMiniprogram.CustomEvent) {
    const code = e && e.detail && (e.detail as { code?: string }).code;
    if (!code || !TIERS.some(t => t.code === code)) return;
    this.setData({ selectedTier: code as 'M' | 'Y' | 'L' });
  },

  onAgreementChange(e: WechatMiniprogram.CustomEvent) {
    const agreed = !!(e && e.detail && (e.detail as { checked?: boolean }).checked);
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