// auth-code-card 组件 — PANR-19 C5 payment-deferred
//
// onActivate 不再 navigateTo /pages/P08-auth-code-detail/index；
// 仅做"复制授权码到剪贴板"+"toast 提示支付未启用"。
// 文案与后端 5030 (PAY_DISABLED) message 字段一一对应。

interface ComponentData {
  authCode: string;
  state: 'current' | 'history' | 'buffer';
}

Component<ComponentData, Record<string, never>>({
  data: {
    authCode: '',
    state: 'current',
  },

  properties: {
    authCode: { type: String, value: '' },
    state: { type: String, value: 'current' },
  },

  methods: {
    onActivate() {
      const code = this.data.authCode;
      if (!code) {
        wx.showToast({ title: '支付功能未启用', icon: 'none' });
        return;
      }
      wx.setClipboardData({
        data: code,
        success: () => {
          wx.showToast({ title: '支付功能未启用', icon: 'none' });
        },
        fail: () => {
          wx.showToast({ title: '支付功能未启用', icon: 'none' });
        },
      });
    },
  },
});
