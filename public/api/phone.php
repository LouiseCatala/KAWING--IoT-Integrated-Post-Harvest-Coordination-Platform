<?php
declare(strict_types=1);

function normalizeMobileNumber(string $value): string {
    $compact = preg_replace('/[\s-]+/', '', $value);
    return str_starts_with($compact, '+63') ? '0' . substr($compact, 3) : $compact;
}

function isValidMobileNumber(string $value): bool {
    $number = normalizeMobileNumber($value);
    return preg_match('/^09\d{9}$/D', $number) === 1
        && $number !== '09123456789'
        && preg_match('/^09(\d)\1{8}$/D', $number) !== 1;
}
