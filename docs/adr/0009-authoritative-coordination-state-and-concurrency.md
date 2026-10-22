# Use authoritative coordination state with transactional changes

Maintain authoritative current coordination state in PostgreSQL, with controlled transactional operations for consequential changes, material-change conflict detection, safe retries, and concise attributable history. This supports reliable collaboration without full event sourcing or workflow infrastructure; the application should handle complexity so users do not have to.

## Approved invariants

- Preserve the distinctions among needs, requests/opportunities, responsibilities, accepted commitments, reported outside commitments, completion reports, and express need resolution. These are conceptual distinctions, not a selected schema or exhaustive state-label list.
- Joining, viewing, suggesting, or receiving a request never automatically establishes acceptance.
- Authorize consequential operations against current authoritative state, validate applicable transitions, and apply related updates atomically where necessary. Prevent unintended duplicate/conflicting commitments for single-person responsibilities without prohibiting legitimate multi-person contributions or separate coordination/performance responsibilities.
- Materially outdated actions must not silently overwrite newer arrangements. Unrelated changes should not cause unnecessary conflicts.
- Network retries and repeated submissions must not duplicate commitments, completion reports, or other consequential records.
- Withdrawal, cancellation, reassignment, replacements, and corrections preserve meaningful attribution and expose resulting gaps. Proposed replacement help is not accepted help.
- Completion reports are attributable claims, not independent verification. Completing one or all responsibilities never automatically resolves the need.
- Where authorized and appropriate, one intuitive operation reports completion and expressly resolves the need, recording both intended outcomes atomically. It must never silently complete, cancel, or dismiss outstanding responsibilities.
- Preserve distinct assistance-provider and recorder attribution for outside agreements and completion, relevant timestamps, and subsequent corrections. Do not replace historical actors with the latest assignee.
- Distinguish recurring occurrences and historical reports. One occurrence's changes must not silently alter others or rewrite historical results.
- Offline completion remains provisional until backend acceptance after applicable authorization, state, conflict, and duplicate-prevention checks. This adds no broader offline mutation capability.
- Protect transactional operations against unauthorized invocation and privilege escalation. Supabase database functions are an available option, not a finalized mechanism; review execution permissions and security context explicitly.
- Ordinary actions require no unnecessary approval rounds, mandatory comments, repeated confirmations, or technical conflict messages. Give clear outcomes and straightforward recovery for materially changed circumstances.

## Approved single-person acceptance behavior

- For a single-person responsibility explicitly available for acceptance, the first valid acceptance successfully committed by the backend secures it. Backend authorization, current availability, applicable state, older-adult preferences, and authorized performer restrictions must all be satisfied; first arrival alone is insufficient.
- A competing acceptance neither overwrites the existing commitment nor creates an unintended duplicate. Give a simple indication that the responsibility has already been arranged.
- Retrying an already successful acceptance, including after a lost response, returns the existing successful outcome without another commitment. This must not bypass current authorization or disclose information beyond current access.
- Interest or availability is not acceptance when an interaction is intended only to gather willingness. This distinction does not require a separate availability-gathering feature.
- Respect an existing valid commitment, including an appropriately recorded outside agreement, before admitting a competing exclusive commitment.
- Preserve deliberate multi-person assistance through distinct contributions or authorized shared responsibilities. The exclusive rule does not prohibit legitimate multi-helper activities.
- Acceptance remains separate from completion and express need resolution. Ordinary acceptance requires no mandatory Coordinator approval, extra confirmations, or unnecessary administration.

## Rationale and alternatives

Unrestricted client status editing and last-write-wins coordination can create misleading commitments or overwrite newer arrangements. Transactions alone do not necessarily detect outdated user intent; combine invariant protection with appropriate material-change checks. Full event sourcing and workflow engines impose unnecessary infrastructure and maintenance for this MVP. Prefer current state plus meaningful history and the simplest reliable mechanisms compatible with ADR 0001.

## Unresolved decisions

The single-person first-valid-committed-acceptance rule above is approved. Material-change rules, resolution with outstanding responsibilities, detailed state labels, database schema, transaction/locking mechanisms, API implementation, detailed interfaces, and unusual conflict-handling cases remain for subsequent review. No particular replacement or resolution policy is selected here. Resolve consequential behavior before dependent tickets are finalized; routine implementation details must demonstrably preserve these invariants.

Preserve requirements, ADRs 0001–0008, all 72 stories, established testing and launch gates, consumer-only scope, and conditional hosting and representative authorization. No implementation, tickets, additional technology selection, or commit is authorized.
