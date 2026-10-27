-- Safe, idempotent KAWING business-capability migration.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(32) NULL;
UPDATE users SET user_id = CONCAT('USR-', LEFT(SHA2(LOWER(COALESCE(email, name)), 256), 16)) WHERE user_id IS NULL OR user_id = '';
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS uq_users_user_id (user_id);

CREATE TABLE IF NOT EXISTS business_capabilities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(32) NOT NULL,
  capability ENUM('buyer','loan_provider','transport','storage','drying','milling') NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  approval_status ENUM('inactive','pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  is_available BOOLEAN NOT NULL DEFAULT FALSE, capacity VARCHAR(191), rate_info VARCHAR(255),
  location_coverage VARCHAR(255), details_json JSON, approved_by VARCHAR(32), approved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_business_capability (user_id, capability), INDEX idx_capability_status (capability, approval_status, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO business_capabilities (user_id, capability, enabled, approval_status, is_available, details_json)
SELECT user_id,
  CASE role WHEN 'buyer' THEN 'buyer' WHEN 'truck' THEN 'transport' WHEN 'storage' THEN 'storage' WHEN 'dryer' THEN 'drying' WHEN 'miller' THEN 'milling' END,
  TRUE, IF(is_approved, 'approved', 'pending'), is_approved, data
FROM users WHERE role IN ('buyer','truck','storage','dryer','miller')
ON DUPLICATE KEY UPDATE details_json = VALUES(details_json);

UPDATE users SET role = 'agricultural_business' WHERE role IN ('buyer','logistics','truck','storage','dryer','miller');
