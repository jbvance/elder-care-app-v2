# Limit Helper scope while supporting authorized opportunity discovery

Default Helper access to needs, responsibilities, and practical information explicitly made available within authorized participation scope, while allowing Coordinators to make appropriate unclaimed needs available for voluntary assistance. This refines ADR 0006 without creating another preset or sacrificing ADR 0005's audience boundaries; the application should handle complexity so users do not have to.

## Approved boundaries

- Joining an arrangement or receiving the Helper preset does not grant visibility into every need, unrelated personal information, or restricted background.
- Authorized ongoing scopes may cover recurring assistance and other appropriate ongoing involvement without repeated authorization for each occurrence or ordinary responsibility.
- An authorized Coordinator may make appropriate unclaimed needs available to selected Helpers or an authorized group of Helpers without individually assigning every responsibility. This describes an audience within the existing arrangement, not a separate coordination circle or new group-management subsystem.
- A Helper can understand an available opportunity and volunteer or accept responsibility without unrestricted arrangement-wide access. Visibility is not acceptance or commitment; preserve explicit acceptance and unresolved-gap semantics.
- Opportunity information must provide sufficient authorized practical context under ADR 0005 without unnecessary unrelated sensitive disclosure. Relevant health information remains shareable where authorized and needed; medical/nonmedical classification is not the access boundary.
- Use sensible defaults and simple availability mechanisms to avoid repetitive Coordinator administration for ordinary needs. No third preset, public marketplace, or complex permission-management interface is authorized.
- Preserve relationship-specific, backend-enforced access, the older adult's preferences, applicable authority, and delegation limits. Opportunity discovery does not bypass recipient-bound joining or create accounts/access for outside helpers.

## Rationale and alternatives

Arrangement-wide visibility by default exposes too much. Restricting Helpers only to assigned responsibilities would conceal useful unclaimed opportunities and force Coordinators to contact or assign people individually. Limited default scope plus authorized opportunity availability preserves privacy and voluntary help without requiring one-off access administration for every occurrence.

## Unresolved details

Exact scope-selection interactions, opportunity visibility defaults, audience labels, database representation, and enforcement mechanisms remain for subsequent review. This decision does not set every new need visible to all Helpers, prescribe automatic group inclusion, or select a volunteering/acceptance concurrency mechanism.

Preserve existing requirements, ADRs 0001–0006, approved testing, conditional representative authority, consumer-only scope, and contractual/live-data gates. ADR 0006 and its associated pending documentation changes remain intact and uncommitted. No tickets, implementation, additional technology selection, or commit is authorized.
