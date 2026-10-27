# Concurrency controls

The business writes covered below use InnoDB transactions with resource-scoped MySQL
named locks. Lock names include the database name. Shared resource names cover
harvests, participants, lender funds and provider reservations. This also
serializes creation when a row does not exist yet. Locks time out after five
seconds and return a conflict; they never authorize an action by themselves.

The existing `/api/realtime/changes` endpoint is retained. Business checks run
inside its transaction, including writes from older clients:

- One accepted offer per harvest; pending competitors are declined atomically.
- Closed harvests reject new offers; committed harvests reject edits/deletion.
- Loan approval checks the current pending state, requested amount and funds,
  deducts on the server, and publishes the new lender record in the same commit.
- Loan applications retain a snapshot of offered terms. Approved terms and
  amounts cannot be rewritten by later status updates.
- Service claims assign only one provider. Known kilogram capacities are checked
  against matching reservations under the provider lock.
- The existing field comparison rejects stale edits/deletes. Username checks
  share a directory lock with registration and profile changes.
- A committed batch receipt makes retries idempotent, including a lost response.
  Receipt hashes and sensor receipts live in private `system_settings` keys;
  they are not included in public snapshots. Retain receipts while clients may
  retry. They currently require periodic operational storage monitoring.

Profile/provider endpoints require `before`, the values from when the form was
opened. They merge only changed fields and reject stale edits with HTTP 409.
FAQ and announcement saves require the previously fetched list in `before`.
Old open browser sessions should reload before using these forms.

Login counters are stored in MySQL: five attempts per normalized username and
30 per source IP per rolling five minutes, including concurrent requests and
fresh cookies. These count attempts, not just failed passwords. Google OAuth
starts have a separate 30/IP/five-minute counter. `REMOTE_ADDR` is used; when
deploying behind a reverse proxy, configure the web server's trusted-proxy real
IP support. Client-supplied forwarded headers are intentionally not trusted.

New record IDs use 128 random bits. A frontend guard rejects identical clicks
within two seconds. Network retries keep their record IDs. Email delivery uses
an atomic pending claim so only one worker can send or retry a failed delivery.
SMTP itself cannot guarantee exactly-once delivery after an ambiguous remote
failure; a crashed pending delivery is not automatically resent.

## Sensor and capacity boundaries

PalaySense uploads support `readingId` / `reading_id` or an `Idempotency-Key`
header. Reuse that value for retries of the same sample; use a new value for
each new sample. Reusing a key with different data returns 409. Legacy firmware
without a sample ID still works, but its retries cannot be distinguished safely
from two real samples with the same moisture value. Gateway firmware is not in
this repository and has not been changed.

Capacity checks currently understand explicit values such as `1,000 kg`.
Free-text sack counts, tonnes/hour and unspecified units are not converted or
treated as bookable inventory. Transport/drying/milling reservations share a
preferred date/time slot; storage counts all active reservations. Duration-based
overlap and arbitrary capacity units require a structured scheduling model.

## Verification

- `npm.cmd run lint`
- `node scripts/check-submissions.cjs`
- `node scripts/check-realtime.cjs`
- `php scripts/check-realtime.php`
- `php scripts/check-realtime-db.php` (connection-local temporary tables)
- `php scripts/check-concurrency.php` (parallel PHP workers in a uniquely named
  disposable database, removed in `finally`; requires CREATE/DROP DATABASE)

The concurrency suite exercises competing offer winners, competing loan fund
deductions, retries, service claims/capacity, shared login counters, registration,
profile conflicts, shared-list conflicts and email claims. It sends no emails
and changes no application records.
