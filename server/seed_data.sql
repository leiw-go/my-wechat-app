-- =================================================================
-- PANR-19 / PANR-25 Seed Data — staging demo
-- =================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------
-- 1. category
-- -----------------------------------------------------------------
DELETE FROM `category`;
INSERT INTO `category` (`id`, `name`, `sort`, `status`) VALUES
  (1, '效率办公',  1, 1),
  (2, '设计创意',  2, 1);

-- -----------------------------------------------------------------
-- 2. goods (首期 IP：会员小程序 SaaS)
-- -----------------------------------------------------------------
DELETE FROM `goods`;
INSERT INTO `goods`
  (`id`, `title`, `subtitle`, `cover_img`, `description`, `demo_url`, `category_id`, `status`, `ip_proof_url`, `created_at`, `updated_at`)
VALUES
  (1,
   '会员小程序 SaaS 标准版',
   '为零售门店提供会员管理 / 积分 / 卡券的一体化小程序',
   'https://yaowen.store/static/cover-membership.png',
   '覆盖会员注册、积分累计、卡券发放、消费画像等核心场景；支持微信支付 + 微信卡包打通。',
   'https://yaowen.store/demo/membership',
   1,
   1,
   'https://yaowen.store/static/ip-proof/membership-license.pdf',
   NOW(), NOW());

-- -----------------------------------------------------------------
-- 3. goods_tier (3 档：M 月付 / Y 年付 / L 终身)
-- -----------------------------------------------------------------
DELETE FROM `goods_tier`;
INSERT INTO `goods_tier`
  (`id`, `goods_id`, `tier_code`, `tier_name`, `price_cent`, `duration_days`, `sort`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'M', '月付版',   9900,    30,    1, 1, NOW(), NOW()),
  (2, 1, 'Y', '年付版',   99900,   365,   2, 1, NOW(), NOW()),
  (3, 1, 'L', '终身版',   999900,  36500, 3, 1, NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'category' AS tbl, COUNT(*) AS cnt FROM category
UNION ALL SELECT 'goods', COUNT(*) FROM goods
UNION ALL SELECT 'goods_tier', COUNT(*) FROM goods_tier;