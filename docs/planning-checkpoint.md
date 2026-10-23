# Elder Care App v2 planning checkpoint

## Current phase and approval

- Step 18: Application requirements planning is complete through Q1–Q52, using Matt Pocock's `$grill-with-docs` workflow.
- The user approved the requirements baseline as sufficiently complete to proceed toward specification.
- `docs/requirements.md` preserves confirmed requirements, decision context, a consolidated scope summary, and evaluation criteria. Later explicit Q35–Q52 decisions supersede earlier exploratory scope language.
- Root `GLOSSARY.md` contains domain terminology and remains unchanged.
- Step 19 — Technical Specification is complete and formally approved, including the refinements on implementation grouping, architecture simplicity, and decision timing. The Step 18 baseline was committed as 7216e58. No tickets, implementation, or new architectural decisions are authorized by this approval.

## Current project status

The requirements, technical specification, and ADRs 0001–0011 are approved; 5b01f4b is the preceding architecture checkpoint. The concrete authorization contract is approved as written and documented in the authoritative specification. This documentation commit closes its review. The project is Ready With Limited Prerequisites for `$to-tickets` drafting, which is the next phase after this commit; no further broad architecture phase or new ADR is required.

Historical stopping instructions and pending-review statements retained below describe earlier sessions and are superseded by this current status. They do not prohibit this approved documentation commit or the subsequent ticket-drafting phase. This closeout operation stops after its Git report without invoking `$to-tickets`, generating tickets, or starting implementation.

## Approved authorization contract and next phase

The specification's "Approved authorization contract" defines Helper/Coordinator defaults, independent scope/audience/delegation checks, and positive/negative backend acceptance criteria. Onward participation-management delegation requires explicit authority; Coordinators may select/reuse/narrow already authorized practical audiences, while expansion/restricted disclosure requires applicable authority. Authorized Coordinator commitment changes preserve history/notice and never imply renewed acceptance. External sharing remains separate from preset, with appropriate initial practical-summary authority granted through ordinary authorization; Helpers have no general sharing authority by default.

Preserve private preparation without inferred disclosure permission, reported permission without claims of legal verification, older-adult authority, conditional representatives, contextual sensitive free text without automatic-detection guarantees, non-user helpers, and backend-validated offline acceptance. Prior requirements and ADRs 0001–0011 are unchanged.

The next activity after this documentation commit is `$to-tickets` drafting, not another broad architecture phase. Remaining bounded identity/session recovery, offline lifecycle/storage, material-change/recurrence edges, notification/sharing delivery, and concrete enforcement choices must be resolved during ticket review before dependent tickets are finalized. Legal/contractual and operational gates remain mandatory before affected real-data/live use. No substantive contradiction currently prevents drafting.

## Historical checkpoints and retained decision context

The following records preserve earlier decision context. References to "current," uncommitted changes, or stopping instructions within this historical section apply to their original checkpoints, not the current project status above.

Latest committed checkpoint: 1837452 approved ADR 0010. ADR 0011 now records approved hybrid recurring arrangements with rolling individual occurrences, with specification/checkpoint changes uncommitted pending review. Earlier pending references below are historical. Stop after summary, conflicts, preservation checks, and Git status; do not commit, ask another decision, invoke `$to-tickets`, create tickets, or implement.

## Current recurring-assistance architecture

Use ongoing arrangements with stable occurrences generated over a bounded rolling future window, extended as needed. Preserve consequential commitments, exceptions, reports, unresolved history, and corrections under existing retention gates. A schedule is not acceptance; ongoing commitments, including attributed outside agreements, ordinarily cover agreed occurrences after one acceptance.

Keep one-occurrence exceptions independent from future commitments and show needed replacement gaps. Future edits preserve history and exceptions; material changes cannot silently expand agreement. Generation is duplicate-safe and identity-preserving, with reliable catch-up after inactivity/failure. Correctness and unattended reminders must not rely solely on mobile opening; a shared lightweight backend mechanism may be needed, not per-arrangement schedulers. Preserve local wall time and named zone; resolve ambiguous/nonexistent-time policies before implementation. Completion is not resolution, and one resolved occurrence does not end the series.

