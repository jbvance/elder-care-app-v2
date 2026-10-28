# Ticket 02 native Android validation — 2026-10-28

Review checkpoint for independent evaluation. No completion declaration or commit is authorized by this report.

## Initial state and environment

HEAD was `0b22a5e71d07f6e69bc9ab6f6a16d6a286e55363`; Git working tree was clean. The connected Samsung SM-S921U1 reported Android 16 and was ADB-authorized. Git and Docker required their installed paths in this shell.

The existing local health script passed: five required containers running, configured health checks healthy, PostgreSQL SQL/host TCP and Auth/PostgREST/Mailpit reachable, effective Auth settings checked. Docker publications and Windows backend listeners remained loopback-only. No paid/hosted services, real recipients, public exposure, data reset, uninstall, or ADB-key reset was used.

The ARM64 debug build passed using JDK 17, `%TEMP%/elder-care-gradle`, CMake 3.31.6 and the documented Gradle arguments. `adb install -r` succeeded preserving app data. USB reverse was limited to ports 8081 and 54321. The existing Metro process served status but the app remained on its splash screen. Restarting that specific Metro process with process-local `NODE_OPTIONS=--dns-result-order=ipv4first`, followed by app relaunch, restored normal operation. Its listener was checked at 127.0.0.1:8081. No source correction was required.

## Actual device and backend observations

The existing synthetic `Fictional Native Morgan` / `Synthetic grocery trip` draft survived the in-place installation. It was opened through Revisit private draft and returned through Done for now. This session reused that previously prepared fixture; it did not replace or erase the draft to manufacture a fresh start.

Using the native account form, `native-t02-20261028-a@example.test` requested a numeric email code. Local Mailpit captured it. The code was entered privately through ADB into the actual app form; no OTP, encryption key, or authentication token was printed. Sign in established the account session. The native screen explicitly retained the device-only draft and showed no saved arrangements. Actual PostgreSQL owner-filtered counts were zero before and after authentication, before association.

Tapping Save my draft to this account displayed the matching private arrangement and an acknowledged success message. PostgreSQL reported exactly one row and one distinct operation ID for that owner. After force-stop and launch, the home screen offered Prepare an assistance need instead of showing the redundant draft. Opening the account restored authentication without another code and retrieved the matching arrangement. The association prompt was absent. These observations support successful ordinary association, retrieval and logical anonymous-draft cleanup; they do not establish forensic erasure or interrupted-association retry behavior on-device.

Existing debug access listed separate 8192-byte account-v1.db and anonymous-v1.db files in the app-private directory. A process inspected their bytes in memory, reporting only size and Boolean checks: neither had the plaintext SQLite header; neither contained the checked fixture email, grocery description, access_token or refresh_token markers. No database copy, key or session was emitted. Together with native persistence/restoration through the committed SQLCipher-checking adapter, this supports ordinary protected persistence on this device. It does not establish key-loss, corruption, backup, transfer, reinstall or every possible plaintext-leakage property. The anonymous database file remains allocated after logical cleanup.

Current-device sign-out returned to the unauthenticated email form with the account identity and arrangement absent. PostgreSQL reported zero sessions for fixture A. After a second force-stop/launch, opening the account still presented the unauthenticated form without protected account contents.

## Verification boundaries

This session's TypeScript and ESLint checks passed. Native build/install and the local backend health check passed. The prior 36 Jest tests across seven suites and prior backend authorization/core integration results remain historical evidence; they were not rerun merely to repeat implementation verification. No new source behavior was introduced.

The strict local OTP verification-throttling failure remains accepted only for fictional local development and is not converted into a pass by this journey. Effective server-side verification throttling remains mandatory before real-information or live-family use. Hosted Pro-only inactivity configuration/validation remains deferred; no custom rate limiter or inactivity framework was added.

Still unverified in this bounded native session: iOS; native key failure, interrupted writes/association and retry, actual backup/restore/transfer/reinstall, replacement-device access, other-device revocation through the native interface, elapsed inactivity expiry, connectivity failures and broader foreground-refresh edge cases. Accessibility/usability evaluation and all ticket 01 remaining acceptance, legal/contractual, retention/deletion, production delivery and live-use gates remain open.

