# Ticket 04 synthetic implementation checkpoint — 2026-10-28

Independent-review handoff, not full acceptance. Baseline HEAD: `ff23eff682cb821bf31136702d7111cc0004a718`. Initial status contained only the two untracked ticket 02/03 review artifacts; both are preserved. No staging, commit, push, database reset, migration consolidation, app-data clear, uninstall, new dependency, paid service or public exposure.

## Authorization and delivered scope

The user approved the focused execution contract and explicitly authorized this bounded implementation. Ticket 04 now records ready-for-agent and the resolved content gate; the ticket-review checkpoint records synthetic sequencing from committed ticket 03. Acceptance checkboxes remain unchecked, and tickets 01/02/03 acceptance and all live-use gates remain open. Ticket 05 and the ticket sequence are unchanged.

The account has an ordinary Open scoped participation entry, available to signed-in owners and joined participants. The screen lists only current authorized scopes or the user's own unshared private preparations. Owners can record a direct own older-adult statement or a reported statement for fresh, previously unshared arrangements. The statement explicitly covers ongoing coordination of prepared need scopes, invite/remove delegation and practical disclosure to designated helpers. Separate optional powers are shown contextually, default off. This is attributable permission, not independent legal/representative verification.

Initial authorization records a finite ceiling. Repeating setup is an idempotent retry only with the same operation and contents; it cannot raise that ceiling or restore restrictions. Existing legacy arrangements cannot be expanded by recording another statement. Their original author remains a Helper with the exact narrow invite/remove delegation, rather than being promoted automatically. Their participants retain their stable-ID practical scope and removal restrictions. This deliberately does not introduce an in-place legacy-authority expansion or unrestricted permission-recovery path.

Current authorized managers choose recognizable invitation-context participant labels and change Helper/Coordinator involvement for the selected need. Coordinator carries scoped resolution capability, but does not bundle management, onward delegation, background access, cancellation or external-disclosure authority. A grant must fit the actor's current rights; granting management requires onward-management delegation, and granting restricted reads requires separately recorded authority to authorize restricted readers. Self-escalation is denied. Scope/preset changes have visible effects and record actor, server time, source/kind, operation and prior/resulting state.

Helper suggestions are attributable, visible to an authorized manager and idempotent, creating no invitation, participation, disclosure or assistance commitment. A manager must independently exercise applicable invitation authority to act on a suggestion.

Minimal practical instructions/place entry and separate restricted-note entry are real data operations. Protected projections omit restricted information entirely unless the caller has its separate current right. Practical access can be paused or restored only with appropriate current coordination/disclosure authority; removal cannot be undone by a new grant or consumed-link retry. A root arrangement Coordinator with explicit ongoing scope can prepare another need's information and deliberately include an already joined, eligible participant from that arrangement. The UI explains that this exposes existing practical content. There is no automatic Helper audience inherited from an unrelated need; restricted background remains separate. Delegated need-only Coordinators cannot infer arrangement-wide powers.

Cancellation, resolution and external-disclosure authority can be recorded, changed and displayed, but no responsibility acceptance, scheduling, completion, actual commitment cancellation, express resolution, full comments, export, recurrence, notification or shared-offline-cache workflow was added. There are no dummy execution RPCs or pretend product actions. Later tickets must test their actual current-authority execution paths, including cancellation versus resolution separation, responsibility eligibility, state conflicts and remaining-work semantics.

## Database implementation and consistency

Six additive migrations were applied to the existing local project. Applied migrations 001–009 and their data remain intact:

- `20261028001000_scoped_participation.sql`: arrangement-linked need scopes; explicit initial authorization; fixed scoped involvement; private restricted notes, suggestions and attributable operation history; narrow checked RPCs; existing invitation/read RPCs consult current involvement. Existing scope, participant and invitation grants are not rewritten or promoted.
- `20261028001100_scoped_context_projection.sql`: contextual audience candidates and private before/after restricted-edit history.
- `20261028001200_practical_audience_candidates.sql`: correctly derives eligible candidates from both joined and explicitly scoped participants, without losing joined candidates when a root involvement row exists.
- `20261028001300_current_invitation_authority.sql`: one current issuance/redemption predicate and permanent invalidation of outstanding invitations on relevant authority loss. The legacy original-inviter exception preserves only the already approved narrow summary-invitation authority.
- `20261028001400_serialized_scope_removal.sql`: arrangement-before-scope lock order serializes cross-need source eligibility with restrictions; the preserved removal RPC blocks both old joined participation and new audience participation, and revokes the removed inviter's pending links.

