# Elder Care App v2 requirements

## Status

Requirements Q1–Q52 are complete. The user approved this baseline as sufficiently complete for specification. Specification has not begun; invoking `$to-spec` requires the user's next instruction after documentation review and their Git checkpoint.

Later explicit decisions in Q35–Q52 govern MVP scope where they refine earlier exploratory material. Earlier examples preserve context, not additional release commitments.

## Approved baseline summary

- Confirmed MVP: minimal onboarding and private preparation; lightweight attributable permission; simple invitations and distinct identities; needs, requests, directly accepted and externally reported commitments; visible gaps; ordinary changes and replacement assistance; basic recurrence; attributable completion and explicit need resolution, combined in one action where appropriate and authorized; contextual comments; minimal practical information with access boundaries; restrained reminders; accessibility, recovery, and time-zone clarity; limited essential offline viewing and offline completion; optional reviewed practical external sharing; ordinary medication-assistance coordination; participation ending and privacy handling.
- Explicitly deferred: comprehensive chat and general discussion feeds; organizational administration and sophisticated shared-device management; multiple circles; dedicated sensitive-record repositories; dedicated dose reminders and structured dose tracking; broader offline editing; elaborate scheduling, dependency automation, and escalation; comprehensive exports, reports, and extensive printing; professional emergency monitoring; comprehensive multilingual support and international expansion. These remain future considerations, not implied commitments.
- Conditional MVP: representative-based authorization is intended scope only with validated, workable safeguards and review. Narrow supported launch scenarios explicitly if responsible support is not feasible (Q46).
- Specification decisions: exact fields, access and resolution authority, supported recurrence patterns, correction and conflict behavior, notification defaults, sharing contents, interfaces, authentication, recovery, storage, and synchronization. Preserve settled product meanings and evaluate offline-completion development and testing effort explicitly.
- Before live use: satisfy applicable privacy, security, legal, authorization, reliability, and operational safeguards; define dispute-review responsibility and protective actions; validate representative support for actual scenarios; address retention, deletion, retained device information, external copies, problem reporting, and fallback coordination. Correct and retest material usability problems before affected functionality enters the pilot. Baseline approval does not establish launch readiness.
- Evaluation: synthetic sessions with approximately five individuals, including at least two with limited smartphone confidence, approximately 30–45 minutes each; then approximately three family arrangements over four weeks after safeguards. Q51's independent use, correct understanding, and material-problem correction criteria and Q52's reduced effort, clear coordination, dependable behavior, and acceptable burden/trust govern evaluation. Five-minute first-need and 30-second attention targets are diagnostic, not hard thresholds; live results use no rigid numerical success thresholds.

Simplicity, accessibility, minimal setup, and minimal administrative effort govern every capability. Features must not impose a rigid sequence, duplicate acceptance, mandatory separate coordinators, or universal double-confirmation.

## Approved consumer business model and health information

This post-Step-19 decision refines the Q1–Q52 baseline: Elder Care App v2 is an independent direct-to-consumer application for individuals and families. Healthcare organizations, hospitals, health plans, and care agencies are not supported organizational customers or administrators. The application will not operate on behalf of HIPAA-covered entities or their business associates to manage patient information; the business model is deliberately structured to avoid becoming a HIPAA business associate. This intent is not a determination of legal applicability or contractual permission.

- Families may voluntarily enter useful coordination information, including diagnoses, medical conditions, medications, dosages, physicians' names, appointment details, mobility limitations, and practical care instructions. Treat it as sensitive consumer health information even where HIPAA does not apply.
- Entry remains optional, purpose-relevant, gradual, and appropriately authorized; do not require comprehensive medical profiles or medication lists. Minimize unnecessary collection, exposure, retention, and sharing without burdening ordinary users.
- Permitting medication names or dosages in notes does not authorize dedicated medication management, dose reminders, structured dose tracking, clinical decision support, or professional medical monitoring. Existing coordination and privacy boundaries remain in force.
- Do not introduce organizational healthcare functionality, HIPAA-specific infrastructure, or speculative enterprise architecture. Individual professionals may still participate in family-authorized assistance; this does not establish an organizational customer or an on-behalf-of healthcare arrangement.
- Before processing real personal or health-related information, evaluate applicable legal and privacy obligations, including HIPAA applicability, the FTC Health Breach Notification Rule, relevant state laws, and vendor contracts. Consumer positioning is not an exemption from health-information privacy obligations.
- Use synthetic data during development until legal, contractual, privacy, and security requirements have been validated. Supabase Cloud with managed PostgreSQL is the selected backend direction under ADR 0001, subject to contractual suitability before real health-related data processing. An ordinary paid plan is intended; written confirmation permitting this use has not been received. Do not claim ordinary hosting is HIPAA-compliant or infer contractual permission from HIPAA non-applicability. HIPAA-specific hosting is outside the budget; an actual contractual restriction requires reconsideration before live use.

## Purpose

Help family members, friends, and other trusted individuals coordinate dependable assistance for older adults with daily needs, while preserving dignity, autonomy, independence, and quality of life. Reduce miscommunication, duplicated work, missed responsibilities, uncertainty about responsibilities, and stress.

Appointments, transportation, medication-related tasks, household responsibilities, and errands illustrate the original purpose, not separate specialized feature commitments. The approved summary and Q35–Q47 define which general coordination capabilities support them in the MVP.

## Simplicity and ease of adoption

Simplicity, low-friction interaction, and ease of adoption are paramount across the product. Older adults, family members, friends, and caregivers must not be discouraged by complicated or laborious coordination.

- Minimize steps, information entry, and effort for common activities.
- Do not require repeated entry of information the application already knows.
- Make complex capabilities available when needed without complicating ordinary activities.
- Keep routine coordination intuitive and advanced options out of the way unless relevant.
- Keep notifications, confirmations, and reporting useful rather than burdensome.
- Prioritize practical everyday usability over sophisticated features with little everyday value.
- Manage complexity behind the scenes wherever practical.
- During requirements planning, actively identify unnecessary complexity and consider simpler approaches before committing capabilities.

## Participation and autonomy

- Support active, limited, or no personal participation by the older adult, according to their preferences and abilities.
- An older adult must be able to benefit without personally using the application.
- Technological ability and application participation do not determine decision-making authority.
- Coordinating assistance does not itself confer legal authority over personal, medical, financial, or other decisions.
- Explore consent, privacy, access permissions, legally authorized decision-making, and changes in circumstances during the interview.

## Relationships

- A person may assist multiple older adults, receive assistance, or do both simultaneously.
- A person's role depends on their relationship to the particular person receiving assistance; people are not permanently divided into mutually exclusive helper and recipient categories.
- Multiple trusted individuals may support the same older adult, with different responsibilities and levels of access.
- Involvement in one person's care must not automatically grant access to another person's information. Consider privacy and permissions separately for each care relationship.
- Relationships and responsibilities must be capable of changing over time.
- Account structures, care groups, role definitions, and permission mechanisms remain undecided.

## Personal and professional participation

- Family members, friends, neighbors, and other trusted informal helpers are the primary intended audience.
- Explore coordination with individual paid caregivers and professional service providers alongside informal helpers, including recurring home visits.
- Distinguish access for an individual professional from organizational functionality involving employees, administrators, and changing staff assignments.
- Individual professionals may participate in ordinary authorized coordination within the core MVP; this does not include organizational administration or specialized clinical workflows (Q35, Q40).
- Earlier exploration of organizational participation is superseded by the approved consumer-only business model: agencies and other healthcare organizations are not supported customers or administrators. Individual professional participation remains subject to family authorization and the consumer-use boundary.
- Explore consent, privacy, responsibilities, access boundaries, and additional professional-care scenarios. Coordination participation alone must not confer medical decision-making authority, broad sensitive-information access, or authority to act on the older adult's behalf.

## Illustrative appointment assistance workflow

This scenario informs requirements exploration; it is not a finalized feature or interface specification.

