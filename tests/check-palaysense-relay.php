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
try {
    palaySensePair($other, $device);
    check(false, 'another farmer cannot claim an active device');
} catch (DomainException) {
    check(true, 'another farmer cannot claim an active device');
}
check(palaySenseLatest($farmer, $device)['moisture_percentage'] === 12.26, 'rejected pairing keeps the current farmer reading');
palaySenseUnpair($farmer, $device);
palaySensePair($other, $device);
check(palaySenseLatest($other, $device) === null, 'new pairing starts without an old sample');
palaySenseSubmit($device, 14.1);
check(palaySenseLatest($other, $device)['moisture_percentage'] === 14.1, 'new paired farmer receives new sample');
palaySenseUnpair($other, $device);
check(palaySenseLatest($other, $device) === null, 'closing paired form clears temporary access');
