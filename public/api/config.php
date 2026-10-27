<?php
declare(strict_types=1);

// Keep PHP's date filtering aligned with MySQL and the KAWING users' local
// timestamps. Browser timestamps arrive as UTC (ISO 8601) and are converted
// to Philippine time before they are compared with recorded_at.
date_default_timezone_set('Asia/Manila');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'httponly' => true,
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
    ]);
    session_start();
}

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");

// KAWING uses same-origin API calls (including the local Vite proxy). Do not
// expose credential-bearing endpoints to arbitrary websites with wildcard CORS.
$requestOrigin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
$requestHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
if ($requestOrigin !== '') {
    $originHost = strtolower((string) (parse_url($requestOrigin, PHP_URL_HOST) ?? ''));
    $hostWithoutPort = strtolower((string) preg_replace('/:\d+$/', '', $requestHost));
    if ($originHost !== '' && hash_equals($hostWithoutPort, $originHost)) {
        header('Access-Control-Allow-Origin: ' . $requestOrigin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
}
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

$publicRoot = dirname(__DIR__);
$privateRoot = dirname($publicRoot);
$autoloadCandidates = [$privateRoot . '/vendor/autoload.php', $publicRoot . '/vendor/autoload.php'];
foreach ($autoloadCandidates as $autoload) {
    if (is_file($autoload)) { require_once $autoload; break; }
}
if (class_exists(Dotenv\Dotenv::class) && is_file($privateRoot . '/.env')) {
    Dotenv\Dotenv::createImmutable($privateRoot)->safeLoad();
}

// Copy deploy/cpanel/kawing-config.example.php to ~/kawing-config.php on cPanel.
$privateConfig = $privateRoot . '/kawing-config.php';
$settings = is_file($privateConfig) ? require $privateConfig : [];
$readSetting = static function (string $key, string $env, mixed $fallback = null) use ($settings): mixed {
    $value = $_ENV[$env] ?? $_SERVER[$env] ?? getenv($env);
    return ($value !== false && $value !== '') ? $value : ($settings[$key] ?? $fallback);
};

$dbHost = (string) $readSetting('db_host', 'DB_HOST', 'localhost');
$dbPort = (string) $readSetting('db_port', 'DB_PORT', '3306');
$dbName = (string) $readSetting('db_name', 'DB_NAME', 'kawing');
$dbUser = (string) $readSetting('db_user', 'DB_USER', 'root');
$dbPassword = (string) $readSetting('db_password', 'DB_PASSWORD', '');
$iotApiKey = (string) $readSetting('iot_api_key', 'IOT_API_KEY', '');
$googleClientId = (string) $readSetting('google_client_id', 'GOOGLE_CLIENT_ID', '');
$googleClientSecret = (string) $readSetting('google_client_secret', 'GOOGLE_CLIENT_SECRET', '');
$appUrl = rtrim((string) $readSetting('app_url', 'APP_URL', ''), '/');
$sseEnabled = filter_var($readSetting('sse_enabled', 'KAWING_SSE_ENABLED', PHP_SAPI !== 'cli-server'), FILTER_VALIDATE_BOOL);
$adminApiKey = (string) $readSetting('admin_api_key', 'ADMIN_API_KEY', '');
$fishAudioApiKey = (string) $readSetting('fish_audio_api_key', 'FISH_AUDIO_API_KEY', '');
$fishAudioReferenceId = (string) $readSetting('fish_audio_reference_id', 'FISH_AUDIO_REFERENCE_ID', '');
$caBundle = is_file($privateRoot . '/certs/cacert.pem') ? $privateRoot . '/certs/cacert.pem' : '';
$smtpConfig = [
    'enabled' => filter_var($readSetting('smtp_enabled', 'MAIL_ENABLED', false), FILTER_VALIDATE_BOOL),
    'host' => (string) $readSetting('smtp_host', 'MAIL_HOST', 'smtp.gmail.com'),
    'port' => (int) $readSetting('smtp_port', 'MAIL_PORT', 587),
    'encryption' => (string) $readSetting('smtp_encryption', 'MAIL_ENCRYPTION', 'tls'),
    'username' => (string) $readSetting('smtp_username', 'MAIL_USERNAME', ''),
    'password' => (string) $readSetting('smtp_password', 'MAIL_PASSWORD', ''),
    'from_email' => (string) $readSetting('smtp_from_email', 'MAIL_FROM', ''),
    'from_name' => (string) $readSetting('smtp_from_name', 'MAIL_FROM_NAME', 'KAWING Notifications'),
    'test_recipient' => (string) $readSetting('smtp_test_recipient', 'MAIL_TEST_RECIPIENT', ''),
    'admin_recipient' => (string) $readSetting('admin_notification_email', 'ADMIN_NOTIFICATION_EMAIL', ''),
    'ca_bundle' => $caBundle,
];

try {
    $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed. Check ~/kawing-config.php and the MySQL user privileges.']);
    exit;
}

function jsonBody(): array {
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > 16 * 1024 * 1024) respond(['error' => 'Request body is too large.'], 413);
    $raw = file_get_contents('php://input') ?: '{}';
    try {
        $decoded = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        respond(['error' => 'Malformed JSON request body.'], 400);
    }
    if (!is_array($decoded)) respond(['error' => 'JSON request body must be an object.'], 400);
    return $decoded;
}
function respond(mixed $payload, int $status = 200): never {
    global $pdo, $path, $method;
    if ($status >= 200 && $status < 300 && in_array($method ?? ($_SERVER['REQUEST_METHOD'] ?? ''), ['POST', 'PUT', 'PATCH', 'DELETE'], true) && function_exists('publishLiveResponse')) {
        publishLiveResponse($pdo, $path ?? basename($_SERVER['SCRIPT_NAME'] ?? ''));
    }
    if (isset($GLOBALS['endpointWriteLocks'])) finishEndpointWrite($pdo, $status >= 200 && $status < 300);
    http_response_code($status);
    header('Cache-Control: private, no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
function requestHeader(string $name): string {
    return trim((string) ($_SERVER['HTTP_' . strtoupper(str_replace('-', '_', $name))] ?? ''));
}
