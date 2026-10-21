# Use Supabase Cloud with managed PostgreSQL

For an independent consumer application coordinating family assistance, select Supabase Cloud with managed PostgreSQL to fit relational care relationships and transactional coordination while reducing infrastructure maintenance for a solo developer. This architectural direction is approved, but real health-related data use is conditional on validating contractual suitability of an ordinary paid plan; written confirmation has not been received, and HIPAA-specific hosting is outside the budget.

## Rationale and boundaries

- PostgreSQL is the authoritative shared datastore. Enforce access in the backend, using row-level security where appropriate, and controlled transactional server-side operations for consequential changes; interface restrictions alone are insufficient.
- Retain a narrow cache of authorized essential information and durable pending completion reports, with authorization revalidation, conflict handling, and duplicate prevention. No general-purpose offline replication platform is selected.
- Prefer managed services, lower maintenance, minimal custom infrastructure, fewer user-visible steps, and lower operational burden without compromising privacy, security, reliability, or correctness. The application should handle complexity so users do not have to.
- Individuals and families are customers. Organizational healthcare customers/administrators and operation on behalf of HIPAA-covered entities or business associates to manage patient information are excluded. Individual professionals may participate only within family-authorized consumer coordination.

## Considered options

- Supabase Cloud/PostgreSQL: selected for relational modeling, transactional consistency, backend access enforcement, and managed operations. Policies and narrow offline behavior still require careful custom implementation and tests; PostgreSQL portability does not eliminate Supabase service integration costs.
- Firebase/Firestore: credible managed collaboration and offline option, but document-oriented modeling and default synchronization do not by themselves establish the required relational authorization and completion-conflict semantics.
- AWS Amplify/AppSync with managed persistence: credible managed alternative, with more service configuration and operational concepts than preferred for this solo-developer MVP.
- Custom TypeScript API with managed PostgreSQL: greater control, but more API, deployment, identity-integration, and operational work. Reconsider if contractual or other material requirements warrant it.

## Contractual and live-data conditions

Families may voluntarily provide health-related coordination information, including diagnoses, conditions, medications and dosages; treat it as sensitive consumer health information. This neither authorizes clinical features nor requires medical profiles or medication lists.

Use synthetic data during development until legal, contractual, privacy, and security requirements are validated. Before real personal or health-related processing, evaluate HIPAA applicability, the FTC Health Breach Notification Rule, relevant state laws, and vendor requirements. The intent to avoid HIPAA business-associate operation is not a legal determination or exemption from consumer health privacy obligations.

Do not represent ordinary Supabase hosting as HIPAA-compliant or assume consumer health information is contractually permitted merely because HIPAA may not apply. Written confirmation of suitability remains outstanding. An actual contractual restriction requires reconsidering hosting before live use; do not weaken safeguards or silently assume an unaffordable HIPAA hosting arrangement.

## Unresolved choices and consequences

Authentication methods and integration, session/recovery handling, schema and detailed authorization policies, API contracts, server-operation mechanism, local storage libraries and protection, synchronization implementation, notification infrastructure, region, specific paid-plan configuration, retention, and operational review procedures remain unresolved. Resolve foundational dependencies before related tickets are finalized. This ADR creates no implementation authorization.

Backend enforcement, concurrency, recurrence, and durable offline completion remain significant correctness work. Vendor hosting does not validate consent, representative authority, contractual permission, or compliance. Existing launch gates and synthetic/live evaluation plans remain in force.
