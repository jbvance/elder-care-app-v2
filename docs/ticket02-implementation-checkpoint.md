# Ticket 02 implementation checkpoint - 2026-10-28

Baseline: `05050c674c809dd7f3970552866f2ecfa83a61f7`. No commit, ticket completion,
requirements/specification/ADR change, paid service or hosted project was made.
The four testing boundaries were approved. The user expressly accepted local
verification throttling as a synthetic-development sequencing limitation after a
bounded supported-configuration investigation. It remains a mandatory pre-real-data
and pre-live-use gate, not a passed authentication-security test. No commit is made.

## Implemented functionality

The home screen links to the ordinary account route. It supports fictional email
entry, six-digit code entry, resend countdown, recoverable errors, private account
retrieval, deliberate draft association, current-device sign-out, and an email-code
reauthenticated other-device sign-out path. Authentication does not upload the draft,
invite anyone, confer legal authority or establish collaboration rights.

Complete SDK sessions and owner-bound association receipts use a separate
`account-v1.db` SQLCipher database and device-only SecureStore key. The existing
native protected directory and backup plugin cover it. There is no plaintext
persistence fallback; web account persistence is unavailable. Native encryption
checks precede writes. The new native platform factory preserves ticket 01's
anonymous filename/key and gives the account database separate identifiers.

Supported SDK refresh runs only in the foreground. On resumption, Auth evaluates
its own refresh policy. The shared `refreshForeground` handler stops refresh and
uses supported local sign-out for terminal refresh errors; transient connection
errors do not deliberately erase a valid session. Terminal errors raised while
restoring an already-expired JWT are handled too: when SDK sign-out cannot reach
local cleanup, only the configured protected authentication entry is removed,
followed by supported local sign-out to clear SDK state/notify observers. This is
local credential cleanup, not a claim of acknowledged server revocation.
No client inactivity clock or
PostgreSQL inactivity arithmetic was added.

The API origin is fixed to loopback. Requests reject redirects and unexpected
origins. The app accepts only fictional `@example.test` addresses in this local
build. An ignored `.env.local` contains only the local public client key; no
privileged credential is embedded in the mobile application. Raw SDK, JSON,
storage and HTTP response errors are not shown or logged by the account screen.

## Backend ownership and explicit revocation

Both additive migrations `20261028000100` and `20261028000200` remain applied.
No reset or volume deletion was performed. The private table permits reads only
to its owner through RLS, with live session-ID/user and `not_after` checks.
Controlled association derives ownership from Auth; it accepts no client owner ID.
Owner/operation identity is unique, and a changed-payload retry returns a conflict.
No invitation, participation or broader permission framework was introduced.

Actual local HTTP/PostgreSQL tests passed for anonymous denial, owner association
and retrieval, stable duplicate-safe retry, altered-payload rejection, cross-account
identifier denial, forged owner insertion/RPC denial, and owner-scoped operation IDs.
After explicit local sign-out, an otherwise unexpired JWT cannot read or create
private arrangements. A second session remains valid. Fresh same-identity email
reauthentication followed by other-session sign-out denies the other device's stale
JWT while retaining the fresh current session.

## Clarified inactivity contract and test correction

The user explicitly clarified that native inactivity ends refreshability, while
an otherwise unexpired JWT may retain its remaining validity. The previous test's
expectation of immediate denial at that threshold exceeded this approved contract.
That expectation was corrected; the scenario itself was preserved.

Executed checks now establish:

1. Backdating only a disposable synthetic session's native refresh metadata beyond
   720 hours causes Auth to reject refresh with `session_expired`.
2. The retained one-hour JWT can still read its owner's arrangement while unexpired.
3. The actual application foreground handler clears the ended client session and
   does not continue refresh requests.
4. A test-only, correctly signed JWT with elapsed expiry is rejected for protected
   reads and writes. A still-valid signed control succeeds. Local signing material
   exists only in test-process memory, never mobile code, logs or committed files.
5. Explicit revocation remains a separate immediate-denial test and still passes.

The backdated fixture does not imply a one-hour token normally survives 31 days.
Remaining JWT validity after native inactivity is an approved limitation to assess
before real-information/live use. Pro-only hosted timeout validation stays deferred.
No parallel inactivity system or weaker revocation check was introduced.

## Association and cleanup corrections

- Overlapping calls for the same owner share one in-flight operation. A regression
  first reproduced two arrangements, then passed with one stable operation.
- The durable receipt and exact payload are persisted before upload. An uncertain
  response retries that operation rather than generating another identity.
- An interrupted old receipt is reconciled before the exact newer version selected
  by the user's current action is uploaded. The cleanup-interruption/newer-draft
  regression first failed, then passed.
