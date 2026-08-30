// tier-list 组件 — PANR-19 C5 P0 组件 (ADR-007 §二 #2)
// 与 index.js 同源（PANR-24 引入构建工具链后 .ts 为 source of truth）

interface Tier {
  code: string;
  name: string;
  duration: string;
  price: string;
}

interface ComponentData {
  tiers: Tier[];
  selectedCode: string;
}

Component<ComponentData, Record<string, never>>({
  data: {
    tiers: [],
    selectedCode: 'M',
  },

  properties: {
    tiers: { type: Array, value: [] as Tier[] },
    selectedCode: { type: String, value: 'M' },
  },

  methods: {
    onTapRow(e: WechatMiniprogram.TouchEvent) {
      const code = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.code;
      if (!code) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).triggerEvent('select', { code });
    },
  },
});