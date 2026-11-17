# Service Fulfillment Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement safe service cancellation, fulfillment, completed views, notifications, and mutual ratings.

**Architecture:** Preserve the existing `ServiceRequest` record as the source of truth. Enforce all status transitions and participant authorization in PHP, then reflect the states in Buyer and Farmer dashboards. Store service ratings separately from harvest-offer ratings.

**Tech Stack:** React 19, TypeScript, PHP, MySQL

**Spec:** `docs/specs/2026-11-13-service-fulfillment-workflow-design.md`

## Global Constraints

- Only the assigned provider may cancel or fulfill.
- Cancellation returns the request to Available Jobs.
- Fulfillment never changes the farmer's harvest record.
- Ratings are database-backed and limited to completed-service participants.

## Review Focus

- Concurrent accepts result in only one assigned provider.
- Cancellation clears every assignment timestamp and field.
- Unassigned providers cannot cancel or fulfill.
- Fulfillment does not modify harvest ownership data.
- Each participant can rate only once after completion.

---

### Task 1: Harden lifecycle transitions

- [x] Add cancellation and fulfillment timestamps and callbacks.
- [x] Enforce transitions and participant authorization on the server.
- [x] Remove the unauthorized harvest update from fulfillment.

### Task 2: Update service booking interfaces

- [x] Add Cancel beside Mark Fulfilled for matched buyer bookings.
- [x] Add Farmer Completed view and remove completed requests from Accepted Services.

### Task 3: Add service ratings

- [x] Create database-backed service ratings.
- [x] Reuse the star rating component for completed service participants.
- [x] Verify TypeScript, PHP, tests, build, and layout checks.

