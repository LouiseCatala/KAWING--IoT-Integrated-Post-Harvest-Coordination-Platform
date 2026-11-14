<?php
declare(strict_types=1);
// All test writes use connection-local TEMPORARY tables, which shadow the real
// tables and disappear automatically when this process exits.
require __DIR__ . '/../public/api/config.php';
require __DIR__ . '/check-realtime.php';
foreach (['users', 'harvests', 'service_requests', 'offers', 'offered_services', 'production_loans', 'notifications', 'system_settings'] as $table) {
    $definition = $pdo->query("SHOW CREATE TABLE {$table}")->fetch(PDO::FETCH_NUM)[1];
    $pdo->exec(preg_replace('/^CREATE TABLE/', 'CREATE TEMPORARY TABLE', $definition));
}
$first = ['id' => 'test-h1', 'farmerEmail' => $farmer['email'], 'quantity' => 10, 'status' => 'posted'];
$second = ['id' => 'test-h2', 'farmerEmail' => 'farmer2@example.test', 'quantity' => 20, 'status' => 'posted'];
$change = static fn(string $collection, string $id, ?array $before, ?array $after): array => compact('collection', 'id', 'before', 'after');
applyLiveChanges($pdo, [$change('harvests', 'test-h1', null, $first)], $farmer);
applyLiveChanges($pdo, [$change('harvests', 'test-h2', null, $second)], ['email' => 'farmer2@example.test', 'role' => 'farmer']);
check((int) $pdo->query('SELECT COUNT(*) FROM harvests')->fetchColumn() === 2, 'Second save overwrote the first user');
applyLiveChanges($pdo, [$change('harvests', 'test-h1', null, $first)], $farmer);
check((int) $pdo->query('SELECT COUNT(*) FROM harvests')->fetchColumn() === 2, 'Retry duplicated a record');
$changed = [...$first, 'quantity' => 12];
applyLiveChanges($pdo, [$change('harvests', 'test-h1', $first, $changed)], $farmer);
rejects(fn() => applyLiveChanges($pdo, [$change('harvests', 'test-h1', $first, [...$first, 'quantity' => 15])], $farmer), LiveConflict::class);
check((string) $pdo->query("SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.quantity')) FROM harvests WHERE id='test-h1'")->fetchColumn() === '12', 'Conflict modified stored data');
$version = liveVersions($pdo)['harvests'];
rejects(fn() => applyLiveChanges($pdo, [
    $change('harvests', 'test-h1', $changed, [...$changed, 'quantity' => 30]),
    $change('harvests', 'test-h2', $second, null),
], $farmer), LiveForbidden::class);
check((string) $pdo->query("SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.quantity')) FROM harvests WHERE id='test-h1'")->fetchColumn() === '12', 'Failed transaction was not rolled back');
check(liveVersions($pdo)['harvests'] === $version, 'Rolled back transaction published an event');
$hash = password_hash('Test-only-password-123!', PASSWORD_DEFAULT);
$account = ['email' => $farmer['email'], 'name' => 'Farmer', 'role' => 'farmer', 'isApproved' => false];
$pdo->prepare('INSERT INTO users (email,name,password_hash,role,is_approved,data) VALUES (?,?,?,?,?,?)')->execute([$farmer['email'], 'Farmer', $hash, 'farmer', 0, json_encode($account)]);
applyLiveChanges($pdo, [$change('users', $farmer['email'], $account, [...$account, 'isApproved' => true])], $admin);
check($pdo->query('SELECT password_hash FROM users')->fetchColumn() === $hash, 'Approval changed the password');
check((int) liveVersions($pdo)['users'] > 0, 'User update did not publish');
$account = [...$account, 'isApproved' => true];
$service = ['id' => 'test-service', 'farmerEmail' => $farmer['email'], 'harvestId' => 'test-h1', 'type' => 'Storage', 'status' => 'pending'];
$assignedService = ['id' => 'test-assigned-service', 'farmerEmail' => 'farmer2@example.test', 'type' => 'Storage', 'status' => 'matched', 'operatorEmail' => $farmer['email'], 'operatorName' => 'Farmer'];
$offer = ['id' => 'test-offer', 'harvestId' => 'test-h1', 'farmerEmail' => $farmer['email'], 'buyerEmail' => 'buyer@example.test', 'status' => 'pending'];
$providerService = ['id' => 'test-provider-service', 'providerEmail' => $farmer['email'], 'serviceType' => 'Storage', 'isAvailable' => true];
$loan = ['id' => 'test-loan', 'farmerEmail' => $farmer['email'], 'buyerEmail' => 'buyer@example.test', 'status' => 'Pending', 'requestedAmount' => 100];
$notification = ['id' => 'test-notification', 'userEmail' => $farmer['email'], 'type' => 'info', 'isRead' => false];
$insert = static function (string $sql, array $values) use ($pdo): void { $pdo->prepare($sql)->execute($values); };
$insert('INSERT INTO service_requests (id,harvest_id,farmer_email,service_type,status,data) VALUES (?,?,?,?,?,?)', [$service['id'], $service['harvestId'], $service['farmerEmail'], $service['type'], $service['status'], json_encode($service)]);
$insert('INSERT INTO service_requests (id,harvest_id,farmer_email,service_type,status,data) VALUES (?,?,?,?,?,?)', [$assignedService['id'], null, $assignedService['farmerEmail'], $assignedService['type'], $assignedService['status'], json_encode($assignedService)]);
$insert('INSERT INTO offers (id,harvest_id,buyer_email,farmer_email,status,data) VALUES (?,?,?,?,?,?)', [$offer['id'], $offer['harvestId'], $offer['buyerEmail'], $offer['farmerEmail'], $offer['status'], json_encode($offer)]);
$insert('INSERT INTO offered_services (id,provider_email,service_type,is_available,data) VALUES (?,?,?,?,?)', [$providerService['id'], $providerService['providerEmail'], $providerService['serviceType'], 1, json_encode($providerService)]);
$insert('INSERT INTO production_loans (id,farmer_email,buyer_email,status,requested_amount,data) VALUES (?,?,?,?,?,?)', [$loan['id'], $loan['farmerEmail'], $loan['buyerEmail'], $loan['status'], $loan['requestedAmount'], json_encode($loan)]);
$insert('INSERT INTO notifications (id,user_email,is_read,notification_type,data) VALUES (?,?,?,?,?)', [$notification['id'], $notification['userEmail'], 0, $notification['type'], json_encode($notification)]);
applyLiveChanges($pdo, [$change('users', $farmer['email'], $account, null)], $admin);
foreach (['users' => 'email', 'harvests' => 'farmer_email', 'service_requests' => 'farmer_email', 'offers' => 'farmer_email', 'offered_services' => 'provider_email', 'production_loans' => 'farmer_email', 'notifications' => 'user_email'] as $table => $column) {
    check((int) $pdo->query("SELECT COUNT(*) FROM {$table} WHERE {$column}='farmer@example.test'")->fetchColumn() === 0, "Deleting a user must remove related {$table} records");
}
check((int) $pdo->query("SELECT COUNT(*) FROM harvests WHERE id='test-h2'")->fetchColumn() === 1, 'Deleting one farmer must keep other farmers’ data');
check((string) $pdo->query("SELECT status FROM service_requests WHERE id='test-assigned-service'")->fetchColumn() === 'pending', 'Deleting a service provider should reopen another farmer’s request');
check($pdo->query("SELECT JSON_EXTRACT(data, '$.operatorEmail') FROM service_requests WHERE id='test-assigned-service'")->fetchColumn() === null, 'Reopened service should no longer reference the deleted provider');
echo "MySQL integration checks passed using temporary tables: concurrent saves, retries, rollback, credentials, and user data cleanup.\n";
