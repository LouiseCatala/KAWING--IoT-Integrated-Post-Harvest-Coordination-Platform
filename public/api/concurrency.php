<?php
declare(strict_types=1);

// Named locks also cover records that have not been inserted yet. All writers
// use the same resource names; row changes still commit in InnoDB transactions.
function acquireWriteLocks(PDO $pdo, array $resources): array {
    $database = (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
    $names = array_unique(array_map(static fn(string $resource): string => 'kw:' . substr(hash('sha256', $database . ':' . $resource), 0, 60), $resources));
    sort($names, SORT_STRING);
    $held = [];
    try {
        foreach ($names as $name) {
            $statement = $pdo->prepare('SELECT GET_LOCK(?, 5)');
            $statement->execute([$name]);
            if ((int) $statement->fetchColumn() !== 1) throw new LiveConflict('Another request is updating this data. Please try again.');
            $held[] = $name;
        }
        return $held;
    } catch (Throwable $error) {
        releaseWriteLocks($pdo, $held);
        throw $error;
    }
}

function releaseWriteLocks(PDO $pdo, array $locks): void {
    foreach (array_reverse($locks) as $name) {
        $statement = $pdo->prepare('SELECT RELEASE_LOCK(?)');
        $statement->execute([$name]);
    }
}

function beginEndpointWrite(PDO $pdo, array $resources): void {
    $GLOBALS['endpointWriteLocks'] = acquireWriteLocks($pdo, $resources);
    $pdo->beginTransaction();
}

function finishEndpointWrite(PDO $pdo, bool $success): void {
    if ($pdo->inTransaction()) {
        if ($success) $pdo->commit(); else $pdo->rollBack();
    }
    releaseWriteLocks($pdo, $GLOBALS['endpointWriteLocks'] ?? []);
    $GLOBALS['endpointWriteLocks'] = [];
}

function lockedRecord(PDO $pdo, string $table, string $id): ?array {
    $allowed = ['users', 'harvests', 'offers', 'service_requests', 'production_loans', 'offered_services'];
    if (!in_array($table, $allowed, true)) throw new InvalidArgumentException('Invalid resource.');
    $key = $table === 'users' ? 'email' : 'id';
    $query = $pdo->prepare("SELECT data FROM {$table} WHERE {$key} = ? FOR UPDATE");
    $query->execute([$id]);
    $data = $query->fetchColumn();
    return $data === false ? null : json_decode((string) $data, true, 512, JSON_THROW_ON_ERROR);
}

function ensureUniqueAccount(PDO $pdo, string $name, string $email): void {
    $query = $pdo->prepare('SELECT email FROM users WHERE LOWER(name) = LOWER(?) AND LOWER(email) <> LOWER(?) LIMIT 1 FOR UPDATE');
    $query->execute([trim($name), trim($email)]);
    if ($query->fetchColumn() !== false) throw new LiveConflict('That username is already in use. Choose another name.');
}

// A baseline is required for settings forms. Unchanged submitted fields are
// ignored, so a profile save cannot overwrite a concurrent loan-fund deduction.
function mergeSubmittedFields(array $current, array $body, array $fields): array {
    if (!is_array($body['before'] ?? null)) throw new LiveConflict('Reload this form before saving.');
    foreach ($fields as $field) {
        $old = $body['before'][$field] ?? null;
        $next = $body[$field] ?? null;
        if (liveEqual($old, $next)) continue;
        $actual = $current[$field] ?? null;
        if (!liveEqual($actual, $old) && !liveEqual($actual, $next)) throw new LiveConflict('These details changed in another session. Reload and review them before saving.');
        $current[$field] = $next;
    }
    return $current;
}

function saveSharedList(PDO $pdo, string $key, array $body): array {
    $next = $body[$key] ?? null;
    if (!is_array($next)) throw new InvalidArgumentException('A list is required.');
    if (!array_key_exists('before', $body) || !is_array($body['before'])) throw new LiveConflict('Reload this list before saving.');
    $query = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ? FOR UPDATE');
    $query->execute([$key]);
    $current = json_decode((string) ($query->fetchColumn() ?: '[]'), true);
    if (!liveEqual($current, $body['before']) && !liveEqual($current, $next)) throw new LiveConflict('Another administrator changed this list. Reload it before saving.');
    $pdo->prepare('INSERT INTO system_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)')->execute([$key, json_encode(array_values($next), JSON_THROW_ON_ERROR)]);
    return array_values($next);
}

// Persist a rolling window per IP and username, independently of PHP cookies.
// Call while holding the corresponding login locks; consume before checking
// the password so concurrent attempts cannot all pass the same counter.
function consumeLoginAttempt(PDO $pdo, array $buckets, int $now): int {
    $windows = []; $wait = 0;
    foreach ($buckets as $bucket => $limit) {
        $key = '__login_' . hash('sha256', $bucket);
        $query = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ? FOR UPDATE');
        $query->execute([$key]);
        $times = json_decode((string) ($query->fetchColumn() ?: '[]'), true);
        $times = array_values(array_filter(is_array($times) ? $times : [], static fn($time) => is_int($time) && $time > $now - 300));
        if (count($times) >= $limit) $wait = max($wait, $times[0] + 300 - $now);
        $windows[$key] = $times;
    }
    if ($wait > 0) return $wait;
    foreach ($windows as $key => $times) {
        $times[] = $now;
        $pdo->prepare('INSERT INTO system_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)')->execute([$key, json_encode($times)]);
    }
    return 0;
}

function changeLockResources(PDO $pdo, array $changes): array {
    $resources = [];
    $tables = ['users' => 'users', 'harvests' => 'harvests', 'offers' => 'offers', 'services' => 'service_requests', 'productionLoans' => 'production_loans', 'offeredServices' => 'offered_services', 'notifications' => 'notifications'];
    foreach ($changes as $change) {
        $collection = $change['collection'] ?? ''; $id = (string) ($change['id'] ?? '');
        $resources[] = $collection . ':' . strtolower($id);
        if ($collection === 'users') $resources[] = 'users-directory';
        $rows = [$change['before'] ?? [], $change['after'] ?? []];
        if (isset($tables[$collection])) {
            $table = $tables[$collection]; $key = $collection === 'users' ? 'email' : 'id';
            $query = $pdo->prepare("SELECT data FROM {$table} WHERE {$key} = ?");
            $query->execute([$id]);
            $rows[] = json_decode((string) ($query->fetchColumn() ?: '[]'), true);
        }
        foreach ($rows as $row) {
            foreach (['farmerEmail', 'buyerEmail', 'operatorEmail', 'providerEmail', 'userEmail'] as $field) {
                if (!empty($row[$field])) $resources[] = 'users:' . liveEmail($row[$field]);
            }
            if (!empty($row['harvestId'])) $resources[] = 'harvests:' . strtolower((string) $row['harvestId']);
        }
    }
    return $resources;
}
