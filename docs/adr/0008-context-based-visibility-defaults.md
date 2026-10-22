# Use context-based visibility defaults with authorized ongoing audiences

New needs ordinarily remain within their authorized coordination context unless an applicable Helper audience has already been explicitly established. Automatically inherit deliberately authorized ongoing audiences for appropriate new needs and recurring occurrences, balancing privacy with minimal repeated coordination work: the application should handle complexity so users do not have to.

## Approved defaults and boundaries

- New needs are not automatically visible to all Helpers or every Coordinator in an arrangement. Visibility follows the authorized coordination context and any explicitly established applicable Helper audience.
- New needs and recurring occurrences within a deliberately authorized ongoing Helper audience or participation scope ordinarily inherit it automatically. Do not repeat audience selection for every ordinary request; do not infer authorization from an unrelated request or from frequency of assistance.
- Coordinators retain an understandable view of unresolved needs and coordination gaps within their own authorized scope, including needs not made available to Helpers. Privacy boundaries must not hide work requiring their coordination.
- Where no authorized Helper audience applies, an authorized Coordinator can make an opportunity available through one simple understandable choice, without elaborate permission administration.
- Helpers see opportunities and practical information only within authorized scope, without automatic arrangement-wide or restricted-background access.
- Relevant health information may appear in authorized practical instructions when appropriate. Legitimate involvement and authorization determine access, not medical/nonmedical classification.
- Contextual information and comments follow their applicable audience. Broadening an audience may disclose existing contextual information; make consequential disclosure understandable without repetitive confirmations. Separately restricted background does not become available automatically.
- Explain relevant visibility in plain language, such as "Visible to…", without overwhelming controls or classification of every field or comment. This example is not a finalized interface or audience label.
- Seeing an opportunity, accepting responsibility, completion, and express need resolution remain distinct. Audience availability implies neither assignment nor commitment.
- Enforce applicable boundaries in the backend and respect them in notifications, offline information, and external sharing. Do not use automatic sensitive-text classification as a security mechanism. Preserve existing limits on retrieving previously disclosed information.
- Respect the older adult's preferences, applicable authority, existing delegation limits, and ADRs 0001–0007. Introduce no extra preset, permission hierarchy, public marketplace, or unnecessary configuration.

## Rationale and alternatives

Automatically exposing all new needs to all Helpers would violate limited-purpose privacy. Requiring individual audience selection for every request would impose repetitive work, especially for recurring assistance. Limited context defaults with deliberately authorized ongoing inheritance preserve both protection and practical discovery without a separate audience-management subsystem.

## Unresolved details

Exact audience labels, user-interface interactions, database representation, enforcement mechanisms, and detailed scope/delegation rules remain for subsequent review. This decision settles the conceptual defaults left open in ADR 0007 without selecting SQL policies, schema, or technology. Audience broadening and historical-content disclosure interactions require review without reopening these settled principles.

Preserve all approved MVP functionality, testing decisions, conditional representative-authority safeguards, consumer-only scope, Supabase contractual conditions, and synthetic-development-data requirements. No implementation, tickets, additional technology selection, or commit is authorized.