1. The older adult or a helper identifies an upcoming medical appointment and a need for transportation or other assistance.
2. Appropriate participants learn what assistance is needed and when, without relying on scattered messages or individual recollections.
3. A helper agrees to provide transportation, and appropriate participants can distinguish accepted responsibility from an assumption that someone will help.
4. The responsible helper has necessary logistical information, such as time, location, and relevant instructions, with sensitive medical information limited appropriately.
5. The helper provides assistance, whether or not the older adult personally uses the application.
6. Appropriate participants can determine whether the responsibility was fulfilled without contacting multiple people individually.
7. New needs arising from the appointment, such as prescription pickup or follow-up scheduling, can be coordinated.

The central coordination outcome is shared understanding among appropriate participants of what assistance is needed, who has accepted responsibility, what has been completed, and what remains outstanding. Prevent responsibilities from falling through the cracks because participants assume someone else is handling them.

Explore analogous workflows for medication-related assistance, errands, groceries, household maintenance, and recurring caregiver visits, along with exceptions and coordination failures, before settling capabilities or interfaces.

## Responsibility and unresolved needs

- Distinguish responsibility for coordinating a need from responsibility for providing the assistance. One person may accept both.
- Responsibility requires explicit acceptance. Naming a potential helper or requesting help does not establish a commitment.
- Keep needs with no accepted coordination or assistance responsibility identifiable as unresolved; do not imply that someone is handling them.
- Allow different people to coordinate different needs. A permanent family coordinator is optional, not required.
- When someone can no longer fulfill an accepted responsibility, reflect the resulting gap as unresolved so another arrangement can be made. Exact workflow states remain undecided.
- Help prevent important needs from being overlooked as deadlines approach. Explore reminders, notifications, and escalation without committing to mechanisms yet.
- Preserve appropriate participation and autonomy for older adults, including coordinating their own needs, accepting assistance, and participating in decisions about who provides it.
- Facilitate accountability without guaranteeing assistance. If nobody is available, make the unresolved situation apparent.
- Help appropriate participants answer: what needs to be done; who, if anyone, is coordinating it; who, if anyone, has committed to doing it; and whether it has actually been completed.
- Workflow states, notification behavior, permissions, interface design, and exceptions require further exploration.

## Declining assistance and changing preferences

- Distinguish declining a particular helper or arrangement from declining assistance for the underlying need. Rejecting an arrangement may leave the need open for alternatives.
- When the older adult retains the relevant decision-making authority, ordinarily respect their decision to decline assistance altogether.
- Distinguish assistance that was completed, remains unresolved, or was knowingly declined, without finalizing workflow states.
- Allow preferences to change; declining assistance must not permanently prevent future requests.
- Communicate declined assistance respectfully to appropriate participants. Disagreement is not evidence of incapacity; avoid unnecessary pressure and repeated unwanted reminders.
- Distinguish preferences from legally recognized authority for particular decisions. Family membership, caregiving, coordination, and application administration do not themselves confer that authority.
- Explore appropriately limited documentation of declined assistance, including the distinction between a decision communicated directly by the older adult and one reported by another person.
- Explore communication and follow-up for unresolved safety concerns without implying authority to override the older adult's wishes.
- Examine cognitive impairment, legal representatives, consent, and emergency circumstances later in the interview. The application must not be assumed to determine legal capacity or decision-making authority.
- Specific states, access permissions, and legal-authority mechanisms remain undecided.

## Completion reporting and accountability

- A person who accepted assistance responsibility should ordinarily be able to report its completion, without requiring confirmation from multiple people for routine activities.
- Attribute completion reports to the reporting person and record when the report was made.
- Distinguish reported completion from independently verified outcomes. A completion report alone must not imply independent verification.
- Allow appropriate participants to raise concerns, correct inaccuracies, or dispute completion; preserve the original report and relevant correction history as appropriate. Details of correction, dispute handling, and retention remain open.
- Completion applies only to the responsibility undertaken. Reporting transportation to an appointment does not establish that the appointment occurred, medical instructions were followed, or prescriptions were obtained.
- Allow appropriate older-adult participation in confirming or questioning completion without requiring direct participation.
- Distinguish reported completion, independent confirmation where applicable, disputed completion, and uncertain outcomes without finalizing workflow states.
- Explore additional documentation or confirmation for individual sensitive or higher-risk activities rather than imposing verification across all activities.
- Keep everyday reporting quick and straightforward; avoid a burdensome compliance or reporting system.
- Determine later which activities justify further verification and what information must be recorded.

## Multiple responsibilities and handoffs

- A need may involve multiple identifiable responsibilities, each accepted and reported complete separately.
- Completing an individual contribution must not automatically imply resolution of the overall need or conceal outstanding responsibilities.
- Accommodate coordination where responsibilities depend on earlier activities, such as outbound transportation, appointment accompaniment, and return transportation.
- Keep unclaimed responsibilities and gaps caused by participant unavailability visible even when other contributions are completed.
- Accommodate reassignment, cancellation, partial completion, and additional assistance becoming necessary after activities begin. Changes must not silently imply that an unaccepted responsibility is covered.
- Let appropriate participants understand assistance provided, outstanding responsibilities, and whether the overall need has been addressed. Preserve attribution and the distinction between reports and independent verification.
- Keep simple activities simple; multiple responsibilities and formal handoffs must not be mandatory for every need. Avoid an overly complicated project-management system.
- Preserve the older adult's preferences and participation, and limit each participant's information to what is appropriate for their involvement.
- Task hierarchies, dependency mechanisms, workflow states, interfaces, and notifications remain undecided.

## Recurring assistance

- Distinguish an ongoing recurring arrangement from its individual occurrences without making routine use cumbersome.
- Allow a person to explicitly accept an ongoing responsibility once, without separately accepting each occurrence.
- Accommodate an exception for one occurrence without unnecessarily affecting future commitments.
- Keep individual occurrences distinguishable; do not treat unfulfilled or unconfirmed occurrences as completed.
- Minimize ongoing administrative effort for ordinary recurring assistance.
- Scheduling, task-management, and confirmation mechanisms remain undecided; preserve flexibility without prematurely introducing complexity.

## Urgent concerns and emergency boundary

- Everyday care coordination is the application's primary responsibility, not emergency response.
- The earlier exploration of urgent communication does not commit a dedicated urgent-alert feature to the MVP; it remains deferred under the advanced-capability boundary in Q35. Ordinary contextual communication remains subject to emergency limitations.
- If urgent communication is supported, distinguish sending from receipt, acknowledgment, and agreement to respond. Do not imply continuous monitoring or a guaranteed immediate response.
- For genuine emergencies, direct users to appropriate emergency services rather than reliance on the application. Exact presentation remains undecided.
- Exclude professional emergency monitoring, automatic emergency dispatch, and similar capabilities from the initial MVP. Any future consideration requires separate evaluation.
- Respect privacy and appropriate access when communicating urgent concerns.
- Emergency-related functionality must not unnecessarily complicate everyday use; simplicity and minimal effort remain overarching requirements.

## Shared practical information

Provide a convenient, organized way for appropriate trusted participants to find information regularly needed when assisting an older adult, reducing reliance on scattered messages, emails, paper notes, and individual recollections.

Originally explored information categories follow. Q44 confirms only minimal purpose-relevant practical information, not comprehensive records or mandatory fields:

- Important contacts, including physicians, pharmacies, emergency contacts, neighbors, and service providers.
- Personal preferences, daily routines, communication preferences, and dietary preferences.
- Practical assistance information, including mobility limitations, transportation considerations, accessibility needs, and household instructions.
- Relevant health information, potentially including medications, allergies, important medical conditions, and care instructions.
- Information locating or referencing important documents, services, and other resources.

Guiding requirements:

- Allow information to be added gradually as needed; do not require a lengthy questionnaire or extensive entry before users benefit.
- Prioritize information with practical coordination value rather than collecting speculative information.
- Do not assume every helper can access every category. Sensitive health, financial, personal, and household information may need more restrictive access.
- For accuracy-sensitive information, explore identifying when it was last confirmed and avoid implying that outdated or unverified information is reliable.
- Respect the older adult's sharing preferences, subject to applicable legal authority and other considerations to be explored.
- Evaluate storing information against referencing an existing reliable source; avoid unnecessary duplication.
- Avoid a complicated personal-records management system or constant entry and maintenance burdens.
- Data structures, forms, integrations, and technical implementation remain open.

