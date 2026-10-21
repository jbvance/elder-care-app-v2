# Elder Care App v2 MVP technical specification

Status: ready-for-agent

Review state: Step 19 formally approved at commit 5403bb4. Subsequent consumer-business-model and Supabase decisions are recorded below for user review. The required status does not authorize tickets, implementation, or unresolved architecture choices.

Baseline: approved requirements Q1–Q52, committed as 7216e58, plus the subsequently approved Step 19 testing decision. Later explicit baseline decisions govern earlier exploratory language. Existing requirements and glossary remain authoritative; this synthesis does not replace them.

## Problem Statement

Older adults often receive assistance from several willing family members, friends, neighbors, and caregivers. Scattered calls, messages, notes, and calendars make it difficult to know what is needed, who has actually committed, what remains unresolved, and what has been done. Missed responsibilities, duplicated work, repeated explanations, and uncertainty increase stress.

Older adults must retain dignity, autonomy, and appropriate control. Not using a smartphone does not imply incapacity; coordinating assistance does not confer legal authority. A useful solution must reduce everyday work rather than require families to administer a project-management, records, or compliance system.

## Solution

Provide one understandable primary coordination context per older adult on iOS and Android. Let authorized participants quickly record a real need, arrange assistance, see gaps and changes, and report completion. People may help several older adults, receive help themselves, or both; involvement and access depend on the particular care relationship.

Make simple activities simple: no mandatory team setup before recording a need, no duplicate acceptance of agreements obtained outside the application, no mandatory separate coordinator, and no universal second approval for completion. Where authorized and appropriate, one clear action may report completion and expressly resolve the need. Completion alone never automatically establishes resolution.

Support ordinary recurrence, contextual comments, minimal practical information, restrained notifications, essential offline viewing, narrowly limited offline completion, and reviewed external sharing. Medication assistance uses these ordinary capabilities without dose monitoring. Privacy, accessibility, recoverability, and clear status information are foundational. Representative-based authorization is conditional on validated safeguards, not an unrestricted self-assertion.

## User Stories

Actors below describe involvement in a situation, not fixed account roles or a proposed permission hierarchy.

The 72 stories are behavioral requirements, not 72 independent features or implementation tickets. Future implementation planning should group closely related behaviors into cohesive workflows and vertical slices, preserving coverage and traceability to the stories without requiring one ticket or subsystem per story.

