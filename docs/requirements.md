# Elder Care App v2 requirements

## Status

Requirements interview in progress. The principles below are confirmed; functional scope and release priorities remain open.

## Purpose

Help family members, friends, and other trusted individuals coordinate dependable assistance for older adults with daily needs, while preserving dignity, autonomy, independence, and quality of life. Reduce miscommunication, duplicated work, missed responsibilities, uncertainty about responsibilities, and stress.

Appointments, transportation, medication-related tasks, household responsibilities, errands, information sharing, scheduling, activity tracking, and communication are illustrative needs to explore, not committed features.

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
- Appropriate coordination with professional caregivers is part of the longer-term vision; individual professional participation remains a candidate capability whose MVP inclusion is undecided.
- Evaluate home care agencies and other organizations separately during MVP prioritization. Full organizational functionality is not a confirmed MVP requirement.
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
- Explore a simple, intuitive way for authorized participants to communicate urgent concerns. A dedicated urgent-communication feature is a candidate for MVP prioritization, not a committed capability.
- If urgent communication is supported, distinguish sending from receipt, acknowledgment, and agreement to respond. Do not imply continuous monitoring or a guaranteed immediate response.
- For genuine emergencies, direct users to appropriate emergency services rather than reliance on the application. Exact presentation remains undecided.
- Exclude professional emergency monitoring, automatic emergency dispatch, and similar capabilities from the initial MVP. Any future consideration requires separate evaluation.
- Respect privacy and appropriate access when communicating urgent concerns.
- Emergency-related functionality must not unnecessarily complicate everyday use; simplicity and minimal effort remain overarching requirements.

## Shared practical information

Provide a convenient, organized way for appropriate trusted participants to find information regularly needed when assisting an older adult, reducing reliance on scattered messages, emails, paper notes, and individual recollections.

Candidate categories to explore, not committed MVP scope:

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

## Medication assistance candidates

Explore three levels separately; none is a finalized feature or committed MVP scope:

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

## Communication candidates

- Prioritize exploration of communication associated with a particular need or activity, such as questions, arrangement clarification, changes, and coordination between participants.
- Explore brief general updates about the older adult, such as well-being, temporary living arrangements, or upcoming caregiver availability changes, shared with appropriate participants.
- These are candidate capabilities for later MVP evaluation, not a commitment to a full messaging system.
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
- Account structure, invitation mechanism, role hierarchy, and permissions implementation remain undecided. Access boundaries require further exploration.

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

Offline viewing is a high-priority capability to explore:

- Where practical, retain access to essential information previously made available to an authorized participant, such as appointment details, addresses, contacts, and relevant practical instructions.
- Respect information-access boundaries and appropriately protect sensitive information retained on devices.
- Clearly but unobtrusively indicate unavailable connectivity and potentially outdated information; offline information must not imply guaranteed currency.
- Account for the limitation that revoking access may not immediately remove information stored on a disconnected device.

Offline updates are a separate candidate for MVP evaluation:

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
- Regular shared-device use by multiple independently authenticated participants remains a candidate based on demonstrated need. Sophisticated professional shared-work-device management is not an initial MVP requirement and belongs with separate organizational evaluation.
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
- Simple sharing of essential practical information is a potentially valuable early capability. Comprehensive exports, formal reports, and extensive printing remain candidates for later prioritization, not automatic MVP commitments.
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

## Established project constraints

- Target Apple iOS and Android using Expo SDK 58, React Native, and TypeScript, as specified by the project owner.
- Development environment and initial Git repository are configured; do not repeat setup.
- Define requirements before writing application code.