Preserve ADRs 0001–0010, audiences, authority, first-valid acceptance, transactions, offline limits, testing, and live-data gates. Exact patterns, generation window/mechanism, renewed-agreement rules, daylight-saving policies, schema, and implementation remain open. No libraries, scheduler technology, or extra capabilities are selected.

Latest committed checkpoint: 41b1459 approved contextual resolution in ADR 0009. ADR 0010 now records the user's approved limited offline architecture, with specification/checkpoint changes uncommitted pending review. Earlier pending references below are historical. Stop after summary, conflicts, and Git status; do not commit, ask another decision, create tickets, invoke `$to-tickets`, or implement.

## Current offline architecture decision

Use a minimal protected cache of previously authorized essential information for accepted responsibilities and a durable completion-only outbox. Include relevant authorized practical health instructions, not unrelated background or broad comments. Save durably before reporting local success, retaining attribution, timing, responsibility context, and stable operation identifiers through ordinary restarts.

Automatically synchronize when practical at active startup/resume/connectivity restoration; do not depend on background execution or immediate closed-app delivery. Backend identity/authorization/state/material-change/deduplication checks govern acceptance under ADR 0009. Pending is distinct from accepted/shared and never implies others read or verified a report. Retry temporary failures automatically; definitive conflicts/authorization failures need clear authorized recovery, not endless retries or stale overwrites.

Protect local data through encryption, account isolation, secure keys, and device safeguards; if encrypted SQLite is chosen later, verify real builds, recognizing SQLCipher is not in Expo Go. Distinguish replaceable cache and unsent reports for sign-out/switching/withdrawal/cleanup; no silent report destruction or indefinite retention without policy. Disconnected removal cannot be guaranteed; uninstall/device/key loss can make pending reports unrecoverable. No offline acceptance/reassignment/broader editing/invitations/resolution. Exact libraries, encryption/keys, retention, session-transition cleanup, retries, and rejected-report handling remain open. Preserve synthetic-data and all other live-use gates.

Latest committed checkpoint: 2614b5c approved ADR 0009's state/concurrency architecture and first-valid-acceptance rule. ADR 0009 now also records the user's approved contextual resolution behavior with specification/checkpoint updates, uncommitted pending review. Earlier pending references below are historical. Stop after summary, conflicts, and Git status; no further question, commit, ticketing, or implementation.

## Current contextual resolution decision

An authorized participant may expressly report a genuinely addressed need resolved while associated responsibilities remain outstanding. With no remaining work, preserve one-action express resolution and authorized combined completion/resolution. With remaining work, show concise context, allow separately authorized explicit cancellation with history, and otherwise retain visible follow-up in appropriate authorized attention views. Do not imply everything is finished or grant cancellation power merely from resolution authority.

Provide affected Helpers appropriate restrained notice without claiming receipt/action. Resolved-need opportunities must not misleadingly solicit new commitments, without silently dismissing accepted responsibilities or losing history; detailed availability handling remains open. Backend current-state/authorization/conflict checks protect concurrent changes. Corrections preserve attribution and do not revive canceled commitments automatically. Refusal/withdrawal is not successful assistance. Respect information boundaries and avoid comments, universal approvals, or repetitive confirmations. Material-change rules, detailed interfaces/labels, schema, transaction mechanisms, APIs, replacement policy, and unusual conflicts remain open.

Latest committed checkpoint: 3771d1f approved ADR 0008. Pending ADR 0009 documents the approved state/concurrency architecture and now the approved first-valid-committed acceptance rule for available single-person responsibilities. Its specification/checkpoint updates remain uncommitted pending review. Preserve earlier decisions; historical statements below do not reopen committed ADRs. Stop after summary, conflict report, and Git status; no further decision question, commit, tickets, or implementation.

## Current coordination-state decision

