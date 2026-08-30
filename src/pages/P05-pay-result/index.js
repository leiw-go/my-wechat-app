// P05 支付结果页 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 视觉对齐 issue 附件 p05-pay-result.html (v3 batch)
// 4 个 result 态 (success / pending / failed / unknown):
//   success: 绿圆 + ✓ + 支付成功 + 描述 + auth-card + 「查看订单详情」+ 「返回首页」
//   pending: 橙圆 + ⏱ + 支付处理中 + 「我已支付」+ 「取消」
//   failed:  红圆 + ✕ + 支付失败 + 「重试支付」+ 「联系客服」
//   unknown: 灰圆 + ? + 订单状态未知 + （无 footer）
//
// 支付路径（payment-deferred 期间）：
//   所有按钮早返 wx.showToast('支付功能未启用')；与后端 5030 PAY_DISABLED 对齐。
//   不调用 /api/pay/query + /api/order/status（request.js 拦截器会跳占位页）。
//
// 数据契约：
//   query.result ∈ {success, pending, failed, unknown}（默认 unknown）
//   query.order_no? — 后续真实场景用于拉 /api/order/detail（当前 demo 硬编码 authCode）
//   query.goods_name? — 描述区可显示商品名（当前 demo 未启用）

const STATE_TEXT = {
  success: {
    glyph: '✓',
    title: '支付成功',
    desc: '订单已生成，请在「我的订单」查看',
    primaryLabel: '查看订单详情',
    secondaryLabel: '返回首页',
    primaryAction: 'viewOrder',
    secondaryAction: 'goHome',
  },
  pending: {
    glyph: '⏱',
    title: '支付处理中',
    desc: '请稍后在「我的订单」查看结果',
    primaryLabel: '我已支付',
    secondaryLabel: '取消',
    primaryAction: 'forceQuery',
    secondaryAction: 'cancelOrder',
  },
  failed: {
    glyph: '✕',
    title: '支付失败',
    desc: '支付未成功，请重试或更换支付方式',
    primaryLabel: '重试支付',
    secondaryLabel: '联系客服',
    primaryAction: 'retryPay',
    secondaryAction: 'contactCs',
  },
  unknown: {
    glyph: '?',
    title: '订单状态未知',
    desc: '请刷新页面或在「我的订单」查看',
    primaryLabel: '',
    secondaryLabel: '',
    primaryAction: '',
    secondaryAction: '',
  },
};

const DEFAULT_AUTH_CODE = 'MEMB-M-XXXX-XXXX-XXXX-XXXX-XYZW'; // PRD §6.1 自研格式（30 字符）

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
      // demo 硬编码 authCode（payment-deferred 期间；真实场景由 /api/order/detail 拉取）
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

  onPrimary() {
    // payment-deferred：所有主按钮早返 toast，与 5030 对齐
    wx.showToast({ title: '支付功能未启用', icon: 'none' });
  },

  onSecondary() {
    // 次按钮：pending/failed 走取消 / 联系客服，payment-deferred 同样早返
    const result = this.data.result;
    if (result === 'pending') {
      // 取消订单（payment-deferred 期间无真实下单 → 仅 toast）
      wx.showToast({ title: '支付功能未启用', icon: 'none' });
      return;
    }
    if (result === 'failed') {
      // 联系客服（payment-deferred 期间无客服入口 → 仅 toast）
      wx.showToast({ title: '支付功能未启用', icon: 'none' });
      return;
    }
    // success: 返回首页
    wx.reLaunch({ url: '/pages/P04-order-confirm/index' });
  },
});