1. As an organizer, I want to identify an older adult with minimal information, so that I can begin without an extensive profile.
2. As an organizer, I want to record one real need and its relevant timing quickly, so that I gain useful coordination value immediately.
3. As a new participant, I want to explore or prepare privately without inventing a need, so that I can learn at my own pace.
4. As an organizer, I want private preparation to remain separate from shared coordination, so that preparation does not imply permission.
5. As an older adult, I want active, selective, or no direct app participation, so that assistance does not depend on my technology use.
6. As an older adult, I want my permission and preferences respected, so that help preserves my autonomy.
7. As an organizer, I want to record permission obtained outside the app with attribution and general scope, so that ordinary collaboration can begin without unnecessary paperwork.
8. As a participant, I want reported permission distinguished from direct permission and independent verification, so that its basis is clear.
9. As an authorized participation manager, I want to invite helpers within delegated boundaries, so that routine participation does not require repeated approval.
10. As a participant without invitation authority, I want to suggest a helper without granting access, so that useful suggestions do not bypass authorization.
11. As an invited helper, I want to understand who invited me, who needs help, what is requested, and when, so that I can respond without searching.
12. As an invited helper, I want lightweight secure entry and direct access to the relevant request after joining, so that helping is easy.
13. As a helper, I want joining and accepting a responsibility to be separate, so that participation does not imply a commitment.
14. As a helper, I want to accept, decline, or defer a request, so that my actual availability is accurately represented.
15. As a participant, I want unanswered requests to remain unresolved, so that nobody assumes assistance is arranged.
16. As an organizer, I want to record an outside helper's reported agreement without creating an account, so that occasional helpers need not install the app.
17. As a participant, I want the assistance provider distinguished from the person recording an agreement, so that accountability remains accurate.
18. As a helper, I want to accept coordination responsibility separately from assistance responsibility where useful, so that arranging help and providing it are not confused.
19. As a helper, I want to fulfill both responsibilities without redundant steps, so that simple needs stay simple.
20. As a participant, I want multi-part assistance and practical handoffs to remain understandable, so that one completed contribution does not hide another gap.
21. As a helper, I want necessary logistical and practical information, so that I can provide assistance without unrelated sensitive access.
22. As a returning participant, I want to see my commitments, pending requests, relevant changes, and unresolved gaps, so that I understand what needs attention within seconds.
23. As an occasional helper, I want information appropriate to my involvement, so that I am not overwhelmed by coordinator-oriented detail.
24. As a participant helping several older adults, I want clear identification and simple switching, so that responsibilities are not confused.
25. As a participant, I want a clear indication when nothing needs attention, so that the app does not manufacture urgency.
26. As a helper, I want to withdraw from an accepted responsibility when unavailable, so that replacement assistance can be arranged visibly.
27. As an organizer, I want to change or cancel arrangements and arrange replacements with accurate history, so that plans stay understandable.
28. As an older adult, I want declining one arrangement distinguished from declining assistance altogether, so that my preferences are represented correctly.
29. As an older adult, I want to change my mind later, so that declining assistance does not permanently prevent future help.
30. As a participant, I want a reported refusal distinguished from a decision communicated directly, so that provenance and uncertainty remain clear.
31. As a helper, I want to accept an ongoing recurring commitment once, so that routine assistance does not require repeated administration.
32. As an organizer, I want to record recurring agreements obtained outside the app, so that recurrence works for non-user helpers too.
33. As a participant, I want recurring unclaimed needs distinguished from ongoing commitments, so that a schedule does not imply coverage.
34. As a helper, I want to change one occurrence without unintentionally changing the series, so that exceptions are easy.
35. As an organizer, I want future recurrence changes to preserve past completion, so that history remains accurate.
36. As a participant, I want a skipped occurrence needing replacement to remain unresolved, so that future commitments do not conceal today's gap.
37. As a helper, I want to report my responsibility completed with attribution and time, so that others know what I report doing.
38. As an authorized participant, I want to report completion by an outside helper with separate performer and reporter attribution, so that non-user assistance is represented accurately.
39. As an authorized participant, I want one clear action to report completion and expressly confirm need resolution when appropriate, so that simple activities do not require double-confirmation.
40. As a helper, I want completion-only reporting when other work remains or I lack resolution authority, so that I do not overstate the outcome.
41. As a participant, I want outstanding responsibilities preserved even if someone reports resolution, so that unresolved work is not silently dismissed.
42. As a participant, I want to correct or question reports with appropriate history, so that inaccuracies can be addressed without formal approval for every update.
43. As a participant, I want reported completion distinguished from independent verification, so that confidence is not overstated.
44. As a participant, I want brief contextual comments for practical questions, so that clarification stays with the relevant assistance.
45. As a participant, I want current arrangement details directly visible, so that I need not read a comment history to understand the plan.
46. As a participant, I want ordinary actions to require no explanation or comment, so that communication does not become administration.
47. As a participant, I want attributable practical-information updates and simple concern reporting, so that information remains useful without approval ceremonies.
48. As a participant, I want consequential uncertainty apparent and sensitive conflicts referred to appropriate authoritative sources, so that family votes or app automation do not substitute for professional clarification.
49. As a helper, I want previously available essential information offline automatically where practical, so that temporary loss of reception does not prevent assistance.
50. As a helper, I want unavailable or potentially outdated information indicated clearly, so that offline access does not imply guaranteed currency.
51. As a helper, I want to record completion of an already accepted responsibility offline, so that I do not need to remember to report later.
52. As a helper, I want pending reports to survive restarts and share automatically without duplicates, so that connectivity problems do not create work or false records.
53. As a participant, I want locally saved and successfully shared reports distinguished, so that I do not assume others received an update.
54. As a participant, I want changed responsibilities and revoked authorization checked before pending reports are shared, so that stale updates do not overwrite newer arrangements or bypass access restrictions.
55. As an authorized participant, I want to review a concise practical summary before sharing externally, so that non-user helpers receive only appropriate information without re-entry.
56. As a participant, I want sensitive instructions considered deliberately and external-copy limitations made understandable, so that sharing does not imply retrievable or independently verified information.
57. As a caregiver, I want prescription pickups and medication assistance to use ordinary coordination, recurrence, reminders, and reporting, so that no medication list or specialized workflow is required.
58. As a participant, I want pickup and assistance completion distinguished from dose ingestion or administration, so that practical reports do not imply clinical monitoring.
59. As a participant, I want targeted useful reminders and reasonable preference control, so that notifications help without overload or incidental disclosure.
60. As a participant, I want sending distinguished from delivery, reading, acknowledgment, and action, so that notifications do not imply guaranteed response.
61. As a participant in another time zone, I want an authoritative activity time and clear local equivalents, so that daylight saving and travel do not cause missed assistance.
62. As a participant with accessibility needs, I want readable scalable text, accessible controls, generous targets, plain language, and predictable interactions, so that ordinary use requires little effort.
63. As a participant, I want important information available without sound or precise gestures and errors correctable without lost entry, so that limitations do not prevent participation.
64. As a participant, I want my own identity and straightforward secure recovery, so that device loss does not require rebuilding arrangements or sharing credentials.
65. As an authorized coordinator, I want continuity and replacement arrangements without taking over another identity, so that access loss does not interrupt legitimate coordination.
66. As a participant using a shared device occasionally, I want protection against residual sessions, retained information, and sensitive notifications exposing another person's information, so that assisted use preserves privacy.
67. As an older adult, I want permission withdrawal or limitation respected promptly where effective, so that unwanted access can end.
68. As a participant, I want a simple way to report authorization concerns and proportionate protection, so that privacy is protected without unnecessary disruption to unrelated assistance.
69. As a legitimately authorized representative, I want a distinct appropriately safeguarded authorization path if supported at launch, so that necessary coordination can occur without unsupported assertions granting access.
70. As a participant, I want departure, arrangement closure, and deletion requests distinguished, so that useful attribution and privacy are both respected.
71. As an authorized participant, I want understandable handling of historical contributions, retention, and deletion limitations, so that I need not administer archival policies.
72. As a pilot participant, I want brief feedback requests and fallback coordination options, so that testing does not add excessive work or imply guaranteed care.

