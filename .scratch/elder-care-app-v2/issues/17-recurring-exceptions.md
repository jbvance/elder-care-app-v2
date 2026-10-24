# 17: Handle recurring exceptions and generation catch-up

**What to build:** Record attributed recurring outside agreements and this-occurrence exceptions/replacement without altering future coverage; show remaining assistance gaps.

**Blocked by:** 09: Record assistance agreed and completed outside the app (approved slice 6); 12: Change plans and arrange replacements (approved slice 9); 06: Report an accepted responsibility completed (approved slice 10); 16: Establish recurring arrangements and commitments (approved slice 15)

**Status:** needs-info

**Approved slice:** 16. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 32, 34, 35, 36, 57, 61, 62, 63. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0004, 0009, 0011. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Record attributed recurring outside agreements and this-occurrence exceptions/replacement without altering future coverage; show remaining assistance gaps.
- [ ] One-occurrence/future changes preserve history and exceptions and cannot silently expand agreement. Extend duplicate-safely and catch up after inactivity/failure without relying solely on mobile opening.
- [ ] Integrate completion/resolution and stable offline references as available; one occurrence's resolution does not end the series.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Test permitted and denied actions at the actual backend boundary, including direct requests, other arrangements, current revoked/restricted permissions and attempted privilege escalation where relevant. Never depend on interface hiding, stale token permissions or loading restricted fields into an otherwise accessible record.
- [ ] Exercise applicable simultaneous/materially stale actions and repeated submissions with deterministic outcomes, attribution and no unintended duplicate or silent overwrite. Use controlled transactions for consequential related changes.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

This is a published **draft**, not an executable ticket. Content review is pending; dependency completion alone does not authorize implementation.

Approve renewed-agreement thresholds, remaining future-edit and catch-up/time-edge behavior; select no unapproved recurrence library or scheduler.

Resolve only decisions required for this slice before marking it ready for implementation. Do not demand resolution of unrelated future-slice questions or reopen approved architecture.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.
