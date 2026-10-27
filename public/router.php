<?php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) return false;

if (str_starts_with($path, '/api/')) {
    $_GET['route'] = trim(substr($path, 5), '/');
    require __DIR__ . '/api/index.php';
    return true;
}

if (is_file(__DIR__ . '/index.html')) {
    readfile(__DIR__ . '/index.html');
    return true;
}

http_response_code(404);
echo 'Run the React frontend with npm run dev.';
