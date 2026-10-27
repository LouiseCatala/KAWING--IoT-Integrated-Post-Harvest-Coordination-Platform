<?php
declare(strict_types=1);

$config = require dirname(__DIR__) . '/kawing-config.php';
$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']);
$pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$roles = ['buyer', 'logistics', 'truck', 'storage', 'dryer', 'miller', 'agricultural_business'];
$placeholders = implode(',', array_fill(0, count($roles), '?'));
$hasUserId = (bool) $pdo->query("SHOW COLUMNS FROM users LIKE 'user_id'")->fetch();
$statement = $pdo->prepare('SELECT email,name,role,' . ($hasUserId ? 'user_id' : 'NULL AS user_id') . " FROM users WHERE role IN ($placeholders) ORDER BY role,name");
$statement->execute($roles);
$users = $statement->fetchAll();

if (!$users) {
    echo "No Buyer, Logistics, or Agricultural Business accounts found.\n";
    exit(0);
}

echo "Accounts selected for cleanup:\n";
foreach ($users as $user) echo sprintf("- %s | %s | %s\n", $user['email'], $user['name'], $user['role']);
if (($argv[1] ?? '') !== '--execute') {
    echo "\nDry run only. No records were deleted.\n";
    exit(0);
}

$emails = array_values(array_filter(array_column($users, 'email')));
$userIds = array_values(array_filter(array_column($users, 'user_id')));
$emailMarks = implode(',', array_fill(0, count($emails), '?'));
$pdo->beginTransaction();
try {
    $notificationIds = $pdo->prepare("SELECT id FROM notifications WHERE user_email IN ($emailMarks)");
    $notificationIds->execute($emails);
    $ids = array_column($notificationIds->fetchAll(), 'id');
    if ($ids) {
        $marks = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("DELETE FROM email_deliveries WHERE notification_id IN ($marks)")->execute($ids);
    }
    foreach ([
        "DELETE FROM notifications WHERE user_email IN ($emailMarks)",
        "DELETE FROM offered_services WHERE provider_email IN ($emailMarks)",
        "DELETE FROM offers WHERE buyer_email IN ($emailMarks)",
        "DELETE FROM production_loans WHERE buyer_email IN ($emailMarks)",
    ] as $sql) $pdo->prepare($sql)->execute($emails);
    $hasCapabilities = (bool) $pdo->query("SHOW TABLES LIKE 'business_capabilities'")->fetch();
    if ($hasCapabilities && $userIds) {
        $marks = implode(',', array_fill(0, count($userIds), '?'));
        $pdo->prepare("DELETE FROM business_capabilities WHERE user_id IN ($marks)")->execute($userIds);
    }
    $pdo->prepare("DELETE FROM users WHERE email IN ($emailMarks)")->execute($emails);
    $pdo->commit();
    echo "\nCleanup completed. Farmers, administrators, harvests, and moisture readings were preserved.\n";
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fwrite(STDERR, "Cleanup rolled back: {$error->getMessage()}\n");
    exit(1);
}
