# Use contextual audiences for practical and restricted information

Distinguish practical information intended for a limited, explicitly authorized helper audience from additional background information that remains restricted unless separately authorized. This refines ADR 0004's audience boundary while keeping ordinary coordination simple: the application should handle complexity so users do not have to.

## Approved boundaries

- Access depends on authorized involvement and legitimate coordination needs, not merely whether content is medical or nonmedical. Relevant diagnoses, medications, dosages, mobility limitations, physician details, and other health information may be shared with authorized helpers when appropriate.
- Use conservative, understandable default audiences. Ordinary users must not configure permissions for every field, sentence, comment, or assistance request.
- Information associated with a need or responsibility ordinarily follows that context's authorized audience. Comments have a clear audience consistent with their context. Users entering information must understand who can see it without navigating a complicated permission interface.
- Restricted background must not become visible to broader audiences automatically because someone is invited, accepts a responsibility, or receives participation-management authority.
- If broader disclosure of restricted information is supported, require an understandable deliberate disclosure choice, without unnecessary repeated confirmation. This conditional requirement does not itself add a new sharing capability or finalize an audience-changing interaction.
- Do not use automatic detection or classification of sensitive text as a security boundary. Descriptions and comments may contain voluntarily entered sensitive information and must receive the protection of their applicable audience.
- Enforce access in the backend, including direct requests, rather than rely on hidden screens. Apply consistent protection to offline copies, notifications, and external sharing; preserve existing limits on recalling previously disclosed information.
- Respect the older adult's preferences, applicable authority, and ADRs 0001–0004. Context membership does not override restricted-information rules or grant legal authority.
- Minimize routine sharing decisions; make sophisticated controls available only when genuinely necessary, not as mandatory administration.

## Rationale and alternatives

Giving every participant all arrangement information is easier but fails limited-purpose privacy needs. Classifying medical versus nonmedical content is insufficient because either may be relevant or sensitive. Per-sentence or per-comment permission setup would burden families, while automatic classification cannot reliably enforce disclosure boundaries. Contextual audiences with separate restricted background provide understandable defaults without creating a general-purpose permissions editor.

## Unresolved choices and consequences

Exact audience labels, default assignments, audience-changing interactions, database representation, and enforcement implementation require subsequent decisions. No schema, SQL policy, library, automatic redaction service, or new technical subsystem is selected.

Context inheritance must not accidentally broaden restricted information. Practical instructions may legitimately include sensitive health details when authorized; moving or copying restricted material to a broader audience is a disclosure decision, not permission automatically inherited from the destination. Precise interactions remain open.

This decision refines, rather than replaces, ADR 0004. Its pending documentation changes remain intact. Preserve the approved MVP scope, consumer-only operation, conditional representative authority, Supabase contractual gates, and synthetic-development-data requirement. No commit, ticketing, or implementation is authorized.
