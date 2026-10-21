# Elder Care App v2 planning checkpoint

## Current phase and approval

- Step 18: Application requirements planning is complete through Q1–Q52, using Matt Pocock's `$grill-with-docs` workflow.
- The user approved the requirements baseline as sufficiently complete to proceed toward specification.
- `docs/requirements.md` preserves confirmed requirements, decision context, a consolidated scope summary, and evaluation criteria. Later explicit Q35–Q52 decisions supersede earlier exploratory scope language.
- Root `GLOSSARY.md` contains domain terminology and remains unchanged.
- Step 19 — Technical Specification is complete and formally approved, including the refinements on implementation grouping, architecture simplicity, and decision timing. The Step 18 baseline was committed as 7216e58. No tickets, implementation, or new architectural decisions are authorized by this approval.

## Current stopping point

Q52 and Step 19 are complete. The user formally approved `.scratch/elder-care-app-v2/spec.md`, titled "Elder Care App v2 MVP technical specification," including all 72 behavioral stories and the three targeted refinements. The authoritative specification retains its required `ready-for-agent` status and is included directly in Git; `.scratch` is not excluded, so no archival copy is necessary. The older `docs/technical-specification-review.md` is a pre-refinement review snapshot, not the approved specification or an exact archive of it. Approval is recorded here without changing the authoritative specification's contents or metadata. Its historical pending-review wording describes publication history and is superseded by this formal approval record.

Stop after the Step 19 closeout commit. Plan the next phase with the user; do not invoke `$to-tickets` or `$implement`, modify application code, or silently finalize architectural choices. Consequential choices still require approval before dependent implementation tickets are finalized; live-use gates remain mandatory.

## Confirmed Step 19 testing decision

- Prefer a small number of high-level behavior-testing boundaries exercising cooperating components. Use focused tests for authorization enforcement, security, and offline reliability; interface restrictions alone do not establish authorization correctness.
- Include acceptance criteria for simplicity, minimal user effort, clear statuses, no unnecessary confirmations, and no repeated entry of known information. Preserve optional steps, external commitments without repeat acceptance, simple needs without mandatory separate coordinators, and authorized one-action completion plus express resolution.
- Keep automated correctness tests distinct from Q48–Q52 human usability evaluation. Automated behavior assertions do not establish that people understand or can easily use the application.
- Use practical solo-developer techniques, minimal infrastructure, and few mocks. A smaller set of device-level checks covers navigation, accessibility, notifications, persistence, and sharing.
- Specific test tools and backend architecture remain undecided. No existing coordination-test prior art was found in the Expo starter.

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
2. Resolve consequential open decisions documented in the approved specification before dependent implementation tickets are finalized, without reopening settled scope unnecessarily. No provider, database, authentication method, or synchronization architecture is selected by approval of this synthesis.
3. Explicitly evaluate offline-completion development and testing implications.
4. Track pre-live-use privacy, security, legal, retention/deletion, authorization, reliability, and operational conditions. Define dispute reviewers, protective actions, unresolved-concern handling, and representative safeguards. Validate supported launch scenarios and address material usability issues before live testing.

## Important project instructions

- Simplicity, accessibility, low friction, minimal setup, and minimal administration are fundamental. The application should handle complexity so its users do not have to.
- Do not reopen feature discovery unless a specific material gap prevents specification. If clarification is necessary, ask one question at a time.
- During closeout, do not modify application code, make architecture decisions, or begin ticketing or implementation.
- Preserve confirmed requirements, useful historical context, and the glossary. Distinguish confirmed scope, deferred capabilities, conditional support, specification decisions, and launch gates.
- Follow `AGENTS.md` and the configured domain, issue-tracker, and triage instructions when those activities apply.
