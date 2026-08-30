// P04 订单确认页 — PANR-19 C5 high-fidelity
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface Goods {
  name: string;
  subtitle: string;
}

interface Tier {
  code: 'M' | 'Y' | 'L';
  name: string;
  duration: string;
  price: string;
}

interface PageData {
  goods: Goods;
  tiers: Tier[];
  selectedTier: 'M' | 'Y' | 'L';
  agreed: boolean;
}

const GOODS: Goods = {
  name: '会员小程序 SaaS',
  subtitle: '一键开通会员体系 + 积分商城 + 优惠券',
};

const TIERS: Tier[] = [
  { code: 'M', name: '月付版', duration: '30 天 · 首期优惠', price: '99' },
  { code: 'Y', name: '年付版', duration: '365 天 · 折合 2.7 元/天', price: '999' },
  { code: 'L', name: '终身版', duration: '终身可用 · 限量发售', price: '9999' },
];

Page<PageData, Record<string, never>>({
  data: {
    goods: GOODS,
    tiers: TIERS,
    selectedTier: 'M',
    agreed: false,
  },

  onLoad(query) {
    const updates: Partial<PageData> = {};
    if (query && typeof query === 'object') {
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