## Implementation Decisions

### Confirmed constraints and observable contracts

- Approved authentication under ADR 0002: use Supabase Auth emailed one-time codes as primary, with securely retained mobile sessions for returning participants. Conventional passwords and passkeys are deferred. Learning and appropriate private preparation need not require authentication where practical; protected shared information and collaborative actions do.
- Email verification grants no care access, legal authority, invitation acceptance, or commitment. Preserve stable participant identity independent of email and care relationships. Replacement-device recovery with original email access uses ordinary code authentication without rebuilding arrangements; outside helpers still need no accounts merely to record assistance.
- Protect retained sessions with appropriate mobile storage, straightforward sign-out, and lost/shared-device and revocation safeguards. Specific storage and session policies remain unresolved. ADR 0003 now selects the recipient-bound invitation model; exact invitation policies, lost-email recovery, email changes, and exceptional verification require separate review; family relationships do not permit takeover.
- Approved invitations under ADR 0003: an authorized participant can simply invite a designated recipient, ordinarily by email, using an expiring, revocable invitation. Before joining, authenticate and validate in the backend the recipient restriction, invitation validity, and inviter's continuing relevant authority. A forwarded link alone grants no sensitive access. Authentication or invitation acceptance does not establish legal authority, broader access, or responsibility acceptance; each care relationship remains separately authorized.
- Invitation emails, links, previews, and unauthenticated screens disclose minimal authorized information, with request details available after appropriate authentication and authorization. A different sign-in email receives a simple explanation and a secure route to a corrected invitation from an authorized participant, never a bypass. Inbox control does not independently verify real-world identity or legal authority. Avoid redundant routine approvals, account administration, or elaborate permission setup; non-user helper recording remains available. Expiration duration, exact matching rules, revocation mechanics, and detailed authorization policies remain unresolved.
- OTP is not phishing-resistant or MFA. Define expiry, attempt limits, resend controls, session safeguards, and evaluate additional verification for sensitive actions. Plan reliable transactional email without selecting a vendor. During implementation, configure and test the actual code flow in Expo on iOS and Android and refine usability as appropriate. Consumer-only operation, sensitive-information safeguards, and ADR 0001's contractual/synthetic-data gates remain unchanged.

