<?php
declare(strict_types=1);
ob_start();
require __DIR__ . '/../public/api/realtime.php';
require __DIR__ . '/../public/api/ratings.php';
$offer = ['status' => 'accepted', 'farmerEmail' => 'farmer@example.com', 'buyerEmail' => 'buyer@example.com'];
function check(bool $value, string $message): void {
    if (!$value) throw new RuntimeException($message);
}
check(ratingRecipient($offer, 'farmer@example.com') === 'buyer@example.com', 'Farmer rates buyer');
check(ratingRecipient($offer, 'BUYER@example.com') === 'farmer@example.com', 'Buyer rates farmer');
foreach (['pending', 'declined', 'cancelled'] as $status) {
    try { ratingRecipient([...$offer, 'status' => $status], 'farmer@example.com'); throw new RuntimeException('Nonaccepted offer permitted'); }
    catch (LiveForbidden $expected) {}
}
foreach ([[$offer, 'outsider@example.com'], [[], 'farmer@example.com'], [[...$offer, 'buyerEmail' => 'farmer@example.com'], 'farmer@example.com']] as [$record, $email]) {
    try { ratingRecipient($record, $email); throw new RuntimeException('Unauthorized rating permitted'); }
    catch (LiveForbidden $expected) {}
}
echo "Rating participation and eligibility checks passed.\n";
if (in_array('--database', $argv, true)) {
    require __DIR__ . '/../public/api/config.php';
    $schema = file_get_contents(__DIR__ . '/../database/migrations/20261101_transaction_ratings.sql');
    $pdo->exec(str_replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMPORARY TABLE', $schema));
    $insert = $pdo->prepare('INSERT INTO transaction_ratings (offer_id, reviewer_email, recipient_email, score) VALUES (?, ?, ?, ?)');
    $insert->execute(['test-one', 'farmer@example.com', 'buyer@example.com', 4]);
    try { $insert->execute(['test-one', 'farmer@example.com', 'buyer@example.com', 5]); throw new RuntimeException('Duplicate allowed'); }
    catch (PDOException $expected) { check($expected->getCode() === '23000', 'Expected unique constraint'); }
    $insert->execute(['test-one', 'buyer@example.com', 'farmer@example.com', 3]);
    $insert->execute(['test-two', 'other@example.com', 'buyer@example.com', 5]);
    $row = $pdo->query("SELECT AVG(score) AS average, COUNT(*) AS count FROM transaction_ratings WHERE recipient_email = 'buyer@example.com'")->fetch();
    check((float) $row['average'] === 4.5 && (int) $row['count'] === 2, 'Average and count');
    echo "Temporary-table duplicate protection, reciprocal ratings, and averages passed.\n";
}
