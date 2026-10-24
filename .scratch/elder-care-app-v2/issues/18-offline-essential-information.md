# 18: Retrieve essential responsibility information offline

**What to build:** Automatically retain previously available essential details for accepted responsibilities including authorized health instructions, not unrelated background or broad comment histories.

**Blocked by:** 02: Authenticate and retain a private arrangement (approved slice 2); 05: Discover opportunities and accept responsibility (approved slice 5)

**Status:** needs-info

**Approved slice:** 17. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 21, 49, 50, 62, 63, 66. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0001, 0002, 0004, 0005, 0010. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Automatically retain previously available essential details for accepted responsibilities including authorized health instructions, not unrelated background or broad comment histories.
- [ ] Use ordinary navigation while disconnected, show potentially stale/unavailable data unobtrusively and never imply guaranteed currency.
- [ ] Protect local persistence/account isolation/keys; verify actual iOS/Android encryption and backup/key-failure behavior. No general replication.
- [ ] Use the approved mobile Expo SQLite/SQLCipher store with securely generated keys protected by Expo SecureStore, following ticket 01's supported SDK 58 configuration, Continuous Native Generation, native cipher-presence check and fail-secure behavior. Validate actual iOS/Android encryption/persistence, backup exclusions, missing/invalid keys, interrupted writes and reinstall/recovery limits. No plaintext fallback, sensitive logging or mandatory biometrics for ordinary use. Expo Go/web cannot verify SQLCipher protection; synthetic browser checks do not authorize sensitive persistence.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Test permitted and denied actions at the actual backend boundary, including direct requests, other arrangements, current revoked/restricted permissions and attempted privilege escalation where relevant. Never depend on interface hiding, stale token permissions or loading restricted fields into an otherwise accessible record.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

This is a published **draft**, not an executable ticket. Content review is pending; dependency completion alone does not authorize implementation.

Expo SQLite with SQLCipher and SecureStore-protected securely generated keys is the approved mobile local storage architecture. Remaining review covers consequential key/backup lifecycle details, cache freshness/access duration and cleanup baseline; detailed policies are not implied by the storage selection. Preserve account isolation and already-unlocked-device limitations.

Resolve only decisions required for this slice before marking it ready for implementation. Do not demand resolution of unrelated future-slice questions or reopen approved architecture.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.