- Approved post-Step-19 business boundary: independent direct-to-consumer coordination for individuals and families, not organizational customers or administrators such as healthcare organizations, hospitals, health plans, or agencies. Do not operate on behalf of HIPAA-covered entities or their business associates to manage patient information. This is business intent to avoid business-associate operation, not a legal conclusion. Individual professionals may participate in family-authorized assistance within this boundary.
- Families may voluntarily record diagnoses, conditions, medications, dosages, physicians, appointments, mobility limitations, and care instructions where useful for coordination. Treat all such information as sensitive consumer health information. Do not require comprehensive profiles or medication lists, add dedicated dose management, tracking, clinical decision support, or monitoring, or weaken purpose-limited access and sharing.
- Selected backend direction under ADR 0001: Supabase Cloud managed PostgreSQL is the authoritative shared datastore, with backend-enforced access controls using PostgreSQL row-level security where appropriate and controlled transactional server-side operations for consequential changes. Use a narrow authorized essential-information cache and durable offline completion with authorization revalidation, conflict handling, and duplicate prevention. Prefer managed services, minimal custom infrastructure, and low maintenance. ADR 0002 separately selects Supabase Auth email codes; no specific schema, local library, notification infrastructure, or server-operation mechanism is selected.
- Intended hosting is an ordinary paid Supabase plan, subject to contractual suitability validation before real health-related data. Written permission for this consumer-health use has not been received; ordinary hosting must not be represented as HIPAA-compliant. HIPAA-specific hosting is outside the budget. Use synthetic development data until legal, contractual, privacy, and security requirements are validated; an actual contractual restriction requires reconsidering hosting before live use.

- Architecture simplicity is a guiding constraint: where multiple approaches satisfy the approved requirements, prefer lower ongoing maintenance, less custom infrastructure, fewer user-visible steps, and lower operational burden, without compromising privacy, security, reliability, or correctness. This is an evaluation criterion, not approval of a particular architecture or provider.

