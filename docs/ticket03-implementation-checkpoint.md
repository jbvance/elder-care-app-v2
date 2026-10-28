# Ticket 03 synthetic implementation checkpoint — 2026-10-28

The independent-review correction section at the end supersedes the original handoff's counts, retry behavior and native-removal limitation. Earlier sections retain the original implementation evidence.

Review checkpoint only. No staging, commit, push, acceptance-status change, database reset, uninstall or storage clearing. Initial and final HEAD: `0caedd3a6d6fdd0f5327af6b3559775a0f060d53`. Initial status contained only the expected unrelated `.scratch/ticket02-closeout-review.txt`, which was preserved.

## Delivered scope

The saved private arrangement now has an ordinary Permission and invitations entry. The preparation screen previews the six deliberately shared practical fields, explains that the signed-in email identifies the inviter, and records either the signed-in older adult's own statement or another person's reported permission. Database attribution includes recorder user ID, server time, source, kind, specific prompting scope and explicit invite/remove delegation. This is an attributable statement, not independently verified legal consent or representative authority. Ownership without this recorded permission cannot issue invitations.

The initial statement author can invite and remove for that one need. Joining grants practical-summary reading only, bound to stable Auth user ID: no management, onward delegation, restricted background, private payload or assistance responsibility. There is no general permission/preset editor, discovery workflow, responsibility acceptance or ticket 04/05 functionality.

Invitation tokens use two random UUIDs, are hashed with SHA-256 server-side, and never substitute for authentication. Only trimmed/lowercased current confirmed Auth email matches; JWT email, client identity and provider-alias equivalence do not. Issuance operation receipts and the minimal pending token use the existing encrypted account store. The native intent handler removes token material before Router builds navigation state. No raw issued token is recorded in this checkpoint or final review.

Copy invitation link copies the actual recipient-bound link. Open copied invitation link on this device reads that clipboard content on explicit user action and opens it through Expo Linking. Pending links survive the inline email-code sign-in/account-switch path. Explicit Join alone calls redemption; pre-join screens show generic instructions and the user's own address. Invitation mode suppresses the account screen's arrangement/draft display. The destination is read-only and explicitly says joining has not accepted assistance responsibility.

All invitation, authority and participant mutations serialize on the prompting scope row. Redemption rechecks live session after blocking locks, confirmed current Auth email, state, restriction, scope, authority and database-clock expiry. Issuance uses exactly seven elapsed days from one server-clock reading. Replacement invalidates pending links for the same normalized recipient/scope; retrying the same issuance operation preserves its token and expiry. Concurrent Join and lost-response retry produce one scoped grant. Removed participation is a permanent restriction in this slice: neither consumed replay nor a fresh invitation restores it. Authority loss permanently revokes outstanding invitations; restoration cannot revive those links. Existing independent participation survives inviter departure; withdrawn sharing denies affected reads immediately. Consumed invitation expiry alone does not end participation.

## Changed files and database migrations

Modified existing files: `mobile/src/features/account/account-screen.tsx`, `account-service.ts`, `runtime.ts`.

New routes: `mobile/src/app/+native-intent.tsx`, `invitation.tsx`, `invite.tsx`.

New invitation files: `mobile/src/features/invitations/invitation-service.ts`, `invitation-screen.tsx`, `invite-screen.tsx`, and four focused files in its `__tests__/` directory. New actual-backend suite: `scripts/test-ticket03-backend.mjs`.

Five additive migrations were applied to the existing local database, preserving earlier migration history and data:

- `20261028000400_invitations.sql`: private prompting permission/summary, hashed invitations and scoped participants; checked transactional bodies and invoker wrappers.
- `20261028000500_invitation_wrappers.sql`: completes two omitted public invoker wrappers and restricts their private function execution. The first backend attempt detected missing wrappers before any grant; the correction was applied and tests rerun.
- `20261028000600_invitation_review.sql`: session checks after locks, uniform unavailable-link denials and a deliberately disclosed inviter-email snapshot.
- `20261028000700_invitation_exact_lifetime.sql`: exact seven-day expiry from the same issuance clock reading.

Private records have no direct client table privileges. Public RPCs are invoker functions; privileged implementations remain in the non-exposed private schema with fixed empty search paths. Only authenticated callers can execute them, with live checks in each operation. Existing owner-private RLS and session protections remain intact. No dependency or hosting changes; development remains $0/month.

