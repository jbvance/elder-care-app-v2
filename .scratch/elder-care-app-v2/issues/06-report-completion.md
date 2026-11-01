# 06: Report an accepted responsibility completed

**What to build:** Report own accepted responsibility complete through normal navigation with author/time and safe retry; distinguish acknowledged backend success from failed delivery.

**Blocked by:** 05: Discover opportunities and accept responsibility (approved slice 5)

**Status:** ready-for-agent

**Approved slice:** 10. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 37, 40, 43, 46, 58, 62, 63. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0004, 0006, 0009. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Report own accepted responsibility complete through normal navigation with author/time and safe retry; distinguish acknowledged backend success from failed delivery.
- [ ] Check current reporting authority and responsibility state; deny unauthorized other-person reporting and duplicate lost-response submissions. Completion implies neither verification, medication ingestion nor need resolution; no required comment.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Test permitted and denied actions at the actual backend boundary, including direct requests, other arrangements, current revoked/restricted permissions and attempted privilege escalation where relevant. Never depend on interface hiding, stale token permissions or loading restricted fields into an otherwise accessible record.
- [ ] Exercise applicable simultaneous/materially stale actions and repeated submissions with deterministic outcomes, attribution and no unintended duplicate or silent overwrite. Use controlled transactions for consequential related changes.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

The bounded synthetic contract below and completion-relevant material-change rule are approved for implementation from committed Ticket 05 HEAD `fb2a129c063b94c6d4a0d7b4dab42324e2d53010`. Ticket 05 is sufficient technical foundation for this sequencing; its acceptance and all prior acceptance and live-use gates remain open. Independent review is required before a commit.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.

## Approved bounded execution contract (2026-11-01)

From **My accepted work**, the currently authorized performer can report their own accepted assistance responsibility complete with one clear action. Persist a separate report tied to that commitment, recording performer, reporter and authoritative server report time. Show backend-acknowledged reported completion in ordinary work navigation. Completion neither verifies the work nor resolves the need; fictional prescription pickup remains ordinary assistance and does not imply medication ingestion. No required comment or routine approval/confirmation round.

At the backend, recheck current session, scoped practical/reporting authority, accepted performer identity and responsibility state under appropriate locking. A first report binds to the accepted commitment and material responsibility terms opened by the Helper. If the commitment was canceled, replaced or materially changed before backend acceptance, reject stale intent and require review of current details. Loss of access is an authority denial. Unrelated display-name, comment or restricted-background changes do not make completion stale. Ticket 05 currently freezes accepted task, place, schedule and essential instructions; this rule does not import Ticket 12 change workflows.

Simultaneous and repeated attempts produce one report with unchanged attribution and time. A lost-response retry reuses captured arguments and operation ID and rechecks current access, without claiming success before acknowledgment. Give distinct recoverable uncertain, stale and definitive-denial outcomes. Keep current practical and restricted projections separate; no direct-RPC, old-token, cross-scope or other-person bypass.

Use one additive migration and focused actual-backend and UI/service tests for authorized and denied reporting, current restrictions, stale intent, races, duplicates, retry, attribution and no automatic resolution. Attempt focused Android observation if available. Ticket 07 express resolution, Ticket 12 changes/replacements, Ticket 13 corrections and Ticket 19 offline outbox remain separate. Keep the existing architecture, synthetic-only information, $0/month local development, dependency 05, approved slice 10, existing story assignments and all open acceptance/live-use gates. No staging, commit or push without independent review.
