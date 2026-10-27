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
echo "MySQL integration checks passed using temporary tables: isolated concurrent saves, idempotent retries, conflict rollback, atomic versions, preserved credentials.\n";