- `20261028000800_invitation_elapsed_lifetime.sql`: uses 168 elapsed hours independently of timezone/DST, including the table default.

## Actual backend evidence

From repository root with Docker's installed directory prepended to process-local PATH:

`node scripts/test-ticket03-backend.mjs` — passed after all five migrations. Uses actual local Auth, Mailpit, PostgREST and PostgreSQL with fictional identities. Establishes anonymous/pre-join denial; normalized matching; mismatch including plus/dot alternatives; forged identity argument denial; stale JWT email versus changed current Auth email; unconfirmed email denial; cross-arrangement and private-payload isolation; missing delegation/ownership-only/self-escalation denial; unauthorized removal denial; immediate affected-read/replay denial using previously issued unexpired JWTs; preservation of unrelated scope; fresh-invitation restriction bypass denial; concurrent submissions/idempotent issuance and redemption; exact lifetime; invalid/expired/revoked/replaced links; authority loss/restoration; consumed expiry and inviter-departure semantics; scope withdrawal; revoked-session denial. No responsibility record or acceptance operation is introduced.

Race fixtures observe PostgreSQL `PgSleep` while a named transaction holds the scope lock, then submit redemption. Controlled replacement/removal/authority-loss winners deny Join. These use privileged test fixtures to establish lock ordering, rather than UI timing. A separate test starts Join behind a held scope lock, observes the waiting query, signs the recipient out, then proves 401 and zero participant grants after lock release. Earlier fixed-delay race readiness was replaced with observed readiness.

`node scripts/test-ticket02-backend.mjs --core` — passed: private isolation, session/expired-JWT denial, association retries, other-device preservation and revocation, OTP expiry/reuse and supported refresh-based inactivity/client cleanup. Its printed accepted synthetic-only local verification-throttling limitation remains open; this command does not run the strict failing rate-limit probe.

`node scripts/verify-local-supabase.mjs health` — passed: five required containers, health, PostgreSQL, Auth, PostgREST, Mailpit, effective settings and loopback mappings. Health does not establish effective OTP verification throttling. CLI Mailpit's hourly-email override remains a documented limitation.

## Automated UI and static evidence

From `mobile/`:

- `& .\node_modules\.bin\jest.cmd --runInBand` — most recent completed full run: 46 tests, 11 suites passed. Focused additions exercise preparation/disclosure, permission recording, copy/open clipboard path, protected native-intent parsing, lost issuance response/replacement retry, email-code continuation, no implicit Join, generic mismatch recovery/retry, explicit authorized destination and delayed-result suppression after sign-out.
- `& .\node_modules\.bin\tsc.cmd --noEmit` — passed after Expo regenerated its ignored route types. An earlier stale generated-route-type error was resolved by starting the local development server.
- `& .\node_modules\.bin\expo.cmd lint` — passed. Earlier JSX/route fallback issues and a ref-cleanup warning were corrected.
- `& 'C:/Program Files/Git/cmd/git.exe' diff --check` — passed; Git emitted only LF/CRLF normalization warnings.

No snapshots or implementation-mirroring tests were added. These JavaScript fixtures do not prove native storage behavior, physical usability or actual backend authorization; backend evidence is recorded separately above.

## Physical Android evidence

The existing Samsung `RFCXB05XF4Z` was authorized. Existing debug installation loaded changed JavaScript; no APK reinstall, data clear or database reset. Metro initially lacked IPv4 reachability; a separate task-started loopback Metro on 8082 was restarted with process-local `NODE_OPTIONS=--dns-result-order=ipv4first`. USB phone port 8081 mapped to local 8082; backend remained phone/local 54321. A transient ADB transport reset temporarily removed the phone, which subsequently reconnected.

Observed on the real phone: generic invitation screen; fictional owner A's numeric Mailpit-code sign-in; saved arrangement navigation; practical-disclosure preview; reported permission/delegation recording; designated fictional recipient B entry; Copy invitation link acknowledgment; opening that actual clipboard link through the ordinary new control; explicit wrong-account Join with generic recovery; owner sign-out and intended-recipient sign-in continuation, followed by explicit Join and the authorized summary with inviter address and the no-responsibility-accepted statement. PostgreSQL reported exactly one pending native invitation after link opening/mismatch, with no redemption.

