<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/realtime.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $sql = 'SELECT data FROM harvests';
    $values = [];
    if (!empty($_GET['farmer_email'])) { $sql .= ' WHERE farmer_email = ?'; $values[] = $_GET['farmer_email']; }
    else { $sql .= " WHERE status = 'posted'"; }
    $sql .= ' ORDER BY created_at DESC';
    $statement = $pdo->prepare($sql); $statement->execute($values);
    $data = [];
    foreach ($statement->fetchAll() as $row) {
        $decoded = json_decode((string) $row['data'], true);
        if (is_array($decoded)) $data[] = $decoded;
    }
    respond(['status' => 'success', 'data' => $data]);
}
if ($method === 'POST') {
    $email = liveEmail($_SESSION['kawing_user_email'] ?? '');
    $accountQuery = $pdo->prepare('SELECT role,is_approved FROM users WHERE email=?');
    $accountQuery->execute([$email]);
    $account = $accountQuery->fetch();
    if (!$account || !$account['is_approved']) respond(['error' => 'Sign in before posting a harvest.'], 401);
    $data = jsonBody();
    $id = (string) ($data['id'] ?? '');
    if ($id === '') respond(['error' => 'A stable harvest ID is required for safe retries.'], 422);
    $data['id'] = $id;
    $data['farmerEmail'] = $email;
    $data['status'] = 'posted';
    try {
        applyLiveChanges($pdo, [['collection' => 'harvests', 'id' => $id, 'before' => null, 'after' => $data]], ['email' => $email, 'role' => $account['role']], 'harvest-create:' . $id);
    } catch (LiveConflict $error) {
        respond(['error' => $error->getMessage()], 409);
    } catch (LiveForbidden $error) {
        respond(['error' => $error->getMessage()], 403);
    }
    respond(['status' => 'success', 'message' => 'Harvest listed successfully.', 'harvest_id' => $id], 201);
}
respond(['error' => 'Method not allowed.'], 405);
