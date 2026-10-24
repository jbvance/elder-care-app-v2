# 01: Explore and prepare one private need

**What to build:** Prepare minimal older-adult information, a real need and relevant timing through ordinary accessible navigation without authentication, invitations, assignments, extensive profiles or mandatory sensitive fields; exploration need not invent a task.

**Blocked by:** None. Ticket readiness does not authorize beginning implementation.

**Status:** ready-for-agent

**Approved slice:** 1. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 1, 2, 3, 4, 5, 61, 62, 63. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0001, 0005, 0008. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Timed needs retain an unambiguous local schedule and named reference zone; physical-location local time is ordinarily primary. Do not require a date or manual conversion for an untimed need.
- [ ] Prepare minimal older-adult information, a real need and relevant timing through ordinary accessible navigation without authentication, invitations, assignments, extensive profiles or mandatory sensitive fields; exploration need not invent a task.
- [ ] Show assistance not arranged, keep preparation private without implying consent, preserve input on errors/navigation and later identity transition.
- [ ] Without authentication, durably retain the private draft through ordinary application closure, restart and reopening on the same device. Protect optional sensitive consumer health information; never fall back to unprotected persistence.
- [ ] Keep the draft private until the user deliberately associates it with the authenticated account through a simple transition, ideally one clear action. Creating a draft or authenticating alone must not upload/disclose it, invite anyone or authorize sharing.
- [ ] Keep an otherwise valid unassociated draft until deliberate discard or successful account association; do not implement automatic fixed-inactivity expiration in the initial MVP. Provide an obvious, low-friction discard action. Ordinary closure is not abandonment. Preserve applicable retention/deletion review before real-information use; this is not a perpetual-retention guarantee.
- [ ] On explicit sign-out/account switching with an unassociated draft, provide a concise warning: cancel the account transition, or discard the draft and continue. Never silently transfer the draft into another account or expose account-owned information across accounts.
- [ ] Verify restart durability, interrupted saves, deliberate association, deletion and account-boundary behavior. Cross-device recovery of a never-associated draft is not required; do not promise recovery after uninstall, device loss or key loss.
- [ ] Use the SDK 58-compatible Expo SQLite SQLCipher configuration through supported Expo configuration while preserving Continuous Native Generation; do not hand-maintain generated native projects. Generate encryption keys securely using supported platform mechanisms and protect them with Expo SecureStore, without hardcoded keys or custom cryptography.
- [ ] Before any protected write, verify SQLCipher is actually present in the running native build; setting PRAGMA key alone is insufficient because it can silently do nothing without SQLCipher. Fail securely on unavailable encryption or missing/invalid keys, without plaintext persistence or sensitive diagnostic logging.
- [ ] Validate encryption and durable protected persistence in actual iOS and Android native development builds, including interrupted writes, backup exclusions, missing/invalid keys and reinstall/recovery limits. SQLCipher is unavailable in Expo Go and on web; synthetic-only browser checks do not verify native protection and must not introduce unprotected sensitive persistence.
- [ ] Keep anonymous drafts separate from account-associated information and avoid unnecessary retained copies. Address backup/key lifecycle deliberately; do not assume reinstall clears all platform secrets or restores usable drafts. Avoid mandatory biometric prompts for ordinary actions and explain that encryption alone does not prevent exposure on an already-unlocked shared device.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

The user approved finalization as ready-for-agent for synthetic-data implementation planning. This status records ticket readiness only; do not begin implementation or invoke implement without separate authorization. Historical draft-review comments below are superseded by this approval.

Approved product decision: unauthenticated private preparation survives ordinary same-device closure/restart, remains appropriately protected, and can be deliberately associated with the authenticated account with minimal effort. Neither preparation nor authentication authorizes sharing. No cross-device recovery of an unassociated draft is required. This approval does not select storage, encryption, key handling or cleanup implementation.

Subsequently approved local protection architecture: Expo SQLite with SQLCipher and securely generated database encryption keys protected by Expo SecureStore, for mobile iOS and Android. Apply the native-build, encryption-verification, isolation and failure safeguards above. This selects the storage architecture, not draft cleanup, authentication-session policies or implementation authorization. The earlier product-only approval did not itself select technology.

Approved anonymous-draft lifecycle:

Retain a valid draft until deliberate discard or successful account association, with no automatic fixed-inactivity expiration in the initial MVP. Provide an obvious discard action. Association is deliberate and simple, naming the destination account; retain the protected source until acknowledged account-private persistence succeeds, make retries duplicate-safe, then remove the redundant anonymous copy. On explicit sign-out/account switching with an unassociated draft, warn concisely and allow canceling the transition or discarding the draft and continuing. Never silently transfer content across accounts. Preserve encryption, secure key handling, backup restrictions and recovery limitations; no routine biometric prompts or claim of protection against another person using an already-unlocked device. Exclude unassociated drafts from device/cloud backup and do not promise physical erasure of previously copied data. Applicable retention/deletion review remains required before real-information use. This policy does not establish perpetual retention or govern future unsent completion reports.

Ticket boundary: ticket 01 delivers the complete unauthenticated local preparation/discard experience and the protected draft boundary. Actual authenticated association and session-change integration are delivered and tested in ticket 02, using this approved contract; they do not become reverse implementation dependencies for ticket 01. No shared backend or authentication is required merely to prepare a draft.

Readiness review: no remaining substantive product or architectural approval blocker is identified for ticket 01, and the user has approved its finalization as ready-for-agent. Native encryption, key/backup failure, restart durability, interrupted-write, accessibility and deletion tests remain implementation acceptance requirements. Pre-real-information/live-use gates remain mandatory; no implementation is authorized by this status update.

Resolve only decisions required for this slice before marking it ready for implementation. Do not demand resolution of unrelated future-slice questions or reopen approved architecture.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.

User approved the private-draft product behavior, including same-device restart durability, protected information, deliberate minimal-effort association, no implied sharing, safe lifecycle handling and no required cross-device recovery. Technical protection and cleanup choices remain proposals; status stays needs-info.

Subsequent user approval selects Expo SQLite with SQLCipher and SecureStore-protected securely generated keys, subject to the acceptance safeguards above. This supersedes the earlier statement that technical protection is only proposed. Draft cleanup, detailed session policies and implementation readiness remain unapproved; status stays needs-info.

Latest user approval settles anonymous-draft lifecycle as described above and rejects automatic fixed-inactivity draft expiration. This supersedes historical statements that draft cleanup is unapproved. Authentication-session policy remains separate. Recommend readiness after user ticket approval; do not change status or begin implementation automatically.

Latest ticket review: user explicitly approved ready-for-agent finalization for synthetic-data work. Status updated accordingly; all acceptance criteria and live-data gates remain. No implementation or implement invocation is authorized.
