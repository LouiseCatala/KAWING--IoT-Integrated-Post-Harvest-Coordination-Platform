# PalaySense Account ID Implementation Plan

> **For agentic workers:** Execute inline; do not delegate.

**Goal:** Save one optional PalaySense device ID on each farmer account and use it for moisture readings.

**Architecture:** Store a farmer-only `palaySenseId` in the account JSON and a unique nullable `users.palaysense_id` column. Add the field to registration and profile editing; the harvest form displays the saved ID read-only and pairs/reads with it.

**Tech Stack:** React, TypeScript, PHP, MySQL.

**Spec:** User request in this conversation.

## Global Constraints

- Keep device readings temporary; do not write samples to MySQL.
- Do not change harvest workflow or the moisture relay.
- Non-farmer accounts must not store a PalaySense ID.

## Review Focus

- Duplicate IDs must not attach one device to multiple farmer accounts.
- Profile edits must persist to MySQL and update the active harvest form.
- Full account synchronization must preserve the dedicated SQL column.
- Missing IDs must not silently fall back to a browser-local ID.

### Task 1: Persist farmer ID

**Files:** `database/schema.sql`, new migration, `public/api/index.php`, `src/types.ts`, `src/App.tsx`.

- [ ] Add the nullable unique column and migration.
- [ ] Normalize and validate IDs during registration, profile updates, and account sync; restrict to farmers.
- [ ] Include the field in registration/profile JSON and SQL writes.

### Task 2: Collect and display ID

**Files:** `src/pages/auth/Auth.tsx`, `src/components/UserProfileModal.tsx`, `src/pages/farmer/FarmerDashboard.tsx`.

- [ ] Add optional registration input and compact profile edit input.
- [ ] Replace the harvest form’s editable local-storage ID with the account’s saved ID, read-only.
- [ ] Keep existing pair/read/unpair lifecycle using the account ID.
