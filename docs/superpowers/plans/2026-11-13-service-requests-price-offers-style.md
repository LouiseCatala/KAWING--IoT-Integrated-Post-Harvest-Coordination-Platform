# Service Requests Price Offers Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle My Service Requests to match Price Offers Received without changing behavior.

**Architecture:** Modify only the directory view JSX in `FarmerDashboard.tsx`. Reuse the existing Price Offers layout and Tailwind patterns while retaining the current request data and state.

**Tech Stack:** React 19, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-11-13-service-requests-price-offers-style-design.md`

## Global Constraints

- No workflow or backend changes.
- No gradients.
- Preserve Posted Requests and Accepted Services behavior.

## Review Focus

- Header actions remain usable on mobile.
- Tab state and counts remain correct.
- Long locations and provider names do not overflow.
- Empty states match both themes.
- Request cards retain all currently visible information.

---

### Task 1: Match the Price Offers visual system

**Files:**
- Modify: `src/components/FarmerDashboard.tsx`

- [x] Hide the generic header for the directory tab and add the matching emerald title card.
- [x] Restyle the view selector to match the Price Offers tab bar.
- [x] Restyle request cards and empty states using the same surface hierarchy.
- [x] Run TypeScript, production build, Impeccable layout detection, and diff checks.

