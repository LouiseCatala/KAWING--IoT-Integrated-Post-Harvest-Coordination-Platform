<?php
declare(strict_types=1);

// Ratings are immutable and tied to an accepted offer and its signed-in participant.
function ratingRecipient(array $offer, string $email): string {
    $email = strtolower($email);
    $farmer = strtolower((string) ($offer['farmerEmail'] ?? ''));
    $buyer = strtolower((string) ($offer['buyerEmail'] ?? ''));
    if (!in_array($email, [$farmer, $buyer], true) || $farmer === $buyer || !$farmer || !$buyer) throw new LiveForbidden('Only the participants in this deal can rate each other.');
    if (($offer['status'] ?? '') !== 'accepted') throw new LiveForbidden('Ratings are available only after the offer is accepted.');
    return $email === $farmer ? $buyer : $farmer;
}

function handleRatings(PDO $pdo, string $method, array $identity): never {
    $pdo->exec('CREATE TABLE IF NOT EXISTS transaction_ratings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        offer_id VARCHAR(191) NOT NULL,
        reviewer_email VARCHAR(191) NOT NULL,
        recipient_email VARCHAR(191) NOT NULL,
        score TINYINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY one_review_per_deal (offer_id, reviewer_email),
        KEY recipient_ratings (recipient_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $email = strtolower($identity['email']);
    if ($method === 'GET' && isset($_GET['recipient'])) {
        $query = $pdo->prepare('SELECT AVG(score) AS average, COUNT(*) AS count FROM transaction_ratings WHERE recipient_email = ?');
        $query->execute([strtolower(trim((string) $_GET['recipient']))]);
        $row = $query->fetch();
        respond(['average' => $row['average'] === null ? null : round((float) $row['average'], 1), 'count' => (int) $row['count']]);
    }
    $body = $method === 'POST' ? json_decode(file_get_contents('php://input'), true) : $_GET;
    $offerId = trim((string) ($body['offerId'] ?? ''));
    $score = $body['score'] ?? null;
    if ($method === 'POST' && (!is_int($score) || $score < 1 || $score > 5)) respond(['error' => 'Choose a rating from 1 to 5.'], 422);
    $pdo->beginTransaction();
    try {
        $query = $pdo->prepare('SELECT data FROM offers WHERE id = ? FOR UPDATE');
        $query->execute([$offerId]);
        $offer = json_decode((string) ($query->fetchColumn() ?: '{}'), true);
        $recipient = ratingRecipient($offer, $email);
        $existing = $pdo->prepare('SELECT score FROM transaction_ratings WHERE offer_id = ? AND reviewer_email = ?');
        $existing->execute([$offerId, $email]);
        $saved = $existing->fetchColumn();
        if ($method === 'POST') {
            if ($saved !== false) throw new LiveConflict('You have already rated this transaction.');
            $insert = $pdo->prepare('INSERT INTO transaction_ratings (offer_id, reviewer_email, recipient_email, score) VALUES (?, ?, ?, ?)');
            $insert->execute([$offerId, $email, $recipient, $score]);
            $saved = $score;
        }
        $pdo->commit();
        respond(['score' => $saved === false ? null : (int) $saved]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}
