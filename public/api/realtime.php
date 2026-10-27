<?php
declare(strict_types=1);
require_once __DIR__ . '/concurrency.php';
require_once __DIR__ . '/businessWrites.php';

const LIVE_COLLECTIONS = ['users', 'harvests', 'services', 'offers', 'offeredServices', 'productionLoans', 'notifications', 'settings'];
const LIVE_TOPICS = [...LIVE_COLLECTIONS, 'announcements', 'faqs', 'moisture'];

function liveVersions(PDO $pdo): array {
    $versions = array_fill_keys(LIVE_TOPICS, '0');
    foreach ($pdo->query("SELECT setting_key,setting_value FROM system_settings WHERE setting_key LIKE '__live_%'")->fetchAll() as $row) {
        $topic = substr($row['setting_key'], 7);
        if (array_key_exists($topic, $versions)) $versions[$topic] = (string) json_decode($row['setting_value'], true);
    }
    return $versions;
}

function publishLiveChanges(PDO $pdo, array $topics): void {
    $statement = $pdo->prepare('INSERT INTO system_settings (setting_key,setting_value) VALUES (?,1)
        ON DUPLICATE KEY UPDATE setting_value = CAST(setting_value AS UNSIGNED) + 1');
    foreach (array_unique(array_intersect(LIVE_TOPICS, $topics)) as $topic) $statement->execute(['__live_' . $topic]);
}

// Called only for successful writes. Events contain topic versions, never records.
function publishLiveResponse(PDO $pdo, string $path): void {
    $topics = match ($path) {
        'registrations', 'auth/profile', 'auth/provider-settings', 'auth/email-notifications' => ['users'],
        'announcements' => ['announcements'],
        'faqs' => ['faqs'],
        'moisture-readings' => ['moisture'],
        'harvests.php' => ['harvests'],
        'db/clear-demo' => LIVE_COLLECTIONS,
        default => [],
    };
    if ($topics) publishLiveChanges($pdo, $topics);
}

function liveEqual(mixed $a, mixed $b): bool {
    if (is_array($a) && is_array($b)) {
        if (count($a) !== count($b)) return false;
        foreach ($a as $key => $value) if (!array_key_exists($key, $b) || !liveEqual($value, $b[$key])) return false;
        return true;
    }
    return $a === $b || (is_numeric($a) && is_numeric($b) && !is_string($a) && !is_string($b) && $a == $b);
}

function liveEmail(mixed $value): string { return strtolower(trim((string) $value)); }
function liveParticipant(array $row, string $email): bool {
    foreach (['farmerEmail', 'buyerEmail', 'operatorEmail', 'providerEmail', 'userEmail'] as $field) {
        if (liveEmail($row[$field] ?? '') === $email) return true;
    }
    return false;
}

function livePublicUser(array $user): array {
    // Public directory fields only. Verification documents and account settings stay private.
    $public = array_intersect_key($user, array_flip([
        'userId', 'name', 'email', 'role', 'rating', 'isApproved', 'contactNumber', 'address',
        'businessName', 'legalCompanyName', 'serviceCoverageArea', 'operatingAddress', 'avatarUrl',
        'bio', 'isAvailable', 'loanConfig', 'buyerLogisticsEnabled', 'businessCapabilities', 'logisticsServices',
    ]));
    foreach (['businessCapabilities', 'logisticsServices'] as $group) {
        foreach (($public[$group] ?? []) as $type => $profile) {
            if (!is_array($profile)) continue;
            $public[$group][$type] = array_intersect_key($profile, array_flip([
                'enabled', 'approvalStatus', 'isAvailable', 'capacity', 'rateInfo', 'locationCoverage',
                'notes', 'vehicleType', 'carryingCapacity', 'storageCapacity', 'dryerType',
                'batchCapacity', 'millingCapacity', 'facilityLocation',
            ]));
        }
    }
    return $public;
}

function liveVisibleDatabase(array $database, ?array $identity): array {
    if (!$identity) return ['users' => [], 'harvests' => [], 'services' => [], 'offers' => [], 'offeredServices' => [], 'productionLoans' => [], 'notifications' => [], 'settings' => ['daReferencePrice' => $database['settings']['daReferencePrice'] ?? 22.8]];
    $email = liveEmail($identity['email']);
    $admin = $identity['role'] === 'admin';
    foreach ($database['users'] as &$user) {
        unset($user['password'], $user['password_hash'], $user['passwordHash']);
        if (!$admin && liveEmail($user['email'] ?? '') !== $email) $user = livePublicUser($user);
    }
    unset($user);
    if (!$admin) {
        $database['users'] = array_values(array_filter($database['users'], static fn(array $u): bool =>
            liveEmail($u['email'] ?? '') === $email || !empty($u['isApproved'])));
        $database['harvests'] = array_values(array_filter($database['harvests'], static fn(array $h): bool =>
            empty($h['targetBuyerEmail']) || liveEmail($h['targetBuyerEmail']) === $email || liveEmail($h['farmerEmail'] ?? '') === $email));
        $visibleHarvests = array_column($database['harvests'], null, 'id');
        $database['offers'] = array_values(array_filter(array_map(static function (array $offer) use ($email, $visibleHarvests): ?array {
            if (liveParticipant($offer, $email)) return $offer;
            $harvest = $visibleHarvests[$offer['harvestId'] ?? ''] ?? [];
            if (($harvest['sellingMethod'] ?? '') !== 'bidding') return null;
            // Bidding rankings are public; competing buyers' identity/documents are not.
            return array_intersect_key($offer, array_flip(['id', 'harvestId', 'cropType', 'quantity', 'unit', 'quantityWanted', 'offerPrice', 'totalAmount', 'status', 'createdAt']));
        }, $database['offers'])));
        $database['services'] = array_values(array_filter($database['services'], static fn(array $r): bool =>
            liveParticipant($r, $email) || ($identity['role'] !== 'farmer' && empty($r['operatorEmail']) && ($r['status'] ?? '') === 'pending')));
        foreach (['productionLoans', 'notifications'] as $collection) {
            $database[$collection] = array_values(array_filter($database[$collection], static fn(array $r): bool => liveParticipant($r, $email)));
        }
    }
    $database['settings'] = ['daReferencePrice' => $database['settings']['daReferencePrice'] ?? 22.8];
    return $database;
}

function streamLiveVersions(PDO $pdo, array $identity): never {
    session_write_close(); // An open event stream must never lock normal API requests.
    @ini_set('zlib.output_compression', '0');
    @set_time_limit(35);
    while (ob_get_level() > 0) ob_end_clean();
    header('Content-Type: text/event-stream; charset=UTF-8');
    header('Cache-Control: private, no-cache, no-store, no-transform');
    header('X-Accel-Buffering: no');
    $emit = static function (string $event, array $data): void {
        echo 'event: ' . $event . "\n" . 'data: ' . json_encode($data, JSON_UNESCAPED_SLASHES) . "\n\n";
        flush();
    };
    echo "retry: 1000\n\n";
    $previous = null;
    $start = microtime(true);
    $lastHeartbeat = 0;
    do {
        if (connection_aborted()) exit;
        $now = microtime(true);
        if ($now - $lastHeartbeat >= 5) {
            // Recheck account revocation. Session authentication is renewed every 25s.
            $check = $pdo->prepare('SELECT is_approved FROM users WHERE LOWER(email) = ?');
            $check->execute([$identity['email']]);
            if (!(bool) $check->fetchColumn()) {
                $emit('expired', []); exit;
            }
            $emit('heartbeat', []);
            $lastHeartbeat = $now;
        }
        $versions = liveVersions($pdo);
        if ($versions !== $previous) { $emit('versions', $versions); $previous = $versions; }
        usleep(500000);
    } while (microtime(true) - $start < 25);
    $emit('renew', []);
    exit;
}

class LiveConflict extends RuntimeException {}
class LiveForbidden extends RuntimeException {}

// Compare only edited fields; simultaneous edits to different fields can coexist.
function liveMergeRecord(?array $current, ?array $before, ?array $after): ?array {
    if ($before === null) {
        if ($current !== null && !liveEqual($current, $after)) throw new LiveConflict('This record was created in another session. Reload it before trying again.');
        return $after;
    }
    if ($current === null) {
        if ($after === null) return null;
        throw new LiveConflict('This record was deleted in another session.');
    }
    if ($after === null) {
        if (!liveEqual($current, $before)) throw new LiveConflict('This record changed before it could be deleted. Review its latest details.');
        return null;
    }
    $merged = $current;
    foreach (array_unique([...array_keys($before), ...array_keys($after)]) as $field) {
        $old = $before[$field] ?? null; $new = $after[$field] ?? null; $actual = $current[$field] ?? null;
        if (liveEqual($old, $new)) continue;
        if (!liveEqual($actual, $old) && !liveEqual($actual, $new)) throw new LiveConflict('Another user updated this record. Review the latest data before retrying.');
        if (array_key_exists($field, $after)) $merged[$field] = $new; else unset($merged[$field]);
    }
    return $merged;
}

function authorizeLiveChange(string $collection, ?array $current, ?array $next, array $identity): void {
    if ($identity['role'] === 'admin') {
        if ($collection === 'users' && (($current['role'] ?? '') === 'admin' || ($next['role'] ?? '') === 'admin')) throw new LiveForbidden('Administrator identities are server-managed.');
        return;
    }
    $email = $identity['email'];
    if (in_array($collection, ['users', 'settings'], true)) throw new LiveForbidden('Administrator access required.');
    $row = $current ?? $next ?? [];
    $allowed = match ($collection) {
        'harvests' => liveEmail($row['farmerEmail'] ?? '') === $email,
        'offeredServices' => liveEmail($row['providerEmail'] ?? '') === $email,
        'offers', 'productionLoans' => $current ? liveParticipant($row, $email) : liveEmail($row[$collection === 'offers' ? 'buyerEmail' : 'farmerEmail'] ?? '') === $email,
        'services' => liveParticipant($row, $email) || ($current && $next && $identity['role'] !== 'farmer' && empty($row['operatorEmail']) && ($row['status'] ?? '') === 'pending' && liveEmail($next['operatorEmail'] ?? '') === $email),
        'notifications' => $current ? liveEmail($row['userEmail'] ?? '') === $email : filter_var($next['userEmail'] ?? '', FILTER_VALIDATE_EMAIL) !== false,
        default => false,
    };
    if (!$allowed) throw new LiveForbidden('You cannot change this record.');
    if ($current && $next) {
        foreach (['id', 'farmerEmail', 'buyerEmail', 'providerEmail', 'userEmail', 'harvestId'] as $field) {
            if (isset($current[$field]) && ($next[$field] ?? null) !== $current[$field]) throw new LiveForbidden('Record ownership cannot be changed.');
        }
        if (!empty($current['operatorEmail']) && ($next['operatorEmail'] ?? '') !== $current['operatorEmail']) throw new LiveForbidden('This request is already assigned to another provider.');
    }
}

function applyLiveChanges(PDO $pdo, array $changes, array $identity, ?string $requestId = null): array {
    if (count($changes) > 1000) throw new InvalidArgumentException('Too many edits in a single save.');
    $tables = ['users' => 'users', 'harvests' => 'harvests', 'services' => 'service_requests', 'offers' => 'offers', 'offeredServices' => 'offered_services', 'productionLoans' => 'production_loans', 'notifications' => 'notifications'];
    $topics = []; $emails = [];
    // Stable lock order prevents two multi-record requests from deadlocking.
    usort($changes, static fn(array $a, array $b): int => strcmp(($a['collection'] ?? '') . ':' . ($a['id'] ?? ''), ($b['collection'] ?? '') . ':' . ($b['id'] ?? '')));
    $payloadHash = hash('sha256', json_encode($changes, JSON_THROW_ON_ERROR));
    $receipt = '__write_' . hash('sha256', $identity['email'] . ':' . ($requestId ?? bin2hex(random_bytes(16))));
    $locks = acquireWriteLocks($pdo, [...changeLockResources($pdo, $changes), $receipt]);
    $pdo->beginTransaction();
    try {
        $query = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ? FOR UPDATE');
        $query->execute([$receipt]);
        $saved = $query->fetchColumn();
        if ($saved !== false) {
            $receiptData = json_decode((string) $saved, true);
            if (($receiptData['payloadHash'] ?? '') !== $payloadHash) throw new LiveConflict('This request ID was already used for different changes.');
            $retryEmails = [];
            foreach ($receiptData['notificationIds'] ?? [] as $notificationId) {
                $notificationQuery = $pdo->prepare('SELECT data FROM notifications WHERE id=?');
                $notificationQuery->execute([$notificationId]);
                $notification = $notificationQuery->fetchColumn();
                if ($notification !== false) $retryEmails[] = json_decode((string) $notification, true);
            }
            $pdo->commit();
            return ['topics' => $receiptData['topics'] ?? $receiptData, 'notifications' => $retryEmails];
        }
        $seen = [];
        foreach ($changes as $decision) {
            if (($decision['collection'] ?? '') !== 'offers' || ($decision['after']['status'] ?? '') !== 'accepted') continue;
            $offer = lockedRecord($pdo, 'offers', (string) $decision['id']);
            $harvest = lockedRecord($pdo, 'harvests', (string) ($offer['harvestId'] ?? ''));
            if (($offer['status'] ?? '') !== 'accepted' && ($harvest['status'] ?? '') !== 'posted') throw new LiveConflict('This harvest is no longer available for acceptance.');
        }
        foreach ($changes as $change) {
            $collection = (string) ($change['collection'] ?? '');
            $id = (string) ($change['id'] ?? '');
            $before = $change['before'] ?? null; $after = $change['after'] ?? null;
            if (!in_array($collection, LIVE_COLLECTIONS, true) || $id === '' || ($before !== null && !is_array($before)) || ($after !== null && !is_array($after))) throw new InvalidArgumentException('Invalid record change.');
            if (isset($seen[$collection . ':' . $id])) throw new InvalidArgumentException('A record can only be changed once per request.');
            $seen[$collection . ':' . $id] = true;
            if ($collection === 'settings') {
                if ($identity['role'] !== 'admin') throw new LiveForbidden('Administrator access required.');
                $stmt = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'daReferencePrice' FOR UPDATE");
                $current = ['id' => 'settings', 'daReferencePrice' => json_decode((string) ($stmt->fetchColumn() ?: '22.8'), true)];
                $merged = liveMergeRecord($current, $before, $after);
                if (!is_numeric($merged['daReferencePrice'] ?? null) || $merged['daReferencePrice'] < 0) throw new InvalidArgumentException('Invalid reference price.');
                $pdo->prepare("INSERT INTO system_settings (setting_key,setting_value) VALUES ('daReferencePrice',?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)")->execute([json_encode($merged['daReferencePrice'])]);
            } else {
                $table = $tables[$collection];
                $key = $collection === 'users' ? 'email' : 'id';
                $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE {$key} = ? FOR UPDATE");
                $stmt->execute([$id]); $stored = $stmt->fetch();
                $current = $stored ? json_decode($stored['data'], true) : null;
                if ($current) unset($current['password'], $current['password_hash'], $current['passwordHash']);
                if ($after !== null && (string) ($after[$key] ?? '') !== $id) throw new InvalidArgumentException('Record identifier does not match.');
                if ($collection === 'services' && ($before['status'] ?? '') === 'pending' && $current && ($current['status'] ?? '') !== 'pending' && !liveEqual($current, $after)) throw new LiveConflict('This service request has already been handled. Refresh the list.');
                authorizeLiveChange($collection, $current, $after, $identity);
                $merged = liveMergeRecord($current, $before, $after);
                validateBusinessWrite($pdo, $collection, $current, $merged, $identity, $topics);
                if ($merged === null) {
                    $pdo->prepare("DELETE FROM {$table} WHERE {$key} = ?")->execute([$id]);
                } else {
                    $columns = match ($collection) {
                        'users' => ['email' => $id, 'name' => $merged['name'] ?? '', 'role' => $merged['role'] ?? '', 'is_approved' => !empty($merged['isApproved']) ? 1 : 0],
                        'harvests' => ['id' => $id, 'farmer_email' => $merged['farmerEmail'] ?? '', 'status' => $merged['status'] ?? 'posted', 'harvest_date' => ($merged['harvestDate'] ?? '') ?: null, 'moisture_level' => isset($merged['moistureLevel']) ? (float) $merged['moistureLevel'] : null],
                        'services' => ['id' => $id, 'harvest_id' => $merged['harvestId'] ?? null, 'farmer_email' => $merged['farmerEmail'] ?? '', 'service_type' => $merged['type'] ?? '', 'status' => $merged['status'] ?? 'pending'],
                        'offers' => ['id' => $id, 'harvest_id' => $merged['harvestId'] ?? '', 'buyer_email' => $merged['buyerEmail'] ?? '', 'farmer_email' => $merged['farmerEmail'] ?? '', 'status' => $merged['status'] ?? 'pending'],
                        'offeredServices' => ['id' => $id, 'provider_email' => $merged['providerEmail'] ?? '', 'service_type' => $merged['serviceType'] ?? '', 'is_available' => !empty($merged['isAvailable']) ? 1 : 0],
                        'productionLoans' => ['id' => $id, 'farmer_email' => $merged['farmerEmail'] ?? '', 'buyer_email' => $merged['buyerEmail'] ?? '', 'status' => $merged['status'] ?? 'Pending', 'requested_amount' => (float) ($merged['requestedAmount'] ?? 0)],
                        'notifications' => ['id' => $id, 'user_email' => $merged['userEmail'] ?? '', 'is_read' => !empty($merged['isRead']) ? 1 : 0, 'notification_type' => $merged['type'] ?? 'info'],
                    };
                    if ($collection === 'users') {
                        if (!filter_var($id, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('A valid email is required.');
                        $password = (string) ($merged['password'] ?? '');
                        if ($password !== '') $columns['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
                        elseif (!$stored) $columns['password_hash'] = password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT);
                        unset($merged['password'], $merged['password_hash'], $merged['passwordHash']);
                    }
                    $columns['data'] = json_encode($merged, JSON_THROW_ON_ERROR);
                    $names = array_keys($columns);
                    $sql = "INSERT INTO {$table} (" . implode(',', $names) . ') VALUES (' . implode(',', array_fill(0, count($names), '?')) . ') ON DUPLICATE KEY UPDATE ' . implode(',', array_map(static fn(string $name): string => "{$name}=VALUES({$name})", array_diff($names, [$key])));
                    $pdo->prepare($sql)->execute(array_values($columns));
                    if ($collection === 'notifications') $emails[] = $merged;
                }
            }
            $topics[] = $collection;
        }
        finalizeOfferDecisions($pdo, $changes, $topics);
        $pdo->prepare('INSERT INTO system_settings (setting_key,setting_value) VALUES (?,?)')->execute([$receipt, json_encode(['payloadHash' => $payloadHash, 'topics' => array_values(array_unique($topics)), 'notificationIds' => array_column($emails, 'id')])]);
        publishLiveChanges($pdo, $topics); // Same transaction as the data: no lost wakeups.
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    } finally {
        releaseWriteLocks($pdo, $locks);
    }
    return ['topics' => array_values(array_unique($topics)), 'notifications' => $emails];
}
