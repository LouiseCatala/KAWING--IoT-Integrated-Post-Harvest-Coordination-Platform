CREATE DATABASE IF NOT EXISTS kawing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kawing;

CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(191) PRIMARY KEY, name VARCHAR(191) NOT NULL, password_hash VARCHAR(255) NULL, role VARCHAR(32) NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE, data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_approved (role, is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Create the first Administrator through a private deployment procedure.
-- No default Administrator identity or password is embedded in this schema.
CREATE TABLE IF NOT EXISTS harvests (
  id VARCHAR(64) PRIMARY KEY, farmer_email VARCHAR(191) NOT NULL, status VARCHAR(32) NOT NULL,
  harvest_date DATE NULL, moisture_level DECIMAL(5,2) NULL, data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_harvests_farmer (farmer_email), INDEX idx_harvests_status_date (status, harvest_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS service_requests (
  id VARCHAR(64) PRIMARY KEY, harvest_id VARCHAR(64) NULL, farmer_email VARCHAR(191) NOT NULL,
  service_type VARCHAR(32) NOT NULL, status VARCHAR(32) NOT NULL, data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_services_farmer (farmer_email), INDEX idx_services_type_status (service_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS offered_services (
  id VARCHAR(64) PRIMARY KEY, provider_email VARCHAR(191) NOT NULL, service_type VARCHAR(32) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE, data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_offered_provider (provider_email), INDEX idx_offered_available (service_type, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS offers (
  id VARCHAR(64) PRIMARY KEY, harvest_id VARCHAR(64) NOT NULL, buyer_email VARCHAR(191) NOT NULL,
  farmer_email VARCHAR(191) NOT NULL, status VARCHAR(32) NOT NULL, data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_offers_harvest (harvest_id), INDEX idx_offers_buyer (buyer_email), INDEX idx_offers_farmer_status (farmer_email, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS production_loans (
  id VARCHAR(64) PRIMARY KEY, farmer_email VARCHAR(191) NOT NULL, buyer_email VARCHAR(191) NOT NULL,
  status VARCHAR(32) NOT NULL, requested_amount DECIMAL(14,2) NOT NULL, data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_loans_farmer (farmer_email), INDEX idx_loans_buyer_status (buyer_email, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY, user_email VARCHAR(191) NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE,
  notification_type VARCHAR(32) NOT NULL, data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_read (user_email, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- PalaySense readings are temporary inputs; harvests retain the submitted moisture value.
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (setting_key, setting_value)
VALUES ('daReferencePrice', '22.8');
CREATE TABLE IF NOT EXISTS email_deliveries (
  notification_id VARCHAR(64) PRIMARY KEY,
  recipient_email VARCHAR(191) NOT NULL,
  delivery_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  last_error VARCHAR(500) NULL,
  sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email_delivery_recipient (recipient_email, delivery_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_daily_usage (
  user_email VARCHAR(191) NOT NULL,
  usage_date DATE NOT NULL,
  questions_used INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_email, usage_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
