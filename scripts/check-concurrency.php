<?php
declare(strict_types=1);
// Uses a uniquely named disposable database, never application rows.
require __DIR__ . '/../public/api/config.php';
require __DIR__ . '/../public/api/realtime.php';
require __DIR__ . '/../public/api/mailer.php';

function expect(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function change(string $collection, string $id, ?array $before, ?array $after): array {
    return compact('collection', 'id', 'before', 'after');
}
function attempt(callable $action): array {
    try { $action(); return ['ok' => true]; }
    catch (LiveConflict $error) { return ['ok' => false, 'conflict' => $error->getMessage()]; }
}

if (($argv[1] ?? '') === 'worker') {
    $schema = $argv[2] ?? '';
    if (!preg_match('/^kawing_concurrency_test_[a-f0-9]{12}$/', $schema)) throw new RuntimeException('Invalid test database');
    $pdo->exec("USE `{$schema}`");
    $job = json_decode(base64_decode($argv[3]), true, 512, JSON_THROW_ON_ERROR);
    while (microtime(true) < $job['start']) usleep(1000);
    $result = attempt(function () use ($pdo, $job): void {
        if ($job['kind'] === 'login') {
            beginEndpointWrite($pdo, ['login:test-name']);
            $wait = consumeLoginAttempt($pdo, ['test-name' => 5], 1000);
            finishEndpointWrite($pdo, true);
            if ($wait) throw new LiveConflict('Limited');
        } elseif ($job['kind'] === 'register') {
            beginEndpointWrite($pdo, ['users-directory', 'users:' . $job['email']]);
            try {
                ensureUniqueAccount($pdo, 'Concurrent Name', $job['email']);
                $pdo->prepare("INSERT INTO users (email,name,role,is_approved,data) VALUES (?,'Concurrent Name','farmer',0,'{}')")->execute([$job['email']]);
                finishEndpointWrite($pdo, true);
            } catch (Throwable $error) { finishEndpointWrite($pdo, false); throw $error; }
        } elseif ($job['kind'] === 'email') {
            if (!claimEmailDelivery($pdo, 'email-test', 'nobody@example.test')) throw new LiveConflict('Claimed');
        } elseif ($job['kind'] === 'profile') {
            beginEndpointWrite($pdo, ['users:' . $job['email']]);
            try {
                $current = lockedRecord($pdo, 'users', $job['email']);
                $next = mergeSubmittedFields($current, $job['body'], ['bio']);
                $pdo->prepare('UPDATE users SET data=? WHERE email=?')->execute([json_encode($next), $job['email']]);
                finishEndpointWrite($pdo, true);
            } catch (Throwable $error) { finishEndpointWrite($pdo, false); throw $error; }
        } else applyLiveChanges($pdo, $job['changes'], $job['identity'], $job['requestId']);
    });
    echo json_encode($result);
    exit;
}

function race(string $schema, array $jobs): array {
    $processes = []; $start = microtime(true) + 2;
    foreach ($jobs as $job) {
        $payload = base64_encode(json_encode([...$job, 'start' => $start], JSON_THROW_ON_ERROR));
        $process = proc_open([PHP_BINARY, __FILE__, 'worker', $schema, $payload], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!is_resource($process)) throw new RuntimeException('Could not start concurrent worker.');
        fclose($pipes[0]);
        $processes[] = [$process, $pipes];
    }
    $results = [];
    foreach ($processes as [$process, $pipes]) {
        $output = stream_get_contents($pipes[1]); $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        $code = proc_close($process);
        expect($code === 0, 'Worker failed: ' . $error);
        $results[] = json_decode($output, true, 512, JSON_THROW_ON_ERROR);
    }
    return $results;
}

$originalDatabase = (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
$schema = 'kawing_concurrency_test_' . bin2hex(random_bytes(6));
$tables = ['users', 'harvests', 'service_requests', 'offers', 'offered_services', 'production_loans', 'notifications', 'system_settings', 'email_deliveries'];
$definitions = [];
foreach ($tables as $table) $definitions[] = $pdo->query("SHOW CREATE TABLE {$table}")->fetch(PDO::FETCH_NUM)[1];
$pdo->exec("CREATE DATABASE `{$schema}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
try {
    $pdo->exec("USE `{$schema}`");
    foreach ($definitions as $definition) $pdo->exec($definition);
    $farmer = ['email' => 'farmer@example.test', 'role' => 'farmer'];
    $buyer = ['email' => 'buyer@example.test', 'role' => 'agricultural_business'];
    $provider = ['email' => 'truck@example.test', 'role' => 'agricultural_business'];
    $other = ['email' => 'truck2@example.test', 'role' => 'agricultural_business'];
    foreach ([$farmer, $buyer, $provider, $other] as $identity) {
        $user = [...$identity, 'name' => $identity['email'], 'isApproved' => true, 'loanConfig' => ['enabled' => true, 'minAmount' => 1, 'maxAmount' => 100, 'availableFund' => 100], 'businessCapabilities' => ['transport' => ['enabled' => true, 'isAvailable' => true, 'approvalStatus' => 'approved', 'carryingCapacity' => '100 kg']]];
        $pdo->prepare('INSERT INTO users (email,name,role,is_approved,data) VALUES (?,?,?,1,?)')->execute([$user['email'], $user['name'], $user['role'], json_encode($user)]);
    }
    $job = static fn(array $changes, array $identity): array => ['kind' => 'changes', 'changes' => $changes, 'identity' => $identity, 'requestId' => bin2hex(random_bytes(16))];
    $harvest = ['id' => 'h1', 'farmerEmail' => $farmer['email'], 'quantity' => 100, 'status' => 'posted'];
    applyLiveChanges($pdo, [change('harvests', 'h1', null, $harvest)], $farmer);
    $offers = [];
    foreach (['o1', 'o2'] as $id) {
        $offer = ['id' => $id, 'harvestId' => 'h1', 'farmerEmail' => $farmer['email'], 'buyerEmail' => $buyer['email'], 'status' => 'pending', 'offerPrice' => 25];
        applyLiveChanges($pdo, [change('offers', $id, null, $offer)], $buyer);
        $offers[] = $offer;
    }
    $results = race($schema, array_map(fn($offer) => $job([change('offers', $offer['id'], $offer, [...$offer, 'status' => 'accepted'])], $farmer), $offers));
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 1, 'Two offers were accepted');
    expect((int) $pdo->query("SELECT COUNT(*) FROM offers WHERE status='accepted'")->fetchColumn() === 1, 'Winner count incorrect');
    expect((int) $pdo->query("SELECT COUNT(*) FROM offers WHERE status='pending'")->fetchColumn() === 0, 'Competitor not declined');
    $closedOffer = [...$offers[0], 'id' => 'o3'];
    expect(!attempt(fn() => applyLiveChanges($pdo, [change('offers', 'o3', null, $closedOffer)], $buyer))['ok'], 'Offer allowed on closed harvest');
    expect(!attempt(fn() => applyLiveChanges($pdo, [change('harvests', 'h1', [...$harvest, 'status' => 'completed'], null)], $farmer))['ok'], 'Sold harvest deleted');
    echo "Offer winner, closed-listing and harvest deletion checks passed.\n";

    $loans = [];
    foreach (['l1', 'l2'] as $id) {
        $loan = ['id' => $id, 'farmerEmail' => $farmer['email'], 'buyerEmail' => $buyer['email'], 'status' => 'Pending', 'requestedAmount' => 80];
        applyLiveChanges($pdo, [change('productionLoans', $id, null, $loan)], $farmer);
        $loans[] = lockedRecord($pdo, 'production_loans', $id);
    }
    $jobs = array_map(fn($loan) => $job([change('productionLoans', $loan['id'], $loan, [...$loan, 'status' => 'Approved', 'approvedAmount' => 80])], $buyer), $loans);
    $results = race($schema, $jobs);
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 1, 'Both loans spent the same funds');
    $winning = $results[0]['ok'] ? $jobs[0] : $jobs[1];
    applyLiveChanges($pdo, $winning['changes'], $buyer, $winning['requestId']);
    expect((float) lockedRecord($pdo, 'users', $buyer['email'])['loanConfig']['availableFund'] === 20.0, 'Approval retry deducted twice');
    echo "Concurrent loan approvals and idempotent retry checks passed.\n";
    $editable = [...$harvest, 'id' => 'editable', 'quantity' => 1];
    applyLiveChanges($pdo, [change('harvests', 'editable', null, $editable)], $farmer, 'create-editable');
    $edited = [...$editable, 'quantity' => 2];
    applyLiveChanges($pdo, [change('harvests', 'editable', $editable, $edited)], $farmer, 'edit-one');
    applyLiveChanges($pdo, [change('harvests', 'editable', $edited, $editable)], $farmer, 'edit-two');
    applyLiveChanges($pdo, [change('harvests', 'editable', $editable, $edited)], $farmer, 'edit-one');
    expect(lockedRecord($pdo, 'harvests', 'editable')['quantity'] === 1, 'Old retry reapplied an action');
    applyLiveChanges($pdo, [change('harvests', 'editable', $editable, $edited)], $farmer, 'edit-three');
    expect(lockedRecord($pdo, 'harvests', 'editable')['quantity'] === 2, 'Intentional repeated edit was suppressed');
    expect(!attempt(fn() => applyLiveChanges($pdo, [change('harvests', 'editable', $edited, $editable)], $farmer, 'edit-three'))['ok'], 'Reused request ID accepted a different payload');

    $request = ['id' => 's1', 'farmerEmail' => $farmer['email'], 'type' => 'transport', 'status' => 'pending', 'quantity' => 70, 'unit' => 'kg', 'preferredDate' => '2026-11-01', 'preferredTime' => '08:00'];
    applyLiveChanges($pdo, [change('services', 's1', null, $request)], $farmer);
    $results = race($schema, array_map(fn($p) => $job([change('services', 's1', $request, [...$request, 'status' => 'matched', 'operatorEmail' => $p['email']])], $p), [$provider, $other]));
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 1, 'Service assigned twice');
    $owner = lockedRecord($pdo, 'service_requests', 's1')['operatorEmail'];
    $request2 = [...$request, 'id' => 's2'];
    applyLiveChanges($pdo, [change('services', 's2', null, $request2)], $farmer);
    expect(!attempt(fn() => applyLiveChanges($pdo, [change('services', 's2', $request2, [...$request2, 'status' => 'matched', 'operatorEmail' => $owner])], ['email' => $owner, 'role' => 'agricultural_business']))['ok'], 'Capacity was overbooked');
    echo "Service assignment and capacity checks passed.\n";

    $results = race($schema, array_fill(0, 6, ['kind' => 'login']));
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 5, 'Concurrent login limit failed');
    expect(!attempt(fn() => mergeSubmittedFields(['bio' => 'new'], ['before' => ['bio' => 'old'], 'bio' => 'stale edit'], ['bio']))['ok'], 'Stale profile overwritten');
    $merged = mergeSubmittedFields(['bio' => 'new', 'address' => 'A'], ['before' => ['bio' => 'old', 'address' => 'A'], 'bio' => 'old', 'address' => 'B'], ['bio', 'address']);
    expect($merged['bio'] === 'new' && $merged['address'] === 'B', 'Independent profile edit lost');
    beginEndpointWrite($pdo, ['settings:faqs']);
    saveSharedList($pdo, 'faqs', ['before' => [], 'faqs' => [['id' => 'f1']]]);
    finishEndpointWrite($pdo, true);
    expect(!attempt(fn() => saveSharedList($pdo, 'faqs', ['before' => [], 'faqs' => [['id' => 'f2']]]))['ok'], 'Stale FAQ overwrite');
    expect(!attempt(fn() => ensureUniqueAccount($pdo, $buyer['email'], 'new@example.test'))['ok'], 'Duplicate username allowed');
    echo "Shared login limits, stale settings, profile merge and username checks passed.\n";
    $results = race($schema, [['kind' => 'register', 'email' => 'new1@example.test'], ['kind' => 'register', 'email' => 'new2@example.test']]);
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 1, 'Concurrent duplicate usernames created');
    $results = race($schema, [
        ['kind' => 'profile', 'email' => $farmer['email'], 'body' => ['before' => ['bio' => null], 'bio' => 'first']],
        ['kind' => 'profile', 'email' => $farmer['email'], 'body' => ['before' => ['bio' => null], 'bio' => 'second']],
    ]);
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 1, 'Concurrent profile updates overwrote each other');
    $results = race($schema, array_fill(0, 2, ['kind' => 'email']));
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 1, 'Email claimed twice');
    $pdo->exec("UPDATE email_deliveries SET delivery_status='failed' WHERE notification_id='email-test'");
    $results = race($schema, array_fill(0, 2, ['kind' => 'email']));
    expect(count(array_filter($results, fn($r) => $r['ok'])) === 1, 'Failed email retry claimed twice');
    echo "Concurrent registration, profile and email-claim checks passed (no email sent).\n";
} finally {
    if ($pdo->inTransaction()) $pdo->rollBack();
    $pdo->exec("USE `{$originalDatabase}`");
    $pdo->exec("DROP DATABASE `{$schema}`");
    echo "Disposable concurrency test database removed.\n";
}
