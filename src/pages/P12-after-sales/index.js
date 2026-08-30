// P12 售后 / 服务协议页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 视觉对齐 issue 附件 p12-after-sales.html (v3 batch)
// 顶部 mode 切换：售后（默认） / 服务协议
//
// 状态机（前端有限状态机）：
//   mode = 'after-sales' (默认) 售后页
//   mode = 'agreement'           服务协议长文

const MODES = [
  { key: 'after-sales', label: '售后' },
  { key: 'agreement', label: '服务协议' },
];

// FAQ: 3 条 (与 v3 HTML draft 一致)
const FAQS = [
  { id: 'refund', q: '如何申请退款？' },
  { id: 'lost', q: '授权码丢失怎么办？' },
  { id: 'upgrade', q: '可以升级套餐吗？' },
];

// 协议段落：5 段（HTML draft §1-§5）
const AGREEMENT_SECTIONS = [
  {
    id: 's1',
    h: '§1 服务内容',
    body: '本服务为会员小程序 SaaS 订阅，授权用户访问会员体系、积分商城、优惠券等功能。',
  },
  {
    id: 's2',
    h: '§2 时长与续费',
    body: '自激活之日起按所选档位（M 月付 / Y 年付 / L 终身）计算有效期，到期前 7 天提醒续费。',
  },
  {
    id: 's3',
    h: '§3 退款规则',
    body: '自购买起 7 日内未激活可全额退款；已激活订单按已使用时长比例退款，不足 7 天按整月扣除。',
  },
  {
    id: 's4',
    h: '§4 终止',
    body: '用户可随时终止订阅；服务到期后未续费，授权码自动失效并保留 7 天缓冲查看历史记录。',
  },
  {
    id: 's5',
    h: '§5 争议解决',
    body: '本协议适用中华人民共和国法律。协商不成的，提交北京仲裁委员会按其规则仲裁解决。',
  },
];

Page({
  data: {
    modes: MODES,
    mode: 'after-sales',
    faqs: FAQS,
    agreementSections: AGREEMENT_SECTIONS,
  },

  onLoad(query) {
    if (query && (query.mode === 'after-sales' || query.mode === 'agreement')) {
      this.setData({ mode: query.mode });
    }
  },

  onSwitchMode(e) {
    const key = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.key;
    if (!key || MODES.some(m => m.key === key) === false) return;
    if (key === this.data.mode) return;
    this.setData({ mode: key });
  },

  // apply-card 点击：跳申请售后 (payment-deferred 期间早返 toast)
  onTapApplyCard() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },

  // 联系客服 (payment-deferred 期间早返 toast)
  onContactCs() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },

  // FAQ 点击 (PANR-24 接 FAQ 详情页)
  onTapFaq(e) {
    const id = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id;
    if (!id) return;
    // payment-deferred 期间早返 toast
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },

  // Footer 主按钮：提交售后申请 (payment-deferred 期间早返 toast)
  onSubmit() {
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },
});