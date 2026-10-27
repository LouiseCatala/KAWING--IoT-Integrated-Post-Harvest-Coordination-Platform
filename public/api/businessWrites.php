<?php
declare(strict_types=1);

function requireTransition(?array $current, ?array $next, array $transitions, string $initial): void {
    if ($next === null) return;
    $status = (string) ($next['status'] ?? '');
    if ($current === null) {
        if ($status !== $initial) throw new LiveConflict('New records must start in their initial status.');
        return;
    }
    $old = (string) ($current['status'] ?? '');
    if ($old !== $status && !in_array($status, $transitions[$old] ?? [], true)) throw new LiveConflict('This action is no longer available. Refresh the record.');
}

function validateBusinessWrite(PDO $pdo, string $collection, ?array $current, ?array &$next, array $identity, array &$topics): void {
    if ($current !== null && liveEqual($current, $next)) return;
    $admin = $identity['role'] === 'admin'; $email = liveEmail($identity['email']);
    if ($collection === 'users' && $next !== null) ensureUniqueAccount($pdo, (string) ($next['name'] ?? ''), (string) ($next['email'] ?? ''));
    if ($collection === 'harvests' && $current !== null) {
        if ($next === null) {
            $committed = $pdo->prepare("SELECT id FROM offers WHERE harvest_id=? AND status IN ('accepted','completed') LIMIT 1 FOR UPDATE");
            $committed->execute([$current['id']]);
            if ($committed->fetchColumn() !== false) throw new LiveConflict('A buyer has already committed to this harvest. It cannot be deleted.');
        }
        if (($current['status'] ?? '') !== 'posted' && ($next === null || !liveEqual(array_diff_key($current, ['status' => true]), array_diff_key($next, ['status' => true])))) {
            throw new LiveConflict('This harvest is already committed. Its details cannot be edited or deleted.');
        }
        requireTransition($current, $next, ['posted' => ['in_progress', 'completed'], 'in_progress' => ['completed']], 'posted');
    }
    if ($collection === 'offers') {
        requireTransition($current, $next, ['pending' => ['accepted', 'declined', 'cancelled'], 'accepted' => ['completed']], 'pending');
        if ($next === null && $current && ($current['status'] ?? '') !== 'pending') throw new LiveConflict('A decided offer cannot be deleted.');
        if ($next === null) return;
        $harvest = lockedRecord($pdo, 'harvests', (string) $next['harvestId']);
        if (!$harvest) throw new LiveConflict('This harvest is no longer available.');
        if (liveEmail($harvest['farmerEmail'] ?? '') !== liveEmail($next['farmerEmail'] ?? '')) throw new LiveForbidden('The offer does not belong to this farmer.');
        if ($current === null || (($current['status'] ?? '') === 'pending' && ($next['status'] ?? '') === 'pending')) {
            if (($harvest['status'] ?? '') !== 'posted') throw new LiveConflict('This harvest is already closed.');
        }
        if (!$admin && ($current['status'] ?? null) !== $next['status']) {
            $owner = $next['status'] === 'cancelled' ? 'buyerEmail' : ($current === null ? 'buyerEmail' : 'farmerEmail');
            if (liveEmail($next[$owner] ?? '') !== $email) throw new LiveForbidden('You cannot make this offer decision.');
        }
        if ($current && ($current['status'] ?? '') !== 'pending') {
            foreach (['offerPrice', 'quantityWanted', 'quantity', 'totalAmount'] as $field) if (!liveEqual($current[$field] ?? null, $next[$field] ?? null)) throw new LiveConflict('Agreed offer details cannot be changed.');
        }
    }
    if ($collection === 'productionLoans') {
        requireTransition($current, $next, ['Pending' => ['Approved', 'Declined', 'Cancelled'], 'Approved' => ['Active', 'Completed'], 'Active' => ['Completed']], 'Pending');
        if ($next === null) {
            if ($current && !in_array($current['status'] ?? '', ['Pending', 'Declined', 'Cancelled'], true)) throw new LiveConflict('An approved loan cannot be deleted.');
            return;
        }
        $buyer = lockedRecord($pdo, 'users', liveEmail($next['buyerEmail'] ?? ''));
        if (!$buyer) throw new LiveConflict('The lender is no longer available.');
        $config = $buyer['loanConfig'] ?? [];
        if ($current === null) {
            $amount = (float) ($next['requestedAmount'] ?? 0);
            if (empty($config['enabled']) || $amount <= 0 || $amount < (float) ($config['minAmount'] ?? 0) || $amount > (float) ($config['maxAmount'] ?? 0)) throw new LiveConflict('Review the current loan limits before applying.');
            $next['loanTerms'] = $config;
        }
        if ($current && !$admin && ($current['status'] ?? '') !== $next['status']) {
            $actor = $next['status'] === 'Cancelled' ? 'farmerEmail' : 'buyerEmail';
            if (liveEmail($next[$actor] ?? '') !== $email) throw new LiveForbidden('You cannot make this loan decision.');
        }
        if ($current && ($current['status'] ?? '') !== 'Pending') {
            foreach (['approvedAmount', 'requestedAmount', 'repaymentPeriod', 'repaymentMethod', 'interestRate', 'loanTerms'] as $field) {
                if (!liveEqual($current[$field] ?? null, $next[$field] ?? null)) throw new LiveConflict('Agreed loan terms cannot be changed.');
            }
        }
        if ($current && ($current['status'] ?? '') === 'Pending' && $next['status'] === 'Approved') {
            $amount = (float) ($next['approvedAmount'] ?? 0);
            $fund = (float) ($config['availableFund'] ?? 0);
            if (!is_finite($amount) || $amount <= 0 || $amount > $fund || $amount > (float) ($current['requestedAmount'] ?? 0)) throw new LiveConflict('The approved amount exceeds the request or available loan funds.');
            $buyer['loanConfig']['availableFund'] = round($fund - $amount, 2);
            $pdo->prepare('UPDATE users SET data = ? WHERE email = ?')->execute([json_encode($buyer, JSON_THROW_ON_ERROR), $next['buyerEmail']]);
            $topics[] = 'users';
        }
    }
    if ($collection === 'services') {
        requireTransition($current, $next, ['pending' => ['matched', 'rejected'], 'matched' => ['completed']], 'pending');
        if ($next === null) {
            if ($current && ($current['status'] ?? '') !== 'pending') throw new LiveConflict('An assigned service request cannot be deleted.');
            return;
        }
        if ($current && ($current['status'] ?? '') !== $next['status'] && !$admin && $next['status'] !== 'rejected' && liveEmail($next['operatorEmail'] ?? '') !== $email) throw new LiveForbidden('Only the assigned provider can update this job.');
        if ($current && ($current['status'] ?? '') === 'pending' && $next['status'] === 'matched') {
            $provider = lockedRecord($pdo, 'users', liveEmail($next['operatorEmail'] ?? ''));
            if (!$provider || ($provider['isAvailable'] ?? true) === false) throw new LiveConflict('This provider is unavailable.');
            $profile = $provider['businessCapabilities'][$next['type']] ?? $provider['logisticsServices'][$next['type']] ?? null;
            if ($profile && (empty($profile['enabled']) || ($profile['isAvailable'] ?? true) === false || !in_array($profile['approvalStatus'] ?? 'approved', ['approved'], true))) throw new LiveConflict('This service is not currently available.');
            checkServiceCapacity($pdo, $next, $profile ?? []);
        }
    }
}

