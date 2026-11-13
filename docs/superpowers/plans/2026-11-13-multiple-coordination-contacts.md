# Multiple Coordination Contacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store multiple profile contact numbers and reveal them with email only to users who have been coordinated by an accepted harvest offer, matched service, or approved loan.

**Architecture:** Preserve `contactNumber` as the primary value and add a normalized `additionalContactNumbers` array to user records. Centralize contact normalization/display in a small frontend helper, persist the array through the profile API, and render coordinated-contact blocks only in accepted/matched/approved views.

**Tech Stack:** React, TypeScript, PHP, existing realtime/profile APIs.

**Spec:** `docs/superpowers/specs/2026-11-13-multiple-coordination-contacts-design.md`

## Global Constraints

- KAWING coordinates users but does not process their payments or transactions.
- Do not reveal contact data before coordination.
- Do not change acceptance, matching, approval, completion, cancellation, or rating workflows.
- Existing accounts with one number remain valid.

## Review Focus

- Duplicate/blank numbers normalize without losing the primary number.
- Profile API rejects invalid array shapes and saves normalized strings.
- Open/public records do not gain contact blocks.
- Accepted harvest, matched service, and approved loan records show both parties' email and all numbers.
- Completed coordinated history retains contact access.

---

### Task 1: Contact data model and profile persistence

**Files:**
- Modify: `src/types.ts`
- Create: `src/lib/contactDetails.ts`
- Modify: `src/App.tsx`
- Modify: `public/api/index.php`

**Interfaces:**
- Produces: `additionalContactNumbers?: string[]`, `getContactNumbers(user)`, and profile API persistence.

- [ ] Add normalization contract checks.
- [ ] Implement the typed contact helper and profile API array validation.
- [ ] Include the field in profile change detection and persistence.
- [ ] Run TypeScript and PHP syntax checks.

### Task 2: Profile editing UI

**Files:**
- Modify: `src/components/UserProfileModal.tsx`

**Interfaces:**
- Consumes: `additionalContactNumbers` and normalization helper.

- [ ] Add the `+ Add another contact number` control and removable fields.
- [ ] Show all saved numbers in profile view.
- [ ] Save normalized additional numbers with the profile.
- [ ] Run TypeScript check.

### Task 3: Coordinated contact visibility

**Files:**
- Modify: `src/components/FarmerDashboard.tsx`
- Modify: `src/components/BuyerDashboard.tsx`
- Modify: `src/components/ProductionLoanFarmer.tsx`
- Modify: `src/components/ProductionLoanBuyer.tsx`

**Interfaces:**
- Consumes: `getContactNumbers(user)` and coordinated record statuses.

- [ ] Render email plus every contact number in accepted/completed harvest views.
- [ ] Render email plus every contact number in matched/completed service views.
- [ ] Render email plus every contact number in approved/active/completed loan views.
- [ ] Keep open, pending, declined, and cancelled views private.
- [ ] Run TypeScript, production build, and PHP syntax checks only; do not start the Playwright audit.