## Information updates and uncertainty

- Let authorized participants update ordinary information quickly and intuitively without multi-person approval or a formal review process for every change.
- Generally attribute changes to the person making them and when they were made.
- Provide a straightforward way to identify incorrect or outdated information without a complicated dispute-resolution process.
- Distinguish ordinary discrepancies from potentially consequential inaccuracies involving health, medications, safety, or other sensitive matters.
- Make unresolved uncertainty in sensitive information apparent to authorized participants who may rely on it; do not present disputed or unverified information as definitively correct.
- Where appropriate, encourage clarification with a reliable, authoritative source. Conflicting medication instructions should be clarified with an appropriate healthcare professional, not settled by a family vote or automated application determination.
- Once clarified, let an authorized participant update the information and resolve the concern without unnecessary procedure.
- Preserve appropriate information about significant changes and corrections without requiring users to navigate detailed audit history during ordinary use.
- Apply additional safeguards only where justified by the nature of the information. Simplicity and minimal administrative burden remain paramount.
- Editing, flagging, verification, concern resolution, and history mechanisms remain open for later design.

## Medication assistance exploration and subsequent decisions

The three levels below preserve the original exploration: Q40 includes practical coordination, Q41 defers dedicated dose reminders, and Q42 defers structured dose tracking. Ordinary caregiver reminders and completion reports remain included.

The three levels originally considered were:

1. Practical coordination: prescription pickup, refill reminders, pharmacy information, and medication-related responsibilities accepted by trusted helpers.
2. Reminders: helping older adults remember medications or caregivers remember medication-related assistance.
3. Limited tracking: recording whether medication was reportedly taken or administered by an older adult or caregiver.

Guiding requirements if these capabilities are included:

- Medication functionality is entirely optional and must not complicate use for families that do not need it.
- Keep medication entry, reminder arrangements, and activity reporting as simple as reasonably possible; avoid excessive reporting or verification requirements.
- Distinguish scheduled medication, a sent reminder, a reported dose taken or administered, and independent verification of administration.
- Missing confirmation is not proof that a dose was missed.
- Protect sensitive medication information through appropriate privacy and access boundaries.
- Do not independently recommend medications, determine dosages, or resolve conflicting medical instructions; those matters belong with qualified healthcare professionals.
- Evaluate practical benefits, risks, usability, and everyday value of reminders and limited tracking before MVP decisions, with simplicity and ease of use guiding scope.

## Communication exploration and subsequent decisions

- Prioritize exploration of communication associated with a particular need or activity, such as questions, arrangement clarification, changes, and coordination between participants.
- Explore brief general updates about the older adult, such as well-being, temporary living arrangements, or upcoming caregiver availability changes, shared with appropriate participants.
- Q43 confirms contextual comments and defers standalone general messaging and comprehensive discussion feeds; the examples above preserve the rationale for that boundary.
- Keep communication contextual where practical and avoid requiring extensive message-history reading to understand the situation or required action.
- Routine updates, responsibility acceptance, and completion reporting must not require lengthy conversations.
- Limit sensitive communication to appropriately authorized participants.
- Avoid excessive notifications and unnecessary messages.
- Distinguish sending a message from it being read, acknowledged, or acted upon.
- Do not replace existing communication services unless doing so offers clear practical benefit.
- Evaluate simple comments, brief updates, and other lightweight approaches before comprehensive chat; users should not need to maintain another complicated messaging system.

## Notification guidance

Notifications should support coordination without constant application interaction or notification overload. Prefer a small number of well-designed behaviors over elaborate options.

Situations warranting prompt notification in principle:

- A direct request for the recipient's assistance.
- Significant changes or cancellations affecting an accepted responsibility.
- Important coordination issues requiring the recipient's timely response.
- Urgent concerns from appropriate trusted participants, subject to the established emergency boundary and later capability prioritization.

Situations warranting ordinary reminders in principle:

- Upcoming accepted responsibilities.
- Significant approaching deadlines with needed assistance still unclaimed.
- Unanswered assistance requests where a reminder would be useful.

Routine shared-information changes, non-actionable general updates, ordinary completion reports, and similar activity should ordinarily remain visible in the application without immediate notifications.

Guiding requirements:

- Target relevant participants rather than everyone involved in the older adult's care.
- Minimize unnecessary, repetitive, and duplicate notifications.
- Provide sensible defaults without extensive initial configuration.
- Allow reasonable preference control, considering quiet hours and personal schedules.
- Match interruption to importance and urgency; avoid unnecessary exposure of sensitive information.
- Sending does not prove delivery, reading, acknowledgment, or action.
- Do not promise immediate responses or guaranteed emergency alerts.
- Notification channels, exact timing, priorities, escalation mechanisms, and configuration interfaces remain undecided; do not assume a complicated priority system or escalation engine.

## Permission and authorization

- Allow older adults who use the application to participate directly in authorizing assistance and appropriate information sharing.
- When an older adult does not use the application but retains relevant decision-making authority, explore a simple way for a trusted participant to record permission obtained outside the application. Clearly distinguish this from permission communicated directly by the older adult in the application.
- Explore lightweight recording of who reported permission, when, and its general scope. A report must not imply independent verification of legally valid consent.
- Distinguish permission for everyday coordination from permission to access or share sensitive medical, financial, or other personal information. Apply proportionate safeguards for consequential access.
- Accommodate legally authorized representatives while separately exploring the scope and verification of authority. Family relationships alone do not establish legal decision-making authority.
- Explore straightforward withdrawal of permission, participant removal, and restrictions on information sharing as preferences change, including consequences for information already shared.
- Explore what limited coordination, if any, is appropriate before permission is established, without misrepresenting consent or exposing sensitive information.
- Minimize friction for ordinary users and apply safeguards proportionate to information and activities; do not assume an elaborate consent-management system.
- Precise authorization, verification, and consent mechanisms remain open.

## Preparation before permission

- Allow limited private preparation before the older adult's permission is established, such as learning the application, planning one's own anticipated responsibilities, or preparing a discussion about assistance.
- Creating a preliminary plan or identifying an older adult must not imply their consent to participation or information sharing.
- Keep preparatory information private by default and avoid unnecessary collection of sensitive personal information before appropriate permission exists. Getting started must not automatically grant access to another person's private information.
- Invitations, information sharing, and collaborative care arrangements should ordinarily require an appropriate basis. Precise boundaries and justified exceptions remain open.
- Once appropriate permission is established, make the transition to ordinary collaboration straightforward without unnecessary re-entry of information.
- Avoid complicated preliminary workflows or administrative steps merely to explore the application or plan personal activities.
- Do not require or assume that every older adult personally uses the application, electronically signs consent, or has a smartphone.
- Explore concrete cases for limited, nonsensitive collaboration before permission before deciding whether to support it; privacy boundaries remain to be established.
- Draft-account, consent, invitation, and permission-management mechanisms remain undecided.

## Participation management

- When the older adult retains relevant decision-making authority, their preferences about participation govern.
- Allow delegation to one or more trusted individuals to manage participation within boundaries established by the older adult or an appropriately authorized representative.
- Let authorized participation managers invite appropriate family members, friends, or caregivers through a few straightforward steps without unnecessary approvals.
- Let participants without authority to add people suggest helpers without granting access.
- Distinguish an invitation, its acceptance, and access to particular information. Joining must not imply unrestricted sensitive-information access or legal decision-making authority.
- Allow authorized individuals to remove participants or change their involvement as circumstances change, including when a paid caregiver stops working with the family.
- Accommodate withdrawal of permission for continued participation, subject to applicable legal authority.
- Attribute significant participation changes without burdening ordinary users with complicated administration.
- Delegated application management does not confer legal authority over medical, financial, or personal decisions.
- Keep participation management extremely simple for ordinary families, with sensible privacy protections largely behind the scenes; avoid dozens of roles, settings, and approvals.
- Account structure, invitation mechanism, role hierarchy, and permissions implementation remain specification decisions. Apply the confirmed access principles in Q34 and Q44–Q46 rather than reopening their product scope.

## Access boundaries

