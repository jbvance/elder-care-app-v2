# Step 20: Draft implementation tickets for review

Status: needs-info

## Workflow and authority

Installed Matt Pocock to-tickets steps 1–4 are complete: gather context, draft vertical slices, review and approve the revised breakdown. Step 5 has published one ticket per approved slice using the local tracker template, numbered in dependency order. Tickets 01–03 are ready-for-agent following explicit user approval for their bounded synthetic scopes; tickets 04–28 remain needs-info pending review and applicable approvals. The overall needs-info status reflects those remaining draft tickets. Ticket 01/02 acceptance remains incomplete and ticket 02 retains a deferred hosted-environment acceptance gate. Ticket 03's design gate and foundation sequencing are resolved in the 2026-10-28 transition checkpoint below. Readiness does not authorize implementation. No feature implementation or commit is authorized by this update.

The 28 slices, approved dependencies and source baseline are unchanged. Filename numbers differ from stable approved slice IDs, retained in every body. No merges, splits or additional infrastructure tickets were introduced. The approved requirements, specification including concrete authorization contract, glossary and ADRs 0001–0011 remain authoritative.

## Sequence and dependencies

| Ticket and delivery | Approved slice | Blocking ticket numbers |
| --- | --- | --- |
| [01: Explore and prepare one private need](issues/01-private-need.md) | 1 | None |
| [02: Authenticate and retain a private arrangement](issues/02-authenticate-private-arrangement.md) | 2 | 01 |
| [03: Authorize collaboration and join by invitation](issues/03-permission-and-invitation.md) | 3 | 02 |
| [04: Apply scoped participation and information boundaries](issues/04-scoped-participation.md) | 4 | 03 |
| [05: Discover opportunities and accept responsibility](issues/05-discover-and-accept.md) | 5 | 04 |
| [06: Report an accepted responsibility completed](issues/06-report-completion.md) | 10 | 05 |
| [07: Expressly resolve a need](issues/07-express-resolution.md) | 11 | 06 |
| [08: Evaluate the first complete synthetic journey](issues/08-initial-synthetic-usability.md) | 27 | 07 |
| [09: Record assistance agreed and completed outside the app](issues/09-outside-helper-assistance.md) | 6 | 05, 06 |
| [10: Understand what needs attention](issues/10-attention-overview.md) | 7 | 05 |
| [11: Coordinate separate contributions](issues/11-separate-contributions.md) | 8 | 05 |
| [12: Change plans and arrange replacements](issues/12-plan-changes.md) | 9 | 05 |
| [13: Correct or question completion and resolution](issues/13-correct-reports.md) | 12 | 07 |
| [14: Respect declined assistance and changed preferences](issues/14-declined-assistance.md) | 13 | 12 |
| [15: Maintain practical information and contextual comments](issues/15-information-and-comments.md) | 14 | 04 |
| [16: Establish recurring arrangements and commitments](issues/16-recurring-arrangement.md) | 15 | 05 |
| [17: Handle recurring exceptions and generation catch-up](issues/17-recurring-exceptions.md) | 16 | 09, 12, 06, 16 |
| [18: Retrieve essential responsibility information offline](issues/18-offline-essential-information.md) | 17 | 02, 05 |
| [19: Save completion offline and reconcile safely](issues/19-offline-completion.md) | 18 | 12, 06, 18 |
| [20: Review and share practical summaries](issues/20-external-sharing.md) | 19 | 04, 05 |
| [21: Notify participants of requests and consequential changes](issues/21-targeted-notifications.md) | 20 | 05, 12 |
| [22: Deliver responsibility reminders](issues/22-responsibility-reminders.md) | 21 | 17, 21 |
| [23: Secure identity changes and recovery](issues/23-identity-recovery.md) | 22 | 02 |
| [24: Protect retained information during access and session changes](issues/24-access-and-local-cleanup.md) | 23 | 04, 19, 23 |
| [25: Report authorization concerns and apply restrictions](issues/25-authorization-concerns.md) | 24 | 04, 12, 24 |
| [26: Close arrangements and request deletion](issues/26-closure-and-deletion.md) | 25 | 06, 24 |
| [27: Establish supported representative-based coordination](issues/27-representative-authorization.md) | 26 | 03, 25 |
| [28: Validate integrated MVP and authorize live-family pilot](issues/28-integrated-readiness-and-pilot.md) | 28 | 10, 11, 13, 14, 15, 17, 19, 20, 21, 22, 25, 26, 08; 27 if representative scenarios supported |

