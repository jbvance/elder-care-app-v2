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

## Approved contextual need resolution

- Resolution is an attributable, authorized report that the underlying need has been addressed, not independent verification or a statement that every responsibility was completed. Completion of one or all responsibilities still never automatically establishes resolution.
- With no outstanding work, allow one intuitive express-resolution action without extra confirmations. Preserve authorized combined completion and express resolution in one action, recording both intended outcomes atomically.
- With outstanding work, give a concise contextual indication and allow appropriate disposition. Explicit cancellation of no-longer-needed assistance requires its own applicable authority and preserves history; resolution authority alone does not grant permission to cancel or modify another commitment.
- An authorized participant may resolve a genuinely addressed need while leaving responsibilities they cannot change requiring follow-up. Responsibilities not canceled or otherwise appropriately addressed remain accurately represented and visible to authorized participants, never silently completed, dismissed, or erased.
- Keep resolved needs with remaining follow-up identifiable in appropriate attention views; do not present an unqualified everything-finished outcome. Notify affected Helpers of consequential changes under the restrained notification rules, without treating sending as receipt, acknowledgment, or action.
- Unresolved or unclaimed opportunities associated with a resolved need must not misleadingly solicit new commitments. Their availability must reflect resolution without silently disposing of accepted responsibilities or losing meaningful history. Exact handling remains to be specified; blocking misleading solicitation does not mean marking assistance completed or erasing an unresolved responsibility.
- Backend authorization, state, and conflict checks must prevent outdated resolution actions from overwriting concurrent material changes. Preserve the existing transactional and retry invariants.
- Correct mistaken resolution with historical attribution preserved, without automatically restoring canceled commitments. Distinguish resolution from refusal or withdrawal of permission: declining assistance is not successful completion.
- Respect older-adult preferences, applicable authority, and information audiences when presenting remaining work; do not disclose restricted details to someone merely because they can resolve the need. Keep exceptional interactions simple, with no mandatory comments, universal approval rounds, or repetitive ordinary confirmations.

## Rationale and alternatives

Unrestricted client status editing and last-write-wins coordination can create misleading commitments or overwrite newer arrangements. Transactions alone do not necessarily detect outdated user intent; combine invariant protection with appropriate material-change checks. Full event sourcing and workflow engines impose unnecessary infrastructure and maintenance for this MVP. Prefer current state plus meaningful history and the simplest reliable mechanisms compatible with ADR 0001.

Blocking resolution until all work is settled can misrepresent a genuinely satisfied need and force unnecessary administrative cleanup. Unqualified resolution with hidden remaining work risks continued unnecessary assistance. Contextual resolution preserves both facts and makes explicit dispositions or follow-up apparent without adding universal confirmation steps.

## Unresolved decisions

The single-person acceptance rule and contextual resolution behavior above are approved. Material-change rules, detailed handling of opportunity availability after resolution, detailed state labels, database schema, transaction/locking mechanisms, API implementation, interfaces, and unusual conflict cases remain for subsequent review. No particular replacement policy is selected here. Resolve consequential behavior before dependent tickets are finalized; routine implementation details must demonstrably preserve these invariants.

Preserve requirements, ADRs 0001–0008, all 72 stories, established testing and launch gates, consumer-only scope, and conditional hosting and representative authorization. No implementation, tickets, additional technology selection, or commit is authorized.
