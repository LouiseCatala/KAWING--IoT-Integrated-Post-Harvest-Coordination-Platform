<?php
// Backwards-compatible endpoint for older ESP32 firmware.
$_GET['route'] = 'moisture-readings';
require __DIR__ . '/index.php';