Ticket 27 implements conditional representative support; ticket 28 additionally depends on it for representative-based live scenarios. Explicit user approval of narrower supported launch scenarios is the alternative, not silent omission.

Early complete coordination: **01 → 02 → 03 → 04 → 05 → 06 → 07**, followed by **08** for observed synthetic usability. This preserves approved slices **1 → 2 → 3 → 4 → 5 → 10 → 11**, followed by slice **27**. Ordinary reachable screens support recording a need, authorized opportunity discovery, acceptance, reported completion and express authorized resolution. Developer-only shortcuts are insufficient.

Ticket 05 includes minimal normal navigation and scheduled-time handling. Ticket 06 supplies own completion without outside-helper reporting; ticket 07 enforces resolution without requiring later multi-part, replacement or full attention-view editors. Ticket 10 expands attention views. Every later slice adds its own relevant status and tests rather than deferring them to integration. Early returning-participant observations use the minimal journey, with targeted retesting after richer attention behavior arrives.

## Foundational protection

Ticket 02 establishes private-owner isolation and secure authenticated access. Ticket 03 establishes current backend permission checks, cross-arrangement isolation and effective participant revocation, including requests using previously issued tokens. Tickets 04–07 enforce scoped authority, restricted information, eligible acceptance, completion and resolution with positive/negative direct-backend and concurrent-action tests.

Ticket 24 (approved slice 23) extends session/cache/pending-report cleanup; it does not introduce basic backend revocation for the first time. Ticket 25 provides the fuller authorization-concern workflow; missing that interface never excuses earlier unauthorized backend access.

Ticket 03 includes only the authorized participant removal needed to demonstrate immediate loss of affected access with previously issued tokens. Ticket 04 retains broader participation management, preset/scope changes and separately controlled powers. The narrow removal path does not move that broader interface or a general permissions editor into ticket 03.

## Explicit story coverage

Assignments are delivery responsibilities, not evidence of completion. Broad stories span multiple tickets. Evaluation and release tickets verify capabilities delivered elsewhere rather than substitute for their implementation.

| Approved story | Delivery/evaluation ticket numbers |
| --- | --- |
| 1 | 01, 08 |
| 2 | 01, 08 |
| 3 | 01 |
| 4 | 01, 02 |
| 5 | 01, 02 |
| 6 | 03, 04, 14, 25, 27 |
| 7 | 03 |
| 8 | 03 |
| 9 | 03, 04 |
| 10 | 04 |
| 11 | 03, 08 |
| 12 | 03 |
| 13 | 03, 05 |
| 14 | 05, 08 |
| 15 | 05 |
| 16 | 09 |
| 17 | 09 |
| 18 | 11 |
| 19 | 11 |
| 20 | 11 |
| 21 | 04, 05, 18 |
| 22 | 10 |
| 23 | 04, 05, 10 |
| 24 | 04, 10 |
| 25 | 10 |
| 26 | 12 |
| 27 | 12 |
| 28 | 14 |
| 29 | 14 |
| 30 | 14 |
| 31 | 16 |
| 32 | 17 |
| 33 | 16 |
| 34 | 17 |
| 35 | 17 |
| 36 | 17 |
| 37 | 06, 08 |
| 38 | 09 |
| 39 | 07, 08 |
| 40 | 06, 07, 08 |
| 41 | 07, 08, 11 |
| 42 | 13 |
| 43 | 06, 07, 09, 13 |
| 44 | 15 |
| 45 | 10, 15 |
| 46 | 06, 07, 15 |
| 47 | 15 |
| 48 | 13, 15 |
| 49 | 18 |
| 50 | 18 |
| 51 | 19 |
| 52 | 19 |
| 53 | 19 |
| 54 | 19, 24 |
| 55 | 20 |
| 56 | 20 |
| 57 | 05, 09, 16, 17, 22 |
| 58 | 06, 09 |
| 59 | 21, 22 |
| 60 | 21, 22 |
| 61 | 01, 05, 16, 17, 22 |
| 62 | All tickets; 08 and 28 evaluate evidence |
| 63 | All tickets; 08 and 28 evaluate evidence |
| 64 | 02, 23 |
| 65 | 12, 23 |
| 66 | 02, 18, 21, 23, 24 |
| 67 | 03, 04, 24, 25 |
| 68 | 25 |
| 69 | 27 |
| 70 | 24, 26 |
| 71 | 26 |
| 72 | 08, 28 |

