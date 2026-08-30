-- =================================================================
-- PANR-19 / PANR-25 C5 后端 MySQL Schema
-- Target: MySQL 8.0+ (兼容 MySQL 5.7)
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- Naming: snake_case, PK = bigint unsigned auto_increment
-- Auth Code format: MEMB-M-XXXXXXXXXXXXXXXXXXXX-XYZW (29 字符)
-- =================================================================
--
-- 使用: mysql -h <host> -u <user> -p < db/schema.sql
-- 或:  mysql -h <host> -u <user> -p dbname < db/schema.sql
-- =================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------
-- 1. 字典表:category
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(64)  NOT NULL,
  `sort`       INT          NOT NULL DEFAULT 0,
  `status`     TINYINT      NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_status_sort` (`status`, `sort`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='类目字典表';

-- -----------------------------------------------------------------
-- 2. 用户表:user
--    - phone_enc: AES-256-GCM 密文 base64
--    - phone_hash: SHA-256(phone), 用于索引查询(整号不入库)
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `openid`         VARCHAR(64)  NOT NULL,
  `unionid`        VARCHAR(64)  DEFAULT NULL,
  `nickname`       VARCHAR(64)  DEFAULT NULL,
  `avatar_url`     VARCHAR(256) DEFAULT NULL,
  `user_type`      TINYINT      NOT NULL DEFAULT 2 COMMENT '1=B端商户 2=C端个人',
  `company_name`   VARCHAR(128) DEFAULT NULL,
  `biz_license_no` VARCHAR(64)  DEFAULT NULL,
  `phone_enc`      VARCHAR(256) DEFAULT NULL COMMENT 'AES-256-GCM 加密, base64',
  `phone_hash`     VARCHAR(64)  DEFAULT NULL COMMENT 'SHA-256 哈希, 用于查询(整号不入库)',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_openid` (`openid`),
  KEY `idx_user_phone_hash` (`phone_hash`),
  KEY `idx_user_unionid` (`unionid`),
  KEY `idx_user_user_type` (`user_type`, `last_login_at` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='用户表:openid 主键,支持 B/C 端';

-- -----------------------------------------------------------------
-- 3. 商品表:goods
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `goods`;
CREATE TABLE `goods` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`        VARCHAR(128) NOT NULL,
  `subtitle`     VARCHAR(128) DEFAULT NULL,
  `cover_img`    VARCHAR(256) NOT NULL,
  `description`  TEXT         NOT NULL,
  `demo_url`     VARCHAR(256) DEFAULT NULL,
  `category_id`  BIGINT UNSIGNED NOT NULL,
  `status`       TINYINT      NOT NULL DEFAULT 1 COMMENT '1=上架 0=下架',
  `ip_proof_url` VARCHAR(256) NOT NULL COMMENT '软著/授权证明',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goods_status_category` (`status`, `category_id`),
  KEY `idx_goods_title` (`title`),
  KEY `idx_goods_created` (`created_at` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='商品表:首期示例 = 会员小程序 SaaS';

-- -----------------------------------------------------------------
-- 4. 商品档位表:goods_tier
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `goods_tier`;
CREATE TABLE `goods_tier` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `goods_id`      BIGINT UNSIGNED NOT NULL,
  `tier_code`     VARCHAR(8)  NOT NULL COMMENT 'M=月付 Y=年付 L=终身',
  `tier_name`     VARCHAR(32) NOT NULL,
  `price_cent`    INT         NOT NULL DEFAULT 0 COMMENT '价格(分)',
  `duration_days` INT         NOT NULL DEFAULT 30 COMMENT '月付=30/年付=365/终身=36500',
  `sort`          INT         NOT NULL DEFAULT 0,
  `status`        TINYINT     NOT NULL DEFAULT 1 COMMENT '1=启用 0=停用',
  `created_at`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_goods_tier` (`goods_id`, `tier_code`),
  KEY `idx_goods_tier_goods_status` (`goods_id`, `status`),
  CONSTRAINT `fk_goods_tier_goods` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='商品档位:M=月付 Y=年付 L=终身';

-- -----------------------------------------------------------------
-- 5. 订单表:order
--    - parent_order_id: 续费订单指向被续费的原订单
--    - status: 8 态状态机
--      pending_payment / paying / active / expiring_soon
--      renewing / expired / refunded / closed
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `order`;
CREATE TABLE `order` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`          VARCHAR(32)  NOT NULL COMMENT '业务订单号,微信侧唯一',
  `user_id`           BIGINT UNSIGNED NOT NULL,
  `user_type`         TINYINT      NOT NULL DEFAULT 2 COMMENT '1=B端 2=C端',
  `goods_id`          BIGINT UNSIGNED NOT NULL,
  `tier_id`           BIGINT UNSIGNED NOT NULL,
  `price_cent`        INT          NOT NULL DEFAULT 0 COMMENT '下单实付(分)',
  `status`            VARCHAR(16)  NOT NULL DEFAULT 'pending_payment' COMMENT '状态机 8 态',
  `wx_transaction_id` VARCHAR(64)  DEFAULT NULL,
  `paid_at`           DATETIME     DEFAULT NULL,
  `expire_at`         DATETIME     DEFAULT NULL,
  `parent_order_id`   BIGINT UNSIGNED DEFAULT NULL COMMENT '续费订单指向原订单',
  `extra`             JSON         DEFAULT NULL COMMENT '支付扩展字段',
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_order_user_status_created` (`user_id`, `status`, `created_at` DESC),
  KEY `idx_order_status_created` (`status`, `created_at` DESC),
  KEY `idx_order_expire_active` (`expire_at`),
  KEY `idx_order_wx_tx` (`wx_transaction_id`),
  KEY `idx_order_parent` (`parent_order_id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk_order_goods` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`),
  CONSTRAINT `fk_order_tier` FOREIGN KEY (`tier_id`) REFERENCES `goods_tier` (`id`),
  CONSTRAINT `fk_order_parent` FOREIGN KEY (`parent_order_id`) REFERENCES `order` (`id`),
  CONSTRAINT `chk_order_status` CHECK (`status` IN (
    'pending_payment','paying','active','expiring_soon',
    'renewing','expired','refunded','closed'
  ))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='订单表:8 态状态机驱动';

-- -----------------------------------------------------------------
-- 6. 授权码表:auth_code
--    - code: 自研格式 MEMB-M-XXXXXXXXXXXXXXXXXXXX-XYZW (29 字符)
--      - MEMB-  : 前缀标识
--      - M      : 类型码 (M=主码 R=重发码)
--      - X*20   : randomBytes(10) Base32(Crockford) 编码
--      - XYZW   : CRC32 校验位 (4 字符 Base32)
--    - replaced_by: 续费覆盖时指向新码 (7 天缓冲)
--    - replaced_expire: 缓冲到期时间
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `auth_code`;
CREATE TABLE `auth_code` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`             VARCHAR(32)  NOT NULL COMMENT 'MEMB-M-XXXXXXXXXXXXXXXXXXXX-XYZW',
  `order_id`         BIGINT UNSIGNED NOT NULL,
  `user_id`          BIGINT UNSIGNED NOT NULL,
  `goods_id`         BIGINT UNSIGNED NOT NULL,
  `status`           TINYINT      NOT NULL DEFAULT 1 COMMENT '1=有效 0=失效',
  `expire_at`        DATETIME     NOT NULL COMMENT '失效时间(终身版=2099-12-31)',
  `activated_at`     DATETIME     DEFAULT NULL,
  `activate_count`   INT          NOT NULL DEFAULT 0,
  `replaced_by`      BIGINT UNSIGNED DEFAULT NULL COMMENT '续费覆盖时指向新码',
  `replaced_expire`  DATETIME     DEFAULT NULL COMMENT '缓冲到期时间(replaced_by + 7 天)',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_auth_code_code` (`code`),
  KEY `idx_auth_code_order` (`order_id`),
  KEY `idx_auth_code_user_status` (`user_id`, `status`),
  KEY `idx_auth_code_goods` (`goods_id`),
  KEY `idx_auth_code_replaced` (`replaced_by`),
  KEY `idx_auth_code_replaced_expire` (`replaced_expire`),
  CONSTRAINT `fk_auth_code_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  CONSTRAINT `fk_auth_code_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk_auth_code_goods` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`),
  CONSTRAINT `fk_auth_code_replaced` FOREIGN KEY (`replaced_by`) REFERENCES `auth_code` (`id`),
  CONSTRAINT `chk_auth_code_status` CHECK (`status` IN (0, 1))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='授权码表:MEMB-M-... 格式, 续费覆盖 7 天缓冲';