- Target iOS and Android with Expo SDK 58, React Native, and TypeScript. Existing Expo Router navigation is a repository instruction. Do not repeat environment setup or treat the starter as existing care functionality.
- Use glossary concepts without translating them into fixed global helper/recipient roles. One primary coordination context per older adult is the default; it is not a database or tenancy design decision.
- Separate request, explicit acceptance, reported outside acceptance, completion report, and express resolution. Store or otherwise preserve enough provenance to identify reporter, relevant performer, report time, and corrections; no schema is selected.
- Simple and multi-part needs share the same product semantics. Combined completion and resolution records both explicit outcomes only when authorized. Completion alone, including completion of all known responsibilities, does not resolve the need. Resolution never silently completes, cancels, or dismisses outstanding responsibilities.
- Changes and withdrawal expose real gaps; replacement does not establish completion. Declining an arrangement differs from declining the underlying assistance, with future preference changes possible.
- Recurrence acceptance applies to an ongoing commitment, while occurrence outcomes and exceptions remain distinct. Future edits preserve history. Exact supported patterns require decision; examples include simple daily and weekly arrangements.
- Each timed activity has an authoritative date, time, and zone, ordinarily local to its location. Remote activities also have an unambiguous reference zone. Account for daylight saving automatically and show viewer equivalents where useful without clutter.
- Comments are attributed and access-controlled; comments do not mutate authoritative arrangement facts. Ordinary actions do not require comments.
- Restrict minimal sensitive information consistently across descriptions, instructions, comments, offline views, notifications, and shared summaries. Do not require users to classify every ordinary field or assume family membership grants access.
- Lightweight reported permission records its author and general scope, distinguished from direct permission and verification. Delegated participation management is not legal authority. Invitations, joining, and information access are separate events.
- Representative-based support is conditional. No diagnosis, title, relationship, or technical limitation establishes incapacity or authority. Unsupported or disputed claims must not enable unrestricted sharing. Authority scope and changes must be addressed by a validated process before that scenario goes live.
- Offline viewing covers previously available essential information for accepted responsibilities, automatically where practical. No claim is made that disconnected information is current or immediately removable after revocation.
- Offline writes are restricted to completion reports for previously accepted responsibilities already available on the device. Pending reports survive ordinary restart, retry automatically, avoid duplicates, and remain visibly pending until shared. Revalidate authorization and material arrangement changes before accepting them; never silently overwrite newer facts. Broader offline resolution or other editing is not included by this capability.
- External sharing is optional: select an arrangement, review appropriate information, and share without recipient registration. Sensitive practical instructions need deliberate consideration; unrelated sensitive data is excluded by default. Do not imply receipt, accuracy verification, or recall of external copies.
- Ordinary medication assistance uses ordinary coordination; it neither requires a medication list nor establishes dose ingestion or clinical verification.
- Participation ending and closure do not automatically erase useful shared history. Contributors cannot automatically delete shared records. Retention and deletion policies remain launch decisions, including backup, device, and external-copy limitations.

### Consequential choices requiring user approval before implementation

Supabase Cloud with managed PostgreSQL is selected under qualified ADR 0001, and Supabase Auth email codes under ADR 0002. Remaining choices below are unresolved; no API contract, schema, local storage library, transactional email provider, or notification service is prescribed.

Resolve consequential choices and obtain user approval before related implementation tickets are finalized. Foundational decisions affecting persistence, identity, authorization enforcement, consistency, offline durability, or recoverability must be resolved before dependent designs and tickets are finalized; they must not be postponed merely because live use is later. Other choices may be resolved progressively before their affected tickets are finalized, without reopening settled requirements.

| Decision | Required evaluation and meaningful tradeoff |
| --- | --- |
| Backend, hosting, persistence, and collaboration architecture | Supabase Cloud managed PostgreSQL selected, subject to contractual suitability for consumer health information. Region, plan details, schema, server-operation mechanism, and collaboration delivery remain unresolved. Preserve low operations burden and backend-enforced consistency and access. |
| Authentication, invitations, sessions, and recovery | Supabase Auth email codes and secure session retention selected under ADR 0002; recipient-bound expiring/revocable invitations selected under ADR 0003. Passwords and passkeys deferred. Exact invitation matching/expiry/revocation and authorization policies, session policies, lost-email recovery, email changes, additional verification, and production email provider remain unresolved. |
| Access and authority model | Simple defaults versus sufficient distinction among participation management, practical/sensitive access, completion, resolution, and reported versus representative permission. Avoid an elaborate role matrix exposed to families. |
| State transitions and concurrent changes | Define requests, commitments, cancellations, declined assistance, corrections, uncertain reports, and explicit resolution without hiding outstanding work. Decide race handling and behavior when resolution conflicts with remaining responsibilities. |
| Offline persistence and synchronization | Durable minimal protected information versus retention and device risk. Decide pending-report identity, duplicate prevention, authorization failure, changed-responsibility conflicts, and clear minimal-effort recovery. Evaluate development and testing cost explicitly. |
| Recurrence representation | Common patterns and understandable occurrence/series edits versus complex calendaring. Specify end conditions, time-zone behavior, and preservation of historical occurrences. |
| Notification delivery and scheduling | Timely relevant attention versus infrastructure, platform limits, duplication, quiet hours, and sensitive disclosure. No delivery guarantees or escalation engine. |
| Information entry and sharing | Minimum fields, sensitive-instruction handling, editable summary contents, and familiar sharing versus accidental disclosure and unnecessary configuration. No file format or sharing mechanism approved. |
| Operational and retention policies | Realistic review capacity, problem response, recoverability, deletion, and history versus indefinite retention and administrative burden. No retention period or service-level promise approved. |