UIAutomator repeatedly failed to reach idle during the existing resend countdown and sometimes required scrolling before code/sign-out controls were visible. A development warning overlay was observed. No sensitive link was printed or passed in diagnostic artifacts. After recipient sign-in and immediately before explicit Join, PostgreSQL still reported one pending invitation. The native Join then displayed the authorized summary. A temporary freshly authenticated owner session invoked the normal authorized removal RPC, then signed out; this removal click was not exercised on the phone. The phone retained its existing recipient session, and replaying the consumed link displayed generic denial with no practical summary. PostgreSQL confirmed one removed grant and zero active grants for that recipient. A later development hot refresh had already cleared the previously displayed summary; the native check establishes replay denial, not push-driven erasure of a continuously displayed summary. The recipient used Forget invitation and Sign out on this device; the final phone showed a blank email form. Stored arrangements were retained. The clipboard was not cleared; it contains an intentionally copied, now non-redeemable link.

## Final review and remaining gates

The installed code-review skill reviewed working changes against the expected HEAD (including untracked source), with separate Standards and Spec agents because the user forbade committing. Standards found an unguarded unavailable-native route; fixed. One nonblocking duplication smell remains in screen lifecycle clearing/subscription logic. Spec found session validity checked before lock waiting, distinguishable unavailable-link errors, and UUID-only inviter identification; all corrected and rechecked, with zero unresolved material findings. The physical check then identified the invitation screen's embedded own-arrangement display; invitation mode suppresses it and regression coverage was added. Follow-up Spec review confirmed the invitation-mode suppression, clipboard opening, 168-hour duration and concurrent-issuance coalescing; no material findings remain. Independent human approval remains outstanding.

