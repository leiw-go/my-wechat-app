// PANR-19 C5 demo skeleton — App entry (Option A scope).
//
// Why .js not .ts: 微信开发者工具 (WeChat DevTools) does NOT natively
// compile TypeScript. PANR-24 will introduce a build pipeline
// (miniprogram-typescript / vite) and rewrite this entry as app.ts.
// For C5 demo, this .js stub is the real entry that DevTools executes.
//
// Page logic stays in each page's index.js (added in PANR-24).
// The 6 placeholder pages registered in app.json currently have only
// .wxml + .ts; DevTools will skip the page when navigated to until
// PANR-24 lands index.js — expected and acknowledged in scope trade-off.

App({
  onLaunch() {
    // eslint-disable-next-line no-console
    console.log('PANR-19 C5 demo skeleton launched (Option A scope, payment-deferred)');
  },

  onShow() {
    // 切前台：业务方扫码体验期间保留空实现
  },

  onError(err) {
    // 错误统一兜底；C5 demo 期间暂不打远端，等 PANR-24 接监控
    // eslint-disable-next-line no-console
    console.error('[PANR-19 C5] onError:', err);
  },
});