- Explore ongoing trusted participation and limited-purpose help as participation situations, not fixed user roles or a committed permission structure.
- Limit access to information appropriate to responsibilities and authorized involvement. A transportation helper ordinarily needs logistics and relevant practical instructions, not unrelated medical, financial, or personal information.
- Allow deliberately authorized broader access where appropriate; do not infer it automatically from participation or family membership.
- Protect sensitive medical, financial, and personal information while allowing helpers to obtain necessary practical information without complicated permission requests.
- Accommodate changing responsibilities and participation without excessive administrative work.
- Allow authorized adjustment or revocation of access while recognizing that information already viewed or copied cannot necessarily be retrieved.
- Keep access governed by the older adult's preferences and applicable legal authority.
- Use sensible privacy defaults largely behind the scenes; ordinary users must not need to understand complex roles, permission matrices, or security concepts to invite help.
- Explore simple, intuitive access arrangements without committing user roles, permission structures, or technical implementations.

## Coordination context

- Default to one understandable primary coordination context per older adult, allowing family, friends, and paid caregivers to coordinate within one arrangement with appropriate individual access boundaries.
- Participation does not automatically grant access to every activity, discussion, or information item.
- Avoid duplicated responsibilities, schedules, and information across groups, and avoid requiring families to administer complicated group structures.
- Consider separate circles only for genuine needs, potentially including estrangement, selected sensitive matters, professional coordination apart from unrelated family matters, or exceptional privacy and safety circumstances that ordinary access boundaries cannot adequately address.
- Multiple-circle functionality is a potential future consideration, not a committed capability. If introduced, minimize confusion about responsibilities.
- The older adult's preferences and applicable authority continue to govern participation and access.
- No particular technical architecture or group structure is established by these principles.

## Accessibility and everyday usability

Accessibility is foundational for older adults and helpers alike, including participants with limited smartphone experience. Accessibility and simplicity must reinforce each other; the application should handle complexity so users do not have to.

Baseline requirements:

- Readable text, support for larger text sizes, sufficient contrast, and clearly identifiable controls.
- Generous touch targets without requiring precise movements or complicated gestures.
- Simple navigation, familiar interaction patterns, obvious actions, and minimal configuration.
- Predictable layouts, clear responsibilities, understandable reminders, and minimal demands on memory and attention.
- Plain language and concise instructions without technical terminology.
- Important information and notifications must not depend exclusively on sound.
- Screen-reader compatibility, accessible controls, and support for platform accessibility settings.
- Accessibility within ordinary workflows, without a complicated special mode; common activities achievable in very few steps.
- Avoid overwhelming screens, lengthy forms, excessive notifications, and unnecessary decisions.
- Make errors easy to recognize and correct without losing previously entered information.
- Preserve selective or no direct older-adult participation. Accommodating cognitive difficulties does not establish legal decision-making capacity.
- Sensible defaults with additional accessibility preferences where useful, without extensive configuration.

Consider comprehensive multilingual support and specialized assistance capabilities separately for later prioritization. Avoid design decisions that unnecessarily impede future localization.

Accessibility libraries, specific interface designs, and implementation details remain undecided.

## Connectivity interruptions

Remain useful during ordinary connectivity interruptions, including in medical facilities, parking garages, and rural areas, without becoming a complicated offline data-management system.

Limited essential offline viewing is confirmed MVP scope under Q37:

- Where practical, retain access to essential information previously made available to an authorized participant, such as appointment details, addresses, contacts, and relevant practical instructions.
- Respect information-access boundaries and appropriately protect sensitive information retained on devices.
- Clearly but unobtrusively indicate unavailable connectivity and potentially outdated information; offline information must not imply guaranteed currency.
- Account for the limitation that revoking access may not immediately remove information stored on a disconnected device.

Q38 confirms only offline completion of previously accepted responsibilities already available on the device; broader offline changes are deferred. The following principles apply within that limit:

- Explore simple updates, such as reporting completion of an accepted responsibility, with automatic sharing when connectivity returns.
- Distinguish updates recorded locally from updates successfully shared with other participants.
- Failed synchronization must not silently lose updates, and conflicting changes must not create misleading responsibility information.
- Do not require users to understand or manually administer complicated synchronization procedures.

Caching, storage, and synchronization architectures remain undecided. Favor simplicity, privacy, reliability, and minimal user effort.

## Geographic scope and language

- Focus the initial release on users in the United States, with English as the initial application language.
- A smaller Texas pilot is a possible testing approach, not a Texas-only product boundary. Do not unnecessarily restrict design or functionality to Texas residents.
- Support coordination when an older adult and helpers live in different U.S. states and time zones.
- Use U.S.-appropriate contact-information, date, time, and emergency-guidance conventions.
- Account for time-zone differences in coordination; exact presentation and scheduling behavior require further exploration.
- Recognize potential state differences in privacy, consent, and legal authority requirements without independently determining capacity, consent, guardianship, or representation. Family relationships do not automatically confer legal authority.
- Avoid complicated jurisdiction-selection or legal-compliance workflows for ordinary users; specific compliance mechanisms remain open.
- Avoid unnecessary barriers to future localization and international expansion. Expansion outside the United States is a future consideration, not an MVP commitment.
- Preserve simplicity, accessibility, privacy, and practical coordination as controlling priorities; no technical architecture is established by the geographic scope.

## Scheduling across time zones

- Give each scheduled activity one authoritative date, time, and applicable time zone.
- For activities at a physical location, ordinarily use that location's local time as the primary reference.
- Show participants' corresponding local times where useful, with clear labels and minimal visual clutter.
- Automatically account for time-zone differences and daylight saving time; reminders and notifications must reflect the correct scheduled time for the relevant participant.
- Virtual appointments, telephone calls, and other activities without a physical location also require an unambiguous reference time zone.
- Do not ordinarily require manual conversions or repeated time-zone configuration.
- For example, a 10:00 a.m. Houston appointment remains anchored to Central Time while a California participant can understand its Pacific Time equivalent.
- Prevent scheduling confusion while keeping everyday use exceptionally simple. Technical implementation remains undecided.

## Participant identity and shared devices

- Distinct participant identities and straightforward assisted participation are baseline requirements for participation, access, and attribution. Families must not need shared credentials.
- An appropriately authorized helper may coordinate assistance using their own identity and device without requiring the older adult to own or operate a personal device.
- When recording an action on behalf of another person, distinguish the person performing or recording the action from the person receiving assistance. Helping with the application does not itself confer legal decision-making authority.
- Explore occasional family device sharing without confused identities or inappropriate information exposure. Do not assume each participant owns or regularly uses a separate smartphone.
- Prevent inadvertent exposure of another participant's or care relationship's information on a shared device; address residual sessions, sensitive notifications, and retained information with appropriate safeguards.
- Avoid cumbersome account-switching or authentication procedures in ordinary use.
- Sophisticated regular shared-device support is deferred; distinct identities, assisted participation, and protection against incidental shared-device disclosure remain requirements. Organizational shared-work-device management is outside the approved consumer-only scope.
- Authentication methods, account-switching mechanisms, and device-management architecture remain undecided.

## Identity recovery and coordination continuity

- Provide reasonably simple, secure recovery of an existing participant identity and information after device loss, replacement, or account-access disruption.
- Do not ordinarily require recreating participation arrangements or accepted responsibilities; recovery should not unnecessarily depend on the lost device.
- Family relationships alone must not permit assuming another identity or bypassing security. Allow participants to secure accounts after device loss or theft.
- Keep accepted responsibilities visible to appropriately authorized participants during access disruption.
- Allow authorized participants to arrange replacement assistance without access to the unavailable person's account; distinguish the original commitment from the replacement arrangement.
- On return, let the participant understand relevant changes made during their absence. Replacement coordination does not imply completion of the original assistance.
- Preserve identity and access boundaries during recovery, and protect sensitive information from someone possessing a lost device. Recognize that previously stored offline information may not be immediately removable after revocation.
- Avoid elaborate recovery plans, mandatory backup administrators, or complicated management procedures for ordinary families. Prefer sensible safeguards and recovery options with minimal configuration.
- Support practical coordination continuity without guaranteeing fulfillment of every disrupted responsibility.
- Authentication providers, recovery methods, and technical implementations remain undecided.