All new tables are private with no client table privileges. Public invoker wrappers call checked private definer functions with fixed empty search paths; anonymous execution is denied. Current Auth sessions are rechecked after blocking locks. Identity comes from `auth.uid()`, never client-supplied actor/preset claims. Ticket 03 current-confirmed-email matching still applies only to initial redemption; consumed retries use the stable joined ID and current scoped read authority.

Consequential mutations use expected scope revisions and stable operation IDs; lost-response retries do not duplicate accepted mutations, conflicting reuse returns conflict and simultaneous materially stale updates cannot silently overwrite each other. Authority reduction and invitation changes are serialized. Restrictions affect subsequent reads/actions with already issued tokens; they preserve independent other scopes and legitimate historical attribution. Authority restoration does not revive revoked pending invitations. A completed target-scope grant remains independent when a separate source-scope participation later ends.

Mobile data is held in screen memory only. One in-memory uncertain-operation receipt is retained for retry and cleared after confirmation or account separation; no shared information is persisted as a cache/outbox. Displays/forms and delayed results are invalidated on auth, focus, foreground and successful local scope-mutation events. Invitation screens also subscribe to local scope changes. Other-device changes are revalidated on protected requests, foreground/focus or Check current access; no push-driven erasure of already viewed information is claimed.

- `20261028001500_legacy_projection_authorization.sql`: preserved setup/list RPCs also check current practical access, preventing disclosure of updated shared information after author narrowing; management-only metadata remains available through the separate scoped context.

## Actual backend evidence

From repository root, with `C:/Users/jbvan/AppData/Local/Programs/DockerDesktop/resources/bin` prepended to process-local PATH:

- `node scripts/test-ticket04-backend.mjs` — passed. Uses actual local Auth/Mailpit/PostgREST/PostgreSQL with fictional identities. Exercises legacy narrow-role preservation, no repeated-statement expansion, two arrangements and multiple needs; recognizable scoped labels/candidates; authorized broadening and denial of automatic inheritance/cross-arrangement grants; Coordinator defaults versus separate rights; self-escalation, over-delegation, unauthorized onward/restricted grants; actual practical/restricted projections and owner-private RLS; attributed information/retry/conflicting reuse; suggestions without new invitations/grants; old-token read denial and consumed-link replay after narrowing/removal; independent other-participant/scope access; preserved old removal for audience-only participation; permanent delegated-disclosure-loss invalidation and non-revival after restoration; simultaneous versioned updates; source-removal-first race denial and target-first independent grant survival; session revocation denial.
- `node scripts/test-ticket03-backend.mjs` — passed after the corrections: stable identity/email-change protections, recognizable removal, pre-join/isolation/delegation checks, retries/concurrent joins, invitation state/lifetime/authority checks, locked session-revocation race and current-session denial remain intact.
- `node scripts/verify-local-supabase.mjs health` — passed. Five required containers, SQL/Auth/PostgREST/Mailpit and loopback publications remain healthy. This is not a verification-throttling acceptance test; the Mailpit hourly-email override and accepted synthetic-only local verification-throttling limitation remain open.
- `& .\node_modules\.bin\supabase.cmd migration list --local` — migrations 001–015 all recorded as applied locally. CLI `remote` fields in this local command describe the local database; no hosted project was created.

The cross-need race fixture observes a named PostgreSQL transaction in `PgSleep` holding the arrangement lock before submitting the target audience grant. Source removal wins and the target grant is denied; the opposite committed order preserves the independent target. Simultaneous versioned involvement requests produce one success and one conflict. Privileged SQL is used only for controlled test-state/race fixtures, not as a product path.

Legacy preservation is established through unchanged legacy record representation, no migration backfill of rights, actual legacy-style setup/read/retry and denial of automatic promotion/statement expansion. No exhaustive byte-for-byte snapshot of every pre-existing database row was captured before migration; only the new arrangement-link column was populated on old scopes, with original permission/grant fields preserved.

## Automated UI/service and static evidence

From `mobile/`:

- `& .\node_modules\.bin\jest.cmd --runInBand src/features/participation/__tests__` — 8 tests in 2 suites passed.
- `& .\node_modules\.bin\jest.cmd --runInBand` — 58 tests in 14 suites passed, including existing ticket 02/03 tests.
- `& .\node_modules\.bin\tsc.cmd --noEmit` — passed, exit 0.
- `& .\node_modules\.bin\expo.cmd lint` — passed, exit 0, no lint warnings.

New coverage exercises explicit initial Coordinator defaults without bundled advanced powers; Helper practical-only reads and no-grant suggestions; recognizable two-person involvement narrowing; separate minimal practical/restricted inputs; visible existing-content disclosure when broadening; denied/stale-change recovery; delayed read suppression after sign-out; uncertain-operation retry and stable account separation. These are JavaScript fixture tests, separate from actual backend enforcement and phone evidence.

From root: `& 'C:/Program Files/Git/cmd/git.exe' diff --check` passed, with normal LF/CRLF normalization notices. New untracked deliverables are separately checked for trailing whitespace. Existing SQLite/module-type and Auth/Clipboard deprecation notices are not converted into release-security passes. Ticket 02 backend `--core` was not rerun for invitation/participation-only changes; its committed evidence remains historical. Strict OTP throttling was not rerun or claimed fixed.

## Physical Android evidence

The Samsung remained ADB-authorized. Existing debug installation, loopback Metro 8082 and USB mappings (phone 8081 → local 8082 and backend 54321) were reused. No APK rebuild/reinstall, storage clearing or database reset. A temporary ignored helper created a fictional prepared arrangement, explicit permission ceiling and two joined helpers through ordinary authenticated RPCs. Tokens remained in process memory and were not printed or written to review artifacts. Fixture setup is programmatic, not proof that initial permission setup or helper sign-in was exercised on the phone.

The fictional owner completed ordinary Android email-code sign-in using local Mailpit, with private code entry. The existing resend countdown caused UIAutomator idle failures; code entry and a separate visible Sign in tap recovered after it settled. The running app initially retained an earlier bundle; a force-stop/relaunch preserved its session and loaded the current JavaScript, exposing Open scoped participation.

The owner used Open scoped participation, opened the prepared need, selected helper A by its fictional address, chose Pause practical access and applied scoped involvement with the prefilled permission source. Actual backend requests using the helpers' existing unexpired sessions confirmed A's practical read and consumed-link replay were denied, while B's read and retry remained authorized. Neither helper was signed into the phone for this check; those denied/permitted reads are actual-backend evidence after a physical owner action. The development-warning overlay blocked initial sign-out taps; after dismissal, the normal sign-out control produced a blank email form. The temporary helper sessions were signed out and its ignored script/command files removed. Stored arrangements/history and the local Metro/USB setup remain. No physical Helper/Coordinator/power-grant, restricted-note, cross-arrangement, background/failure or iOS acceptance is inferred from the automated/backend evidence.

## Security review and remaining gates

Final endpoint audit also found that the original author's narrowed practical access could be bypassed through preserved preparation/list projections. Migration 015 checks current practical access there as well. Its new actual-backend regression passes, and follow-up Spec review found no material issue. The new scoped-context RPC continues to serve authorized management metadata independently of practical-content access.

The installed two-axis review skill reviewed uncommitted changes against the baseline HEAD, including new files. Standards found no hard standards breach or new significant smell beyond existing lifecycle duplication. Spec/security identified three issues during review: disclosure loss did not invalidate every pending invitation; the old removal RPC missed new audience participants; and cross-need eligibility needed serialization with source removal. Migrations 013–014 resolve these issues. Both agents rechecked and report zero unresolved material findings. Their reports are code review, not independently rerun checks or physical observations.

Ticket 04 acceptance remains unverified pending independent review and remaining applicable evidence. Tickets 01/02/03 acceptance remain incomplete. Preserve outstanding iOS/native failure/recovery, interrupted operations, backup/transfer/reinstall, replacement-device, accessibility/human usability, dependency/release-security, effective verification throttling, suitable hosted inactivity, privacy/legal/vendor suitability, retention/deletion, operational/incident support, production delivery and explicit live-use readiness gates. The system does not establish legal capacity, independently verify consent, recall already disclosed copies or promise assistance. Synthetic-only local development remains $0/month.

