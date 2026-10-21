# Elder Care App v2 planning checkpoint

## Current phase and approval

- Step 18: Application requirements planning is complete through Q1–Q52, using Matt Pocock's `$grill-with-docs` workflow.
- The user approved the requirements baseline as sufficiently complete to proceed toward specification.
- `docs/requirements.md` preserves confirmed requirements, decision context, a consolidated scope summary, and evaluation criteria. Later explicit Q35–Q52 decisions supersede earlier exploratory scope language.
- Root `GLOSSARY.md` contains domain terminology and remains unchanged.
- The next phase is specification. `$to-spec` has NOT been invoked. No architecture, implementation, or application-code work has begun as part of this cleanup.

## Current stopping point

Q52 is complete; no requirements question is pending. The user requested targeted documentation reconciliation before reviewing the result and creating their own Git checkpoint. Stop after reporting the cleanup. Do not invoke `$to-spec` or create the Git checkpoint on the user's behalf.

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

## Next steps after user review and Git checkpoint

1. Await explicit instruction to invoke `$to-spec`; baseline approval is not authorization to invoke it during this turn.
2. During specification, define exact fields, access and resolution authority, recurrence patterns, corrections, notification defaults, sharing contents, offline conflict handling, acceptance tests, and technical choices without reopening settled scope unnecessarily.
3. Explicitly evaluate offline-completion development and testing implications.
4. Track pre-live-use privacy, security, legal, retention/deletion, authorization, reliability, and operational conditions. Define dispute reviewers, protective actions, unresolved-concern handling, and representative safeguards. Validate supported launch scenarios and address material usability issues before live testing.

## Important project instructions

- Simplicity, accessibility, low friction, minimal setup, and minimal administration are fundamental. The application should handle complexity so its users do not have to.
- Do not reopen feature discovery unless a specific material gap prevents specification. If clarification is necessary, ask one question at a time.
- Do not modify application code, begin architecture or implementation, or invoke `$to-spec` during documentation cleanup.
- Preserve confirmed requirements, useful historical context, and the glossary. Distinguish confirmed scope, deferred capabilities, conditional support, specification decisions, and launch gates.
- Follow `AGENTS.md` and the configured domain, issue-tracker, and triage instructions when those activities apply.