## Ending participation, closure, and deletion

- Ending participation or access must not automatically delete useful historical contributions. Retain records for appropriately authorized participants where they continue to serve a legitimate coordination purpose, with accurate attribution of who performed or reported activities.
- End participation without disrupting ongoing coordination or responsibilities; departing participants must not retain access beyond what remains authorized.
- Allow an appropriately authorized individual to close an arrangement that is no longer needed. Distinguish closure from permanent deletion and consider death or substantial changes in care circumstances.
- Closure must not imply unauthorized continued access or indefinite retention of unnecessary information.
- Provide understandable ways for appropriately authorized individuals to request deletion, respecting the older adult's preferences, applicable authority, and relevant privacy or legal obligations.
- Contribution alone does not automatically confer permission to delete shared history.
- Do not retain sensitive information longer than reasonably necessary. Distinguish removal from active use from actual deletion, including limitations involving backups and copies previously accessed by others.
- Evaluate specific retention periods, deletion rights, and applicable legal requirements before launch; these are not settled in the interview.
- Keep departure and closure straightforward, use understandable language, and avoid requiring ordinary participants to manage complex retention or archival procedures. Protections should operate largely behind the scenes.
- Retention periods, archival structures, deletion mechanisms, and technical architecture remain undecided.

## Sharing information outside the application

- Explore sharing selected practical details, such as appointments, transportation instructions, addresses, and contacts, without requiring every occasional helper to create an account.
- Explore authorized sharing of selected information with healthcare professionals, paid caregivers, and service providers, simple printed summaries for people who prefer or require paper, and preservation of selected records when an arrangement closes.
- Prioritize small, relevant selections over exporting everything. Users should understand what is shared and with whom, and must have appropriate authorization.
- Avoid automatically including unrelated sensitive medical, financial, or personal information.
- Recognize that external copies may be redistributed and cannot necessarily be recalled. Export must not imply verified accuracy or completeness.
- Prefer simple sharing or printing where it reduces work; avoid elaborate report builders, complicated sharing permissions, and extensive configuration.
- Q39 confirms simple practical external sharing; comprehensive exports, formal reports, and extensive printing are deferred unless independently required.
- Evaluate applicable data-access and portability obligations before launch separately from convenience features, alongside privacy, retention, and deletion requirements.
- File formats, sharing mechanisms, and technical implementations remain undecided. Reduce coordination work rather than creating another information-management system.

## Assistance by people who do not use the application

- Allow an appropriately authorized participant to quickly record that an outside helper agreed to provide assistance, without requiring that helper to download the application or create an account.
- Distinguish the expected assistance provider from the participant recording the arrangement, and distinguish a reported commitment from one personally accepted in the application. Naming or assigning someone alone does not establish acceptance.
- Recording outside involvement must not automatically create an account, grant access, or require an invitation.
- Allow authorized participants to report completion by outside helpers, distinguishing who reportedly performed the activity from who recorded completion. Reports do not imply independent verification.
- Allow corrections without complicated approvals.
- Require minimal information and effort; contact information may be useful but must not automatically be mandatory. Avoid unnecessary personal information collection about non-users.
- Let authorized participants understand who is expected to help and whether responsibilities remain unresolved.
- Keep the ordinary experience unified: record who agreed to help, what they agreed to do, and whether it was completed. Do not make families administer separate systems for app users and non-users.
- Data structures, account representations, verification procedures, and technical implementations remain undecided.

## First-time use and first useful outcome

The primary suggested starting point is establishing one understandable, actionable need that can become the basis for real assistance coordination, not merely finishing account setup or creating a task list.

- Within the first few minutes, an organizer should be able to identify the older adult with minimal necessary information, describe a real need and relevant date and time, and see that it is recorded with assistance not yet arranged.
- Require only information reasonably necessary to understand the need. Avoid lengthy questionnaires, extensive profiles, and unnecessary setup friction while maintaining appropriate account security.
- Do not require establishing a team, inviting participants, or assigning responsibilities before creating a need.
- Clearly communicate whether assistance is still needed, arranged, or completed, preserving the previously established distinctions between acceptance, reported completion, and resolution of the overall need.
- Offer a relevant optional next step, such as inviting help where authorized, recording an agreement obtained outside the application, or returning later. Avoid a rigid mandatory workflow.
- Keep recording an existing outside arrangement straightforward, and distinguish private preparation from authorized collaboration.
- Allow exploration or preparation without forcing users to invent a need.
- Make progression from identifying a need to arranging and confirming assistance natural, demonstrating reduced coordination work rather than additional administration.
- Specific onboarding screens, workflow designs, and technical implementations remain undecided.

## Invited helper's first use

- Clearly explain the invitation's purpose in plain language: who invited the helper, who needs assistance, what is requested, when it is needed, and whether the helper can accept, decline, or respond later.
- Disclose only appropriately authorized information before identity and access requirements are satisfied.
- Keep account setup and onboarding as lightweight as security and privacy reasonably permit; do not require extensive profiles or configuration before participation.
- After joining, present the relevant request or next useful action directly rather than requiring a search through a general overview.
- Joining an arrangement is distinct from accepting a responsibility. Allow joining without committing to the prompting request; declining that request does not automatically decline overall participation.
- Ordinarily allow acceptance, refusal, or deferred response to a request. An unanswered request remains unresolved, not accepted.
- Make accepted commitments and outstanding assistance understandable, with minimal navigation, repeated confirmations, and onboarding complexity, including for people with limited smartphone experience.
- Joining does not grant unrestricted information access. Respect authorized involvement, the older adult's preferences, and applicable authority; family relationships alone are not proof of authorization.
- Make helping easy rather than adding an administrative responsibility. Invitation mechanisms, authentication methods, screens, and implementation remain undecided.

## Returning participant's everyday experience

Participants should understand within seconds what, if anything, needs attention and take the appropriate next action with minimal effort.

- Prioritize accepted upcoming responsibilities, requests awaiting the participant's response, relevant commitment changes, and overdue or otherwise attention-requiring responsibilities.
- Make unarranged assistance, unclaimed or unresolved responsibilities, and gaps caused by unavailable helpers easy to recognize for authorized participants. Visibility must not imply that every viewer is personally responsible for every gap.
- Provide easy access to upcoming arrangements and their status, with enough context to understand whether important needs are being addressed.
- Keep routine completion history and less immediate information available without dominating the initial experience.
- Reflect authorized access and involvement; do not overwhelm occasional helpers with coordinator-oriented information.
- Clearly identify the older adult associated with each responsibility and make switching between arrangements straightforward without unnecessary navigation or configuration.
- Distinguish requests, accepted commitments, reported completion, and unresolved needs. Give important matters appropriate prominence without exaggerated urgency or unnecessary alarm.
- When nothing requires attention, say so clearly rather than manufacturing tasks or notifications.
- Make common actions accessible with minimal taps. Avoid clutter, excessive status indicators, complicated filtering, extensive customization, or an administrative dashboard users must study.
- Screens, navigation structures, layouts, and technical implementations remain undecided.

## Initial collaboration authorization (Q34)

The preferred MVP starting point for ordinary coordination is a lightweight, attributable statement of permission, with limited sharing and clear ways to address objections or withdrawal.

- When the older adult retains relevant decision-making authority, their preferences and permission govern. An organizer may record that ordinary assistance coordination and, where applicable, invitations to trusted helpers were authorized.
- Identify the person making the statement and its general scope without extensive forms or documentation. Distinguish reported permission from independently verified consent; family relationships alone do not establish authorization.
- Limit initial collaboration to ordinary coordination information reasonably necessary for authorized assistance. Coordination permission does not grant access to all information; define sensitive medical, financial, and personal access separately.
- Invitations must not expose unnecessary sensitive information before appropriate access is established. Users must not need to understand complicated permission structures to begin ordinary coordination.
- Provide straightforward ways to express objections, limit participation, withdraw permission, and report disputed authorization or inappropriate access. Credible objections or disputes must trigger appropriate restrictions on further sharing while authorization is addressed.
- Do not independently determine legal capacity or resolve legal-authority disputes. Legal-representative claims and situations where the older adult cannot provide permission require separate consideration and potentially additional safeguards.
- Do not ordinarily require powers of attorney, digital signatures, or elaborate questionnaires for everyday coordination. Keep safeguards understandable, proportional, and largely behind the scenes; reserve additional verification for genuinely necessary situations.
- Specific verification methods, disputed-authority procedures, sensitive-access boundaries, and legal-compliance mechanisms require further definition before launch.