Stories 62–63 apply to every relevant interaction and have explicit criteria in every ticket. Automated correctness/security evidence is distinct from observed human usability. Medication assistance is ordinary coordination, reporting, recurrence and reminders across 05, 06, 09, 16, 17 and 22, not a separate clinical subsystem. Authoritative scheduling/time zones begin with initial timed needs and continue through recurrence and reminders.

## Consequential decision timing

1. **Ticket 01 is approved and ready-for-agent:** private-draft product behavior, SQLCipher/SecureStore protection and anonymous-draft lifecycle are settled. Preserve ordinary same-device restart durability, deliberate association without implied sharing, no fixed-inactivity draft expiration, obvious discard, cancel-or-discard account-transition warning, and redundant-copy cleanup only after acknowledged duplicate-safe persistence. Preserve all native encryption/security, accessibility, backup/recovery and live-data gates in the ticket. Actual iOS/Android validation is an implementation acceptance requirement. This status does not authorize starting implementation. Ticket 02 supplies authenticated association/session-transition integration; never-associated drafts have no cross-device recovery guarantee, and unsent reports have a separate lifecycle.
2. **Ticket 02 is approved and ready-for-agent for no-cost synthetic implementation:** preserve complete SQLCipher-protected sessions/SecureStore keys, ten-minute codes, minimum sixty-second resends and server-side abuse controls, one-hour access-token starting default, foreground refresh, current-device scoped sign-out, reauthenticated other-session revocation and tested current backend session/arrangement permissions including stale-token reads/writes. The Supabase development budget is US$0/month; use local Supabase and/or Cloud Free where appropriate. No Pro activation, paid purchase or production configuration is authorized. The intended 30-day successful-refresh-based inactivity policy remains, but its Pro-only hosted configuration and final verification are explicitly deferred until a suitable paid environment is approved. No custom timeout infrastructure. Local documentation exposes auth.sessions.inactivity_timeout for representative no-cost testing; verify support/behavior in actual CLI/Auth versions and record local evidence separately. Local/Cloud Free testing is not hosted acceptance; Cloud Free must not be described as enforcing the Pro-only timeout. Protected current-session/authorization enforcement is mandatory now, independently of paid inactivity settings. No additional substantive approval blocker is identified for synthetic scope; ticket 01 remains its protected-foundation prerequisite, sufficiently satisfied for synthetic implementation sequencing under the approved refinement below. Existing exceptional recovery/offline boundaries and all real-data/live gates remain. Reference: https://supabase.com/docs/guides/local-development/cli/config .
3. **Ticket 03 is approved and ready-for-agent for bounded synthetic scope:** Auth-compatible matching without alias equivalence, current confirmed recipient email/stable identity, seven-day invitations, explicit idempotent replacement and atomic joining are resolved in ADR 0003. Demonstrate copied-link opening on the development device, pending invitation retention through sign-in and explicit joining, with no private preview. Limit the destination to the deliberately authorized practical need summary and participant removal to enforcing immediate access loss. Broader management stays in ticket 04 and responsibility acceptance in ticket 05. Approved initial reported permission and explicit delegation are not reopened. Separate feature implementation authorization is still required.
4. **Tickets 06–07 and change extensions:** confirm uncovered material-change and resolved-opportunity/reopening details. Current authorization, first-valid acceptance, preserved outstanding commitments and contextual/combined express resolution are already approved.
5. **Later affected tickets:** localized review of recurrence/time edges, protected offline storage/lifecycle, sharing mechanism, notification timing/delivery, exceptional recovery, retention/review operations and conditional representative safeguards. These need not block unrelated synthetic development.