Potential responsibility areas for later module design are coordination, authorization/participation, identity, recurrence/time handling, practical information/comments, offline reporting, notifications, and external sharing. These are logical concerns, not an approved service decomposition. Prefer existing seams and a small cohesive implementation; any consequential architecture must be reviewed rather than inferred from this list.

## Testing Decisions

### Approved testing boundaries

Complete observable coordination journeys are the primary boundary. Test cooperating components at the highest practical seam, preferring a small number of broad integration boundaries over mocking every internal function. Add focused checks at actual authorization enforcement and for consequential security, concurrency, and offline behavior. A hidden control is not proof of denied access.

The current repository is an Expo starter with no identified care-coordination test prior art or existing domain seam. Do not invent reusable tests or infrastructure. Candidate concerns to exercise are coordination with participation/authorization, recurrence, offline completion, notifications, and sharing; final module boundaries and tools remain unapproved.

Keep test infrastructure practical for a solo developer. Use minimal setup, controlled time/network conditions where needed, and test doubles only at necessary external boundaries. Assert external outcomes, not component internals or incidental implementation structure. A small set of real-device/platform checks supplements integrated behavior tests for navigation, accessibility, notifications, persistence, and external sharing.

### Journey acceptance criteria

| Journey | Observable acceptance |
| --- | --- |
| First need | Minimal older-adult identification and a real need can be recorded without extensive profile, invitations, assignments, or sensitive fields. Private preparation does not disclose information or imply permission. Exploration need not invent a task. |
| Invitation | Before identity/access checks, disclose only authorized context. After joining, the relevant request is readily accessible. Joining does not accept it; decline/defer leaves appropriate gaps visible. |
| Recipient-bound joining | A forwarded link alone grants no protected access. Backend joining checks authenticated recipient eligibility, current invitation validity, and inviter authority. Expired/revoked invitations, mismatched accounts, and lost inviter authority cannot bypass checks. Mismatches get a clear corrected-invitation route. Joining grants neither legal authority nor responsibility acceptance or cross-relationship access; routine valid joins avoid redundant approval steps. |
| Existing agreement | An authorized recorder can attribute an outside agreement and completion separately from the performer without account creation, mandatory contact details, or repeated in-app acceptance. |
| Everyday attention | Own commitments, relevant gaps and changes are distinguishable by older adult and authorization. No irrelevant personal responsibility or exaggerated urgency is implied; no-attention state is clear. |
| Changes | Withdrawal, cancellation, and replacement preserve attribution and expose gaps without implying completion. Comments cannot silently change structured arrangements. |
| Recurrence | One ongoing acceptance covers the agreed recurrence. A changed occurrence does not change other occurrences; future edits do not rewrite past reports. No repeated routine confirmation is required. |
| Completion/resolution | Completion-only remains available. Where authorized, one clear action records both completion and express resolution without another approval round. Unauthorized resolution is denied; neither completion of one nor all responsibilities silently resolves a need. Outstanding work is not silently dismissed. |
| Offline viewing | Essential previously available authorized details remain accessible, with unobtrusive currency/connection indications. Unavailable data is not presented as available; access boundaries remain applicable. |
| Offline completion | A pending report survives restart and temporary loss, remains distinct from shared status, and shares automatically without duplicates when authorized. Canceled/reassigned/changed responsibility and revoked access cases do not silently overwrite or disclose. Other offline mutations are not enabled by this scope. |
| External sharing | The user reviews a minimal authorized purpose-specific summary without re-entry, unrelated sensitive defaults, recipient registration, or automatic sharing upon naming a helper. Copies are not represented as recallable or independently verified. |
| Practical medication help | Pickup and routine assistance use ordinary workflows without medication lists or extra forms. Reported assistance does not establish ingestion, dose administration, or monitoring. |
| Authorization | Cross-person/care-relationship reads and writes, unauthorized sensitive access, invitation disclosures, comment access, resolution, and external sharing are checked at the actual enforcement boundary. Verify withdrawal and scoped protection without unrelated blanket disruption. Unsupported representative claims do not grant unrestricted access. |
| Recovery and departure | Recover identity without reconstructing ordinary commitments or assuming another identity. Replacement assistance remains attributable. Removal/closure do not erase useful history automatically or silently retain inappropriate access. |
| Notifications and time | Relevant reminders respect authoritative time/zone, daylight saving, chosen defaults and preferences; avoid duplicates and incidental sensitive disclosure. Sending does not establish reading or action. |
| Accessibility and simplicity | No required precise gesture or sound-only meaning; support scalable readable text, screen readers, clear controls, plain language, correction without lost entry, and situation-appropriate minimal actions. No routine comments, universal double-confirmations, repeated known-data entry, or mandatory separate coordinators. |