## Confirmed core MVP foundation (Q35)

Deliver one complete, intuitive everyday coordination experience that makes assistance substantially easier to organize than scattered calls, messages, emails, and calendars.

Core capabilities for appropriately authorized participants:

- Quickly establish a basic coordination arrangement without extensive onboarding.
- Record an actual assistance need with minimal necessary information.
- Invite trusted helpers and request assistance without complicated participation management.
- Record commitments obtained outside the application without requiring every helper to become an application user.
- Distinguish requests, directly accepted or reported commitments, and unresolved needs.
- Understand personal commitments and relevant coordination gaps requiring attention.
- Accommodate ordinary plan changes, cancellations, and replacement assistance.
- Report completion of responsibilities without implying resolution of the entire need.

Supporting MVP requirements include minimal practical coordination information; restrained relevant notifications and reminders; appropriate access boundaries and Q34 authorization; accessible, predictable interactions; distinct identities and straightforward recovery; clear scheduling and time-zone handling; and basic participation ending, access withdrawal, and privacy handling. Necessary security and legal safeguards must be defined before launch.

The experience must not impose a rigid sequence: creating a need does not require immediate invitations; an outside agreement does not require repeated in-app acceptance; simple needs do not require separate coordinators or elaborate responsibility structures; ordinary completion does not require extra verification; and irrelevant coordination steps may be skipped.

Q36–Q42 settle the previously open candidates: include basic recurrence, limited essential offline viewing, limited offline completion, practical external sharing, and ordinary medication coordination; defer broader offline editing, dedicated dose reminders, and structured dose tracking. Other advanced capabilities remain deferred unless necessary for the basic journey or a responsible launch. Guiding requirements for future capabilities remain preserved.

Success means a family can identify a need, arrange assistance, recognize gaps, respond to changes, and understand completion with substantially less effort and confusion than its previous informal methods. Q48–Q52 confirm evaluation plans and criteria.

## Confirmed MVP recurrence (Q36)

Basic recurrence is included in the MVP because it directly reduces repetitive family coordination work. This decision settles the earlier open prioritization question for recurrence.

- Support simple, common arrangements, such as daily or weekly assistance, with minimal information and configuration. Exact supported patterns remain for specification.
- Ordinarily accept an ongoing commitment once, including commitments reported from outside the application. Distinguish accepted recurring commitments from recurring needs with assistance not yet arranged.
- Distinguish individual occurrences: completion, cancellation, or missed assistance on one date must not incorrectly affect other dates. Completing one occurrence does not complete future occurrences.
- Allow a helper to become unavailable for a particular occurrence without necessarily ending their ongoing commitment. Keep that occurrence visibly unresolved until replacement assistance is arranged.
- Allow authorized changes to or ending of future arrangements without altering accurate history or reported completion. A single-occurrence change must not unintentionally change the series.
- Avoid repeated confirmations, excessive notifications, and unnecessary occurrence management. Make exceptions and gaps visible without requiring routine administration of each occurrence.
- Defer elaborate recurrence rules, complex dependency automation, and sophisticated scheduling systems. Technical implementation remains undecided.

## Confirmed MVP essential offline viewing (Q37)

Limited offline viewing is included in the MVP: participants should not lose essential practical information merely because connectivity temporarily disappears. This settles the earlier open prioritization question for essential offline viewing.

- Let authorized participants view previously available information reasonably necessary for accepted responsibilities, such as appointment times, locations, addresses, relevant contacts, and practical instructions, within established access boundaries.
- Ordinarily make essential information available offline automatically where practical, without manual preparation for each responsibility. Keep connected and disconnected use simple and predictable.
- Clearly but unobtrusively indicate potentially outdated information; do not guarantee currency or imply information is available offline when it was never made available on the device.
- Do not require users to understand caching or synchronization.
- Appropriately protect sensitive information retained on devices and address device loss and retained information in security and privacy requirements. Revocation cannot guarantee immediate removal from a disconnected device.
- Comprehensive offline access, extensive sensitive records offline, offline changes, comprehensive offline operation, and complex synchronization are not included by this decision. Offline updates require separate evaluation.
- Storage, caching, encryption, and synchronization implementations remain undecided.

## Confirmed MVP limited offline completion (Q38)

Include narrowly limited offline completion so helpers can report assistance when it occurs without remembering to return later. This settles the earlier open question for this subset of offline updates.

- Allow a participant to record completion of a previously accepted responsibility already available on their device. Save locally and automatically transmit when connectivity returns, subject to valid authorization and successful synchronization.
- Do not require manual retries or technical synchronization management in ordinary operation.
- Clearly but unobtrusively distinguish locally saved reports from successfully shared reports, for example, "Saved - waiting to share." Do not imply others received an update before successful transmission.
- Preserve pending reports through ordinary connectivity interruptions and application restarts. Repeated transmission attempts must not create duplicate completion reports.
- Do not silently overwrite newer information if the responsibility was canceled, reassigned, or materially changed while offline. Handle exceptional conflicts clearly with minimal user effort.
- Preserve attribution to the recording participant and appropriately protect local information. Do not share reports if the participant no longer has required authorization.
- Completing one responsibility does not resolve every aspect of the underlying need.
- Exclude broader offline changes from the initial MVP, including accepting new responsibilities, reassignment, shared-information editing, and complex conflict management, unless a later concrete need justifies reconsideration.
- During specification, explicitly evaluate development and testing implications to keep this capability appropriately limited. Local storage, synchronization, and conflict-resolution architecture remain undecided.

## Confirmed MVP practical external sharing (Q39)

Include optional, simple sharing of selected practical coordination information with people who do not use the application. This settles the earlier open prioritization question for practical external sharing.

- Let an appropriately authorized participant share a concise, purpose-specific summary of one assistance arrangement, potentially including date, time, location, relevant contacts, and practical instructions.
- Do not require recipients to install the application or create an account. Prefer quick, understandable sharing through familiar communication methods; exact mechanisms and formats remain for specification.
- Let participants review and understand the information before sharing. Include only information appropriate to the purpose and authorized for disclosure.
- Exclude unrelated sensitive medical, financial, and personal information by default. Consider potentially sensitive practical instructions separately rather than including them automatically.
- Identifying a potential helper must not automatically share information.
- Recognize that external information may be retained, copied, or redistributed and cannot necessarily be deleted by revoking application access. A shared summary does not independently verify accuracy or completeness.
- Keep the ordinary experience to selecting an arrangement, reviewing relevant details, and sharing, without report building, elaborate permission configuration, or re-entry of known information. Sharing is optional, not a required coordination step.
- Keep comprehensive exports, report builders, extensive printing, and advanced external collaboration outside the initial MVP unless independently required.
- Technical implementation remains undecided.

## Confirmed MVP practical medication coordination (Q40)

Include practical medication-related assistance through ordinary coordination capabilities, without a dedicated medication-management area.

- Coordinate prescription pickups, refill-related errands, pharmacy visits, and similar assistance like other responsibilities, using recurring arrangements and ordinary reminders where appropriate.
- Do not require medication lists, detailed medication records, specialized workflows, extra forms, specialized configuration, or medical terminology.
- Include pharmacy details, contacts, and practical instructions where helpful. Medication names, dosages, and other sensitive details remain optional and appropriately protected; share only information reasonably necessary for the helper's responsibility.
- Reported prescription-pickup completion establishes only reported pickup, not administration, ingestion, or clinical verification.
- Do not independently determine dosages, prescribe treatment, interpret conflicting clinical instructions, or make medical decisions.
- A dedicated medication database, pharmacy integrations, automatic refill management, medication administration records, and specialized clinical functionality are not required for this capability.
- Q41 and Q42 defer dedicated dose reminders and structured dose tracking. Interface and technical implementation remain for specification.