Each ticket distinguishes its approval gate, routine delegated choices and pre-real-information/live-use conditions. Needs-info means draft review remains pending, not that 28 new architectural decisions are required. Routine schema/index/identifier choices, internal organization and focused testing are delegated within approved contracts. Consequential permission, lifecycle or security tradeoffs still require review.

## Scope and launch safeguards

Preserve Helper/Coordinator only, consumer family coordination, one ordinary context per older adult, no family-status legal powers, no public marketplace, no comprehensive chat or sensitive-record repositories, no specialized medication-dose reminders/tracking/clinical monitoring, no enterprise administration, and no broad offline editing or offline need resolution. Avoid general replication, workflow engines, elaborate permission editors and per-arrangement schedulers.

Optional sensitive health information can be appropriate practical context. Authorized audiences, deliberate disclosure and meaningful separation from restricted information protect it; automatic text classification and row-level security on a record containing readable restricted fields are insufficient. All relevant notifications, local data, logs and sharing outputs must respect these boundaries.

Before real personal/health processing: written Supabase contractual suitability confirmation, applicable HIPAA/FTC/state and vendor obligations, and privacy/security validation. Consumer-only positioning is not categorical exemption and ordinary Supabase hosting is not claimed HIPAA compliant. Real participant contact/authentication data also requires appropriate handling; synthetic care data does not waive that duty.

Before live use: validated supported authorization/representative scenarios, realistic review/support/incident handling, retention/deletion/backup policies, production delivery safeguards, actual-device local-security validation, reliability/security checks and correction/retesting of material usability problems. Maintain fallback coordination and realistic reporting/pause routes. Synthetic development does not require premature production configuration.

Evaluation remains two-stage: approximately five individual synthetic sessions, 30–45 minutes, at least two participants with limited smartphone confidence; then approximately three real family arrangements over four weeks only after readiness approval. Observe independent completion, correct understanding and material problems; five-minute first-need and 30-second attention targets are diagnostic. Live outcomes are reduced effort, clear coordination, dependability and acceptable burden/trust, using brief baseline/closing and optional midpoint feedback. No rigid quotas, diaries, manufactured tasks or statistical claims. Features not encountered remain unevaluated in live use.

## Review checkpoint

The following review and 2026-10-27 transition record the earlier ticket 01/02 checkpoint. The approved ticket 03 transition below supersedes their readiness/authorization summary for the next slice while preserving their acceptance gates.

Tickets 01–02 are ready-for-agent for approved synthetic implementation scope, without authorization to begin implementation. No further product/security approval blocks starting that sequence; ticket 02 retains its ticket 01 protected-foundation dependency, now sufficiently satisfied for synthetic implementation sequencing only; ticket 01 acceptance remains incomplete. Supabase development budget is US$0/month. Ticket 02's deferred paid-hosted 30-day inactivity configuration/verification remains OPEN and must remain visible in completion/release evidence; local testing or delivery of the synthetic slice must not mark it satisfied. Revisit it when a suitable paid environment is explicitly approved, before relying on the intended timeout for live use. All native/runtime security tests, real-information contractual/privacy/legal gates, written Supabase suitability confirmation and operational/live-readiness conditions remain. Later offline retention/key-lifecycle gates stay against dependent tickets. The sequence table maps all 28 original slice identifiers to dependency-ordered filenames, and all 72 story assignments are preserved. The application should handle complexity so its users do not have to. No approved source document or application code was modified, no commit was created, and implement was not invoked.