The test helper needed an ignored local-only PowerShell correction: array `.Address` resolves an array method on this Windows PowerShell, so recipient selection now explicitly enumerates each recipient. Resend countdown updates can prevent UIAutomator from reaching idle; waiting until the countdown ends allows hierarchy capture. A development warning overlay blocked Sign in taps until dismissed. Some bottom controls needed scrolling above system navigation before tapping. These are recorded test/tooling observations; no material application/security defect was established and no consequential correction was made.

## Second identity, final state and recommendation

Fixture B (`native-t02-20261028-b@example.test`) also completed native numeric-code sign-in. Its screen showed no private arrangements, no Morgan content and no device-draft association prompt. Ordinary current-device sign-out returned to the email form. Its manually entered email remained in the in-memory form immediately after sign-out; this was input retained by that screen, with no account arrangement displayed. A force-stop/relaunch cleared the email as well, and opening the account presented a blank unauthenticated form. Treat the transient retained address as a privacy/usability review observation, not evidence of a retained authenticated session.

Final actual PostgreSQL counts: A had one arrangement and zero sessions; B had zero arrangements and zero sessions. This confirms the observed nonduplicated outcome and ordinary account separation for these fixtures. Native fault-injected retry/idempotency and immediate stale-token denial were not retested here; the earlier backend boundary tests remain separate evidence.

The final local backend health check passed again. The phone was left signed out, with the successfully associated synthetic A arrangement retained in the local backend and no anonymous draft shown. The backend, Metro and two USB reverse mappings remain available for continued local development. Mailpit and synthetic identities were retained; no cleanup of unrelated data occurred.

No material code defect was established. Investigate the development warning and transient email-field retention during the remaining usability/privacy review; any requested correction should remain small and receive its appropriate validation. No application source, migration, dependency, architecture or security configuration was modified, and no implementation diff exists to send through the two-axis code-review workflow.

At the review checkpoint, HEAD remains the approved commit. The sole non-ignored working-tree addition is this untracked report (`docs/ticket02-native-android-validation.md`); tracked files have no changes and `git diff --check` passed. Ignored `.expo` UI artifacts/helper changes remain local. No commit was made, no ticket acceptance/status was changed and ticket 03 was not started.

Recommendation: accept this as bounded Android happy-path evidence, submit it for independent evaluation, then select the remaining native failure/recovery and iOS checks before any full ticket acceptance. Preserve the accepted local throttling failure, deferred hosted inactivity gate and all real-information/live-use requirements.

## Authorized UI closeout — 2026-10-28

The user approved the preceding core Android observations and authorized a narrow correction for transient email retention. The preceding sections describe the original validation session; statements there about no source changes and historical test totals apply to that session only.

Both current-device sign-out handlers now use one screen-level helper. It awaits the existing account service's sign-out completion, then clears entered email/code, code-request/resend state, the other-device confirmation mode and the draft-discard confirmation. This also covers the existing Sign out here recovery path, which uses the discard confirmation handler. The account-service contract, local credential removal, server-revocation warnings, backend protections and other-device revocation behavior are unchanged. If sign-out rejects, the helper does not reset those inputs or confirmation state; the existing error and retry path remains available. Canceling draft-discard sign-out leaves inputs and the draft untouched.

Two successful-sign-out UI cases (with and without an unassociated draft) first failed against the unchanged screen because the old email was still visible. After the correction, all five focused account-screen tests passed. They cover the existing deliberate-association journey, both successful sign-out paths with a pending confirmation code, failed sign-out recovery and canceling sign-out. The next code request is also checked to start with an empty code field and no inherited resend wait. These are automated JavaScript UI/service-fixture tests, not new native encryption or backend authorization evidence.

The full Jest run passed: 40 tests across seven suites. The native recheck, static checks and review results are recorded below. No backend migrations, dependency upgrades or planning/status changes are part of this closeout.

### Automated closeout checks

Commands ran from `C:\projects\elder-care-app-v2\mobile`:

- `& .\node_modules\.bin\jest.cmd --runInBand src/features/account/__tests__/account-screen.test.tsx` — 5 tests passed after the correction. Before the correction, the two successful-sign-out cases failed on retained email; the other three passed.
- `& .\node_modules\.bin\jest.cmd --runInBand` — 40 tests across seven suites passed.
- `& .\node_modules\.bin\tsc.cmd --noEmit` — passed, exit 0.
- `& .\node_modules\.bin\expo.cmd lint` — passed, exit 0.