-- -----------------------------------------------------------------
-- 7. 幂等键表:idempotency_key (写接口强制 24h TTL)
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `idempotency_key`;
CREATE TABLE `idempotency_key` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `idem_key`     VARCHAR(128) NOT NULL,
  `user_id`      BIGINT UNSIGNED DEFAULT NULL,
  `endpoint`     VARCHAR(128) NOT NULL,
  `request_hash` VARCHAR(64)  NOT NULL COMMENT '请求体 hash, 检测冲突',
  `response`     JSON         DEFAULT NULL COMMENT '首次响应缓存',
  `status_code`  INT          NOT NULL DEFAULT 0,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expire_at`    DATETIME     NOT NULL COMMENT 'TTL 24h',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_idem_key_endpoint` (`idem_key`, `endpoint`),
  KEY `idx_idem_expire` (`expire_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='幂等键表:写接口 Idempotency-Key 头强制';

-- -----------------------------------------------------------------
-- 8. 定时任务日志:cron_job_log (30min 超时 + 7 天缓冲清理)
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS `cron_job_log`;
CREATE TABLE `cron_job_log` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_name`    VARCHAR(64) NOT NULL,
  `run_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `affected`    INT         NOT NULL DEFAULT 0,
  `duration_ms` INT         NOT NULL DEFAULT 0,
  `error`       TEXT        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cron_log_job` (`job_name`, `run_at` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='定时任务执行日志';

SET FOREIGN_KEY_CHECKS = 1;

-- =================================================================
-- 种子数据(仅 dev/staging 环境)
-- =================================================================
-- INSERT INTO `category` (name, sort) VALUES ('IT科技-软件服务', 1);
-- INSERT INTO `goods` (title, subtitle, cover_img, description, category_id, ip_proof_url)
--   VALUES ('会员小程序 SaaS', '月付/年付/终身', 'https://cdn.example.com/cover.png',
--           '会员小程序 SaaS 介绍...', 1, 'https://cdn.example.com/ip-proof.pdf');
-- INSERT INTO `goods_tier` (goods_id, tier_code, tier_name, price_cent, duration_days, sort)
--   VALUES
--     (1, 'M', '月付版',  1900,   30,    1),
--     (1, 'Y', '年付版',  19800,  365,   2),
--     (1, 'L', '终身版',  99800,  36500, 3);
