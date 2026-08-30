// agreement-row 组件 — PANR-19 C5 P1 组件 (ADR-007 §二 #4)

Component({
  properties: {
    checked: {
      type: Boolean,
      value: false,
    },
    text: {
      type: String,
      value: '我已阅读并同意',
    },
    linkText: {
      type: String,
      value: '《会员服务协议》',
    },
  },

  data: {},

  methods: {
    onTapRow() {
      const next = !this.data.checked;
      this.triggerEvent('change', { checked: next });
    },
    onTapLink() {
      this.triggerEvent('link');
    },
  },
});