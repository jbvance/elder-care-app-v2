# Use Helper and Coordinator participation presets

Use two application participation presets, Helper and Coordinator, with occasional versus ongoing involvement expressed through authorized scope rather than a third preset. This refines ADR 0004 while preserving ADR 0005's information boundaries and the principle that the application should handle complexity so users do not have to.

## Approved defaults and boundaries

- Helper is the ordinary assistance preset: view authorized practical information, respond to requests, accept or decline responsibilities, report own completion or unavailability, and suggest needs or changes without broader management authority.
- Coordinator arranges assistance within authorized scope: create and manage needs, request help, record outside agreements and completion with proper attribution, arrange replacements, and expressly resolve needs they are authorized to coordinate. Coordinators may also perform Helper activities without another preset.
- Participation management, restricted-background access, external disclosure authority, and exceptional Helper need-resolution authority remain distinguishable from the presets and separately controlled according to applicable authorization. Coordinator resolution is limited to authorized coordination scope, not authority inferred from participation management.
- Where appropriate permission is established, the initial authorized Coordinator should ordinarily invite helpers through exceptionally simple setup, without multiple administrative screens or repeated approval requests. This does not imply an unconditional grant of participation-management authority.
- Creating a private arrangement or recording a need does not itself establish permission to share an older adult's information.
- The older adult needs no separate preset and may participate actively, selectively, or not at all. Their legally effective preferences, permission, withdrawal rights, and applicable authority remain independent of application involvement or preset.
- Regular assistance does not automatically increase Helper access or authority. An authorized ongoing scope may cover recurring responsibilities without redundant grants per occurrence.
- Presets and scopes may differ across older adults; one arrangement confers no permission in another.
- Neither preset grants unrestricted sensitive health or restricted-background access. Apply ADR 0005, including authorized sharing of relevant health information where appropriate.
- Outside helpers need no account, preset, or access right merely to have assistance recorded.
- Preserve one-action completion plus express resolution when both permissions apply; completion alone never resolves a need automatically.
- Presets establish neither family standing, legal capacity, nor representative authority. No participant may grant beyond their authorized delegation. Representative-based authorization remains subject to existing safeguards.
- Avoid role hierarchies, extensive editors, and numerous exceptions. Introduce advanced delegation only when necessary and ordinarily keep it out of everyday use.

## Rationale and alternatives

A single preset would conceal material coordination powers or require too many exceptions. Three presets separating occasional and regular Helpers would confuse frequency with access and encourage unnecessary promotion. Two presets distinguish arranging assistance from providing it, while authorized scope accommodates recurring and multi-activity assistance without a new role.

## Unresolved details

Exact participation scopes, audience defaults, delegation interactions and limits, database schema, and enforcement implementation remain for subsequent review. Default capability descriptions do not authorize unrestricted access to all needs or all arrangement information. Delegation must remain understandable without turning separate permissions into a general-purpose configuration system.

Preserve ADRs 0001–0005, all 72 behavioral stories, existing MVP scope and testing, consumer-only operation, conditional representative support, and Supabase contractual/live-data gates. No additional technologies, ticketing, implementation, or commit is authorized.