- Edits arriving during upload remain private locally and return a distinct
  `newer-draft-retained` result, not a false acknowledgment of those edits.
- `discardIfUnchanged` compares and destroys within the protected draft store's
  existing serialized save queue. This closes the review-discovered load/delete
  race. A real-SQLite regression verifies queued saves on both sides of cleanup.
- Pending receipts are owner-bound. Cross-account reuse is rejected before upload.
- Explicit sign-out requires cancel-or-discard for an unassociated draft. If server
  sign-out is unacknowledged, local credential removal is described separately from
  server revocation; no immediate offline-copy recall is promised.

The service tests use the real SDK and SQLite I/O with an HTTP server fixture and
simulated native cipher/key boundary. They do not establish actual RLS or native
SQLCipher behavior; those evidence sources are kept separate.

## Accepted local-only limitation: native IP request/verification limits inactive

The expanded backend suite passed incorrect, reused and elapsed-expired numeric
code rejection and immediate per-address resend denial. It failed its bounded
verification-throttle test: 35 direct requests returned rejection for the invalid
code, but none returned the expected rate-limit response (429).

The isolated command reproduces this against an existing fictional user:

```powershell
node scripts/test-ticket02-backend.mjs --verify-rate-limit-only
```

Observed non-secret environment: `GOTRUE_RATE_LIMIT_VERIFY=30`,
`GOTRUE_RATE_LIMIT_OTP=30`, `GOTRUE_RATE_LIMIT_TOKEN_REFRESH=150`, but
`GOTRUE_RATE_LIMIT_HEADER` is absent. The pinned Auth implementation has no default
for that header and bypasses IP limiting when it is empty and no verified forwarded
identity is available. The pinned CLI's Auth environment builder does not emit it.
This is distinct from the previously accepted Mailpit hourly-email override.

The bounded investigation found no exposed supported CLI option for the Auth
rate-limit identity header. The existing Kong configuration was inspected read-only:
it sets upstream X-Real-IP from its remote address and constructs X-Forwarded-For;
Auth's internal 9999 port has no published host mapping. No gateway/header trust
setting, generated container or official image was modified. A client-supplied
header would not be an acceptable fix. No custom limiter, proxy or extra service
was introduced. Since a practical supported pinned-CLI configuration was not found,
the user explicitly authorized continuing synthetic-only development with the gap.

The strict failing probe remains unchanged in meaning. The default full backend
command still fails at the throttling assertion. `--verify-rate-limit-only` isolates
it. `--core` runs the other actual-backend regressions and explicitly prints the
local limitation; it is not full throttling/security acceptance. Effective native
server-side verification throttling, trusted/overwrite-only gateway identity,
missing/spoofed-header resistance and no bypass endpoint remain mandatory before
real personal/health information or live use. No enabled-limiter negative test is
claimed to have passed in this local stack.

## Validation and remaining gaps

Focused service tests: seven passed. Protected-store and association focused run:
17 passed. Final full Jest run: **33 tests across seven suites passed**. TypeScript,
ESLint, JavaScript syntax and whitespace checks passed. The actual backend `--core`
suite passed, including all ownership/session/OTP sections. The strict full suite
and isolated direct verification probe retain their failing throttling assertion;
core success does not convert that local limitation into acceptance.

The initial offline build lacked a cached Gradle plugin, and the subsequent default
toolchain encountered the Windows path-length error. The existing supported build
environment was then verified: CMake 3.31.6, Ninja 1.12.1, writable dedicated Gradle
home at `%LOCALAPPDATA%/Temp/elder-care-gradle`, and its existing
`android.cmakeVersion=3.31.6` override. With that home explicitly selected and dotted
Gradle arguments quoted for PowerShell, the ARM64 debug build passed. An intermediate
unquoted invocation failed with an `android` property error; no dependency or app
architecture workaround was required. No Windows security or long-path setting changed.

The phone subsequently became authorized. In-place APK installation succeeded with
app data preserved. USB reverse was limited to API 54321 and Metro 8081. Metro was
restarted with process-local `NODE_OPTIONS=--dns-result-order=ipv4first` so USB could
reach its loopback listener.

Reproducible local build command, from `mobile/android`:

```powershell
$env:GRADLE_USER_HOME = Join-Path $env:LOCALAPPDATA 'Temp\elder-care-gradle'
.\gradlew.bat :app:assembleDebug '-Pandroid.cmakeVersion=3.31.6' '-PreactNativeArchitectures=arm64-v8a'
```

