// action-footer 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #5)
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface ComponentData {
  primaryLabel: string;
  primaryDisabled: boolean;
  secondaryLabel: string;
  secondaryDisabled: boolean;
  noBorder: boolean;
}

Component<ComponentData, Record<string, never>>({
  data: {
    primaryLabel: '',
    primaryDisabled: true,
    secondaryLabel: '',
    secondaryDisabled: false,
    noBorder: false,
  },

  properties: {
    primaryLabel: { type: String, value: '' },
    primaryDisabled: { type: Boolean, value: true },
    secondaryLabel: { type: String, value: '' },
    secondaryDisabled: { type: Boolean, value: false },
    noBorder: { type: Boolean, value: false },
  },

  methods: {
    onTapPrimary() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).triggerEvent('primary');
    },
    onTapSecondary() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).triggerEvent('secondary');
    },
  },
});