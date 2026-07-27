  CREATE TABLE IF NOT EXISTS betting_coupons (
    id           VARCHAR(40)  PRIMARY KEY,
    identifier   VARCHAR(64)  NOT NULL,        -- license: (server tarafında türetildi)
    misli        INT          NOT NULL,
    stake        INT          NOT NULL,        -- bedel (server hesapladı)
    total_odd    DECIMAL(12,2) NOT NULL,
    max_win      DECIMAL(14,2) NOT NULL,
    status       ENUM('pending','won','lost','void') NOT NULL DEFAULT 'pending',
    payout       DECIMAL(14,2) NOT NULL DEFAULT 0,
    bets         JSON         NOT NULL,        -- oran snapshot'ı dahil
    created_at   BIGINT       NOT NULL,
    settled_at   BIGINT       NULL,
    INDEX idx_identifier (identifier),
    INDEX idx_status (status)
  );

  CREATE TABLE IF NOT EXISTS betting_payouts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    citizenid  VARCHAR(64) NOT NULL,
    amount     INT         NOT NULL,
    money_type VARCHAR(16) NOT NULL DEFAULT 'bank',
    reason     VARCHAR(64) NOT NULL,
    claimed    TINYINT(1)  NOT NULL DEFAULT 0,
    created_at BIGINT      NOT NULL,
    claimed_at BIGINT      NULL,
    INDEX idx_citizenid_claimed (citizenid, claimed)
  );

  -- Sıralama takma adları (ilk girişte sign-up ile doldurulur)
CREATE TABLE IF NOT EXISTS `app_players` (
  `citizenid`  VARCHAR(64) NOT NULL,
  `name`       VARCHAR(32) NOT NULL,
  `created_at` BIGINT NOT NULL DEFAULT 0,
  `updated_at` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`citizenid`),
  UNIQUE KEY `uniq_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Leaderboard sorguları (status + settled_at) üzerinde gruplama yapar
-- Not: Index zaten varsa bu satırı atla.
ALTER TABLE `betting_coupons` ADD INDEX `idx_lb` (`status`, `settled_at`);