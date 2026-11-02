# 07: Expressly resolve a need

**What to build:** Use one intuitive explicit resolution or authorized combined completion/resolution action with atomic intended outcomes; completion of one or all responsibilities never auto-resolves.

**Blocked by:** 06: Report an accepted responsibility completed (approved slice 10)

**Status:** ready-for-agent

**Approved slice:** 11. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 39, 40, 41, 43, 46, 62, 63. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0004, 0006, 0009. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Use one intuitive explicit resolution or authorized combined completion/resolution action with atomic intended outcomes; completion of one or all responsibilities never auto-resolves.
- [ ] Show authorized outstanding work and follow-up on the need itself; resolution grants no cancellation power and cannot silently dismiss commitments. Stop misleading new solicitation without erasing history.
- [ ] Test current permission, concurrent material changes, duplicate retries and unauthorized resolution. Normal app navigation completes the early journey; dashboard/multi-part/replacement flows extend it later.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Test permitted and denied actions at the actual backend boundary, including direct requests, other arrangements, current revoked/restricted permissions and attempted privilege escalation where relevant. Never depend on interface hiding, stale token permissions or loading restricted fields into an otherwise accessible record.
- [ ] Exercise applicable simultaneous/materially stale actions and repeated submissions with deterministic outcomes, attribution and no unintended duplicate or silent overwrite. Use controlled transactions for consequential related changes.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

The bounded synthetic contract below and its resolved-opportunity, stale-intent, and outstanding-work rules were approved from committed Ticket 06 HEAD `820909fe3b6ac69d37af9a941a7a1433b06b114b`. Ticket 06 is sufficient technical foundation for this sequencing; Ticket 06 and earlier acceptance and all live-use gates remain open. This documentation finalization does not begin implementation. Independent review is required before any commit.

Reopening and attributed correction belong to Ticket 13. Whether a later corrected need's old opportunity becomes available again is a Ticket 13 decision, not a Ticket 07 prerequisite. Do not reopen approved contextual resolution, authority, or first-valid acceptance decisions.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.

## Approved bounded execution contract (2026-11-01)

From ordinary signed-in needs and accepted-work navigation, let a participant with current need-resolution authority expressly report a genuinely addressed need resolved. Show the need's accepted and reported-complete facts and any outstanding responsibility before action. With no outstanding work, use one plain action without another confirmation or required comment. With outstanding work, give concise context and permit authorized resolution without implying that the responsibility was completed, canceled, dismissed, or independently verified. Show attributable resolver and authoritative server time. Project explicit resolved status labels in ordinary list and detail views so “Available,” “Previously declined,” and “unresolved” never misdescribe a resolved target need. Completion of one or all responsibilities never automatically resolves the need.

Enforce current session, care-relationship and need scope, applicable practical audience and older-adult preferences, and the distinct `resolve` capability at the backend. A Coordinator acts only within authorized coordination scope; a Helper requires specific limited resolution delegation. Completion, participation management, family status, or an old token does not grant resolution or cancellation authority. Keep restricted background out of practical projections. Maintain authoritative current resolution plus concise immutable attributable resolution history; later Ticket 13 correction must append history and preserve the original resolver and server time. Preserve request and audience history, accepted commitments, completion reports, performers, reporters, and timestamps.

On a resolved target need, block backend first-request creation, new offers, new acceptance, and new decline/defer responses, including direct calls, stale screens, and retries whose operations did not commit before resolution. Suppress misleading available/reconsider actions in the interface. A prior successful creation, offer, acceptance, or response may return its historical receipt only after current authorization is checked; it must not create or present a new solicitation or commitment. Keep the resolved need and its history readable within current authorization. Resolution of a root need does not by itself prohibit a distinct sibling need. Ticket 07 has no reopening action; Ticket 13 owns attributed correction and any later reactivation policy.

Keep accepted work left outstanding after resolution visible on the need and in My accepted work. Its accepted performer can still report completion under current authorization, commitment identity, and material-responsibility checks. Resolution alone changes neither the commitment nor its material responsibility revision; use separate resolution state/version or an equivalent target-specific control so resolution does not permanently make a valid first completion report stale. A genuinely changed commitment or responsibility still requires current-detail review under Ticket 06's rule. Do not silently cancel or finish any other work.

Serialize consequential changes in controlled transactions. Check first resolution intent against relevant material state of the target need as opened: request terms, solicitation availability, accepted commitment identities, and completion/report statuses. Reject a materially outdated first resolution or combined action with a clear current-detail review path. Check current authorization separately at execution and before disclosing a retry receipt; loss of access is an authority denial. Unrelated sibling changes, display-name edits, comments, and restricted-background edits alone do not make resolution stale. An already-resolved outcome must not replace the original resolver or time. An uncertain transport result retains the same arguments and operation ID for duplicate-safe retry and is not shown as shared before backend acknowledgment. No offline resolution queue.

When the accepted performer also has current resolution authority, offer a clear combined completion-and-express-resolution action alongside completion-only. Record both intended outcomes atomically after both permissions, commitment identity, material terms, target resolution state, and outstanding-work context pass; if either part fails, create neither new outcome. Preserve earlier completion attribution and time; after completion-only, offer express resolution alone. Do not add a required approval round or comment.

Verify actual-backend positive and denied resolution, current restriction/revocation and cross-arrangement boundaries, Helper without delegation, cancellation separation, target material races and unrelated-sibling nonconflict, resolved first-request/offer/accept/decline/defer denial, authorized historical receipts, post-resolution accepted-work visibility/reporting, duplicate retries, retained history, and combined atomicity. Add focused service/screen checks for ordinary navigation, clear status/follow-up, uncertain retry, stale review, and access denial. Attempt focused physical Android observation if available, reported separately from scripted tests and human usability acceptance. Keep Ticket 10 expanded attention, Ticket 12 plan changes/replacement, Ticket 13 correction/reopening, Ticket 19 offline completion, and later notifications in their assigned slices. Preserve synthetic-only information, $0/month local development, approved architecture, and every open acceptance and live-use gate. No staging, commit, or push from this documentation task.
