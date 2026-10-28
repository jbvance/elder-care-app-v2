# 03: Authorize collaboration and join by invitation

**What to build:** Record direct versus reported permission with author/time/scope and applicable delegation without claiming verified legal consent; invite a designated recipient and navigate to the authorized prompting request after explicit joining.

**Blocked by:** 02: Authenticate and retain a private arrangement (approved slice 2). Its committed foundation at `36a058268c387df0947ddca9437359a31d1da28d` is accepted for bounded synthetic implementation sequencing only; ticket 01/02 acceptance remains incomplete (see sequencing decision below).

**Status:** ready-for-agent

**Approved slice:** 3. Filename numbers follow dependency order; approved slice IDs remain unchanged.

**Story coverage:** 6, 7, 8, 9, 11, 12, 13, 62, 63, 67. These are implementation/evaluation assignments, not evidence of completion. Stories 62–63 apply throughout; the review index records primary and cross-cutting coverage.

**Contracts:** Approved requirements and technical specification, including the concrete authorization contract; ADRs 0001, 0002, 0003, 0004, 0006. Respect all earlier ADRs where shared behavior applies.

## Acceptance criteria

- [ ] Record direct versus reported permission with author/time/scope and applicable delegation without claiming verified legal consent; invite a designated recipient and navigate to the authorized prompting request after explicit joining.
- [ ] Backend checks current identity, recipient, invitation and inviter authority; deny forwarded-link-only, expired/revoked/mismatched and unauthorized joins. Joining does not accept work.
- [ ] Establish cross-arrangement isolation and revoked/restricted-participant denial NOW, including previously issued-token direct requests. No dependency on later cleanup or dispute UI; invitations/previews expose minimal information.
- [ ] Match the designated email using established trimming/lowercasing only, with no alias/dot/plus-tag/domain equivalence. The backend requires the authenticated recipient's current confirmed Auth email; participation binds to the stable user ID. Deny forged client identity and stale-token-email substitutions. Mismatch recovery reveals only the user's own signed-in address and generic sign-in/new-invitation instructions.
- [ ] Enforce seven elapsed days from issuance using database time at locked redemption validation, with no automatic extension. Explicit replacement/resend invalidates the prior pending invitation for the same recipient and prompting scope. Issuance and redemption retries remain idempotent; concurrent submissions produce one attributable grant and no partial result.
- [ ] Require explicit authenticated atomic joining with current session, recipient, invitation, permission, delegation, scope and inviter-authority checks. Deny expired/revoked/replaced invitations, lost inviter authority, withdrawn or unshareable prompting needs and active participant restrictions. Authority restoration or old-link replay must not revive invalid invitations or revoked participation.
- [ ] Demonstrate the complete native local-device journey: Copy invitation link, open that copied link on the development device, retain the pending invitation through email-code sign-in, return to it and explicitly join. Opening the link and signing in alone neither redeem nor disclose private information. Preserve account separation, existing draft-transition safeguards and protected handling of pending link state without sensitive logs or plaintext persistence.
- [ ] Before successful joining, show generic invitation/sign-in/unavailable-link instructions only, with no older-adult name, need, place, inviter identity or designated address. After joining, show only the deliberately authorized practical summary of the prompting need, including authorized inviter/timing/place information; never expose the owner-private payload, restricted background or unrelated needs. State that no assistance responsibility has been accepted.
- [ ] Include only the authorized participant removal needed to demonstrate immediate loss of affected access. Deny unauthorized removal and verify denied reads/actions with previously issued tokens after removal while preserving unrelated authorized scopes. Keep broader participant management in ticket 04; do not add preset/scope editors or a general permission system.
- [ ] Deliver a demonstrable complete path through ordinary accessible user interaction, necessary backend enforcement and persistence, and focused observable tests; evaluation slices exercise delivered paths instead of implementing missing capabilities.
- [ ] Keep steps minimal: no unnecessary repeated entry, required comments, approval rounds or confirmations. Support readable scalable text, accessible controls/targets, nonsound status information, predictable navigation and recoverable input errors on iOS and Android.
- [ ] Test permitted and denied actions at the actual backend boundary, including direct requests, other arrangements, current revoked/restricted permissions and attempted privilege escalation where relevant. Never depend on interface hiding, stale token permissions or loading restricted fields into an otherwise accessible record.
- [ ] Exercise applicable simultaneous/materially stale actions and repeated submissions with deterministic outcomes, attribution and no unintended duplicate or silent overwrite. Use controlled transactions for consequential related changes.
- [ ] Preserve applicable information audiences across this slice's interface, backend, local data, logs, notifications and external outputs. Optional health information is protected by authorized context, never by automatic sensitive-text detection.
- [ ] Keep automated correctness/security tests distinct from observed human usability evidence. Prefer focused boundary/integration checks and minimal useful test seams over excessive mocks or infrastructure.

## Approval and execution gates