Preserve conceptual need/request/responsibility/commitment/report/resolution distinctions. Current backend authorization and invariant checks govern consequential atomic operations. Prevent unintended conflicting single-person commitments, preserve deliberate multi-person help, reject materially stale actions without needless unrelated conflicts, and deduplicate retries. Changes and corrections retain provider/recorder attribution and history and reveal gaps; proposals never imply accepted replacement.

Completion remains a claim, never automatic resolution. Authorized one-action completion plus express resolution records both outcomes atomically without silently dismissing outstanding work. Keep recurring occurrences/history distinct and offline completion provisional until backend checks accept it. Avoid unrestricted client updates, last-write-wins, full event sourcing, workflow engines, and unnecessary confirmation burden; review operation permissions/security context. Material-change rules, resolution with outstanding work, labels, schema, transaction mechanisms, detailed interfaces, APIs, and unusual conflict cases remain open.

Single-person acceptance is now settled: first valid acceptance committed by the backend secures an explicitly available exclusive responsibility, after current authorization, availability, state, performer restrictions, preferences, and authority checks. Respect existing valid commitments including outside agreements. Competing attempts get a simple already-arranged outcome; successful lost-response retries return the prior result without duplication or bypassing current access. Interest alone is not acceptance. Preserve deliberate multi-person help and separate completion/resolution; no mandatory Coordinator approval or redundant ordinary confirmation.

Latest committed checkpoint: e1ca19d approved ADRs 0006–0007 and associated documentation. ADR 0008 now records the user's approved context-based visibility defaults with specification/checkpoint updates, pending review and commit. Earlier uncommitted references below are historical. Stop after summary, conflict report, and Git status; do not commit, ask another decision, invoke `$to-tickets`, create tickets, or implement.

## Current visibility-default decision

ADR 0008: new needs ordinarily remain in their authorized coordination context unless an applicable Helper audience is explicitly established. Appropriate new needs and recurring occurrences automatically inherit deliberately authorized ongoing audiences/scopes without repeated ordinary selection. Coordinators retain visibility into unresolved work within their authorized scope even when no Helper audience applies; otherwise an opportunity can be made available through one simple choice.

Helpers remain limited to authorized opportunities and practical context. Relevant health information may be included appropriately; restricted background remains separately protected. Comments/context follow their audience, and consequential broadening must make existing disclosure understandable without redundant confirmations. Explain visibility plainly without per-field classification. Preserve distinctions between visibility, acceptance, completion, and express resolution. Apply backend and downstream controls, older-adult preferences, authority, and all prior gates. Exact labels, interactions, database representation, and enforcement remain open; no new presets, hierarchies, marketplace, or configuration system.

ADR 0007 now records approved limited default Helper scope plus authorized discovery of additional unclaimed assistance opportunities. ADR 0006 and its pending changes are preserved. Both ADRs and specification/checkpoint updates remain uncommitted for review. Latest committed architecture checkpoint remains 52f0191. Stop after documentation summary, conflicts, and verification; no further question, ticketing, implementation, or commit this turn.

## Current Helper scope decision

Helpers ordinarily see only explicitly available authorized needs, responsibilities, and practical information, not all arrangement needs or restricted background by joining. Ongoing scope can cover recurring and other ordinary ongoing involvement without repeated authorization. Authorized Coordinators can make suitable unclaimed opportunities available to selected Helpers or authorized Helper audiences without assigning each responsibility. Visibility is not commitment; Helpers may volunteer or accept under existing rules without arrangement-wide access.

Follow ADR 0005 information audiences, relationship-specific backend enforcement, older-adult preferences, and applicable authority. Provide enough authorized practical context without unrelated sensitive disclosure. Avoid a third preset, marketplace, new coordination circles, and repetitive permission administration. Exact scope interactions, opportunity defaults, audience labels, and implementation mechanisms remain open.

Latest checkpoint: 52f0191 committed ADRs 0004 and 0005. The user now approves the Helper/Coordinator decision recorded in ADR 0006, with specification and checkpoint updates pending review and commit. Earlier statements below about uncommitted ADRs 0004–0005 are historical and superseded by this checkpoint. Do not commit, invoke `$to-tickets`, create tickets, or implement. Continue one consequential decision at a time after reporting this update.

