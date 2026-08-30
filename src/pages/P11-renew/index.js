// P11 续费下单页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 与 index.ts 同源（DevTools 不原生编译 .ts；PANR-24 引入构建工具链后将以
// .ts 为 source of truth）。本 .js 副本确保 DevTools 加载 + 业务方真机预览。
//
// 视觉对齐 issue 附件 p11-renew.html (v3 batch)
// 与 P04 几乎一致，4 处差异：
//   1. 头卡副标橙色：「到期时间：…」(vs P04 商品副标灰)
//   2. 段标「选择续费档位」(vs P04「选择档位」)
//   3. Banner Info 蓝调 (vs P04 .banner.warn 橙)
//   4. 默认选中 L (vs P04 M)
//   5. 主按钮文案「续费下单（未上线）」
//
// 状态机（前端有限状态机，对齐 PRD §5）：
//   loadState = 'ready'  首屏默认
//   agreed (boolean)     协议勾选
//
// 支付路径（payment-deferred 期间）：
//   onSubmit → 早返 wx.showToast('支付功能未启用') → 不调 /api/order/renew。
//   与后端 5030 PAY_DISABLED 对齐。

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
    selectedTier: 'L', // P11 默认 L (vs P04 M)
    agreed: false,
  },

  onLoad(query) {
    // 支持 query 预填
    const updates = {};
    if (query && query.goodsName) updates.goodsName = decodeURIComponent(query.goodsName);
    if (query && query.expireLabel) updates.expireLabel = decodeURIComponent(query.expireLabel);
    if (query && query.tier && TIERS.some(t => t.code === query.tier)) updates.selectedTier = query.tier;
    if (query && query.agreed === '1') updates.agreed = true;
    if (Object.keys(updates).length > 0) this.setData(updates);
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
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});