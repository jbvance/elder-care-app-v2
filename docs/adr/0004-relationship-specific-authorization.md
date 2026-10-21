# Use relationship-specific authorization with simple participation presets

Use authorization specific to each older adult's coordination arrangement, with need or responsibility scope where appropriate, a small number of understandable participation presets, and separately controlled consequential actions. This balances limited-purpose assistance and sensitive consumer health information with ordinary families' need for minimal configuration: the application should handle complexity so its users do not have to.

## Approved boundaries

- Participation in one arrangement grants no access to another. Evaluate current authorized involvement and relevant restrictions rather than infer access from family relationships or authentication alone.
- Presets provide sensible defaults, not an elaborate family-facing role matrix or permission editor. Exact presets remain undecided.
- Distinguish information access, participation management, acceptance or recording of commitments, completion reporting, and express need resolution. Participation-management permission does not automatically grant all sensitive information or resolution authority.
- Where both permissions apply, retain one intuitive action reporting responsibility completion and expressly confirming need resolution. Completion alone never automatically resolves the need; outstanding responsibilities must not be silently completed or dismissed.
- Distinguish helper-facing practical information from additional restricted background information. Use conservative, understandable audiences without requiring classification of every field, comment, or sentence. Exact audiences remain undecided.
- Do not depend on automatic sensitive-medical-content detection for privacy enforcement. Families may enter diagnoses, medications, dosages, physician names, and other health-related information; protect that content according to its applicable access rules wherever it appears, including structured data, descriptions, comments, offline copies, notifications, and external sharing.
- Presets express application permissions, not real-world legal authority. Respect the older adult's preferences and applicable authorization; representative-based authorization remains conditional on validated safeguards. Do not determine capacity or adjudicate family disputes.
- Enforce permissions in the backend using suitable Supabase/PostgreSQL mechanisms. RLS alone must not be assumed to protect individual sensitive fields within accessible rows. Do not rely on hidden controls or stale authentication-token permissions.
- Withdrawal, departure, reassignment, revocation, and disputed authorization must appropriately affect future access and actions while preserving legitimate coordination and necessary historical attribution. Apply proportionate restrictions; previously disclosed or offline information cannot necessarily be retrieved immediately.
- Recording assistance by non-user helpers creates no account or information-access right.

## Rationale and alternatives

Arrangement membership alone is simple but too broad for limited-purpose helpers. Fixed levels alone risk bundling management, sensitive access, and need-resolution powers. Fully granular per-item/action configuration would burden families and increase implementation and testing complexity. Relationship-specific scope with a few presets and separately enforced consequential actions provides practical defaults without a general-purpose permission editor.

Free text can contain sensitive information, so field labels or automated detection cannot guarantee safe disclosure. A helper's practical instructions and restricted background need an enforceable audience boundary. This is a logical access requirement, not a selected table, field, policy, or interface design.

## Consequences and unresolved choices

Exact preset names and permissions, audience definitions and defaults, delegation limits, schema, SQL policies, privileged-operation mechanisms, and detailed revocation/concurrency behavior require subsequent decisions before dependent tickets are finalized. No specific implementation is selected here.

Test permissions at actual enforcement boundaries, including cross-arrangement attempts, unauthorized sensitive access or resolution, changed involvement, revoked authority, and attempted privilege escalation. Apply equivalent disclosure rules to downstream copies and communications rather than assume database RLS alone covers them. Preserve the approved high-level journey testing, human usability evaluation, and all launch gates.

This decision refines open authorization questions in ADRs 0001–0003 without superseding their backend, authentication, invitation, or contractual decisions. Consumer-only operation, optional health information, synthetic development data, and conditional Supabase hosting remain unchanged. No ticketing, implementation, additional technologies, or commit is authorized.