## Current participation preset decision

ADR 0006 selects Helper and Coordinator; occasional/ongoing assistance is authorized scope, not a third preset. Helpers perform authorized assistance and suggest changes without broader management. Coordinators arrange assistance and resolve needs within authorized scope and may also help. Participation management, restricted-background access, external disclosure, and exceptional Helper resolution remain distinguishable and appropriately controlled. Established permission should let the initial authorized Coordinator invite simply without redundant administrative approvals; private creation itself grants no sharing authorization.

No older-adult preset is needed; effective preferences and authority are independent of involvement. Regular helping does not broaden access, recurring scope avoids redundant grants, and permissions remain independent across older adults. Non-users need no preset/account. Preserve combined completion/resolution when both permissions apply, ADR 0005 audiences, delegation limits, and all existing live-data gates. Exact scopes, audience defaults, delegation interactions, schema, and enforcement remain open.

Latest approved architecture checkpoint: effa022 committed ADRs 0002 and 0003 with specification/checkpoint updates. The user approved the directions recorded in ADR 0004 (relationship-specific authorization) and ADR 0005 (contextual information audiences). Both ADRs and associated specification/checkpoint changes remain pending review and commit; preserve them without staging or committing. Stop after reporting documentation changes and Git status. No tickets, implementation, or further decision question is authorized for this turn. Earlier pending-review references below describe prior checkpoints and do not reopen committed decisions.

## Current authorization decision

ADR 0004 selects per-arrangement authorization with need/responsibility scope where appropriate, a few understandable presets, and separately controlled information access, participation management, commitments, completion, and explicit need resolution. Management does not imply blanket sensitive access or resolution authority. Preserve combined completion/resolution where both permissions apply, non-user helpers without access, and conditional representative authority.

Use conservative practical-information versus restricted-background audiences across all information and disclosure channels. Do not require per-field/sentence classification or depend on automatic medical-content detection. Enforce current permissions in the backend; RLS alone does not protect individual sensitive fields, and stale token claims or interface restrictions are insufficient. Changes and disputes must affect future access proportionately while preserving attribution and recognizing previously disclosed/offline-copy limits.

ADR 0005 now settles the conceptual audience boundary: limited explicitly authorized practical information versus separately restricted background, based on legitimate need rather than medical/nonmedical classification. Information and comments ordinarily follow their authorized context; users should understand who can see entries without per-field/sentence configuration. Joining, accepting work, or managing participants must not broaden background access automatically. If broader disclosure is supported, require a deliberate understandable choice without redundant confirmation. Do not rely on automatic classification; apply backend and downstream protection consistently.

Exact presets, audience labels/default assignments, audience-changing interactions, schema, SQL policies, delegation limits, and enforcement mechanisms remain undecided. Preserve simplicity, consumer-only scope, all existing requirements, and ADR 0001 contractual and live-data gates. ADR 0004 remains intact and uncommitted alongside ADR 0005.

Q52 and Step 19 are complete. The user formally approved `.scratch/elder-care-app-v2/spec.md`, titled "Elder Care App v2 MVP technical specification," including all 72 behavioral stories and the three targeted refinements. The authoritative specification retains its required `ready-for-agent` status and is included directly in Git; `.scratch` is not excluded, so no archival copy is necessary. The older `docs/technical-specification-review.md` is a pre-refinement review snapshot, not the approved specification or an exact archive of it. Approval is recorded here without changing the authoritative specification's contents or metadata. Its historical pending-review wording describes publication history and is superseded by this formal approval record.

Step 19 closeout was accepted at commit 5403bb4; the obsolete review copy was subsequently deleted. Foundational architecture planning has resumed, limited to documenting the two approved decisions below. Stop for user review without committing, invoking `$to-tickets` or `$implement`, changing application code, or selecting other unresolved technologies. Consequential choices require approval before dependent tickets are finalized; live-use gates remain mandatory.

## Current authentication planning decision

