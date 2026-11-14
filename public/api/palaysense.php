<?php
declare(strict_types=1);

// Short-lived pairing and latest-value relay. It never writes sensor samples to MySQL.
function palaySenseRelay(callable $update): mixed {
    $directory = sys_get_temp_dir() . '/kawing-palaysense-' . substr(hash('sha256', __DIR__), 0, 16);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Cannot open PalaySense relay.');
    $handle = fopen($directory . '/latest.json', 'c+');
    if (!$handle) throw new RuntimeException('Cannot open PalaySense relay.');
    try {
        if (!flock($handle, LOCK_EX)) throw new RuntimeException('Cannot lock PalaySense relay.');
        $state = json_decode(stream_get_contents($handle) ?: '{}', true) ?: ['bindings' => [], 'readings' => []];
        $now = microtime(true);
        foreach (['bindings', 'readings'] as $group) $state[$group] = array_filter($state[$group] ?? [], static fn(array $item): bool => ($item['expires_at'] ?? 0) > $now);
        $result = $update($state, $now);
        $encoded = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($handle);
        if (!ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) throw new RuntimeException('Cannot update PalaySense relay.');
        return $result;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function palaySensePair(string $email, string $deviceId): void {
    palaySenseRelay(static function (array &$state, float $now) use ($email, $deviceId): void {
        $state['bindings'][hash('sha256', $deviceId)] = ['email' => strtolower($email), 'expires_at' => $now + 600];
        unset($state['readings'][hash('sha256', $deviceId)]);
    });
}

function palaySenseUnpair(string $email, string $deviceId): void {
    palaySenseRelay(static function (array &$state) use ($email, $deviceId): void {
        $key = hash('sha256', $deviceId);
        if (strtolower((string) ($state['bindings'][$key]['email'] ?? '')) === strtolower($email)) unset($state['bindings'][$key], $state['readings'][$key]);
    });
}

function palaySenseSubmit(string $deviceId, float $moisture): array {
    return palaySenseRelay(static function (array &$state, float $now) use ($deviceId, $moisture): array {
        $key = hash('sha256', $deviceId);
        if (empty($state['bindings'][$key])) throw new InvalidArgumentException('Open Post Harvest or Offer Harvest in a farmer account before measuring.');
        $reading = ['moisture_percentage' => $moisture, 'device_id' => $deviceId, 'recorded_at' => gmdate('c'), 'received_at' => $now, 'expires_at' => $now + 120];
        $state['readings'][$key] = $reading;
        return $reading;
    });
}

function palaySenseLatest(string $email, string $deviceId): ?array {
    return palaySenseRelay(static function (array &$state) use ($email, $deviceId): ?array {
        $key = hash('sha256', $deviceId);
        if (strtolower((string) ($state['bindings'][$key]['email'] ?? '')) !== strtolower($email)) return null;
        return $state['readings'][$key] ?? null;
    });
}
