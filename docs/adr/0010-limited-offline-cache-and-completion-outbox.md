# Use a protected essential-information cache and completion outbox

Use a minimal protected local information store and a durable completion-only outbox, with foreground-first automatic synchronization and authoritative Supabase/PostgreSQL validation. This supports temporary connectivity interruptions without general-purpose replication infrastructure; the application should handle complexity so users do not have to.

## Approved architecture and boundaries

- Cache only previously available essential practical details required for accepted responsibilities, including appropriately authorized health instructions. Exclude unrelated sensitive background, broad comment histories, and unnecessary information.
- Durably persist completion reports for already accepted responsibilities before representing them as saved locally. Preserve them through ordinary application restarts and temporary connectivity interruptions.
- Pending reports retain sufficient attribution, relevant timing, responsibility context, and a stable operation identifier. Repeated submissions reuse the operation identity to prevent duplicate records, including after a lost network response, without bypassing current access restrictions.
- Automatically synchronize when practical while active, including startup, resumption, and connectivity restoration. Background synchronization is an optional future improvement, never a guarantee or correctness dependency; the OS need not run the app or deliver reports immediately while closed.
- PostgreSQL remains authoritative. Backend acceptance validates current identity, authorization, responsibility state, material changes, and duplicate submissions using the coordination and concurrency safeguards of ADR 0009.
- Distinguish pending local reports from reports successfully accepted and shared. Local persistence implies neither receipt by others nor independent verification; successful sharing does not establish reading, acknowledgment, or action.
- Retry temporary network failures automatically without unnecessary user intervention. Definitive conflicts or authorization failures must not retry endlessly. For changed responsibilities, explain the outcome and provide an appropriate authorized recovery path without overwriting newer information or falsely reporting sharing.
- Protect retained sensitive consumer health information with suitable encryption, account isolation, secure key handling, and appropriate device protections. No storage library or encryption/key-management implementation is selected.
- If encrypted SQLite is later selected, verify encryption in actual iOS and Android builds. Do not assume configuration establishes encryption; SQLCipher is unavailable in Expo Go.
- Distinguish replaceable cache from unsent reports in sign-out, account switching, device loss, withdrawal, and cleanup design. Do not silently destroy unsent reports or retain sensitive information indefinitely without an approved policy. This principle does not authorize exposing or uploading records after permission ends.
- Remote withdrawal cannot guarantee immediate removal from a disconnected device. Uninstall, device loss, or key loss may make pending local reports unrecoverable; restart durability is not cross-device recovery or a backup guarantee.
- Offline completion does not enable acceptance, reassignment, broader edits, invitation management, or express need resolution. No new conflict-resolution dashboard or user-facing synchronization administration is authorized.
- Preserve authorization, audiences, state, attribution, and all safeguards under ADRs 0001–0009. Use synthetic development information until legal, contractual, privacy, and security conditions for real data are satisfied.

## Rationale and alternatives

An in-memory queue cannot survive ordinary restarts. A broad offline-first replication framework introduces conflict, retention, and maintenance work beyond the approved capability. A narrow protected store with a durable outbox provides the required reliability while limiting retained data and custom infrastructure.

Foreground-first synchronization avoids reliance on iOS/Android background execution and unnecessary battery use. It means pending reports may remain unshared until the application is active and connected; communicate this without requiring manual synchronization in ordinary use.

## Unresolved choices and consequences

Exact storage libraries, local data representation, encryption and key management, retention durations, sign-out/account-switching policies, retry timing and classification details, rejected-report retention and recovery, and backend/API implementation remain for subsequent review or planning as appropriate. Resolve consequential dependencies before related tickets are finalized and validate actual device behavior before live use.

Durability, local isolation, revocation, safe retries, and material-change handling require focused testing in addition to human usability evaluation. Encryption does not itself solve unlocked-device exposure, backup handling, or disclosure outside the app. Preserve the approved testing and launch gates and prefer the simplest reliable solo-developer implementation. No implementation, tickets, additional technology selection, or commit is authorized.
