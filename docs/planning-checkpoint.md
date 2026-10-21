# Elder Care App v2 planning checkpoint

## Current phase and approval

- Step 18: Application requirements planning is complete through Q1–Q52, using Matt Pocock's `$grill-with-docs` workflow.
- The user approved the requirements baseline as sufficiently complete to proceed toward specification.
- `docs/requirements.md` preserves confirmed requirements, decision context, a consolidated scope summary, and evaluation criteria. Later explicit Q35–Q52 decisions supersede earlier exploratory scope language.
- Root `GLOSSARY.md` contains domain terminology and remains unchanged.
- Step 19 — Technical Specification is complete and formally approved, including the refinements on implementation grouping, architecture simplicity, and decision timing. The Step 18 baseline was committed as 7216e58. No tickets, implementation, or new architectural decisions are authorized by this approval.

## Current stopping point

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