The user approved the invitation contract, scope clarifications and synthetic-development sequencing decision on 2026-10-28. The documented design/content gate is resolved and this ticket is ready-for-agent for the bounded synthetic scope. Readiness is not implementation authorization: do not begin features or invoke implementation without a separate explicit instruction.

Implement the approved [ADR 0003 execution contract](../../../docs/adr/0003-recipient-bound-invitations.md#approved-invitation-execution-contract-2026-10-28), including matching, expiry/replacement, revocation, retries and atomic joining. The approved initial direct/reported-permission and delegated-authority contract must be implemented, not reopened. Private ownership alone grants no sharing or participation-management authority.

## Approved execution scope and ticket boundaries

Use the existing Supabase Auth/PostgreSQL and protected mobile foundations. Copy invitation link is the delivery mechanism; use ordinary native navigation/link handling and the existing local-development/USB approach with fictional identities and Mailpit authentication. Production hosting, automatic invitation email, paid services and custom authentication infrastructure are outside this slice. Routine compatible link/route implementation choices are delegated; a developer-only direct RPC shortcut is not the required end-to-end demonstration.

The inviter makes the authorized practical disclosure clear in the ordinary invitation preparation flow, reusing existing need information without extra approval screens. The post-join prompting-request destination is a read-only view of that authorized need summary, not the private-owner arrangement record or a new task-acceptance workflow. Joining creates no assistance commitment, management authority, onward delegation or restricted-background access.

Ticket 03 supplies the narrow authorized participant-removal path needed for its own current-permission/revoked-token tests. Ticket 04 retains broader management of involvement, Helper/Coordinator defaults, preset/scope changes and separately controlled powers. Ticket 05 retains responsibility accept/decline/defer; scheduling and completion workflows are not imported here. Basic backend revocation cannot be postponed to ticket 04 or later cleanup/dispute interfaces.

Expiry of an already consumed invitation does not end valid participation. Pending-invitation revocation is distinct from participant removal. Existing participants retain only independently valid current authorization; inviter departure alone does not automatically remove prior invitees. Lost relevant authority invalidates pending invitations without revival, and a consumed invitation cannot restore removed access. Test replacement/removal/authority-loss races against redemption using controlled transactions.

## Approved synthetic-development sequencing (2026-10-28)

The user accepts ticket 02's committed foundation at `36a058268c387df0947ddca9437359a31d1da28d` as sufficiently delivered for bounded synthetic ticket 03 development: email-code authentication, protected retained sessions, owner-private arrangements, deliberate draft association, current-device sign-out and tested backend ownership/session enforcement. See [implementation evidence](../../../docs/ticket02-implementation-checkpoint.md) and [Android validation/closeout](../../../docs/ticket02-native-android-validation.md).

This satisfies the ticket 02 dependency for implementation sequencing only; neither ticket 01 nor ticket 02 is fully accepted. Outstanding iOS/native failure/recovery, interrupted operations, backup/transfer/reinstall, replacement-device, accessibility/usability and dependency/release-security checks remain open. Preserve the US$0/month development budget, fictional local identities, accepted synthetic-only local OTP verification-throttling limitation and deferred hosted inactivity verification. Effective verification throttling and all applicable privacy/legal/vendor-contract, production delivery, operational and explicit readiness gates remain mandatory before real-information/live-family use. No custom limiter or inactivity framework is authorized.

Ticket 03 must deliver its own current authorization, isolation, revocation and atomic invitation protections. Its acceptance checks remain unchecked until demonstrated. This approval records readiness and sequencing only; feature implementation still requires a separate explicit instruction.

## Delegated implementation details

Codex may choose routine identifiers, compatible internal schema details/indexes, internal organization and focused tests within approved contracts. Verify current versioned documentation before using mobile/backend APIs. A choice affecting permission boundaries, identity recovery, protected-data lifecycle or other consequential behavior must be brought back for approval. No general permission framework, workflow engine or replication system.

## Real-information and live-use gates

Synthetic care information only until applicable legal/privacy/security and vendor contractual suitability have been validated. Ordinary Supabase hosting is not represented as HIPAA compliant or automatically permitted to process consumer health information. Written Supabase suitability confirmation and applicable HIPAA, FTC and state-law evaluation remain required. Real participant contact/authentication data also requires appropriate handling; synthetic-care testing is not a blanket exemption for real personal data.

Live-family use additionally requires validated authorization/review support, retention/deletion and incident/support procedures, security/reliability checks, material-usability fixes and explicit readiness approval. These gates do not require production configuration for this synthetic slice. Representative support remains conditional, never an unsupported assertion of authority.

## Comments

Drafted following the approved breakdown and installed to-tickets publication stage. No implementation authorization or source-baseline change.

2026-10-28: The user approved ADR 0003's concrete invitation contract, minimal participant removal, complete copied-link/sign-in/explicit-join demonstration and ticket 02 foundation sequencing. Status is now ready-for-agent; the historical draft/content gate is superseded. No feature implementation, completion declaration or commit is authorized by this documentation update.
