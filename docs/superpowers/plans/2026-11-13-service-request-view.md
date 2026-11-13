# Service Request View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Posted Requests and Accepted Services views to the farmer's My Service Requests page.

**Architecture:** Keep the existing account-owned `myServices` collection as the source of truth. Add local view state and derive the visible collection without changing persistence or workflow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-11-13-service-request-view-design.md`

## Global Constraints

- Posted Requests is the default view.
- Accepted Services includes only `matched` requests.
- Do not change service workflow, backend calls, or stored data.

## Review Focus

- An account with no requests sees the existing useful empty state.
- An account with requests but no accepted services sees an accepted-view empty state.
- Switching back to Posted Requests restores all account-owned requests.
- Status counts remain accurate when request data changes.
- Buttons remain usable on narrow screens and in both themes.

---

### Task 1: Add the request view switcher

**Files:**
- Modify: `src/components/FarmerDashboard.tsx`

**Interfaces:**
- Consumes: `myServices: ServiceRequest[]`
- Produces: `requestView: 'posted' | 'accepted'` and a derived visible request list

- [x] **Step 1: Establish the failing behavior check**

Confirm the current component has no `requestView` state and cannot isolate `matched` requests from the My Service Requests page.

- [x] **Step 2: Add the minimal view state and filtering**

Add local state defaulting to `posted`; derive accepted requests with `status === 'matched'`.

- [x] **Step 3: Add the two compact buttons and contextual empty state**

Use the exact labels `Posted Requests` and `Accepted Services`, including localized Tagalog labels and live counts.

- [x] **Step 4: Verify**

Run `npm.cmd run lint`, `npm.cmd run build`, Impeccable layout detection, and `git diff --check`.

