# Use recurring arrangements with rolling identifiable occurrences

Represent recurring assistance through an ongoing arrangement and separately identifiable occurrences generated over a bounded rolling future window, extended as needed. Preserve occurrences with meaningful commitments, exceptions, completion reports, unresolved history, or other consequential records, keeping everyday use simple while maintaining reliable history.

## Approved architecture and behavioral rules

- A recurring need or schedule is distinct from an accepted ongoing commitment. Creating a schedule establishes no Helper acceptance.
- Ordinarily accept an ongoing responsibility once for its agreed occurrences, without repeated acceptance. Support authorized recording of recurring outside agreements with separate provider and recorder attribution.
- Each occurrence has stable identity and independently maintains reports, exceptions, cancellations, replacement arrangements, and express resolution. A change or unavailability for one occurrence does not automatically alter future occurrences.
- If assistance is still needed when a Helper is unavailable, keep the occurrence's gap visible for authorized replacement coordination. Proposed replacements are not accepted commitments.
- Provide understandable one-occurrence versus applicable-future changes without rewriting historical commitments, reports, corrections, or exceptions.
- Material schedule or responsibility changes must not silently expand an accepted commitment. Distinguish minor changes from those requiring renewed agreement; exact thresholds and rules require later approval.
- Generation and extension are duplicate-safe and preserve identities, exceptions, cancellations, and reports. Do not recreate an established occurrence as a different responsibility or invalidate an offline report's reference by regeneration.
- Include reliable catch-up so inactivity, connectivity interruption, or scheduling failure does not lose or conceal unfulfilled assistance. Missing materialization is not evidence of completion or absence of a need.
- Correctness and unattended reminders must not depend solely on opening the mobile app. Where necessary use a shared lightweight backend generation/maintenance mechanism, not per-arrangement schedulers or elaborate infrastructure. The mechanism is not selected here.
- Preserve intended local schedule and named time zone so assistance remains at the correct local time across daylight-saving transitions. Define ambiguous and nonexistent local-time behavior before implementation; a fixed UTC offset alone is insufficient to express this intent.
- Occurrence completion does not automatically resolve its underlying need. Express resolution of one occurrence does not terminate the ongoing arrangement. Apply ADR 0009's outstanding-work follow-up and solicitation protections to the relevant occurrence rather than silently altering the series.
- Preserve current relationship-specific authorization, contextual audiences, first-valid-acceptance behavior, transactional concurrency protection, and limited offline completion under ADRs 0001–0010. An ongoing commitment does not override later access restrictions or applicable authority.
- Prefer ordinary recurrence patterns and minimal configuration. No sophisticated recurrence builders, calendar integrations, dependency scheduling engines, speculative automation, required comments, or redundant acceptance/confirmation steps.

## Rationale and alternatives

Generating an indefinite series upfront creates unnecessary records and cumbersome future edits. Pure on-demand calculation makes durable identities, exceptions, offline references, and unattended reminders harder to manage. A bounded rolling window with extension, preservation of consequential occurrences, and catch-up offers practical stability without a complex calendar engine.

An ongoing commitment supplies agreed coverage without requiring individual acceptance of every generated occurrence. Occurrence-level state preserves the distinction between today's exception and the future arrangement. Shared backend maintenance avoids reliance on mobile execution while limiting ongoing operational burden.

## Unresolved choices and consequences

Exact supported patterns, generation-window size, generation mechanism, renewed-acceptance rules, daylight-saving edge policies, schema, and implementation details remain for subsequent decisions. Daily, weekly, or every-other-week examples from recommendation are not a finalized pattern list. No scheduler, recurrence library, or API contract is selected.

Before dependent tickets are finalized, resolve consequential schedule-change and time-edge behavior; implementation must validate concurrent generation, catch-up, series edits, exceptions, and offline report identity. Preserve historical accuracy without introducing unnecessary user-facing administration. Retention remains subject to the existing approved policy gates, not a new indefinite-retention mandate.

Preserve the approved MVP, all 72 stories, existing testing and launch gates, consumer-only operation, conditional representative safeguards and hosting, and synthetic-development-data requirements. The application should handle complexity so its users do not have to. No implementation, tickets, additional technology selection, or commit is authorized.
