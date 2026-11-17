-- Run once on the existing Hostinger database before deploying the matching PHP API.
-- NULL is used for non-farmer accounts and farmers who have not registered a device.
ALTER TABLE users
  ADD COLUMN palaysense_id VARCHAR(64) NULL DEFAULT NULL,
  ADD UNIQUE KEY uq_users_palaysense_id (palaysense_id);
