# Grainy and supporting application audit — 2026-09-12

Scope: code review of Grainy's prompt, response pipeline, FAQ integration, Google authentication, usage routing and speech; cross-checks against registration, profile, sidebar, farmer/business/logistics and loan workflows, moisture classification, and PHP persistence. This is not a completed security certification or a browser test of every workflow.

## Addressed

- The fallback had four broad keyword branches, no loan response, and treated dryer questions as moisture questions. Replaced it with role-aware English/Filipino product help and exact FAQ matching.
- Product instructions described older registration roles and sidebar labels. Updated Agricultural Business navigation, selected-service requirements, capability approvals and mandatory fresh PalaySense readings.
- The AI did not receive the FAQ content displayed alongside it. Included bounded FAQ reference data in its prompt, with an explicit instruction to treat it as reference content rather than instructions.
- Raised the response budget from 300 to 650 tokens to give multistep answers room; concise-answer instructions remain.
- Removed the unnecessary call to the PHP chat endpoint that always returns HTTP 501. Local help is labeled separately from AI output.
- Usage routing failures previously defaulted to a remote model even if verification failed. They now fall back to local help.
- Removed the user's name from the system prompt. No passwords, documents, database exports, private records or credentials were added to AI knowledge.

## Remaining findings

- High priority: GET /api/db calls loadDatabase without checking the session and returns stored collection JSON, including users. Review the initial-load architecture and implement server-side, role-scoped responses before exposing this app publicly. Do not feed this data to Grainy.
- High priority: /api/db/sync authenticates callers but non-admin requests can still replace shared collections. Filtering only users/settings is not record-ownership authorization. Replace global collection writes with authorized record operations.
- Persistence deletes and reinserts collections, risking stale-client overwrites. Use record-level mutations and concurrency checks.
- Grainy is authorized through the signed-in KAWING account. Live AI quality still depends on provider availability and authorization; local help is deterministic, not a full language model.
- Daily usage counts attempts before AI completion. The counter does not measure successful answers or enforce external provider access outside the app.
- Grainy has no live record or sensor access. It must not invent current bids, loan status, prices or device measurements.
- Local help routes known topics but does not reason across arbitrary follow-ups or multiple intents. The AI uses recent conversation when available.
- FAQ prose can drift from workflows. Maintain FAQ content alongside feature changes and verify agricultural claims separately; this audit checks product behavior, not external agronomic evidence.

## Validation

Follow-up improvements: the prompt now includes reviewed end-to-end workflow guidance, the active sidebar label, and a whitelist of capability flags. FAQ references are selected by question relevance across the full FAQ list, with English/Filipino terminology normalization. The AI receives up to 16 recent messages excluding local fallbacks, so repeated fallback text does not teach it an incorrect conversational pattern. Responses distinguish a daily limit from an unavailable/unverified provider. Account switches reset the conversation. Context/retrieval/privacy checks are available through `node tests/grainy-context.cjs`. This is runtime grounding, not model training or proof of live model answer quality.

- TypeScript check: npm.cmd run lint.
- Deterministic help regression checks: node tests/grainy-help.cjs.
- Production build: npm.cmd run build.
- Live Google/Puter account interaction and subjective model-answer evaluation still need an authenticated browser session; no sign-in or model-quality success is claimed from static checks.