References checked against the pinned stack: [Expo SDK 58 Router](https://docs.expo.dev/versions/v58.0.0/sdk/router/), [SDK 58 Linking](https://docs.expo.dev/versions/v58.0.0/sdk/linking/), [native intent rewriting](https://docs.expo.dev/router/advanced/native-intent/), [PostgreSQL explicit locking](https://www.postgresql.org/docs/17/explicit-locking.html). Clipboard reuses the installed React Native adapter (deprecated upstream) without a new dependency; migration to the recommended Expo module and native rebuild can be considered separately if required by release checks.

Ticket 03 remains pending independent human review and the remaining native/platform/failure and human-evaluation acceptance work. The bounded Android happy path, mismatch and replay-after-removal checks above were demonstrated. Ticket 01/02 acceptance remains incomplete. Outstanding iOS, native failure/recovery, interrupted operations, backup/transfer/reinstall, replacement-device, accessibility/human usability, dependency/release-security, effective verification throttling, suitable hosted inactivity validation, legal/privacy/vendor suitability, retention/deletion, operations, production delivery and explicit live-use readiness gates remain open. Previously displayed/copied information cannot be recalled; clipboard contains intentionally copied sensitive link material. This is synthetic development only, with no acceptance or live-use claim.

Final command note: a Jest invocation from repository root with `--config mobile/jest.config.js` failed resolving the existing `@/` alias. This was an invocation-directory error; the prescribed command was rerun from `mobile/`. No alias or repository configuration was changed.

## Final verification and handoff

Final Jest from `mobile/`: 46 tests in 11 suites, exit 0. Final TypeScript and ESLint: exit 0, no errors or warnings. Final ticket 03 actual-backend run after migration 008 and final health check: exit 0. Ticket 02 core regression completed successfully in this session before the final invitation-only lifetime correction; it was not needlessly repeated. Final `git diff --check` passed. Runtime emitted existing experimental SQLite/module-type notices and the installed Clipboard/Supabase lock deprecation warnings; these are not test failures. The strict verification-throttling test was not rerun and remains an accepted synthetic-only failing gate.

Final state: three modified tracked account files, eighteen new task files including this checkpoint and `.scratch/ticket03-implementation-review.txt`, plus the preserved unrelated ticket 02 review artifact. Tracked diff: 12 insertions, 2 deletions; new files are untracked and therefore absent from ordinary `git diff --stat`. No staged changes. Five new additive migrations are applied locally. Fictional test data remains in the existing database. The temporary native owner-RPC helper was removed; no credential/token-bearing artifact was saved. Phone is signed out with a blank email form, and the pending native link was forgotten. Metro 8082 and the USB mappings used above remain for local follow-up; no public service was introduced.

Stop here for independent review before committing. This is bounded synthetic implementation and demonstrated Android happy-path evidence, not full ticket 01/02/03 acceptance or live-use readiness.

## Independent-review corrections — 2026-10-28

### Stable identity after joining

Applied additive migration `20261028000900_invitation_identity_and_labels.sql`; migrations 001–008 and existing local data were preserved. Initial redemption still locks and checks live session, current confirmed Auth recipient email, invitation validity, current scope/authority and restrictions. The consumed branch now checks `joined_by = auth.uid()`, active participation, live session and current shareable scope before returning the practical summary, independently of the original recipient email. Removal still denies reads and replay. This changes no email-recovery workflow.

Actual-backend regressions establish that the same stable user retains read access and consumed-link retry after a confirmed Auth-email change, using an existing JWT. A second authenticated identity is then assigned the original confirmed address: its consumed-link retry and summary read are denied. Removing the original participant subsequently denies their read and replay. Auth-email changes are privileged synthetic test fixtures, not newly delivered account-management operations.

### Recognizable removal

The authorized scope listing now joins each participation to its original invitation and returns that invitation's designated address as `label`. It returns no unrelated current Auth address or profile data. Helper callers still receive no management listing. `InviteScreen` displays the contextual label while retaining `user_id` as the removal target. A backend regression additionally verifies the label stays the original context address after the participant's current Auth email changes.

Focused UI coverage renders two joined participants with different fictional addresses, selects one recognizable control, checks its stable target, and verifies only that control disappears. Actual-backend coverage joins two participants, validates both labels/targets, removes one, denies that participant's read/replay and preserves the other's read/retry.

### Mounted incoming-link handling

The concern was reproduced before correction: delivering a different link through the real native-intent handler while `InvitationScreen` remained mounted left the previous practical summary displayed. Command: from `mobile/`, `& .\node_modules\.bin\jest.cmd --runInBand src/features/invitations/__tests__/invitation-screen.test.tsx`; before correction, 1 failed and 3 passed, with the old summary still present after the replacement-link delivery. This was a handler/mounted-screen integration repro, not a claim about every native Router remount path.

A small invitation-specific `pending-invitation.ts` helper now serializes protected pending-link writes and notifies mounted invitation screens. Incoming changes clear summary and Join target and invalidate older asynchronous results before storage I/O. Only the latest completed write refreshes the context. A failed write blocks pending reads rather than falling back to an older token; malformed/invalid links clear the target. The token never enters navigation state or the notification signal. No automatic redemption occurs. Existing account/AppState lifecycle structure was retained; no lifecycle refactor or general permissions system was added.

Regression coverage checks the newly delivered explicit Join target, no implicit redemption, invalid-link disabled Join, an old in-flight Join result that must remain hidden, ordered incoming writes and failed-write recovery. The same mounted-screen test passes after correction. One new removal-test fixture initially reused a mutable object unlike a real JSON RPC response; returning fresh fixture objects corrected that test without another application behavior change.

### Correction-round automated/backend checks

All commands below exited 0 after the correction:

- From root: `& .\node_modules\.bin\supabase.cmd migration up --local` — applied 009 without reset; `& .\node_modules\.bin\supabase.cmd migration list --local` — migrations 001–009 all applied locally.
- From `mobile/`: `& .\node_modules\.bin\jest.cmd --runInBand src/features/invitations/__tests__` — 10 tests, 5 suites passed.
- From `mobile/`: `& .\node_modules\.bin\jest.cmd --runInBand` — 50 tests, 12 suites passed, including existing ticket 02 UI/service protections.
- From `mobile/`: `& .\node_modules\.bin\tsc.cmd --noEmit` — passed.
- From `mobile/`: `& .\node_modules\.bin\expo.cmd lint` — passed, no lint warnings.
- From root with Docker's installed directory prepended to process-local PATH: `node scripts/test-ticket03-backend.mjs` — passed the new stable-identity/two-participant checks plus all existing invitation authorization, isolation, retry, expiry, revocation, authority and race checks.
- With the same PATH: `node scripts/verify-local-supabase.mjs health` — passed; services remain loopback-only. The Mailpit hourly-email override and accepted synthetic-only verification-throttling limitation remain unchanged.
- From root: `& 'C:/Program Files/Git/cmd/git.exe' diff --check` — passed; only existing line-ending normalization notices. Newly untracked task files were also checked for trailing whitespace.

The actual ticket 02 `--core` backend suite was not rerun for these invitation-only corrections; its earlier passing evidence remains separate. No strict-throttling pass, native encryption/failure acceptance or hosted inactivity evidence is claimed.

### Correction-round physical Android evidence

The existing Samsung and installed debug app used the existing loopback Metro 8082 and USB mappings (phone 8081 → host 8082, phone/host backend 54321). No rebuild, reinstall, data clear, public service or database reset. A temporary ignored helper prepared fictional arrangements and two joined helpers through ordinary authenticated RPCs, retained test tokens in process memory and suppressed link material from outputs. The owner then signed in through the normal Android numeric-code form and navigated from the account to Permission and invitations for Fictional Review Morgan.

Both remove controls displayed distinguishable invitation addresses for fictional helpers C and D. Tapping C's normal removal control removed C while D's control remained. Actual backend requests with the helpers' existing sessions confirmed C's read and consumed retry were denied while D's read and retry remained permitted. This closes the prior limitation that removal had only been performed by an authorized RPC rather than a phone control. Fixture setup and denied-read verification were programmatic backend work; neither helper was signed into the physical phone for this correction-round removal test.

For warm links, the signed-in phone explicitly joined Fictional Link A and showed its summary. A different link B was delivered as a native VIEW intent while the same invitation route was open and foregrounded, with link output suppressed. The A summary disappeared and the screen showed generic instructions and the owner's own address. PostgreSQL confirmed zero B participants before Join. Explicit Join displayed only Fictional Link B's authorized summary; backend checks confirmed two attributable grants for the two explicit joins. An invalid native link then cleared B's summary, and an actual UI hierarchy check reported `Invalid-link Join enabled: false`. No code hot reload or account switch was used between these link deliveries. A replacement-shaped link was covered by the mounted handler/UI test; a separate replacement/resend was not repeated physically in this round. Initial recipient mismatch/expiry/replacement backend coverage remains in the full suite.

The existing countdown caused UIAutomator idle failures; after it settled, private Mailpit-code entry and a separate visible Sign in tap succeeded. These are automation limitations, not a new authentication change. The phone's Forget invitation and normal sign-out controls were used at closeout. No raw issued link, token or OTP is included in evidence files.

### Correction-round review and handoff

The installed two-axis code-review workflow rechecked the corrections against the unchanged expected HEAD and original working implementation. Standards: zero unresolved material findings; existing lifecycle duplication remains nonblocking and no refactor is recommended in this scope. Spec/security: zero unresolved material findings; stable-ID retries, context-only labels and incoming-link invalidation remain within ticket 03. The reviewers did not independently rerun commands or observe the phone; the evidence above is reported by the implementation session.

This round changes ten source/test/migration files plus the two requested evidence files: migration 009; `pending-invitation.ts` and its test; `+native-intent.tsx`; invitation service and both screens; the invitation-screen and invite-screen tests; and `scripts/test-ticket03-backend.mjs`. Existing unrelated work is preserved. Across the whole uncommitted ticket 03 slice there are three modified tracked account files and 21 new task files, plus the unrelated ticket 02 review artifact. The tracked diff remains +12/-2 because the ticket 03 additions are still untracked. No staged changes, commits or pushes. HEAD remains `0caedd3a6d6fdd0f5327af6b3559775a0f060d53`.

All previously recorded ticket 01/02 and remaining ticket 03 native/platform/failure/usability/security/legal/vendor/live-use gates remain open. Development remains synthetic-only and $0/month. Stop for independent review before committing.

Correction closeout: the phone showed a blank signed-out email form after normal sign-out; the pending link was forgotten. The current native helper's retained fixture sessions were signed out and its two ignored helper/command files removed. Fictional arrangements and historical test data remain. Final HEAD/status/whitespace checks match the handoff above; the complete current response is saved in .scratch/ticket03-implementation-review.txt.
