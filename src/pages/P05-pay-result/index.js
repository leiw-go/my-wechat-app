// P05 支付结果页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 2026-08-30 P04 CTA bug fix 同批次：
//   - action-footer v2 (no slot, 内部渲染 button)
//   - 4 态按钮文案按 query.result 切换

const STATE_TEXT = {
  success: {
    glyph: '✓',
    title: '支付成功',
    desc: '订单已生成，请在「我的订单」查看',
    primaryLabel: '查看订单详情',
    secondaryLabel: '返回首页',
  },
  pending: {
    glyph: '⏱',
    title: '支付处理中',
    desc: '请稍后在「我的订单」查看结果',
    primaryLabel: '我已支付',
    secondaryLabel: '取消',
  },
  failed: {
    glyph: '✕',
    title: '支付失败',
    desc: '支付未成功，请重试或更换支付方式',
    primaryLabel: '重试支付',
    secondaryLabel: '联系客服',
  },
  unknown: {
    glyph: '?',
    title: '订单状态未知',
    desc: '请刷新页面或在「我的订单」查看',
    primaryLabel: '',
    secondaryLabel: '',
  },
};

const DEFAULT_AUTH_CODE = 'MEMB-M-XXXX-XXXX-XXXX-XXXX-XYZW';

Page({
  data: {
    result: 'unknown',
    title: STATE_TEXT.unknown.title,
    desc: STATE_TEXT.unknown.desc,
    glyph: STATE_TEXT.unknown.glyph,
    primaryLabel: '',
    secondaryLabel: '',
    authCode: '',
  },

  onLoad(query) {
    const allowed = ['success', 'pending', 'failed', 'unknown'];
    const result = query && allowed.indexOf(query.result) !== -1 ? query.result : 'unknown';
    const text = STATE_TEXT[result];
    this.setData({
      result,
      title: text.title,
      desc: text.desc,
      glyph: text.glyph,
      primaryLabel: text.primaryLabel,
      secondaryLabel: text.secondaryLabel,
      authCode: result === 'success' ? DEFAULT_AUTH_CODE : '',
    });
  },

  // auth-code-card 广播事件：复制授权码
  onCopyAuthCode(e) {
    const detail = (e && e.detail) || {};
    const code = detail.code || this.data.authCode || '';
    if (!code) {
      wx.showToast({ title: '授权码为空', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '已复制到剪贴板', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' }),
    });
  },

  // 主按钮（4 态统一 toast 兜底 — payment-deferred 期间所有支付类操作早返）
  onPrimary() {
    wx.showToast({ title: '支付功能开发中', icon: 'none' });
  },

  // 次按钮
  onSecondary() {
    const result = this.data.result;
    if (result === 'success') {
      // 修复：success 态次按钮「返回首页」文案对应跳 P06-my-orders，
      // 而不是 P04-order-confirm（之前会回环到下单页，UX 不通）
      wx.reLaunch({ url: '/pages/P06-my-orders/index' });
      return;
    }
    // pending 取消 / failed 联系客服：payment-deferred 期间 toast 兜底
    wx.showToast({ title: '支付功能开发中', icon: 'none' });
  },
});