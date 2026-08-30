// auth-code-card 组件 — PANR-19 C5 high-fidelity (DevTools-loadable .js)
//
// 与 index.ts 同源（DevTools 不原生编译 .ts；PANR-24 引入构建工具链后将以
// .ts 为 source of truth）。本 .js 副本确保 DevTools 加载 + 业务方真机预览。
//
// 视觉对齐 issue 附件 auth-code-card.html (v3 batch)
// 3 个 variants: default / copied / expired
//   - default: 白底 + monospace + 「复制」链接
//   - copied:  绿底 + 绿点 + 「已复制」label + 复制 disabled (1.5s 自动回退 default)
//   - expired: 灰底 + line-through + 失效遮罩 + 「重新激活」按钮
//
// 行为:
//   - onCopy: 复制成功后广播事件 copy（父页面负责 toast / 设置 copied variant + 1.5s 回退）
//   - onReactivate: 失效态「重新激活」按钮 → 广播事件 reactivate（父页面跳转 P04）

Component({
  properties: {
    code: {
      type: String,
      value: '',
    },
    variant: {
      type: String,
      value: 'default', // 'default' | 'copied' | 'expired'
    },
    expireMsg: {
      type: String,
      value: '',
    },
    copyHint: {
      type: String,
      value: '',
    },
  },

  data: {},

  methods: {
    onCopy() {
      const code = this.data.code || '';
      if (!code) {
        this.triggerEvent('copy', { ok: false, reason: 'empty' });
        return;
      }
      // 复制行为交给父页面（统一 toast + variant 切换）；此处仅广播「用户点了」
      this.triggerEvent('copy', { ok: true, code });
    },

    onReactivate() {
      this.triggerEvent('reactivate', { code: this.data.code || '' });
    },
  },
});