## Confirmed MVP medication reminder boundary (Q41)

- Include ordinary reminders for accepted medication-related caregiver responsibilities, such as assistance with an established routine, prescription pickup, or checking whether assistance is needed. Apply ordinary recurrence and reminders without repeated creation or acceptance of ongoing commitments.
- Reminders concern the agreed assistance responsibility, not independently prescribed or verified medication administration. Sensitive medication details remain optional and protected.
- Defer dedicated medication-dose reminders until after the initial release, subject to user research, pilot feedback, safety considerations, and demonstrated demand.
- The MVP does not require detailed medication schedules or dosage information, medication-specific dose reminders, specialized reminder or prescription-change management, medication-specific escalation, or missed-dose alert systems.
- Delivery or acknowledgment of a reminder does not establish administration or ingestion. Notifications do not guarantee receipt or action; ordinary reminders are not medical monitoring or a substitute for appropriate medication-management arrangements.
- Do not independently determine dosages, interpret clinical instructions, or recommend treatment.
- Preserve reasonable future flexibility without unnecessary medication-specific architecture or workflows. Q42 settles dose-taking tracking as deferred.

## Confirmed MVP medication completion boundary (Q42)

- Include ordinary completion reporting for accepted medication-assistance responsibilities through the same mechanisms as other activities, attributing who reported completion and when.
- A report establishes only reported completion of the agreed assistance, not administration, ingestion, or clinical verification of particular medications, nor resolution of the overall need.
- Defer structured dose tracking and medication administration records until a potential future release justified by actual needs and the additional complexity and safety requirements.
- The MVP does not require individual medication records marked taken, missed, refused, or administered; prescribed dosage and medication-specific administration-time tracking; reconciliation of conflicting or duplicate administration reports; specialized missed-dose alerts or escalation; or clinical administration histories.
- Keep medication information optional and appropriately restricted. Do not independently prescribe, determine dosages, interpret conflicting clinical instructions, or make treatment decisions.
- Ordinary assistance reminders and completion reports are not substitutes for appropriate medication-management arrangements.
- Do not require medication schedules, medication lists, or specialized forms. Avoid medication-specific complexity without demonstrated value.

## Confirmed MVP contextual comments (Q43)

- Include brief comments associated with individual needs or responsibilities for practical questions, clarification, and relevant circumstances. Attribute comments to their authors and make relevant comments easy to find in context.
- Restrict visibility to participants appropriately authorized for the information and involvement.
- Keep structured arrangement information authoritative and directly visible, including times, locations, accepted responsibilities, and completion status. Comments alone must not silently change schedules, assign responsibilities, modify commitments, or establish completion.
- Reflect important changes in the arrangement itself rather than only in comments. Do not require lengthy conversation-history reading to understand the current arrangement.
- Keep comments secondary to coordination. Routine acceptance, refusal, changes, and completion should be direct actions without required comments or explanations.
- Apply restrained notifications: avoid excessive comment notifications while bringing relevant questions or material changes to appropriate participants' attention when warranted.
- Defer standalone general messaging, chat rooms, comprehensive family discussion feeds, extensive conversation management, and advanced message organization or communication preferences unless future needs justify them.
- Messaging technology, notification mechanisms, and interface designs remain undecided.

## Confirmed MVP sensitive-information scope (Q44)

- Include minimal, purpose-relevant information reasonably necessary for assistance, such as mobility instructions, accessibility needs, practical health considerations, pharmacy details, emergency contacts, and assistance instructions.
- Collect gradually as needed; sensitive details are not mandatory for creating a need or arranging assistance. Do not encourage unnecessary medical, financial, or personal information collection.
- Limit access to authorized involvement, ordinarily giving limited-purpose helpers only what their responsibilities require. Broader access requires appropriate authorization, with sensible privacy defaults and minimal permission administration.
- Apply boundaries consistently to descriptions, instructions, comments, offline information, and external summaries. Offline access must not bypass authorization; external sharing requires authorization and review of selected information.
- Avoid incidental sensitive disclosure through invitations, notifications, or other communications. Do not require manual classification of every ordinary information item for reasonable protection.
- Defer dedicated repositories for comprehensive medical or clinical records, financial statements or account-management records, legal documents such as powers of attorney, trusts, and wills, and extensive medication histories or clinical medication management. Assistance involving these subjects may be coordinated without storing underlying records.
- Sensitive-information protection is foundational. Participant-entered information must not imply medical, legal, or independent verification.
- Evaluate applicable privacy, security, retention, and legal requirements before launch. Consider future specialized records only for demonstrated needs, without adding their complexity to the MVP.
- Data structures, security technologies, and permission architecture remain undecided.

## Confirmed MVP authorization concerns and withdrawal (Q45)

- Include straightforward access withdrawal, reporting of suspected unauthorized participation, access, or sharing, and proportionate protective restrictions.
- Ordinarily respect effective withdrawal or limitation promptly when the older adult retains relevant authority. Restrict or end affected access without unnecessary disruption to unrelated assistance or automatic deletion of historical records.
- Recognize that previously accessed, externally shared, or offline information cannot necessarily be retrieved.
- Credible concerns should prompt proportionate protection, potentially temporary restrictions on affected access or further disclosure. An allegation alone does not establish legal authority; do not disable the whole arrangement when narrower measures are appropriate.
- Preserve relevant history subject to privacy and retention requirements, and accurately represent unresolved responsibilities during restrictions.
- Define a clear, realistic review process before launch, including who reviews significant concerns, available protective actions, and handling of unresolved concerns.
- Do not independently determine legal capacity, conclusively interpret legal documents, or adjudicate competing authority claims. Do not promise immediate intervention or determinations the operator cannot provide.
- Keep ordinary corrections and routine participation changes outside formal review and avoid elaborate dispute procedures for everyday users.
- Detailed review procedures, safeguards, and legal-compliance requirements remain launch prerequisites, not settled mechanisms.

## Intended MVP representative-based authorization (Q46)

Include representative-based authorization in intended MVP scope, conditional on defining and validating a workable, legally appropriate safeguard and review process before launch. If that cannot be achieved responsibly within MVP constraints, explicitly narrow supported launch scenarios rather than use an insecure shortcut.

Confirmed requirements:

- Distinguish the older adult's own permission from representative authority. Smartphone non-use, limited technical ability, diagnosis, and family relationships do not themselves establish incapacity or authority. Preserve lightweight reporting of the older adult's permission when they can provide it.
- Accommodate an appropriately authorized representative establishing or managing coordination when the older adult cannot personally provide relevant permission. Authority must cover the particular decisions, participation arrangements, and disclosures involved.
- Do not infer authority from labels such as spouse, adult child, caregiver, agent, or guardian, or transfer authority over one subject to unrelated personal or healthcare matters. Accommodate changes, limits, expiration, and termination.
- Unsupported assertions must not automatically grant access equivalent to established authorization. Insufficiently supported or unresolved claims must not enable unrestricted collaboration or sensitive disclosure; appropriate private preparation may remain available.
- Do not independently determine legal capacity or conclusively adjudicate competing claims. Apply Q45 protective restrictions and review principles when authority is challenged or questionable, respecting the older adult's legally effective decisions and preferences.
- Preserve appropriate historical accountability without unnecessary disruption to unrelated assistance. Handle any supporting documents securely, only for the necessary purpose, with appropriate retention and deletion.
- Keep representative-specific procedures out of ordinary permission-based use. Do not require every family to upload documents, answer lengthy questionnaires, or navigate legal terminology; do not build comprehensive legal-document management or adjudication.

Unresolved launch prerequisites: define and validate the proportionate authority-establishment process, review responsibilities and safeguards, applicable state and authority-type considerations, and secure supporting-document handling if required. Confirm supported launch scenarios after that assessment. No verification implementation or legal determination is settled here.

## Confirmed MVP explicit need resolution (Q47)