`git diff --check` was run from the repository root and passed. Git warned that LF would be normalized to CRLF on subsequent Git operations; no whitespace error was reported. Subsequent edits were confined to this report, so successful code checks were not rerun.

The existing local backend health script also passed at this closeout's environment check. It does not establish that the strict verification-throttling assertion passes. Actual backend security/core integration tests were not rerun for a screen-only state change.

### Follow-up native outcome

The existing installed Android debug build loaded the corrected JavaScript through Metro; no new APK build/install or app-data reset was needed for this screen-only change. The Samsung remained ADB-authorized. During the follow-up, UIAutomator could not reach idle while the resend countdown was updating. The helper then attempted to parse the missing dump's error text as XML. These were automation failures, not evidence of an application defect. Retrying hierarchy capture after the countdown settled recovered the existing helper without changing app code or device settings.

An initial sign-in attempt displayed the generic incorrect/expired/already-used code error; this alone does not establish which condition occurred. The next request displayed a connection error. Inspection showed both USB reverse mappings absent after the device transport changed. Restoring only tcp:54321 and tcp:8081 allowed a fresh fictional Mailpit email and successful native sign-in for fixture B. No OTP, token or key was printed.

Tapping Sign out on this device then immediately displayed a blank Email address field and Email me a code button, without an OTP field, resend countdown or stale account controls. This was observed in the same running app without force-stop/restart after sign-out. A PostgreSQL query showed zero sessions for fixture B. Thus the ordinary successful-sign-out display correction was reverified on Android. The pending-OTP, confirmed draft-discard, failure and cancellation cases received automated UI coverage; they were not additionally exercised on the physical phone in this follow-up.

### Independent review and final scope

The installed two-axis code-review workflow reviewed the working changes against `0b22a5e71d07f6e69bc9ab6f6a16d6a286e55363`; no commits exist after that base. Because committing was expressly forbidden, reviewers used the working diff and read this untracked report separately.

Standards: zero findings; the shared helper and focused tests follow repository guidance without added machinery. Spec: zero findings; successful cleanup, failure recovery, cancellation and scope boundaries are preserved. Reviewers required the pending report results to be finalized; those results are now recorded above. No material finding required another code change.

HEAD remains `0b22a5e71d07f6e69bc9ab6f6a16d6a286e55363`. The final deliverable consists of two modified tracked files (account-screen.tsx and its existing UI test file) plus this untracked report. No staged files, commits, pushes, backend/migration/dependency changes, acceptance-status edits or ticket 03 work occurred. Ignored local .expo testing artifacts remain outside the commit scope. A small follow-up commit is appropriate after independent approval; suggested message: `Clear account form after sign-out and record Android validation`.

### Remaining acceptance and release gates

This milestone is bounded Android happy-path evidence plus the narrow form-state correction, not full ticket 02 acceptance. Ticket 01's outstanding acceptance work also remains open.

- iOS native validation; selected native SQLCipher/SecureStore key-failure and recovery scenarios; interrupted writes/association and retries; actual backup/restore, device transfer and reinstall; replacement-device recovery.
- Native other-device revocation, connectivity/failure cases and broader foreground-refresh behavior not exercised by this follow-up. Prior backend boundary evidence remains distinct from on-device validation.
- Effective server-side OTP verification throttling before real-information or live-family use. The strict pinned-local-CLI probe remains failing and accepted only for synthetic local development; this closeout did not rerun it or convert it into a pass.
- Hosted refresh-based inactivity configuration and actual expiry/reauthentication verification in an approved suitable environment. No paid environment or custom inactivity framework is authorized here.
- Broader accessibility/usability assessment, development-warning investigation, dependency and release-security assessment, applicable privacy/legal/vendor-contract suitability, retention/deletion and operational safeguards, production email delivery and explicit live-use readiness approval.

The encrypted-file inspection above is limited to sampled files/header/marker checks and ordinary native restoration. It is not exhaustive leakage analysis, forensic erasure, key-failure, backup or transfer validation. Synthetic information only remains mandatory.

Recommended next step: independently review and approve this small closeout before committing; then select the remaining ticket 02 native/security validation work and assess ticket 03 prerequisites separately. No transition to ticket 03 implementation is authorized by this report.
