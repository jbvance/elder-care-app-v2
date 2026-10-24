# 24: Protect retained information during access and session changes

**What to build:** Withdraw/limit access, sign out or change accounts without cross-account exposure, unauthorized uploads or silent destruction of pending reports.

**Blocked by:** 04: Apply scoped participation and information boundaries (approved slice 4); 19: Save completion offline and reconcile safely (approved slice 18); 23: Secure identity changes and recovery (approved slice 22)

**Status:** needs-info

**Approved slice:** 23. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 54, 62, 63, 66, 67, 70. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0002, 0004, 0005, 0009, 0010. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Withdraw/limit access, sign out or change accounts without cross-account exposure, unauthorized uploads or silent destruction of pending reports.
- [ ] Implement approved distinction between replaceable cache and protected unsent reports, retention/cleanup and rejected-report outcomes; verify restart, revocation during upload and key-loss/device scenarios.
- [ ] Preserve the approved Expo SQLite/SQLCipher and SecureStore-key architecture, anonymous/account isolation and secure failure behavior when keys are unavailable or invalid. Validate backup exclusions, reinstall, interrupted cleanup and actual iOS/Android persistence with no plaintext fallback or routine biometric burden. Preserve ticket 01's approved anonymous-draft lifecycle without automatic fixed-inactivity expiration and with cancel-or-discard warning on account transitions; do not reuse draft rules as an unsent-report deletion policy. Encryption cannot retrieve disconnected copies or prevent every already-unlocked-device exposure.
- [ ] Preserve coordination/history and explain disconnected limits. This extends backend revocation effective from slice 3, not its first implementation.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Test permitted and denied actions at the actual backend boundary, including direct requests, other arrangements, current revoked/restricted permissions and attempted privilege escalation where relevant. Never depend on interface hiding, stale token permissions or loading restricted fields into an otherwise accessible record.
- [ ] Exercise applicable simultaneous/materially stale actions and repeated submissions with deterministic outcomes, attribution and no unintended duplicate or silent overwrite. Use controlled transactions for consequential related changes.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

This is a published **draft**, not an executable ticket. Content review is pending; dependency completion alone does not authorize implementation.

Approve sign-out/account-switch/pending report lifecycle, access duration and revoked-report handling; not routine cache housekeeping.

Mobile storage architecture and anonymous-draft lifecycle are approved. For anonymous drafts, no automatic fixed-inactivity expiration is permitted in the initial MVP; ticket 01 defines explicit discard, acknowledged-association cleanup and cancel-or-discard account-transition behavior. Session policies and account-associated cache/pending-report lifecycle remain unresolved; do not extend the anonymous-draft decision to them.

Resolve only decisions required for this slice before marking it ready for implementation. Do not demand resolution of unrelated future-slice questions or reopen approved architecture.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.