The consumer-only model and qualified Supabase backend decision were committed as bfaf436. The user now approves Supabase Auth emailed one-time codes as primary, with securely retained sessions; passwords and passkeys are deferred. ADR 0002 records the decision. This documentation update is uncommitted and awaits review; no ticketing or implementation is authorized.

Learning and appropriate private preparation need not require authentication where practical. Protected shared access and collaborative actions require authentication plus separate backend authorization. Preserve stable identity across email/device/care relationships, minimal invitation disclosure, joining separate from responsibility acceptance, and account-free recording of outside helpers.

Original-email recovery uses ordinary codes. Invitation authorization, lost-email recovery, email changes, exceptional verification, exact session/storage/revocation and OTP settings, additional verification for sensitive actions, and transactional email vendor remain open for separate review. Plan secure mobile retention, sign-out and lost/shared-device protections, and actual Expo iOS/Android code-flow testing during implementation. OTP is not phishing-resistant or MFA. ADR 0001's legal, contractual, consumer-health, and synthetic-data conditions remain in force.

ADR 0003 now records the approved invitation/joining boundary: expiring, revocable designated-recipient invitations, ordinarily by email, with authenticated backend checks of recipient eligibility, invitation validity, and current inviter authority. Forwarded links alone grant no sensitive access. Joining is distinct from responsibility acceptance and does not establish legal authority or broader access. Keep disclosure minimal in emails, URLs, previews, and unauthenticated screens; request details follow appropriate authorization. Different-email users obtain a corrected invitation securely, not a bypass. Inbox control does not independently establish real-world identity or legal authority. Maintain relationship-specific access and account-free outside-helper recording with minimal routine administration.

Exact matching rules, expiration duration, revocation mechanics, and detailed authorization policies remain unresolved. ADR 0002, ADR 0003, and their specification/checkpoint changes remain uncommitted pending review. Stop for review; do not commit, ask a further decision, or begin implementation.

## Approved post-Step-19 decisions

- Consumer-only business model: individuals and families are customers; no healthcare organization, hospital, health plan, or care agency customers/administrators, and no operation on behalf of HIPAA-covered entities or business associates for patient-information management. Individual professionals may participate in family-authorized coordination; that is not organizational use. This explicitly supersedes earlier organizational-customer exploration.
- Permit voluntary diagnoses, conditions, medication names and dosages, physician names, appointments, mobility limitations, and practical care instructions where useful. Treat these as sensitive consumer health information without requiring comprehensive profiles or expanding into dose reminders, structured tracking, clinical decisions, or monitoring.
- Supabase Cloud managed PostgreSQL is selected as the backend direction under ADR 0001: authoritative shared data, backend enforcement with row-level security where appropriate, controlled transactional operations, narrow authorized local information, and durable offline completion with revalidation, conflict handling, and duplicate prevention.
- Ordinary paid hosting is intended; written Supabase confirmation permitting this consumer-health use has not been received. HIPAA-specific hosting is outside the budget. Do not claim ordinary hosting is HIPAA-compliant or infer contractual permission from HIPAA non-applicability. An actual restriction requires reconsidering hosting before live use.
- Use synthetic development data until legal, contractual, privacy, and security requirements are validated. Before real personal or health-related processing, evaluate HIPAA applicability, the FTC Health Breach Notification Rule, state laws, and vendor contracts. Consumer positioning is not a legal exemption.
- ADR 0002 now selects Supabase Auth email codes with secure session retention. Schema, local storage libraries, notification infrastructure, and other unresolved choices remain open. Managed services and minimal maintenance must preserve simplicity and safeguards.

## Confirmed Step 19 testing decision

- Prefer a small number of high-level behavior-testing boundaries exercising cooperating components. Use focused tests for authorization enforcement, security, and offline reliability; interface restrictions alone do not establish authorization correctness.
- Include acceptance criteria for simplicity, minimal user effort, clear statuses, no unnecessary confirmations, and no repeated entry of known information. Preserve optional steps, external commitments without repeat acceptance, simple needs without mandatory separate coordinators, and authorized one-action completion plus express resolution.
- Keep automated correctness tests distinct from Q48–Q52 human usability evaluation. Automated behavior assertions do not establish that people understand or can easily use the application.
- Use practical solo-developer techniques, minimal infrastructure, and few mocks. A smaller set of device-level checks covers navigation, accessibility, notifications, persistence, and sharing.
- Specific test tools remain undecided. The backend direction is now selected in ADR 0001, subject to contractual validation; detailed architecture choices remain open. No existing coordination-test prior art was found in the Expo starter.