- Include explicit overall need resolution. Where appropriate, let an authorized participant report responsibility completion and expressly confirm that the underlying need was addressed in one intuitive action, with clear meaning and attribution of both outcomes. Neither outcome implies independent verification.
- Preserve completion-only reporting when a participant's contribution does not establish overall resolution or they lack authority to resolve the need. Authority to report a responsibility completed does not automatically confer authority to resolve the whole need.
- For multi-part needs, keep responsibilities and their statuses distinct. An appropriately authorized participant may expressly resolve the need after remaining responsibilities are completed, potentially combined with the final completion action without another approval round.
- Never infer overall resolution solely from one or all completion reports. Reporting overall resolution must not silently complete, cancel, or dismiss outstanding responsibilities.
- Allow correction of inaccurate completion or resolution reports while preserving appropriate history and attribution. Ordinary activities do not require independent verification or multi-person approval.
- Avoid repeated confirmations, unnecessary screens, and complicated status management. Present straightforward situation-appropriate actions and manage internal reporting distinctions behind the scenes. Additional confirmation must address a genuine risk rather than be imposed universally.

## Confirmed evaluation sequence (Q48)

Use two stages to evaluate simplicity and everyday coordination value. Q49–Q52 confirm participant targets, duration, and observable criteria without rigid numerical success thresholds.

Stage 1: short, structured usability sessions using fictional older adults, helpers, appointments, and needs, without requiring real medical, financial, or other sensitive care information.

- Observe first-time organizers, invited helpers, and returning participants completing core activities without extensive explanation or coaching: recording needs, requesting help, accepting or declining, identifying unresolved responsibilities, reporting completion, and expressly confirming resolution.
- Include ordinary changes, recurring exceptions, and simulated connectivity interruptions as relevant capabilities become available. Evaluate limited-smartphone-experience use.
- Use observation and a few brief feedback questions rather than lengthy questionnaires. Testing may start with prototypes or partial implementations before the entire MVP is complete.

Stage 2: a small live-family pilot with actual coordination only after significant usability problems are addressed and applicable privacy, security, authorization, and operational safeguards are in place.

- Assess ease and burden relative to previous methods, understanding of responsibilities and changes, reduced unnecessary communication, confusion and duplication, notification burden, reliability, and confidence in information.
- Minimize feedback requests; do not require diaries, extensive surveys, or administrative reporting. Treat results as preliminary evidence, not definitive proof of effectiveness.
- Address representative authorization, disputed permission, offline information, and external sharing safeguards where relevant before live use. Do not imply guaranteed assistance, emergency monitoring, or independent verification of care.

## Confirmed initial usability round (Q49)

- Begin with approximately five individual participants, including at least two with limited smartphone confidence or experience. Where practical, include family organizers, occasional helpers, and older adults who may participate directly, considering age, technology experience, and accessibility needs.
- Aim for approximately 30-minute sessions, allowing up to 45 minutes where useful. Use realistic fictional scenarios and synthetic information, observing activity completion without coaching.
- Distribute organizer, invited-helper, and returning-participant scenarios across sessions; do not require everyone to test every role or capability. Avoid lengthy questionnaires and exhaustive demonstrations.
- Observe understanding of the application's purpose, starting coordination, responding to requests, recognizing commitments and gaps, and distinguishing completion from overall resolution. Note repeated hesitation, confusion, consequential mistakes, assistance required, and perceived simplicity, especially among less confident smartphone users.
- Record significant and recurring usability problems, prioritize barriers to important activities, improve, and conduct targeted retesting as appropriate.
- This is a lightweight initial improvement round, not statistical validation, proof of universal accessibility, or a determination of live-use or release readiness. Q50 confirms live pilot size and duration.

## Confirmed initial live pilot plan (Q50)

- Following synthetic usability testing and satisfaction of applicable safeguards, begin with approximately three real family coordination arrangements over approximately four weeks. These are flexible starting targets, not rigid quotas.
- Ideally include an older adult and at least two coordinating or assisting people per arrangement; do not require the older adult to use the application. Recruit genuine existing needs, with variation in circumstances, technology confidence, and assistance types where practical.
- Observe ordinary recurring assistance, changes, commitments, gaps, and completion without manufactured activities or artificial live tasks. Accommodate reasonable changes in family circumstances.
- Evaluate effort and confusion relative to existing methods, understanding of responsibilities and gaps, recurring arrangements and changes, useful visibility without excessive interaction, notification burden, confidence in statuses, and participation by occasional and non-user helpers.
- Minimize burden through brief conversations or a few targeted questions, not extensive surveys or diaries. Collect only information reasonably necessary for evaluation.
- Before live use, address applicable privacy, security, authorization, reliability, and operational safeguards, including representative authority and disputes relevant to actual participants.
- Explain pilot status and the absence of emergency monitoring or guaranteed care. Ensure alternative coordination methods for essential assistance during outages and a realistic route for reporting significant problems.
- Treat findings as preliminary, not conclusive effectiveness evidence. Q51 and Q52 confirm observable evaluation criteria.

## Confirmed synthetic usability success criteria (Q51)

Use three primary criteria:

- Independent task completion: record independent completion, completion with assistance, or non-completion for assigned scenarios, approximate times, significant hesitation, confusion, and consequential errors. Do not require everyone to test everything; avoid coaching except to prevent distress or allow continuation.
- Correct understanding: where relevant, participants understand requests, accepted responsibilities, unresolved needs, whether completion expressly included resolution, what is shared and with whom, and whether offline completion is pending or successfully shared. Understanding matters as much as executing an interface action.
- Material problems addressed: identify, prioritize, correct, and retest barriers or consequential misunderstandings before affected functionality enters live use, especially risks of missed responsibilities, inaccurate completion, or inappropriate disclosure. Use targeted retesting; cosmetic issues and harmless hesitation do not automatically block further testing.

Preliminary diagnostic benchmarks: generally record the first need within approximately five minutes and recognize attention items within approximately 30 seconds. These are not rigid pass/fail thresholds; consider technology confidence, accessibility needs, and reasons for delay. Favor individual observations and recurring patterns over statistical percentages in this small, varied sample.

Use brief observation notes and a few follow-up questions, not extensive paperwork. Make clear that the application, not the participant, is being evaluated. Keep evaluation proportionate to early development.

## Confirmed live-pilot success criteria (Q52)

Evaluate four outcomes without rigid numerical thresholds:

- Reduced coordination effort: seek concrete examples of less chasing, repeated messages, duplicate work, and uncertainty, as well as new frustration or work introduced by the application. Judge whether coordination is meaningfully easier overall without participant time logs, message counts, or diaries.
- Clear coordination: participants understand commitments, gaps, changes, recurring exceptions, and responsibility completion versus overall need resolution. Prioritize confusion that could cause missed assistance or incorrect responsibility assumptions.
- Dependable behavior: encountered features behave consistently and accurately. Do not misleadingly present offline information as current, lose pending completion silently, falsely imply sharing, or unexpectedly disclose unrelated sensitive information. Address material privacy, security, and reliability problems before expansion; serious unresolved problems require appropriate restrictions or pausing affected use.
- Acceptable burden and trust: useful notifications, understandable sharing boundaries, minimal routine entry and configuration, and willingness to continue. Pay attention to occasional helpers and people with limited smartphone confidence.

For each family, use a brief baseline conversation about existing coordination, approximately four weeks of ordinary use, an optional brief midpoint check-in, and a short closing conversation about benefits, frustrations, misunderstandings, and willingness to continue. Supplement only with limited, appropriate, authorized, privacy-conscious observations or reliability information. Avoid extensive questionnaires, unnecessary tracking, and burdensome reporting.

Capabilities not naturally encountered remain unevaluated in live use, with synthetic and technical testing providing separate evidence. Findings from approximately three families over four weeks are preliminary, not statistically representative or definitive effectiveness evidence.

Use concrete observations, recurring issues, participant experience, and material reliability findings to decide whether to cautiously expand, improve and retest, narrow capabilities that add more work than value, or pause or restrict live use. No rigid numerical success thresholds are established.

## Established project constraints

- Target Apple iOS and Android using Expo SDK 58, React Native, and TypeScript, as specified by the project owner.
- Development environment and initial Git repository are configured; do not repeat setup.
- Define requirements before writing application code.
