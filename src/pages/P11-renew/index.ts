// P11 续费下单页 — PANR-19 C5 high-fidelity
//
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth；.js 为
// DevTools-loadable 副本）。
//
// 视觉对齐 issue 附件 p11-renew.html (v3 batch)
// 与 P04 几乎一致；4 处差异：副标橙色 + 段标改 + Banner Info 蓝 + 默认 L + 主按钮文案

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
    selectedTier: 'L', // P11 默认 L (vs P04 M)
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

  onTapTier(e: WechatMiniprogram.TouchEvent) {
    const code = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.code;
    if (!code || !TIERS.some(t => t.code === code)) return;
    this.setData({ selectedTier: code as 'M' | 'Y' | 'L' });
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  onSubmit() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选协议', icon: 'none' });
      return;
    }
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});