CREATE TABLE IF NOT EXISTS transaction_ratings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    offer_id VARCHAR(191) NOT NULL,
    reviewer_email VARCHAR(191) NOT NULL,
    recipient_email VARCHAR(191) NOT NULL,
    score TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY one_review_per_deal (offer_id, reviewer_email),
    KEY recipient_ratings (recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
