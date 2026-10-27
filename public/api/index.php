<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/mailer.php';
require __DIR__ . '/realtime.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = trim((string) ($_GET['route'] ?? ''), '/');
if ($path === '') {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $position = strpos($uri, '/api/');
    $path = $position === false ? '' : trim(substr($uri, $position + 5), '/');
}

$collections = [
    'users' => 'users', 'harvests' => 'harvests', 'services' => 'service_requests',
    'offeredServices' => 'offered_services', 'offers' => 'offers',
    'productionLoans' => 'production_loans', 'notifications' => 'notifications',
];

$sessionIdentity = static function () use ($pdo): array {
    $email = strtolower(trim((string) ($_SESSION['kawing_user_email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'Authentication required.'], 401);
    $statement = $pdo->prepare('SELECT email,role,is_approved,data FROM users WHERE LOWER(email) = ? LIMIT 1');
    $statement->execute([$email]);
    $row = $statement->fetch();
    if (!is_array($row)) respond(['error' => 'Authentication required.'], 401);
    if (!(bool) $row['is_approved']) {
        $_SESSION = [];
        respond(['error' => 'This account is not approved or has been suspended.'], 403);
    }
    return ['email' => strtolower((string) $row['email']), 'role' => (string) $row['role'], 'data' => json_decode((string) $row['data'], true) ?: []];
};

$requireAdmin = static function () use ($sessionIdentity): array {
    $identity = $sessionIdentity();
    if ($identity['role'] !== 'admin') respond(['error' => 'Administrator access required.'], 403);
    return $identity;
};

$loadDatabase = static function (?array $requested = null) use ($pdo, $collections): array {
    $ownsTransaction = !$pdo->inTransaction();
    if ($ownsTransaction) $pdo->beginTransaction();
    try {
    $database = array_fill_keys(array_keys($collections), []);
    foreach ($collections as $collection => $table) {
        if ($requested !== null && !in_array($collection, $requested, true)) continue;
        $rows = $pdo->query("SELECT data FROM {$table} ORDER BY created_at, updated_at")->fetchAll();
        $database[$collection] = [];
        foreach ($rows as $row) {
            $decoded = json_decode((string) $row['data'], true);
            if (is_array($decoded)) $database[$collection][] = $decoded;
        }
    }
    $database['settings'] = [];
    foreach (($requested === null || in_array('settings', $requested, true)) ? $pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key = 'daReferencePrice'")->fetchAll() : [] as $row) {
        $database['settings'][$row['setting_key']] = json_decode((string) $row['setting_value'], true);
    }
        if ($ownsTransaction) $pdo->commit();
        return $database;
    } catch (Throwable $error) {
        if ($ownsTransaction && $pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
};

$replaceRows = static function (string $table, array $rows, string $sql, callable $values) use ($pdo): void {
    $pdo->exec("DELETE FROM {$table}");
    $statement = $pdo->prepare($sql);
    foreach ($rows as $row) $statement->execute($values($row));
};

$saveDatabase = static function (array $data) use ($pdo, $replaceRows): void {
    $pdo->beginTransaction();
    try {
        if (isset($data['users'])) {
            // Administrator identities and credentials are server-managed. Client
            // synchronization cannot create, replace, downgrade, or delete them.
            $users = array_values(array_filter(
                is_array($data['users']) ? $data['users'] : [],
                static fn(mixed $user): bool => is_array($user) && (($user['role'] ?? '') !== 'admin')
            ));
            $existingPasswordHashes = [];
            $reservedEmails = [];
            foreach ($pdo->query("SELECT email FROM users WHERE role = 'admin'")->fetchAll() as $administrator) {
                $reservedEmails[strtolower(trim((string) $administrator['email']))] = true;
            }
            $seenEmails = [];
            foreach ($users as $record) {
                $email = strtolower(trim((string) ($record['email'] ?? '')));
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new InvalidArgumentException('Each account must have a valid email address. Check the user details before saving.');
                }
                if (isset($reservedEmails[$email]) || isset($seenEmails[$email])) {
                    throw new InvalidArgumentException('Two accounts cannot use the same email address. Enter a unique email address for each account, then save again.');
                }
                $seenEmails[$email] = true;
            }
            foreach ($pdo->query("SELECT email,password_hash FROM users WHERE role <> 'admin'")->fetchAll() as $existingUser) {
                $existingPasswordHashes[strtolower((string) $existingUser['email'])] = (string) $existingUser['password_hash'];
            }
            $pdo->exec("DELETE FROM users WHERE role <> 'admin'");
            $statement = $pdo->prepare('INSERT INTO users (email,name,password_hash,role,is_approved,data) VALUES (?,?,?,?,?,?)');
            foreach ($users as $record) {
                $email = strtolower(trim((string) $record['email']));
                $plainPassword = (string) ($record['password'] ?? '');
                $passwordHash = $plainPassword !== ''
                    ? password_hash($plainPassword, PASSWORD_DEFAULT)
                    : ($existingPasswordHashes[$email] ?? password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT));
                unset($record['password'], $record['password_hash'], $record['passwordHash']);
                $record['email'] = $email;
                $statement->execute([
                    $email,
                    $record['name'] ?? '',
                    $passwordHash,
                    $record['role'] ?? '',
                    !empty($record['isApproved']) ? 1 : 0,
                    json_encode($record),
                ]);
            }
        }
        if (isset($data['harvests'])) $replaceRows('harvests', $data['harvests'], 'INSERT INTO harvests (id,farmer_email,status,harvest_date,moisture_level,data) VALUES (?,?,?,?,?,?)',
            static fn(array $r): array => [$r['id'], $r['farmerEmail'] ?? '', $r['status'] ?? 'posted', !empty($r['harvestDate']) ? $r['harvestDate'] : null, isset($r['moistureLevel']) ? (float) $r['moistureLevel'] : null, json_encode($r)]);
        if (isset($data['services'])) $replaceRows('service_requests', $data['services'], 'INSERT INTO service_requests (id,harvest_id,farmer_email,service_type,status,data) VALUES (?,?,?,?,?,?)',
            static fn(array $r): array => [$r['id'], $r['harvestId'] ?? null, $r['farmerEmail'] ?? '', $r['type'] ?? '', $r['status'] ?? 'pending', json_encode($r)]);
        if (isset($data['offeredServices'])) $replaceRows('offered_services', $data['offeredServices'], 'INSERT INTO offered_services (id,provider_email,service_type,is_available,data) VALUES (?,?,?,?,?)',
            static fn(array $r): array => [$r['id'], $r['providerEmail'] ?? '', $r['serviceType'] ?? '', !empty($r['isAvailable']) ? 1 : 0, json_encode($r)]);
        if (isset($data['offers'])) $replaceRows('offers', $data['offers'], 'INSERT INTO offers (id,harvest_id,buyer_email,farmer_email,status,data) VALUES (?,?,?,?,?,?)',
            static fn(array $r): array => [$r['id'], $r['harvestId'] ?? '', $r['buyerEmail'] ?? '', $r['farmerEmail'] ?? '', $r['status'] ?? 'pending', json_encode($r)]);
        if (isset($data['productionLoans'])) $replaceRows('production_loans', $data['productionLoans'], 'INSERT INTO production_loans (id,farmer_email,buyer_email,status,requested_amount,data) VALUES (?,?,?,?,?,?)',
            static fn(array $r): array => [$r['id'], $r['farmerEmail'] ?? '', $r['buyerEmail'] ?? '', $r['status'] ?? 'Pending', (float) ($r['requestedAmount'] ?? 0), json_encode($r)]);
        if (isset($data['notifications'])) $replaceRows('notifications', $data['notifications'], 'INSERT INTO notifications (id,user_email,is_read,notification_type,data) VALUES (?,?,?,?,?)',
            static fn(array $r): array => [$r['id'], $r['userEmail'] ?? '', !empty($r['isRead']) ? 1 : 0, $r['type'] ?? 'info', json_encode($r)]);
        if (isset($data['settings']) && is_array($data['settings'])) {
            $statement = $pdo->prepare('INSERT INTO system_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)');
            foreach ($data['settings'] as $key => $value) $statement->execute([$key, json_encode($value)]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
};

try {
    if (($path === '' || $path === 'health') && $method === 'GET') respond(['status' => 'ok', 'runtime' => 'php-mysql', 'timestamp' => gmdate(DATE_ATOM)]);
    if ($path === 'registrations' && $method === 'POST') {
        $body = jsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $role = (string) ($body['role'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, ['farmer', 'agricultural_business'], true)) {
            respond(['error' => 'A valid name, email, and account category are required.'], 422);
        }
        if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) {
            respond(['error' => 'Password requirements were not met.'], 422);
        }
        beginEndpointWrite($pdo, ['users-directory', 'users:' . $email]);
        $duplicate = $pdo->prepare('SELECT COUNT(*) FROM users WHERE LOWER(email) = ? OR LOWER(name) = LOWER(?)');
        $duplicate->execute([$email, $name]);
        if ((int) $duplicate->fetchColumn() > 0) respond(['error' => 'That email address or account name is already registered.'], 409);
        $account = $body;
        unset($account['password'], $account['password_hash'], $account['passwordHash']);
        $account['name'] = $name;
        $account['email'] = $email;
        $account['role'] = $role;
        $account['isApproved'] = false;
        $statement = $pdo->prepare('INSERT INTO users (email,name,password_hash,role,is_approved,data) VALUES (?,?,?,?,0,?)');
        $statement->execute([$email, $name, password_hash($password, PASSWORD_DEFAULT), $role, json_encode($account)]);
        respond(['success' => true, 'user' => $account], 201);
    }
    if ($path === 'announcements' && $method === 'GET') {
        $statement = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'announcements' LIMIT 1");
        $statement->execute();
        $items = json_decode((string) ($statement->fetchColumn() ?: '[]'), true);
        respond(['announcements' => is_array($items) ? $items : []]);
    }
    if ($path === 'announcements' && $method === 'POST') {
        $requireAdmin();
        $body = jsonBody();
        beginEndpointWrite($pdo, ['settings:announcements']);
        $items = saveSharedList($pdo, 'announcements', $body);
        respond(['success' => true, 'announcements' => array_values($items)]);
    }
    if ($path === 'faqs' && $method === 'GET') {
        $statement = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'faqs' LIMIT 1");
        $statement->execute();
        $items = json_decode((string) ($statement->fetchColumn() ?: '[]'), true);
        respond(['faqs' => is_array($items) ? $items : []]);
    }
    if ($path === 'faqs' && $method === 'POST') {
        $requireAdmin();
        $body = jsonBody();
        beginEndpointWrite($pdo, ['settings:faqs']);
        $items = saveSharedList($pdo, 'faqs', $body);
        respond(['success' => true, 'faqs' => array_values($items)]);
    }
    if ($path === 'auth/login' && $method === 'POST') {
        $body = jsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if ($name === '' || $password === '') respond(['error' => 'Name and password are required.'], 422);
        $buckets = ['name:' . mb_strtolower($name) => 5, 'ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') => 30];
        beginEndpointWrite($pdo, array_map(static fn(string $key) => 'login:' . $key, array_keys($buckets)));
        $sharedWait = consumeLoginAttempt($pdo, $buckets, time());
        finishEndpointWrite($pdo, true);
        if ($sharedWait > 0) {
            header('Retry-After: ' . $sharedWait);
            respond(['error' => 'Too many login attempts. Please try again later.', 'retryAfterSeconds' => $sharedWait], 429);
        }
        $now = time();
        $attempts = array_values(array_filter(
            is_array($_SESSION['login_attempts'] ?? null) ? $_SESSION['login_attempts'] : [],
            static fn(mixed $attempt): bool => is_int($attempt) && $attempt > $now - 300
        ));
        if (count($attempts) >= 5) {
            $retryAfter = max(1, ((int) $attempts[0] + 300) - $now);
            header('Retry-After: ' . $retryAfter);
            respond([
                'error' => 'Too many login attempts. Please try again later.',
                'retryAfterSeconds' => $retryAfter,
            ], 429);
        }
        $statement = $pdo->prepare('SELECT name,email,role,is_approved,password_hash,data FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1');
        $statement->execute([$name]);
        $user = $statement->fetch();
        if (!is_array($user) || !password_verify($password, (string) ($user['password_hash'] ?? ''))) {
            $attempts[] = $now;
            $_SESSION['login_attempts'] = $attempts;
            respond(['error' => 'Incorrect name or password.'], 401);
        }
        if (!(bool) $user['is_approved']) respond([
            'error' => 'Your registration is waiting for administrator approval.',
            'code' => 'ACCOUNT_PENDING_APPROVAL',
        ], 403);
        $account = json_decode((string) ($user['data'] ?? '{}'), true);
        if (!is_array($account)) $account = [];
        $account['name'] = $account['name'] ?? $user['name'];
        $account['email'] = $account['email'] ?? $user['email'];
        $account['role'] = $account['role'] ?? $user['role'];
        $account['isApproved'] = (bool) $user['is_approved'];
        unset($account['password'], $account['password_hash'], $account['passwordHash'], $account['documents'], $account['uploadedDocs'], $account['govIdData']);
        session_regenerate_id(true);
        unset($_SESSION['login_attempts']);
        $_SESSION['kawing_user_email'] = strtolower((string) $account['email']);
        $_SESSION['kawing_user_role'] = (string) $account['role'];
        respond(['user' => $account]);
    }
    if ($path === 'auth/me' && $method === 'GET') {
        $email = strtolower(trim((string) ($_SESSION['kawing_user_email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'Not authenticated.'], 401);
        $statement = $pdo->prepare('SELECT name,email,role,is_approved,data FROM users WHERE LOWER(email) = ? LIMIT 1');
        $statement->execute([$email]);
        $row = $statement->fetch();
        if (!is_array($row)) respond(['error' => 'Account not found.'], 401);
        if (!(bool) $row['is_approved']) {
            $_SESSION = [];
            respond(['error' => 'This account is not approved or has been suspended.'], 403);
        }
        $account = json_decode((string) ($row['data'] ?? '{}'), true);
        if (!is_array($account)) $account = [];
        $account['name'] = $account['name'] ?? $row['name'];
        $account['email'] = $row['email'];
        $account['role'] = $row['role'];
        $account['isApproved'] = (bool) $row['is_approved'];
        unset($account['password'], $account['password_hash'], $account['passwordHash'], $account['documents'], $account['uploadedDocs'], $account['govIdData']);
        respond(['user' => $account]);
    }
    if ($path === 'auth/logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        respond(['success' => true]);
    }
    if ($path === 'auth/email-notifications' && $method === 'POST') {
        $identity = $sessionIdentity();
        $body = jsonBody();
        beginEndpointWrite($pdo, ['users:' . $identity['email']]);
        if (!array_key_exists('enabled', $body) || !is_bool($body['enabled'])) respond(['error' => 'Email notification preference must be true or false.'], 422);
        $statement = $pdo->prepare('SELECT name,email,role,is_approved,data FROM users WHERE LOWER(email) = ? LIMIT 1');
        $statement->execute([$identity['email']]);
        $row = $statement->fetch();
        if (!is_array($row)) respond(['error' => 'Account not found.'], 401);
        $account = json_decode((string) ($row['data'] ?? '{}'), true);
        if (!is_array($account)) $account = [];
        $account['name'] = $row['name'];
        $account['email'] = $row['email'];
        $account['role'] = $row['role'];
        $account['isApproved'] = (bool) $row['is_approved'];
        $account = mergeSubmittedFields($account, ['before' => $body['before'] ?? null, 'emailNotificationsEnabled' => $body['enabled']], ['emailNotificationsEnabled']);
        $account['emailNotificationConsentAsked'] = true;
        $account['emailNotificationConsentAt'] = gmdate(DATE_ATOM);
        $update = $pdo->prepare('UPDATE users SET data = ? WHERE LOWER(email) = ?');
        $update->execute([json_encode($account, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $identity['email']]);
        unset($account['password'], $account['password_hash'], $account['passwordHash'], $account['documents'], $account['uploadedDocs'], $account['govIdData']);
        respond(['success' => true, 'user' => $account]);
    }
    if ($path === 'auth/profile' && $method === 'POST') {
        $identity = $sessionIdentity();
        $body = jsonBody();
        beginEndpointWrite($pdo, ['users-directory', 'users:' . $identity['email']]);
        $allowedFields = ['name', 'contactNumber', 'address', 'businessName', 'legalCompanyName', 'rsbsaNumber', 'avatarUrl', 'bio', 'emailNotificationsEnabled'];
        $provided = array_values(array_intersect(array_keys($body), $allowedFields));
        if (!$provided) respond(['error' => 'No profile changes were supplied.'], 422);

        foreach ($provided as $field) {
            if (in_array($field, ['emailNotificationsEnabled', 'emailNotificationConsentAsked'], true)) {
                if (!is_bool($body[$field])) respond(['error' => "{$field} must be true or false."], 422);
                continue;
            }
            if (!is_string($body[$field])) respond(['error' => "{$field} must be text."], 422);
        }
        if (array_key_exists('name', $body) && trim($body['name']) === '') respond(['error' => 'Your name is required.'], 422);
        if (array_key_exists('name', $body) && mb_strlen(trim($body['name'])) > 191) respond(['error' => 'Your name is too long.'], 422);
        if (array_key_exists('bio', $body) && mb_strlen($body['bio']) > 5000) respond(['error' => 'Your profile notes are too long.'], 422);

        $statement = $pdo->prepare('SELECT name,email,role,is_approved,data FROM users WHERE LOWER(email) = ? LIMIT 1');
        $statement->execute([$identity['email']]);
        $row = $statement->fetch();
        if (!is_array($row)) respond(['error' => 'Account not found.'], 401);
        $account = json_decode((string) ($row['data'] ?? '{}'), true);
        if (!is_array($account)) $account = [];
        $account = mergeSubmittedFields($account, $body, $provided);
        if (array_key_exists('emailNotificationsEnabled', $body)) {
            $account['emailNotificationConsentAsked'] = true;
            $account['emailNotificationConsentAt'] = gmdate(DATE_ATOM);
        }
        $account['name'] = trim((string) ($account['name'] ?? $row['name']));
        ensureUniqueAccount($pdo, $account['name'], $identity['email']);
        $account['email'] = $row['email'];
        $account['role'] = $row['role'];
        $account['isApproved'] = (bool) $row['is_approved'];
        $update = $pdo->prepare('UPDATE users SET name = ?, data = ? WHERE LOWER(email) = ?');
        $update->execute([$account['name'], json_encode($account, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $identity['email']]);
        unset($account['password'], $account['password_hash'], $account['passwordHash'], $account['documents'], $account['uploadedDocs'], $account['govIdData']);
        respond(['success' => true, 'user' => $account]);
    }
    if ($path === 'auth/provider-settings' && $method === 'POST') {
        $identity = $sessionIdentity();
        $body = jsonBody();
        beginEndpointWrite($pdo, ['users:' . $identity['email']]);
        $allowed = ['loanConfig', 'logisticsServices', 'businessCapabilities', 'buyerLogisticsEnabled', 'isAvailable'];
        $provided = array_intersect(array_keys($body), $allowed);
        if (!$provided) respond(['error' => 'No provider settings were supplied.'], 422);
        foreach (['loanConfig', 'logisticsServices', 'businessCapabilities'] as $field) {
            if (array_key_exists($field, $body) && !is_array($body[$field]) && $body[$field] !== null) respond(['error' => "{$field} must be an object."], 422);
        }
        foreach (['buyerLogisticsEnabled', 'isAvailable'] as $field) {
            if (array_key_exists($field, $body) && !is_bool($body[$field])) respond(['error' => "{$field} must be true or false."], 422);
        }
        $statement = $pdo->prepare('SELECT name,email,role,is_approved,data FROM users WHERE LOWER(email) = ? LIMIT 1');
        $statement->execute([$identity['email']]);
        $row = $statement->fetch();
        if (!is_array($row)) respond(['error' => 'Account not found.'], 401);
        if ($row['role'] === 'farmer' || $row['role'] === 'admin') respond(['error' => 'Only business providers can change provider settings.'], 403);
        $account = json_decode((string) ($row['data'] ?? '{}'), true);
        if (!is_array($account)) $account = [];
        $account = mergeSubmittedFields($account, $body, $provided);
        $account['name'] = $row['name'];
        $account['email'] = $row['email'];
        $account['role'] = $row['role'];
        $account['isApproved'] = (bool) $row['is_approved'];
        // Keep the capability metadata in the user record in step with an
        // enabled loan configuration or logistics service.
        $capabilities = is_array($account['businessCapabilities'] ?? null) ? $account['businessCapabilities'] : [];
        if (!empty($account['loanConfig']['enabled'])) {
            $existing = is_array($capabilities['loan_provider'] ?? null) ? $capabilities['loan_provider'] : [];
            $capabilities['loan_provider'] = array_merge($existing, ['enabled' => true, 'approvalStatus' => $existing['approvalStatus'] ?? 'approved', 'isAvailable' => true]);
        }
        foreach (($account['logisticsServices'] ?? []) as $type => $profile) {
            if (!in_array($type, ['transport', 'storage', 'drying', 'milling'], true) || !is_array($profile)) continue;
            $existing = is_array($capabilities[$type] ?? null) ? $capabilities[$type] : [];
            $capabilities[$type] = array_merge($existing, $profile);
        }
        $account['businessCapabilities'] = $capabilities;
        $update = $pdo->prepare('UPDATE users SET data = ? WHERE LOWER(email) = ?');
        $update->execute([json_encode($account, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $identity['email']]);
        unset($account['password'], $account['password_hash'], $account['passwordHash'], $account['documents'], $account['uploadedDocs'], $account['govIdData']);
        respond(['success' => true, 'user' => $account]);
    }
    if ($path === 'auth/change-password' && $method === 'POST') {
        $identity = $sessionIdentity();
        $body = jsonBody();
        beginEndpointWrite($pdo, ['users:' . $identity['email']]);
        $currentPassword = (string) ($body['currentPassword'] ?? '');
        $newPassword = (string) ($body['newPassword'] ?? '');
        if ($currentPassword === '' || $newPassword === '') respond(['error' => 'Current and new passwords are required.'], 422);
        if (strlen($newPassword) < 8 || !preg_match('/[A-Za-z]/', $newPassword) || !preg_match('/\d/', $newPassword) || !preg_match('/[^A-Za-z0-9]/', $newPassword)) {
            respond(['error' => 'The new password must be at least 8 characters and include a letter, number, and special character.'], 422);
        }
        $statement = $pdo->prepare('SELECT password_hash FROM users WHERE LOWER(email) = ? LIMIT 1');
        $statement->execute([$identity['email']]);
        $currentHash = (string) ($statement->fetchColumn() ?: '');
        if ($currentHash === '' || !password_verify($currentPassword, $currentHash)) respond(['error' => 'The current password is incorrect.'], 403);
        if (password_verify($newPassword, $currentHash)) respond(['error' => 'The new password must be different from the current password.'], 422);
        $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = ?')
            ->execute([password_hash($newPassword, PASSWORD_DEFAULT), $identity['email']]);
        respond(['success' => true, 'message' => 'Password changed successfully.']);
    }
    if ($path === 'realtime/status' && $method === 'GET') {
        $sessionIdentity();
        respond(['sse' => $sseEnabled && PHP_SAPI !== 'cli-server', 'versions' => liveVersions($pdo)]);
    }
    if ($path === 'realtime/events' && $method === 'GET') {
        $identity = $sessionIdentity();
        // The single-threaded PHP development server cannot serve APIs while streaming.
        if (!$sseEnabled || PHP_SAPI === 'cli-server') respond(['error' => 'Streaming is unavailable on this server. Use polling fallback.'], 503);
        streamLiveVersions($pdo, $identity);
    }
    if (($path === 'db' || $path === 'realtime/snapshot') && $method === 'GET') {
        $identity = !empty($_SESSION['kawing_user_email']) ? $sessionIdentity() : null;
        if ($path === 'realtime/snapshot' && !$identity) respond(['error' => 'Authentication required.'], 401);
        $requested = $path === 'realtime/snapshot' && isset($_GET['collections'])
            ? array_values(array_intersect(LIVE_COLLECTIONS, explode(',', (string) $_GET['collections']))) : LIVE_COLLECTIONS;
        $load = in_array('offers', $requested, true) ? array_unique([...$requested, 'harvests']) : $requested;
        $data = liveVisibleDatabase($loadDatabase($load), $identity);
        if ($path === 'realtime/snapshot' && isset($_GET['collections'])) {
            $data = array_intersect_key($data, array_flip($requested));
        }
        respond($data);
    }
    if ($path === 'realtime/changes' && $method === 'POST') {
        $identity = $sessionIdentity();
        $body = jsonBody();
        if (!is_array($body['changes'] ?? null)) respond(['error' => 'A changes array is required.'], 422);
        $requestId = $body['requestId'] ?? null;
        if ($requestId !== null && (!is_string($requestId) || !preg_match('/^[a-zA-Z0-9_-]{16,100}$/', $requestId))) respond(['error' => 'Invalid request ID.'], 422);
        $saved = applyLiveChanges($pdo, $body['changes'], $identity, $requestId);
        // Release the session before SMTP work; the committed data is already visible.
        session_write_close();
        $data = liveVisibleDatabase($loadDatabase(), $identity);
        $result = ['data' => array_intersect_key($data, array_flip($saved['topics']))];
        // End the browser request before optional delivery when PHP-FPM supports it.
        if (function_exists('fastcgi_finish_request')) {
            header('Cache-Control: private, no-store');
            echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            fastcgi_finish_request();
            foreach ($saved['notifications'] as $notification) deliverNotificationEmail($pdo, $smtpConfig, $notification, $appUrl);
            exit;
        }
        foreach ($saved['notifications'] as $notification) deliverNotificationEmail($pdo, $smtpConfig, $notification, $appUrl);
        respond($result);
    }
    if ($path === 'db/sync' && $method === 'POST') {
        $sessionIdentity();
        // Older cached clients must not overwrite collections maintained by live clients.
        respond(['error' => 'Please reload KAWING to use the updated synchronization protocol.'], 409);
    }
    if ($path === 'db/clear-demo' && $method === 'POST') {
        $requireAdmin();
        $environment = strtolower((string) ($_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production'));
        if (!in_array($environment, ['development', 'local', 'demo'], true)) respond(['error' => 'Demo cleanup is disabled in this environment.'], 403);
        $pdo->beginTransaction();
        try {
            foreach (['notifications', 'production_loans', 'offers', 'offered_services', 'service_requests', 'harvests'] as $table) $pdo->exec("DELETE FROM {$table}");
            $pdo->exec("DELETE FROM users WHERE role <> 'admin'");
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $error;
        }
        respond(['success' => true, 'message' => 'Demo data cleared. Existing server-managed administrators were preserved.']);
    }

    if ($path === 'moisture-readings' && $method === 'POST') {
        if ($iotApiKey !== '' && !hash_equals($iotApiKey, requestHeader('x-api-key'))) respond(['error' => 'Invalid IoT API key.'], 401);
        $body = jsonBody();
        $moisture = $body['moisturePercentage'] ?? $body['moisture_percentage'] ?? null;
        if (!is_numeric($moisture) || (float) $moisture < 0 || (float) $moisture > 100) respond(['error' => 'moisturePercentage must be between 0 and 100.'], 400);
        $moisture = (float) $moisture;
        $classification = $moisture >= 17
            ? 'Wet (17% MC and above)'
            : ($moisture >= 15
                ? 'Moderate (15-16.9% MC)'
                : ($moisture >= 12 ? 'Dry (12-14.9% MC)' : 'Risk of Grain Breakage (Below 12% MC)'));
        $deviceId = $body['deviceId'] ?? $body['device_id'] ?? 'ESP32-GRAIN-01';
        $gatewayId = $body['gatewayId'] ?? $body['gateway_id'] ?? null;
        // Keep the same reading ID when a gateway retries a sample.
        $readingId = requestHeader('idempotency-key') ?: (string) ($body['readingId'] ?? $body['reading_id'] ?? '');
        $receiptKey = '__sensor_' . hash('sha256', $deviceId . ':' . $readingId);
        beginEndpointWrite($pdo, ['sensor:' . $deviceId, $receiptKey]);
        $sampleHash = hash('sha256', json_encode($body, JSON_THROW_ON_ERROR));
        if ($readingId !== '') {
            $receiptQuery = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key=? FOR UPDATE');
            $receiptQuery->execute([$receiptKey]);
            $receipt = json_decode((string) ($receiptQuery->fetchColumn() ?: 'null'), true);
            if ($receipt) {
                if ($receipt['hash'] !== $sampleHash) throw new LiveConflict('This reading ID was already used for a different sample.');
                respond($receipt['response'], 201);
            }
        }
        $pdo->prepare('INSERT INTO iot_devices (device_id,gateway_id,last_seen_at) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE gateway_id=VALUES(gateway_id),last_seen_at=NOW(),is_active=1')->execute([$deviceId, $gatewayId]);
        $statement = $pdo->prepare('INSERT INTO moisture_readings (harvest_id,batch_id,farmer_email,farmer_name,raw_value,moisture_percentage,quality_classification,device_id,gateway_id) VALUES (?,?,?,?,?,?,?,?,?)');
        $statement->execute([$body['harvestId'] ?? $body['harvest_id'] ?? null, $body['batchId'] ?? $body['batch_id'] ?? ('BATCH-' . time()), $body['farmerEmail'] ?? $body['farmer_email'] ?? null, $body['farmerName'] ?? $body['farmer_name'] ?? null, $body['rawValue'] ?? $body['raw_value'] ?? null, $moisture, $classification, $deviceId, $gatewayId]);
        $response = ['id' => (int) $pdo->lastInsertId(), 'moisturePercentage' => $moisture, 'qualityClassification' => $classification, 'deviceId' => $deviceId];
        if ($readingId !== '') $pdo->prepare('INSERT INTO system_settings (setting_key,setting_value) VALUES (?,?)')->execute([$receiptKey, json_encode(['hash' => $sampleHash, 'response' => $response], JSON_THROW_ON_ERROR)]);
        respond($response, 201);
    }
    if ($path === 'moisture-readings' && $method === 'GET') {
        $conditions = []; $values = [];
        foreach (['harvestId' => 'harvest_id', 'deviceId' => 'device_id'] as $query => $column) if (!empty($_GET[$query])) { $conditions[] = "{$column} = ?"; $values[] = $_GET[$query]; }
        if (!empty($_GET['farmerEmail'])) { $conditions[] = ($_GET['includeUnassigned'] ?? '') === 'true' ? '(farmer_email = ? OR farmer_email IS NULL)' : 'farmer_email = ?'; $values[] = $_GET['farmerEmail']; }
        if (!empty($_GET['since'])) { $conditions[] = 'recorded_at >= ?'; $values[] = date('Y-m-d H:i:s', strtotime($_GET['since'])); }
        $limit = min(max((int) ($_GET['limit'] ?? 50), 1), 500);
        $statement = $pdo->prepare('SELECT * FROM moisture_readings' . ($conditions ? ' WHERE ' . implode(' AND ', $conditions) : '') . " ORDER BY recorded_at DESC LIMIT {$limit}");
        $statement->execute($values); respond(['data' => $statement->fetchAll()]);
    }

    if ($path === 'auth/google/url' && $method === 'GET') {
        $bucket = 'google-ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        beginEndpointWrite($pdo, ['login:' . $bucket]);
        $wait = consumeLoginAttempt($pdo, [$bucket => 30], time());
        finishEndpointWrite($pdo, true);
        if ($wait > 0) {
            header('Retry-After: ' . $wait);
            respond(['error' => 'Too many sign-in requests. Please try again later.', 'retryAfterSeconds' => $wait], 429);
        }
        if ($googleClientId === '') respond(['configured' => false, 'error' => 'Google OAuth is not configured.']);
        $base = $appUrl ?: ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST']);
        $redirect = $base . '/api/auth/google/callback';
        $state = bin2hex(random_bytes(24));
        $_SESSION['google_oauth_state'] = $state;
        $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query(['client_id' => $googleClientId, 'redirect_uri' => $redirect, 'response_type' => 'code', 'scope' => 'openid email profile', 'prompt' => 'select_account', 'state' => $state]);
        respond([
            'configured' => true,
            'url' => $url,
            'redirectUri' => $redirect,
            'redirectOrigin' => rtrim($base, '/'),
        ]);
    }
    if ($path === 'auth/google/status' && $method === 'GET') {
        $verifiedEmail = strtolower(trim((string) ($_SESSION['google_user_email'] ?? '')));
        respond([
            'verified' => !empty($_SESSION['google_user_verified']) && filter_var($verifiedEmail, FILTER_VALIDATE_EMAIL) !== false,
            'email' => $verifiedEmail,
        ]);
    }
    if ($path === 'auth/google/callback' && $method === 'GET') {
        $base = $appUrl ?: ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST']);
        $targetOrigin = (string) (parse_url($base, PHP_URL_SCHEME) . '://' . parse_url($base, PHP_URL_HOST) . (parse_url($base, PHP_URL_PORT) ? ':' . parse_url($base, PHP_URL_PORT) : ''));
        $sendPopupResult = static function (array $payload) use ($targetOrigin): never {
            header('Content-Type: text/html; charset=UTF-8');
            header("Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'");
            $json = json_encode($payload, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES);
            echo '<!doctype html><html><body style="font-family:Arial,sans-serif;padding:30px;text-align:center"><p>Completing Google authentication…</p><script>if(window.opener){window.opener.postMessage(' . $json . ',' . json_encode($targetOrigin) . ');}window.close();</script></body></html>';
            exit;
        };
        if ($googleClientId === '' || $googleClientSecret === '') $sendPopupResult(['type' => 'GOOGLE_AUTH_ERROR', 'error' => 'Google OAuth is not configured.']);
        if (isset($_GET['error'])) $sendPopupResult(['type' => 'GOOGLE_AUTH_ERROR', 'error' => 'Google sign-in was cancelled.']);
        $state = (string) ($_GET['state'] ?? '');
        $expectedState = (string) ($_SESSION['google_oauth_state'] ?? '');
        unset($_SESSION['google_oauth_state']);
        if ($state === '' || $expectedState === '' || !hash_equals($expectedState, $state)) $sendPopupResult(['type' => 'GOOGLE_AUTH_ERROR', 'error' => 'Invalid Google authentication state.']);
        $code = (string) ($_GET['code'] ?? '');
        if ($code === '') $sendPopupResult(['type' => 'GOOGLE_AUTH_ERROR', 'error' => 'Google did not return an authorization code.']);

        $redirect = $base . '/api/auth/google/callback';
        $tokenRequest = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($tokenRequest, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'], CURLOPT_POSTFIELDS => http_build_query(['code' => $code, 'client_id' => $googleClientId, 'client_secret' => $googleClientSecret, 'redirect_uri' => $redirect, 'grant_type' => 'authorization_code'])]);
        if ($caBundle !== '') curl_setopt($tokenRequest, CURLOPT_CAINFO, $caBundle);
        $tokenBody = curl_exec($tokenRequest);
        $tokenStatus = (int) curl_getinfo($tokenRequest, CURLINFO_RESPONSE_CODE);
        $tokenTransportError = curl_errno($tokenRequest);
        curl_close($tokenRequest);
        $token = json_decode(is_string($tokenBody) ? $tokenBody : '{}', true);
        if ($tokenStatus !== 200 || !is_array($token) || empty($token['access_token'])) {
            // Log only diagnostic codes, never authorization codes, credentials or tokens.
            $googleError = is_array($token) && is_string($token['error'] ?? null) ? $token['error'] : 'unknown';
            error_log('[KAWING GOOGLE TOKEN] HTTP ' . $tokenStatus . '; curl=' . $tokenTransportError . '; error=' . preg_replace('/[^a-zA-Z0-9_]/', '', $googleError));
            $message = match (true) {
                $tokenTransportError !== 0 => 'The server could not securely connect to Google. Please try again shortly.',
                $googleError === 'invalid_grant' => 'Google sign-in expired or its code was already used. Close the sign-in window and connect your Google account again.',
                $googleError === 'invalid_client' => 'Google rejected the app sign-in credentials. Ask the administrator to check the Google OAuth client configuration.',
                $googleError === 'redirect_uri_mismatch' => 'The Google sign-in callback address does not match the app configuration. Contact the administrator.',
                default => 'Google could not complete sign-in. Please reconnect your Google account.',
            };
            $sendPopupResult(['type' => 'GOOGLE_AUTH_ERROR', 'error' => $message]);
        }

        $profileRequest = curl_init('https://openidconnect.googleapis.com/v1/userinfo');
        curl_setopt_array($profileRequest, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token['access_token']]]);
        if ($caBundle !== '') curl_setopt($profileRequest, CURLOPT_CAINFO, $caBundle);
        $profileBody = curl_exec($profileRequest);
        $profileStatus = (int) curl_getinfo($profileRequest, CURLINFO_RESPONSE_CODE);
        curl_close($profileRequest);
        $profile = json_decode(is_string($profileBody) ? $profileBody : '{}', true);
        if ($profileStatus !== 200 || !is_array($profile) || empty($profile['email']) || empty($profile['email_verified'])) $sendPopupResult(['type' => 'GOOGLE_AUTH_ERROR', 'error' => 'Google account email could not be verified.']);
        $_SESSION['google_user_email'] = strtolower(trim((string) $profile['email']));
        $_SESSION['google_user_verified'] = true;
        $kawingAccount = $pdo->prepare('SELECT email,role,is_approved FROM users WHERE LOWER(email) = ? LIMIT 1');
        $kawingAccount->execute([$_SESSION['google_user_email']]);
        $matchedAccount = $kawingAccount->fetch();
        if (is_array($matchedAccount) && (bool) $matchedAccount['is_approved']) {
            session_regenerate_id(true);
            $_SESSION['kawing_user_email'] = strtolower((string) $matchedAccount['email']);
            $_SESSION['kawing_user_role'] = (string) $matchedAccount['role'];
        }
        $sendPopupResult(['type' => 'GOOGLE_AUTH_SUCCESS', 'user' => ['name' => (string) ($profile['name'] ?? 'Google User'), 'email' => (string) $profile['email'], 'verified' => true]]);
    }
    if ($path === 'grainy/usage' && $method === 'POST') {
        $identity = $sessionIdentity();
        $body = jsonBody();
        $accountEmail = strtolower(trim((string) ($body['email'] ?? '')));
        if ($accountEmail === '' || !hash_equals($identity['email'], $accountEmail)) {
            respond(['error' => 'The Grainy request does not match the signed-in KAWING account.'], 403);
        }

        $pdo->exec('CREATE TABLE IF NOT EXISTS ai_daily_usage (
            user_email VARCHAR(191) NOT NULL,
            usage_date DATE NOT NULL,
            questions_used INT UNSIGNED NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_email, usage_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

        $philippineTime = new DateTimeImmutable('now', new DateTimeZone('Asia/Manila'));
        $usageDate = $philippineTime->format('Y-m-d');
        $questionNumber = 31;
        $pdo->beginTransaction();
        try {
            $pdo->prepare('INSERT IGNORE INTO ai_daily_usage (user_email,usage_date,questions_used) VALUES (?,?,0)')
                ->execute([$identity['email'], $usageDate]);
            $usageStatement = $pdo->prepare('SELECT questions_used FROM ai_daily_usage WHERE user_email = ? AND usage_date = ? FOR UPDATE');
            $usageStatement->execute([$identity['email'], $usageDate]);
            $questionsUsed = (int) ($usageStatement->fetchColumn() ?: 0);
            if ($questionsUsed < 30) {
                $questionNumber = $questionsUsed + 1;
                $pdo->prepare('UPDATE ai_daily_usage SET questions_used = ? WHERE user_email = ? AND usage_date = ?')
                    ->execute([$questionNumber, $identity['email'], $usageDate]);
            }
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $error;
        }

        $model = $questionNumber <= 10
            ? 'gemini-3.1-flash-lite'
            : ($questionNumber <= 30 ? 'gpt-5-nano' : 'local');
        respond(['allowed' => $model !== 'local', 'model' => $model]);
    }
    if ($path === 'grainy/speech' && $method === 'POST') {
        $identity = $sessionIdentity();
        $body = jsonBody();
        $accountEmail = strtolower(trim((string) ($body['email'] ?? '')));
        $text = trim((string) ($body['text'] ?? ''));
        if ($accountEmail === '' || !hash_equals($identity['email'], $accountEmail)) respond(['error' => 'The Grainy voice request does not match the signed-in KAWING account.'], 403);
        if ($fishAudioApiKey === '' || str_contains($fishAudioApiKey, 'PASTE_') || $fishAudioReferenceId === '') {
            respond(['error' => 'Fish Audio is not configured.'], 503);
        }
        if ($text === '') respond(['error' => 'Speech text is required.'], 422);
        if (mb_strlen($text) > 1800) respond(['error' => 'Speech text is too long.'], 422);
        $speechText = preg_replace('/\bKAWING\b/ui', 'Ka-wing', $text) ?? $text;

        $speechRequest = curl_init('https://api.fish.audio/v1/tts');
        curl_setopt_array($speechRequest, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 45,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $fishAudioApiKey,
                'Content-Type: application/json',
                'model: s2.1-pro-free',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'text' => $speechText,
                'reference_id' => $fishAudioReferenceId,
                'format' => 'mp3',
                'normalize' => true,
                'prosody' => ['speed' => 1.0, 'volume' => 0, 'normalize_loudness' => true],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
        if ($caBundle !== '') curl_setopt($speechRequest, CURLOPT_CAINFO, $caBundle);
        $audio = curl_exec($speechRequest);
        $speechStatus = (int) curl_getinfo($speechRequest, CURLINFO_RESPONSE_CODE);
        $speechError = curl_error($speechRequest);
        curl_close($speechRequest);
        if ($audio === false || $speechStatus < 200 || $speechStatus >= 300) {
            error_log('[KAWING FISH AUDIO FREE] HTTP ' . $speechStatus . ($speechError !== '' ? ': ' . $speechError : ''));
            respond(['error' => 'Fish Audio is temporarily unavailable.'], 502);
        }

        header_remove('Content-Type');
        header('Content-Type: audio/mpeg');
        header('Content-Length: ' . strlen((string) $audio));
        header('Cache-Control: private, no-store, max-age=0');
        echo $audio;
        exit;
    }
    if ($path === 'email/status' && $method === 'GET') {
        respond(['configured' => smtpIsConfigured($smtpConfig), 'provider' => 'gmail-smtp']);
    }
    if ($path === 'email/test' && $method === 'POST') {
        if ($adminApiKey === '' || !hash_equals($adminApiKey, requestHeader('x-api-key'))) respond(['error' => 'Invalid admin API key.'], 401);
        $recipient = (string) (($smtpConfig['test_recipient'] ?? '') ?: ($smtpConfig['username'] ?? ''));
        if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) respond(['error' => 'Configure smtp_test_recipient first.'], 503);
        try {
            sendKawingEmail($smtpConfig, $recipient, '[KAWING] Gmail SMTP Test', 'Your KAWING Gmail SMTP configuration is working correctly.', $appUrl);
            respond(['success' => true, 'message' => 'Test email sent.']);
        } catch (Throwable $error) {
            error_log('[KAWING EMAIL TEST] ' . $error->getMessage());
            respond(['error' => 'Test email failed. Check the PHP error log and SMTP configuration.'], 502);
        }
    }
    if (($path === 'analyze-id' || $path === 'grainy/chat') && $method === 'POST') respond(['error' => 'Optional Gemini endpoint is unavailable; the frontend fallback remains active.'], 501);
    respond(['error' => 'API route not found.', 'route' => $path], 404);
} catch (LiveConflict $error) {
    respond(['error' => $error->getMessage()], 409);
} catch (LiveForbidden $error) {
    respond(['error' => $error->getMessage()], 403);
} catch (InvalidArgumentException $error) {
    respond(['error' => $error->getMessage()], 422);
} catch (Throwable $error) {
    error_log('[KAWING API] ' . $error->getMessage());
    respond(['error' => 'The server could not complete your request. Please try again. If the problem continues, contact the administrator.'], 500);
}
