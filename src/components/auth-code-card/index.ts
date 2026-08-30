// auth-code-card 组件 — PANR-19 C5 high-fidelity
//
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth；.js 为
// DevTools-loadable 副本）。
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

interface ComponentData {
  code: string;
  variant: 'default' | 'copied' | 'expired';
  expireMsg: string;
  copyHint: string;
}

Component<ComponentData, Record<string, never>>({
  data: {
    code: '',
    variant: 'default',
    expireMsg: '',
    copyHint: '',
  },

  properties: {
    code: { type: String, value: '' },
    variant: { type: String, value: 'default' },
    expireMsg: { type: String, value: '' },
    copyHint: { type: String, value: '' },
  },

  methods: {
    onCopy() {
      const code = this.data.code || '';
      if (!code) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).triggerEvent('copy', { ok: false, reason: 'empty' });
        return;
      }
      // 复制行为交给父页面（统一 toast + variant 切换）；此处仅广播「用户点了」
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).triggerEvent('copy', { ok: true, code });
    },

    onReactivate() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).triggerEvent('reactivate', { code: this.data.code || '' });
    },
  },
});