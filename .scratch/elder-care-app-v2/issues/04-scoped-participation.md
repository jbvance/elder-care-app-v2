# 04: Apply scoped participation and information boundaries

**What to build:** Demonstrate Helper/Coordinator defaults and separately controlled management, restricted access, audience/disclosure, cancellation and resolution powers within independent older-adult scopes.

**Blocked by:** 03: Authorize collaboration and join by invitation (approved slice 3)

**Status:** ready-for-agent

**Approved slice:** 4. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 6, 9, 10, 21, 23, 24, 62, 63, 67. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0003, 0004, 0005, 0006, 0007, 0008. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Demonstrate Helper/Coordinator defaults and separately controlled management, restricted access, audience/disclosure, cancellation and resolution powers within independent older-adult scopes.
- [ ] Authorized management can change involvement within delegation; others suggest helpers without access. Deny self-escalation, over-delegation, restricted-field leakage and cross-arrangement requests at real backend boundaries.
- [ ] Make audiences understandable without per-field classification or automatic sensitive-text detection. Maintain current-permission/revocation enforcement already present in slice 3.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Test permitted and denied actions at the actual backend boundary, including direct requests, other arrangements, current revoked/restricted permissions and attempted privilege escalation where relevant. Never depend on interface hiding, stale token permissions or loading restricted fields into an otherwise accessible record.
- [ ] Exercise applicable simultaneous/materially stale actions and repeated submissions with deterministic outcomes, attribution and no unintended duplicate or silent overwrite. Use controlled transactions for consequential related changes.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

The user approved the focused execution contract and explicitly authorized bounded synthetic implementation on 2026-10-28 from `ff23eff682cb821bf31136702d7111cc0004a718`. The content gate is resolved. Ticket 03 satisfies the technical dependency for this sequencing only; tickets 01/02/03 acceptance and live-use gates remain open. No staging, commit, push or ticket 05 work is authorized.

No new authorization model approval is required. Implement the approved concrete authorization contract; raise only a consequential gap discovered while representing its boundaries.

Resolve only decisions required for this slice before marking it ready for implementation. Do not demand resolution of unrelated future-slice questions or reopen approved architecture.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.

## Approved execution contract (2026-10-28)

Deliver recognizable scoped participation changes, Helper/Coordinator defaults, suggestions without grants, explicit direct/reported authorization and separate management/onward-delegation, restricted-read, practical-disclosure, cancellation and resolution capabilities. Retain existing narrow ticket 03 rights and restrictions; neither ownership nor a preset creates additional authority. New statements cannot restore restrictions or confer rights outside established authorization.

Use simple contextual controls, actual grant mutations and separate practical/restricted reads. Show the effect of audience changes on existing content. Coordinator resolution is the approved scoped default; cancellation, management, onward delegation, restricted access and external disclosure remain distinct. Existing invitation email matching, stable joined identity, expiry/replacement, removal and replay protections remain mandatory.

Record/display future cancellation/resolution authority without dummy execution endpoints. No acceptance, scheduling, completion, actual commitment cancellation, express resolution, full comments, external exports, recurrence, notifications or shared offline cache. Later tickets must test their real execution checks.

Test multiple participants, arrangements and need scopes at actual backend RPCs; no automatic migration broadening, self-escalation or over-delegation; immediate current-token restrictions; safe retries and serialized stale/racing mutations. Keep UI/backend/native evidence separate. Preserve attribution, independent unaffected access, synthetic data, existing Supabase/mobile architecture and $0/month development. Acceptance remains unverified pending evidence and independent review.