No staging, commit, push or ticket 05 work. Stop for independent review.

## Historical handoff before independent-review corrections

HEAD remains `ff23eff682cb821bf31136702d7111cc0004a718`. Final ticket 04 backend, ticket 03 backend and health checks after 015 passed. Final mobile source checks passed: 58 Jest tests/14 suites, TypeScript and ESLint. Migration list records 001-015 applied locally. Those results describe the pre-correction implementation; the correction evidence below supersedes its final counts and affected behavior.

Changed tracked files: ticket 04, ticket-review checkpoint, account-screen.tsx, account/runtime.ts, and invitations/invitation-screen.tsx (5 files; +27/-4 tracked diff). New deliverables: participation route; participation module/screen and two test files; backend suite; six migrations 010-015; this checkpoint and the final scratch review (14 new task files). The two pre-existing review artifacts remain unrelated and untracked. New-file whitespace checks pass. No staged changes, commits or pushes. Independent review remains required before committing.

## Independent-review corrections (current handoff)

Both requested findings are resolved without changing the approved authorization model or implementing later workflows. This section supersedes the historical final counts and affected controls above. HEAD remains `ff23eff682cb821bf31136702d7111cc0004a718`.

### Delegated scoped invitation path

Scoped participation now offers Copy scoped invitation link and an explicit replacement/copy action whenever the backend reports current invitation authority for the selected need. It uses the existing recipient-bound invitation service and protected issuance receipt. The preview contains only that need's authorized practical summary, contextual sender attribution, explicit-Join requirement and no-responsibility statement. It requires no owner-private arrangement read. The old owner-only invitation listing has not been opened to delegates; no general invitation-management listing was added. Additional authorized need scopes use the same path.

The backend rechecks existing may_invite authority on every issuance and initial redemption. Existing recipient normalization, confirmed Auth-email binding, stable joined identity, seven-day lifetime, idempotency/replacement, permanent pending-link invalidation on relevant authority loss, removal and replay checks remain in effect. Tests establish delegated original/additional-need issuance and explicit joining, outside-scope and lost-authority denial, owner-private RLS denial and restricted-payload omission.

### Practical audience independent of management

A narrow authenticated set_practical_audience RPC changes only the practical-reading flag of an existing, currently eligible participant in one scope. It requires current Coordinator/practical involvement, not participation-management delegation. Increasing access requires current disclosure authority. It cannot create or restore participation, alter presets or grant management, background, delegation, cancellation, resolution or external-disclosure powers. Preset/other-power changes and removal remain under the existing management operation and delegation checks.

Ordinary Practical audience controls are separate from People in this need. A Coordinator receives only recognizable label, stable target ID and inclusion state for eligible entries, not the management projection, suggestions, permission source or restricted content. Reusing/narrowing existing audiences and root ongoing authorized audience selection no longer depend on management delegation; expanding audiences still requires applicable disclosure and scope authority. Controls describe disclosure of existing instructions; an include control is disabled without disclosure authority.

The operation locks arrangement before scope, rechecks current session/rights after locking, checks revision and stable operation identity, records before/after history and permanently revokes pending invitations if the target loses invitation authority. Replays return current authorized context. Existing removed tombstones and unaffected rights/scopes are preserved. Actual-backend tests prove old-token read/consumed-link denial, surviving other participant/scope access, no unrelated-right changes, forbidden preset/removal/management/other-power mutations, broadening denial, removed-target denial, exact retry/conflicting reuse, stale revision and concurrent one-success/one-conflict behavior.

### Additive migrations and review resolution

- `20261028001600_scoped_practical_audience.sql`: narrow audience operation, separate minimal audience projection, current can_invite projection and authorized audience-selection adjustment.
- `20261028001700_invitation_sender_attribution.sql`: review found delegated links were still displayed as invited by the original scope author. An insert trigger now snapshots the actual sender's existing authorized contextual label; destination reads use the participant's original joining invitation. A redundant later invitation does not rewrite established grant attribution. The copy preview shows the authorized sender. Backend assertions cover delegated attribution for original/additional needs.