## Confirmed scope

The MVP delivers ordinary coordination from minimal onboarding and permission through needs, invitations, directly accepted or externally reported commitments, visible gaps, changes, completion, and explicit need resolution. Simple authorized activities may combine completion and express resolution in one action; completion alone never automatically resolves a need.

Confirmed supporting capabilities include basic recurrence, contextual comments, minimal purpose-relevant information with access boundaries, restrained notifications, accessibility, distinct identities and recovery, time-zone handling, essential offline viewing, limited offline completion, practical external sharing, and ordinary medication-assistance coordination. Participation ending, access withdrawal, and authorization-concern protections are included.

Dedicated medication-dose reminders and structured dose tracking are deferred, along with broader offline editing, comprehensive messaging, organizational administration, sophisticated shared-device support, multiple circles, dedicated sensitive-record repositories, elaborate scheduling and escalation, comprehensive exports and reporting, professional emergency monitoring, and international expansion. See the requirements summary for full boundaries.

Representative-based authorization is conditional intended MVP scope: validate a workable, legally appropriate safeguard and review process before launch, or explicitly narrow supported launch scenarios. Unsupported claims must not justify unrestricted access.

## Confirmed evaluation

- Stage 1: approximately five individual synthetic-data usability sessions, about 30 minutes with up to 45 minutes where useful, including at least two participants with limited smartphone confidence. Distribute scenarios; use observation and targeted retesting, not exhaustive questionnaires.
- Q51 criteria: independent task completion, correct understanding, and correction/retesting of material problems before affected functionality enters live use. Five-minute first-need and 30-second attention-recognition targets are diagnostic, not hard pass marks.
- Stage 2: approximately three real family arrangements over approximately four weeks after applicable safeguards. Ideally an older adult and at least two helpers per arrangement; older-adult app use and manufactured activities are not required.
- Q52 outcomes: reduced effort, clear coordination, dependable behavior, and acceptable burden and trust. Use brief baseline and closing conversations and an optional midpoint check-in, without diaries or rigid numerical success thresholds.
- Treat results as preliminary; capabilities not encountered naturally remain unevaluated in live use. Material unresolved problems require appropriate restrictions or pausing affected use. Maintain fallback coordination and a realistic significant-problem reporting route.

## Next steps after Step 19 closeout

1. Await the user's instruction to plan the next phase; do not invoke ticketing or implementation workflows automatically.
2. Review ADR 0002 and resolve remaining consequential decisions before dependent tickets are finalized. Supabase Cloud/PostgreSQL and email-code authentication are selected; schema, local library, detailed synchronization, invitation authorization, exceptional recovery, and session policies remain open. Obtain contractual confirmation and validate applicable obligations before real-data use.
3. Explicitly evaluate offline-completion development and testing implications.
4. Track pre-live-use privacy, security, legal, retention/deletion, authorization, reliability, and operational conditions. Define dispute reviewers, protective actions, unresolved-concern handling, and representative safeguards. Validate supported launch scenarios and address material usability issues before live testing.

## Important project instructions

- Simplicity, accessibility, low friction, minimal setup, and minimal administration are fundamental. The application should handle complexity so its users do not have to.
- Do not reopen feature discovery unless a specific material gap prevents specification. If clarification is necessary, ask one question at a time.
- During this documentation task, record only the two expressly approved decisions; do not modify application code, choose additional technologies, commit, or begin ticketing or implementation.
- Preserve confirmed requirements, useful historical context, and the glossary. Distinguish confirmed scope, deferred capabilities, conditional support, specification decisions, and launch gates.
- Follow `AGENTS.md` and the configured domain, issue-tracker, and triage instructions when those activities apply.