Automated tests can establish behavior and absence of mandatory redundant steps. They cannot establish that people find the product intuitive, that text is understood, or that families experience less burden. Assess those through the approved human evaluation, not implementation-shaped assertions or arbitrary universal tap counts.

### Human usability and live evaluation

- Synthetic first: approximately five participants, at least two with limited smartphone confidence, in roughly 30-minute sessions allowing up to 45 minutes. Distribute organizer, invited-helper, and returning-user scenarios; include accessibility variation where practical. Use fictional information, observation without coaching, brief notes, and targeted retesting. Prototypes or partial functionality may be tested before the whole MVP exists.
- Q51 criteria: independent completion, correct understanding, and correction/retesting of material problems before affected functionality enters live use. Roughly five minutes to record a first need and 30 seconds to identify attention items are diagnostic targets, not rigid pass marks; consider experience and accessibility.
- Live second: approximately three family arrangements over approximately four weeks, ordinarily an older adult and at least two helpers. Older-adult app use is not required. Use actual needs, flexible recruitment and timing, no manufactured activities, and no diaries or detailed time/message counts.
- Q52 criteria: reduced effort, clear coordination, dependable behavior, and acceptable burden/trust and willingness to continue. Use brief baseline and closing conversations and an optional midpoint check-in, supplemented only by limited appropriate authorized observations or reliability information.
- Treat findings as preliminary, without statistical claims or rigid numerical thresholds. Unencountered capabilities remain unevaluated in live use; synthetic and technical evidence must be reported separately. Restrict or pause affected live use for serious unresolved problems, and correct material issues before expansion.

## Out of Scope

- Application implementation, implementation tickets, deployment, and approval of unresolved architectural choices in this publication step.
- Comprehensive chat, general family feeds, standalone general messaging, and advanced conversation organization.
- Organizational staff administration, sophisticated shared-device management, and multiple coordination circles.
- Organizational healthcare customers or administrators and operation on behalf of HIPAA-covered entities or business associates for patient-information management; HIPAA-specific infrastructure and speculative enterprise architecture.
- Dedicated medical, financial, or legal repositories and comprehensive personal-record management.
- Dedicated medication-dose reminders, structured dose tracking, clinical administration histories, pharmacy integrations, automatic refill management, treatment advice, and clinical monitoring.
- Offline acceptance, reassignment, shared-information editing, comprehensive offline operation, or complex general-purpose synchronization.
- Elaborate recurrence, dependency automation, sophisticated scheduling, and escalation engines.
- Comprehensive exports, report builders, extensive printing, and advanced external collaboration unless independently required by applicable obligations.
- Professional emergency monitoring or dispatch, guaranteed care or response, determining capacity, or adjudicating legal authority.
- Comprehensive multilingual functionality and international launch. Initial market is the United States and initial language English; a Texas pilot is not a Texas-only product boundary. Avoid unnecessary barriers to future localization.

