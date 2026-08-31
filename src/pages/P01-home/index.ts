// P01 首页 — PANR-19 C5 (v3.2 sync · 3-tab)
//   原 4 tab (首页 / 分类 / 订单 / 我的) → v3.2 砍「订单」入口（支付未上线）
//   仅渲染骨架（推荐位 banner / 分类网格 / 推荐商品），CTA 标 disabled
//   路由：分类 → P02 / 商品 → P03 / 我的 → P09

interface Category {
  code: string;
  name: string;
  icon: string;
}

interface Goods {
  id: string;
  name: string;
  sub: string;
  price: string;
  unit: string;
  cover: string;
}

interface Banner {
  tag: string;
  title: string;
  sub: string;
}

interface PageData {
  tabs: Array<{ key: string; label: string }>;
  currentTab: string;
  categories: Category[];
  goods: Goods[];
  banners: Banner[];
  currentBannerIdx: number;
  banner: Banner;
}

const CATEGORIES: Category[] = [
  { code: 'member',  name: '会员体系', icon: '会' },
  { code: 'retail',  name: '电商零售', icon: '店' },
  { code: 'edu',     name: '教育培训', icon: '教' },
  { code: 'health',  name: '医疗健康', icon: '医' },
  { code: 'fnb',     name: '餐饮门店', icon: '餐' },
  { code: 'biz',     name: '企业服务', icon: '企' },
  { code: 'life',    name: '生活服务', icon: '生' },
  { code: 'all',     name: '全部',     icon: '全' },
];

const GOODS: Goods[] = [
  {
    id: 'g1',
    name: '会员小程序 SaaS',
    sub: '会员体系 · 优惠券 · 积分商城',
    price: '99',
    unit: '/月起',
    cover: 'linear-gradient(135deg, #1677FF 0%, #0A47A0 100%)',
  },
  {
    id: 'g2',
    name: '门店收银 SaaS',
    sub: '收银 · 库存 · 会员一站打通',
    price: '199',
    unit: '/月起',
    cover: 'linear-gradient(135deg, #722ED1 0%, #391085 100%)',
  },
];

const BANNERS: Banner[] = [
  { tag: '首期推荐', title: '会员小程序 SaaS', sub: '一键开通会员体系 · 月付 99 元起' },
  { tag: '限时优惠', title: '门店收银 SaaS', sub: '新店首发 · 6 个月免单' },
  { tag: '企业版',   title: '会员体系 Pro',   sub: '支持 SSO / 自定义品牌' },
];

Page<PageData, Record<string, never>>({
  data: {
    tabs: [
      { key: 'home',     label: '首页' },
      { key: 'category', label: '分类' },
      { key: 'me',       label: '我的' },
    ],
    currentTab: 'home',
    categories: CATEGORIES,
    goods: GOODS,
    banners: BANNERS,
    currentBannerIdx: 0,
    banner: BANNERS[0],
  },

  onTapSearch() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' });
  },

  onTapCategory(e: WechatMiniprogram.CustomEvent) {
    const code = (e && e.currentTarget && e.currentTarget.dataset && (e.currentTarget.dataset as { code?: string }).code) || '';
    wx.showToast({ title: `分类 ${code} 跳转开发中`, icon: 'none' });
  },

  onTapGoods(e: WechatMiniprogram.CustomEvent) {
    const id = (e && e.currentTarget && e.currentTarget.dataset && (e.currentTarget.dataset as { id?: string }).id) || '';
    wx.showToast({ title: `商品 ${id} 详情开发中`, icon: 'none' });
  },

  onTapBannerDot(e: WechatMiniprogram.CustomEvent) {
    const idx = e && e.currentTarget && e.currentTarget.dataset && (e.currentTarget.dataset as { idx?: number }).idx;
    if (typeof idx !== 'number' || idx < 0 || idx >= BANNERS.length) return;
    const b = BANNERS[idx];
    this.setData({
      currentBannerIdx: idx,
      banner: { tag: b.tag, title: b.title, sub: b.sub },
    });
  },

  onTapTab(e: WechatMiniprogram.CustomEvent) {
    const key = (e && e.currentTarget && e.currentTarget.dataset && (e.currentTarget.dataset as { key?: string }).key) || '';
    if (key === 'category') {
      wx.showToast({ title: '分类页开发中', icon: 'none' });
      return;
    }
    if (key === 'me') {
      wx.showToast({ title: '我的页跳转 P09（P09 未上线）', icon: 'none' });
      return;
    }
    this.setData({ currentTab: key });
  },
});