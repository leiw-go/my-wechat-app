// src/utils/request.js — PANR-19 C5 high-fidelity auth spec v1
//
// Authoritative source: backend owner auth/auth.controller.ts + jwt-auth.guard.ts
// + global-exception.filter.ts (commit e0cf259)
//
// 约定:
//   - 登录: POST /api/auth/wx-login {code, encryptedData?, iv?} → {access_token, refresh_token, user}
//   - Header 唯一合法: Authorization: Bearer <access_token>
//   - Storage: panr_access_token / panr_refresh_token / panr_user_profile
//   - 写接口 (POST/PUT/PATCH/DELETE) 必须 Idempotency-Key: ${openid}-${ts}-${rand}
//   - 401 / code=2000 → 清 token + wx.reLaunch('/pages/login/index')
//   - 503 / code=5030 → 跳转支付未启用占位页（guard 顺序：WxPayEnabledGuard 先于 JwtAuthGuard）
//   - 公开端点白名单（不发 token）: /api/auth/wx-login, /api/auth/refresh,
//                                    /api/category/list, /api/goods/*, /api/health/live,
//                                    /api/pay/notify
//
// 用法:
//   import { get, post, request, BizError } from '../../utils/request';
//   try { const list = await get('/api/goods/list'); }
//   catch (e) { if (e instanceof BizError) { /* e.code, e.message */ } }

const BASE_URL = 'https://yaowen.store/panr-api';

// 公开端点白名单（不发 Authorization 头）
const PUBLIC_ENDPOINTS = [
  /^\/api\/auth\/wx-login$/,
  /^\/api\/auth\/refresh$/,
  /^\/api\/category\/list$/,
  /^\/api\/goods(\/.*)?$/,
  /^\/api\/health\/live$/,
  /^\/api\/pay\/notify$/,
];

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// 业务异常：HTTP 非 200 + 业务 code 非 0 / 网络异常
export class BizError extends Error {
  constructor(code, message, httpStatus, raw) {
    super(message);
    this.name = 'BizError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.raw = raw;
  }
}

function getToken() {
  try {
    return wx.getStorageSync('panr_access_token') || '';
  } catch (_) {
    return '';
  }
}

function clearAuthStorage() {
  try {
    wx.removeStorageSync('panr_access_token');
    wx.removeStorageSync('panr_refresh_token');
    wx.removeStorageSync('panr_user_profile');
  } catch (_) {
    /* 静默吞错（storage 异常不影响主流程） */
  }
}

function isPublicEndpoint(path) {
  return PUBLIC_ENDPOINTS.some(re => re.test(path));
}

function genIdempotencyKey() {
  // ${openid}-${ts}-${rand}；openid 来自 user profile storage
  let openid = 'unknown';
  try {
    const profile = wx.getStorageSync('panr_user_profile');
    if (profile && profile.openid) openid = profile.openid;
  } catch (_) {
    /* 静默吞错（profile 缺失时 fallback 到 'unknown'） */
  }
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `${openid}-${ts}-${rand}`;
}

function buildHeader(method, path, customHeader = {}) {
  const header = { 'Content-Type': 'application/json', ...customHeader };
  if (!isPublicEndpoint(path)) {
    const token = getToken();
    if (token) header['Authorization'] = `Bearer ${token}`;
  }
  if (WRITE_METHODS.includes(method.toUpperCase())) {
    header['Idempotency-Key'] = genIdempotencyKey();
  }
  return header;
}

// 401 / code=2000 → 静默清 token + 跳登录
function handleAuthFail() {
  clearAuthStorage();
  wx.reLaunch({ url: '/pages/login/index' });
}

// 503 / code=5030 → 跳支付未启用占位页（guard 顺序：5030 先于 401）
//
// TODO(PANR-19 C5 next phase): 新增 src/pages/_placeholder/payment-disabled/index
// 当前 P04 onSubmit 不走 request()，所以 5030 路径不触发；P05 后续页面集成 request
// 后会触发，届时需先创建占位页。
function handlePaymentDisabled() {
  wx.reLaunch({ url: '/pages/_placeholder/payment-disabled/index' });
}

function resolveUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE_URL}${path}`;
}

export function request({ url, method = 'GET', data, header = {}, auth = true }) {
  const fullUrl = resolveUrl(url);
  const finalHeader = auth
    ? buildHeader(method, url, header)
    : { 'Content-Type': 'application/json', ...header };

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header: finalHeader,
      success(res) {
        const status = res.statusCode;
        const body = res.data || {};
        const code = body.code;

        // HTTP 401 → 静默重登
        if (status === 401) {
          handleAuthFail();
          reject(new BizError(2000, '未登录或登录已过期', 401, res));
          return;
        }

        // HTTP 503 + code 5030 (PAY_DISABLED) → 跳支付未启用占位
        if (status === 503 && code === 5030) {
          handlePaymentDisabled();
          reject(new BizError(5030, body.message || '支付功能未启用', 503, res));
          return;
        }

        // 业务 code=2000 (无 token / token 过期) → 静默重登
        if (code === 2000) {
          handleAuthFail();
          reject(new BizError(2000, body.message || '未登录', status, res));
          return;
        }

        // 业务 code=5030 (PAY_DISABLED) — 即使 HTTP 200 也跳占位
        if (code === 5030) {
          handlePaymentDisabled();
          reject(new BizError(5030, body.message || '支付功能未启用', status, res));
          return;
        }

        // 业务 code !== 0（其他业务异常）
        if (code !== undefined && code !== 0) {
          reject(new BizError(code, body.message || '业务异常', status, res));
          return;
        }

        // 成功：返回 data 字段
        resolve(body.data);
      },
      fail(err) {
        // 网络异常 / 超时
        reject(new BizError(-1, err.errMsg || '网络异常', 0, err));
      },
    });
  });
}

// 便捷方法
export const get = (url, opts = {}) => request({ ...opts, url, method: 'GET' });
export const post = (url, data, opts = {}) => request({ ...opts, url, method: 'POST', data });
export const put = (url, data, opts = {}) => request({ ...opts, url, method: 'PUT', data });
export const patch = (url, data, opts = {}) => request({ ...opts, url, method: 'PATCH', data });
export const del = (url, opts = {}) => request({ ...opts, url, method: 'DELETE' });