## Further Notes

### Launch gates, not approved implementations

These are conditions to satisfy before live use, distinct from the design decisions required before related implementation tickets are finalized. Operational readiness, validated review processes, and release evidence may be completed later, but any finding that materially affects foundational architecture must be evaluated and resolved before dependent tickets are finalized. For example, authority review, retention/deletion, and device-information protection cannot be treated solely as last-minute release checks when they affect the design. A launch gate is not permission to defer an architectural dependency.

These timing and simplicity clarifications add no capabilities or technical subsystems and do not change approved MVP boundaries, testing decisions, or launch gates.

1. Before processing real personal or health-related information, evaluate legal, privacy, security, and data-use obligations, including HIPAA applicability, the FTC Health Breach Notification Rule, relevant state laws, and vendor contractual requirements. Use synthetic development data until validation. No legal compliance determination follows from consumer positioning. Obtain written Supabase confirmation of contractual suitability for the intended ordinary paid-plan consumer-health use before processing real health-related data; actual restrictions require reconsideration of hosting, not an insecure shortcut or an assumption that HIPAA-specific hosting is affordable. All other live-use gates remain applicable.
2. Define and validate sufficient authorization and authority scope, sensitive information boundaries, withdrawal, and protection against incidental disclosure. Ordinary reported permission must not imply verified legal consent.
3. Identify who reviews significant authorization concerns, available proportionate restrictions, unresolved-case handling, and realistic response capacity. Do not promise immediate intervention or legal adjudication. Ordinary corrections remain outside formal review.
4. Validate representative-based authorization, state/authority-type considerations, changed or expired authority, and secure purpose-limited supporting-document handling if needed. If not feasible, explicitly narrow supported live scenarios; do not use unsupported claims as a shortcut.
5. Define retention, deletion, closure, backups, correction history, and participant-departure policy consistent with legitimate use and applicable obligations. Explain device/offline/external-copy limitations without requiring family archival administration.
6. Validate identity/session recovery, lost-device and occasional shared-device protections, protected retained information, actual enforcement boundaries, and denied unauthorized pending uploads. Select and review concrete security mechanisms before live use.
7. Validate reliability of recurrence, time-zone changes, notification behavior, pending-report durability, duplicate prevention, and conflict handling. Technical testing complements human usability; material problems require correction before affected live use.
8. Establish participant-facing pilot expectations, realistic significant-problem reporting, operational support and restriction/pause procedures, and fallback ways to coordinate essential assistance if unavailable. Do not present the pilot as emergency monitoring or guaranteed assistance.
9. Collect only appropriate authorized evaluation information and address material usability issues before live testing. Evidence from a small pilot is not release certification.

### Risks and review status

The MVP is substantial despite a deliberately simple experience. Offline completion combines durability, authorization changes, concurrency, and user-understandable recovery. Recurrence combines series and occurrence history with time zones. Purpose-limited access must cover free text, comments, retained device data, notifications, and external summaries without exposing a burdensome permissions system. Representative review creates a real operational dependency, not just another screen.

No ADRs existed at original synthesis. ADR 0001 now records the selected Supabase direction and its contractual qualification. The consumer-only decision explicitly supersedes earlier exploration of organizational customers; it does not remove individual caregiver participation or authorize clinical features. No conflict with an existing ADR was identified. Remaining approval points and launch gates are preserved; the required triage status does not authorize implementation.

## Comments

- Published using the installed to-spec template after the user approved the testing boundaries and simplicity acceptance requirements. No application code was modified.
- Following independent review, clarified behavioral-story grouping, architecture simplicity, and decision timing. All 72 stories, substantive requirements, testing decisions, and launch gates are preserved. Final user approval remains pending.
- The user subsequently approved Step 19, committed as 5403bb4. Post-approval decisions select consumer-only operation and qualified Supabase hosting; the 72 stories and existing testing approach remain unchanged. Earlier pending-review comments are historical.
