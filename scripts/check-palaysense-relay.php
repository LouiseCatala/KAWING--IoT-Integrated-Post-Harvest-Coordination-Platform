<?php
require __DIR__ . '/../public/api/palaysense.php';
function check(bool $ok, string $name): void { if (!$ok) throw new RuntimeException("FAIL: $name"); echo "PASS: $name\n"; }
$device = 'test-' . bin2hex(random_bytes(8));
$farmer = 'farmer-' . bin2hex(random_bytes(8)) . '@example.invalid';
$other = 'other-' . bin2hex(random_bytes(8)) . '@example.invalid';
palaySensePair($farmer, $device);
$reading = palaySenseSubmit($device, 12.26);
check($reading['moisture_percentage'] === 12.26, 'device sample accepted into temporary relay');
check(palaySenseLatest($farmer, $device)['moisture_percentage'] === 12.26, 'paired farmer receives the reading');
check(palaySenseLatest($other, $device) === null, 'other farmer cannot read it');
palaySensePair($other, $device);
check(palaySenseLatest($farmer, $device) === null, 'new pairing removes prior farmer access');
check(palaySenseLatest($other, $device) === null, 'new pairing clears prior sample');
palaySenseSubmit($device, 14.1);
check(palaySenseLatest($other, $device)['moisture_percentage'] === 14.1, 'new paired farmer receives new sample');
palaySenseUnpair($farmer, $device);
check(palaySenseLatest($other, $device)['moisture_percentage'] === 14.1, 'old farmer cannot unpair current owner');
palaySenseUnpair($other, $device);
check(palaySenseLatest($other, $device) === null, 'closing paired form clears temporary access');
