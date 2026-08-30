// agreement-row 组件 — PANR-19 C5 P1 组件 (ADR-007 §二 #4)
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface ComponentData {
  checked: boolean;
  text: string;
  linkText: string;
}

Component<ComponentData, Record<string, never>>({
  data: {
    checked: false,
    text: '我已阅读并同意',
    linkText: '《会员服务协议》',
  },

  properties: {
    checked: { type: Boolean, value: false },
    text: { type: String, value: '我已阅读并同意' },
    linkText: { type: String, value: '《会员服务协议》' },
  },

  methods: {
    onTapRow() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const self = this as any;
      const next = !self.data.checked;
      self.triggerEvent('change', { checked: next });
    },
    onTapLink() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).triggerEvent('link');
    },
  },
});