Both migrations were applied with `& .\node_modules\.bin\supabase.cmd migration up --local`. Existing applied files 001-015 were not rewritten or consolidated. Migration 017 backfills only its newly added attribution column from recorded participation/invitation context; no current Auth-email identity lookup, access broadening or grant backfill. Local data and prior history are preserved.

Standards review: zero unresolved material findings. Spec/security review: the attribution issue above was found and resolved, then rechecked with zero unresolved material findings. These reviews did not independently rerun automated checks or observe a phone. No general permissions framework, lifecycle refactor, new dependency or later-ticket execution endpoint was introduced.

### Current checks and exact results

From `mobile/`:

- `& .\node_modules\.bin\jest.cmd --runInBand src/features/participation/__tests__ src/features/invitations/__tests__/invitation-service.test.ts`: initial focused correction run passed, 13 tests/3 suites. Later attribution-preview and replacement assertions are included in the final full run below.
- `& .\node_modules\.bin\jest.cmd --runInBand`: final run passed, 62 tests/14 suites, exit 0, including affected UI/service tests and ticket 02/03 regressions.
- `& .\node_modules\.bin\tsc.cmd --noEmit`: passed, exit 0 after final source/test edits.
- `& .\node_modules\.bin\expo.cmd lint`: passed, exit 0 after final source/test edits.

From root, Docker's installed directory prepended only to this process PATH (`$env:PATH='C:/Users/jbvan/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH`):

- `node scripts/test-ticket04-backend.mjs`: final pass, exit 0 after migrations 016/017 and the simultaneous-audience regression. Real local Auth/Mailpit/PostgREST/PostgreSQL; covers the new corrections plus existing ticket 04 enforcement/races.
- `node scripts/test-ticket03-backend.mjs`: passed, exit 0 after 017; recipient binding, stable identity after email change, removal, expiry/replacement, authority/race, live-session and privacy protections retained.
- `node scripts/verify-local-supabase.mjs health`: passed, exit 0; local-only service health/mappings. Reports the existing Mailpit hourly-limit override; strict verification-throttling acceptance remains open.
- `& .\node_modules\.bin\supabase.cmd migration list --local`: passed, 001-017 recorded locally.
- `& .\node_modules\.bin\supabase.cmd db lint --local --level warning`: exit 0; one existing extra warning that private.issue_invitation's row variable s is never read. Its SELECT INTO still acquires the existing scope lock; no applied migration was changed to silence it. No other reported issues.
- `& 'C:/Program Files/Git/cmd/git.exe' diff --check`: passed (normal LF/CRLF notices). Untracked task deliverables separately scanned for trailing whitespace/conflict markers; passed.

A first expanded test run failed the new sender assertion because its recipient had already joined through a prior invitation: established participation correctly retained its original attribution. The fixture was corrected to establish a first delegated join; the final run above passes. No server payloads, raw invitation links/tokens or credentials were printed or recorded.

### Native evidence and limitations for these corrections

`& 'C:/Users/jbvan/AppData/Local/Android/Sdk/platform-tools/adb.exe' devices` returned an empty device list. Metro was still listening on loopback 8082. No new physical delegated copy or Coordinator-without-management audience journey was demonstrated. No correction-specific native fixture or clipboard content was created/read, and no app storage, installation, database or device state was reset. Prior phone observations above describe the earlier owner-management control and are historical; they do not validate these new ordinary controls. Automated UI/service behavior and actual-backend enforcement are separate evidence. Physical delegated invitation/copy, no-management audience narrowing and affected/unaffected recipient observations remain native follow-up work.

### Current changed files and remaining gates

Correction-specific edits: participation route, participation screen/service and both test files; existing invitation-service test; backend ticket 04 suite; new migrations 016/017; this checkpoint and the scratch review. Earlier ticket 04 work remains preserved: ticket 04/ticket-review documentation, account screen/runtime, invitation-screen invalidation, participation foundation and migrations 010-015.

Final status: six modified tracked files (+41/-4) and 16 untracked ticket 04 deliverables; the two existing untracked ticket 02/03 review artifacts remain untouched. No staged changes. HEAD unchanged. All ticket 01/02/03 acceptance and ticket 04 acceptance/live-use gates remain open, including the native/platform/failure/usability/security/throttling/legal/vendor/operational gates documented above. Synthetic-only local development remains $0/month. No staging, commit, push or ticket 05 work. Stop for independent review.
