# Service Request Edit and Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let farmers edit or delete their own open service requests while clearly locking transaction records and removing provider identity from Posted Requests.

**Architecture:** Reuse the existing request form as an edit form, and route edits/deletions through the existing atomic realtime endpoint. Enforce ownership, open-status, and immutable transaction fields on the server; render actions only for open requests.

**Tech Stack:** React, TypeScript, PHP, existing realtime API and confirmation dialogs.

**Spec:** `docs/superpowers/specs/2026-11-13-service-request-edit-delete-design.md`

## Global Constraints

- Do not change matching, cancellation, fulfillment, notifications, or ratings.
- Only the farmer owner may edit/delete an open request.
- Accepted and completed records remain locked.
- Locked accepted requests display `With pending transaction`.

## Review Focus

- Stale open request accepted before save: server rejects edit/delete and UI retains current data.
- Forged ownership/status/provider fields: server rejects the write.
- Failed save/delete: UI does not pretend it succeeded.
- Cancelled request: returns to open and becomes editable.
- Posted view: never displays provider identity.

---

### Task 1: Secure persistence

**Files:**
- Modify: `public/api/businessWrites.php`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `onUpdateServiceRequest(id, updates)` and server-confirmed deletion.

- [ ] Add server validation for farmer-owned pending edits and immutable transaction fields.
- [ ] Add App handlers that persist edit/delete before changing local state.
- [ ] Verify PHP syntax and type checking.

### Task 2: Posted Request actions and edit form

**Files:**
- Modify: `src/components/FarmerDashboard.tsx`

**Interfaces:**
- Consumes: `onUpdateServiceRequest(id, updates)` and existing delete callback.

- [ ] Remove provider name from Posted Requests.
- [ ] Add Edit/Delete actions only to open requests and `With pending transaction` to matched records.
- [ ] Prefill and lock the existing form to the single request being edited.
- [ ] Confirm save and delete through existing dialogs.
- [ ] Verify lint and production build.

### Task 3: Workflow regression verification

**Files:**
- Test: existing service workflow tests and build configuration.

- [ ] Run service workflow tests, lint, build, and PHP syntax checks.
- [ ] Inspect the final diff for unrelated workflow changes.