Executed native UI evidence: normal home navigation, preparing `Fictional Native
Morgan` / `Synthetic grocery trip`, protected local save, Done for now, returning
to the home summary, opening the account route, entering a fictional address and
requesting a numeric email. Local Mailpit captured the native fixture emails.
A database count verified no arrangement had been uploaded for that fixture.
No code was printed or entered during the attempted device verification.

ADB became unauthorized again before numeric verification could be completed.
The agent did not reset ADB keys, change device settings, clear app data or remove
the fictional draft. Consequently native account authentication, complete-session
persistence/encryption, association, restart restoration and account transitions
are **not validated**. Successful installation/build/private preparation do not
establish those properties. Temporary UI artifacts and helper code remain ignored
under `.expo/`; the private local environment file is also ignored.

Still unverified: Android/iOS encryption and session restoration, foreground/resume
and account transitions on-device, full normal native journey, actual backup/key
failure/restore/transfer behavior, and broader accessibility/usability. The existing
seven mobile audit findings (three moderate, four high) remain untriaged; no forced
upgrades were applied. Ticket 01's outstanding gates remain open. Synthetic-only,
consumer-only, legal/contractual/privacy, production delivery, hosted inactivity and
live-use approval gates are preserved.

## Code review

Both installed review axes ran against the working changes. Standards identified
the cleanup race (fixed with atomic conditional discard) and nonblocking duplicated
cipher/key initialization. Spec accepted the clarified inactivity behavior and
association corrections; its dark-mode notice contrast finding was fixed using the
existing theme. Final Standards and Spec rechecks found no unresolved material
code defect under the explicit local-development sequencing decision. One
nonblocking protected-database initialization duplication smell remains. Actual
verification throttling remains an accepted local-only limitation and mandatory
deployment gate, not a completed requirement. A provisional synthetic-development
commit is appropriate after independent review; no commit or full ticket completion
is authorized by this report.

## Primary-source diagnosis references

- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions)
- [Pinned Auth rate-limit header handling](https://github.com/supabase/auth/blob/v2.197.0/internal/api/middleware.go)
- [Pinned Auth configuration defaults](https://github.com/supabase/auth/blob/v2.197.0/internal/conf/configuration.go)
- [Pinned CLI Auth environment](https://github.com/supabase/cli/blob/v2.122.0/apps/cli/src/commands/start/services/gotrue.service.ts)

## Final security corrections - 2026-10-28

The independent source review found an SDK early-return path where sign-out could
leave local credentials present while the application claimed removal. This is now
corrected. Current-device sign-out stops refresh, attempts supported local-scope
server sign-out, removes only its configured protected session entry, calls
supported SDK local sign-out again to clear client state/notify observers, and
checks both SDK session absence and persisted-entry absence. Failure to verify
cleanup reports an accurate failure. Confirmed local removal without confirmed
server revocation remains an explicit warning, not a claim of immediate revocation.
Other-device revocation remains a separate reauthenticated action.

A focused regression first failed with credentials still present, then passed.
Additional regressions cover thrown connectivity failure, storage cleanup failure,
and restoration using a newly created SDK client after local termination. The
existing successful/discard-cancel and unacknowledged-server cases remain covered.
These are SDK/SQLite fixture checks, not native encryption evidence.

Additive migration `20261028000300_private_function_boundary.sql` is applied after
both existing migrations. The public RPC names/parameters are unchanged and now
use SECURITY INVOKER. Privileged association lives in non-exposed `private` with
SECURITY DEFINER; session lookup remains private. All four relevant functions are
owned by postgres, pin an empty search path, and have execution grants only to
postgres and authenticated. Existing schema usage is sufficient for invoker
wrappers; no new public schema exposure or direct table-write grant was added.
Owner/session checks, exact payload validation and owner-scoped idempotency remain.

The new actual-backend metadata test failed before migration and passed afterward.
Anonymous and authenticated requests selecting the private API schema receive 406.
The existing core suite continues to test public RPC operation and authorization.
Final Jest: 36 tests / seven suites passed. TypeScript and ESLint passed. The strict
verification-rate-limit-only probe was rerun and still fails as explicitly accepted
for synthetic local development; it remains a mandatory real-data/live-use gate.
No Android/iOS rebuild or native authentication test was performed in this step.

Both final code-review axes found zero unresolved material defects. Standards
retains one nonblocking duplication smell in protected-database initialization.
No approved planning document, architecture, phone data, hosting configuration or
repository history was changed. This remains an uncommitted synthetic-data source
checkpoint, not full ticket or live-use acceptance.

Final actual-backend --core run exited 0, including other-device preservation and
fresh-OTP other-session revocation. Local service health/loopback checks passed;
all three migrations are recorded as applied. No teardown or volume deletion occurred.
