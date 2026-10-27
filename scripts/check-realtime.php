<?php
declare(strict_types=1);
require __DIR__ . '/../public/api/realtime.php';
function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function rejects(callable $fn, string $class): void {
    try { $fn(); } catch (Throwable $error) { check($error instanceof $class, 'Wrong exception: ' . $error::class); return; }
    throw new RuntimeException('Expected ' . $class);
}
$farmer = ['email' => 'farmer@example.test', 'role' => 'farmer'];
$buyer = ['email' => 'buyer@example.test', 'role' => 'buyer'];
$other = ['email' => 'other@example.test', 'role' => 'buyer'];
$admin = ['email' => 'admin@example.test', 'role' => 'admin'];
$row = ['id' => 'h1', 'farmerEmail' => $farmer['email'], 'quantity' => 10, 'status' => 'posted'];
$local = [...$row, 'quantity' => 12];
$remote = [...$row, 'status' => 'completed'];
check(liveMergeRecord($remote, $row, $local) === [...$remote, 'quantity' => 12], 'Independent fields should merge');
rejects(fn() => liveMergeRecord([...$row, 'quantity' => 20], $row, $local), LiveConflict::class);
rejects(fn() => liveMergeRecord(null, $row, $local), LiveConflict::class);
rejects(fn() => liveMergeRecord($remote, $row, null), LiveConflict::class);
check(liveMergeRecord($row, null, $row) === $row, 'Create retry must be idempotent');
authorizeLiveChange('harvests', $row, $local, $farmer);
rejects(fn() => authorizeLiveChange('harvests', $row, $local, $buyer), LiveForbidden::class);
rejects(fn() => authorizeLiveChange('harvests', $row, [...$local, 'farmerEmail' => $buyer['email']], $farmer), LiveForbidden::class);
$service = ['id' => 's1', 'status' => 'pending', 'farmerEmail' => $farmer['email']];
authorizeLiveChange('services', $service, [...$service, 'status' => 'matched', 'operatorEmail' => $buyer['email']], $buyer);
rejects(fn() => authorizeLiveChange('services', [...$service, 'operatorEmail' => $buyer['email']], [...$service, 'operatorEmail' => $other['email']], $other), LiveForbidden::class);
$db = array_fill_keys(LIVE_COLLECTIONS, []);
$db['settings'] = ['daReferencePrice' => 22.8, 'faqs' => [], '__live_users' => 4];
$db['users'] = [
    ['email' => $farmer['email'], 'name' => 'Farmer', 'role' => 'farmer', 'isApproved' => true, 'password' => 'secret', 'documents' => ['govId' => 'private']],
    ['email' => $buyer['email'], 'name' => 'Buyer', 'role' => 'buyer', 'isApproved' => true, 'documents' => ['govId' => 'private'], 'rsbsaNumber' => 'private'],
];
$db['harvests'] = [[...$row, 'sellingMethod' => 'bidding'], [...$row, 'id' => 'private', 'targetBuyerEmail' => $other['email']]];
$db['offers'] = [['id' => 'o1', 'harvestId' => 'h1', 'buyerEmail' => $other['email'], 'farmerEmail' => $farmer['email'], 'offerPrice' => 25, 'govIdData' => 'private']];
$db['notifications'] = [['id' => 'n1', 'userEmail' => $farmer['email']], ['id' => 'n2', 'userEmail' => $buyer['email']]];
$view = liveVisibleDatabase($db, $buyer);
check(count($view['harvests']) === 1, 'Targeted harvest must stay private');
check(!isset($view['users'][0]['documents'], $view['users'][0]['password']), 'Directory leaked credentials or documents');
check(!isset($view['offers'][0]['buyerEmail'], $view['offers'][0]['govIdData']), 'Bidding rankings leaked private buyer data');
check(count($view['notifications']) === 1 && $view['notifications'][0]['id'] === 'n2', 'Notification isolation failed');
check(count(liveVisibleDatabase($db, null)['users']) === 0, 'Anonymous database must be empty');
check(count(liveVisibleDatabase($db, $admin)['offers']) === 1, 'Administrator view failed');
echo "Realtime PHP checks passed: concurrent edits, conflicts, ownership, service claims, private projections.\n";