function checkServiceCapacity(PDO $pdo, array $request, array $profile): void {
    // Only compare explicit kg capacities. Free-text rates, tons/hour, and sack
    // counts cannot safely be treated as a numeric kilogram reservation.
    $field = ['transport' => 'carryingCapacity', 'storage' => 'storageCapacity', 'drying' => 'batchCapacity', 'milling' => 'millingCapacity'][$request['type']] ?? 'capacity';
    $raw = (string) ($profile[$field] ?? $profile['capacity'] ?? '');
    if (!preg_match('/^\s*([\d,]+(?:\.\d+)?)\s*kg\s*$/i', $raw, $match) || strtolower((string) ($request['unit'] ?? '')) !== 'kg') return;
    $capacity = (float) str_replace(',', '', $match[1]);
    $used = (float) ($request['quantity'] ?? 0);
    // The provider's named lock protects reservations; avoid locking unrelated
    // providers while scanning schedules stored in JSON.
    $query = $pdo->prepare("SELECT data FROM service_requests WHERE service_type = ? AND status = 'matched' AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(data, '$.operatorEmail'))) = ?");
    $query->execute([$request['type'], liveEmail($request['operatorEmail'] ?? '')]);
    foreach ($query->fetchAll() as $row) {
        $job = json_decode($row['data'], true);
        if ($job['id'] === $request['id'] || liveEmail($job['operatorEmail'] ?? '') !== liveEmail($request['operatorEmail'] ?? '')) continue;
        if ($request['type'] !== 'storage' && (($job['preferredDate'] ?? '') !== ($request['preferredDate'] ?? '') || ($job['preferredTime'] ?? '') !== ($request['preferredTime'] ?? ''))) continue;
        if (strtolower((string) ($job['unit'] ?? '')) === 'kg') $used += (float) ($job['quantity'] ?? 0);
    }
    if ($used > $capacity) throw new LiveConflict('This booking exceeds the remaining service capacity for that schedule.');
}

function finalizeOfferDecisions(PDO $pdo, array $changes, array &$topics): void {
    foreach ($changes as $change) {
        if (($change['collection'] ?? '') !== 'offers' || ($change['after']['status'] ?? '') !== 'accepted') continue;
        $id = $change['after']['harvestId'];
        $query = $pdo->prepare("SELECT id,data FROM offers WHERE harvest_id = ? AND status IN ('accepted','completed') FOR UPDATE");
        $query->execute([$id]);
        if (count($query->fetchAll()) !== 1) throw new LiveConflict('Another offer has already been accepted for this harvest.');
        $harvest = lockedRecord($pdo, 'harvests', $id);
        if (!$harvest) throw new LiveConflict('This harvest no longer exists.');
        $harvest['status'] = 'completed';
        $pdo->prepare("UPDATE harvests SET status='completed',data=? WHERE id=?")->execute([json_encode($harvest, JSON_THROW_ON_ERROR), $id]);
        $query = $pdo->prepare("SELECT id,data FROM offers WHERE harvest_id=? AND status='pending' FOR UPDATE");
        $query->execute([$id]);
        foreach ($query->fetchAll() as $row) {
            $offer = json_decode($row['data'], true); $offer['status'] = 'declined';
            $pdo->prepare("UPDATE offers SET status='declined',data=? WHERE id=?")->execute([json_encode($offer, JSON_THROW_ON_ERROR), $row['id']]);
        }
        $topics[] = 'harvests'; $topics[] = 'offers';
    }
}