### Approved transition checkpoint (2026-10-27)

[Ticket 01](issues/01-private-need.md#implementation-and-android-validation-checkpoint-2026-10-27) records the committed implementation and prior Android validation evidence, with native iOS and other outstanding acceptance checks explicitly open. Tickets 01 and 02 remain ready-for-agent. The user approves [ticket 02's sequencing refinement](issues/02-authenticate-private-arrangement.md#approved-implementation-sequencing-refinement-2026-10-27): its protected private-draft foundation dependency is retained and sufficiently satisfied for synthetic-data implementation using the delivered interfaces/core Android behavior, without declaring ticket 01 complete. Remaining ticket 01 checks must be completed before the relevant integrated feature or release is fully accepted. This refines the earlier completion prerequisite only; all 28 tickets, 72 story assignments, approved architecture, US$0 budget, deferred paid-hosted gate and launch requirements are preserved. This task authorizes only the three-file documentation checkpoint and its commit, without beginning implementation.

### Approved ticket 03 transition checkpoint (2026-10-28)

The user approves [ticket 03](issues/03-permission-and-invitation.md)'s invitation execution contract in [ADR 0003](../../docs/adr/0003-recipient-bound-invitations.md#approved-invitation-execution-contract-2026-10-28) and its scope clarifications. Ticket 03 is ready-for-agent; the prior recipient-matching/expiry/redemption content gate is resolved. Tickets 04–28 remain needs-info. The 28-ticket sequence, dependency edges and 72-story assignments are unchanged.

Ticket 02's committed foundation at `36a058268c387df0947ddca9437359a31d1da28d` is accepted for bounded synthetic ticket 03 sequencing only. Its delivered email-code authentication, protected retained sessions, private arrangements, deliberate association and sign-out, together with actual backend ownership/session tests and Android journey evidence, satisfy that foundation dependency for sequencing; they do not establish full ticket 01/02 acceptance. See [ticket 02 implementation checkpoint](../../docs/ticket02-implementation-checkpoint.md) and [Android validation/closeout](../../docs/ticket02-native-android-validation.md).

Ticket 03 must demonstrate the actual local-device Copy invitation link → open copied link → retain pending invitation through sign-in → explicit Join → authorized practical need summary path. Opening the link and authentication alone neither redeem nor disclose private information, and joining accepts no assistance responsibility. Only the minimal authorized removal needed to prove immediate revoked-participant denial belongs here; broader participant management remains in ticket 04. Current permission, delegation, scope, recipient, inviter authority and session checks, cross-arrangement isolation, stale-token denial and atomic redemption/retry/race tests are ticket 03 obligations now.

Preserve outstanding ticket 01/02 iOS/native failure/recovery, interrupted operations, backup/transfer/reinstall, replacement-device, accessibility/usability and dependency/release-security requirements. Preserve US$0/month development and fictional local identities, the accepted synthetic-only local OTP verification-throttling failure, deferred hosted inactivity verification and all real-information/live-use privacy/legal/contractual, production delivery, operational and explicit readiness gates. Effective server-side verification throttling remains mandatory before real-information/live-family use. No production hosting, automatic invitation email, paid services or custom authentication/inactivity infrastructure is included.

This approval resolves ticket 03's design and sequencing gates only. Its acceptance remains unverified, and feature implementation still requires a separate explicit instruction. This documentation task authorizes no application code, dependencies, migrations, staging, commit or push.
