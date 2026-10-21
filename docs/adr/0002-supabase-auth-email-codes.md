# Use Supabase Auth with emailed one-time codes

Select Supabase Auth emailed one-time codes as the primary MVP authentication method, with securely retained sessions to avoid repeated sign-in. Defer conventional passwords and passkeys to reduce onboarding and account-management burden, preserving the consumer-only model and ADR 0001's sensitive-information and conditional hosting safeguards.

## Approved boundaries

- Authentication is not required merely to learn about the application or begin appropriate private preparation where practical. It is required before protected shared information or authorized collaborative actions. Preparation must not bypass privacy or imply consent.
- Verifying email does not authorize care-information access, establish legal authority, accept an invitation, or create a responsibility. Enforce authorization separately in the backend.
- Preserve stable participant identity independent of email and care relationships. Replacement devices must not require rebuilding legitimate arrangements or expand access across older adults.
- Retain sessions securely in appropriate mobile-device storage. Provide straightforward sign-out and appropriate lost-device, shared-device, and revocation protection. Exact storage technology and session policies remain unresolved.
- Invitation links disclose minimal information before authorization. Joining remains separate from accepting responsibility; the invitation authorization protocol is not finalized here.
- Outside helpers do not need accounts merely to have agreements or assistance recorded.
- Recovery with the original email accessible uses ordinary email-code authentication to the existing identity. Lost-email recovery, email changes, and exceptional verification remain open; family relationships alone must never permit takeover.
- Email OTP is neither phishing-resistant nor multifactor authentication. Define appropriate expiry, attempt limits, resend controls, session safeguards, and evaluate additional verification for sensitive actions. No exact values or extra factors are selected here.
- Plan reliable production delivery using an appropriate transactional email service; no provider is selected. Evaluate deliverability, abuse controls, cost, and vendor privacy suitability.
- During implementation, configure and test the actual code flow in Expo on iOS and Android, including session retention, replacement-device access, sign-out, and failure handling. Refine the experience through approved usability testing without silently changing the authentication boundary.

## Rationale and alternatives

Email codes remove password creation and reset workflows and work when email is accessed on another device, without requiring a magic-link authentication callback to open the correct app. They require mailbox access, code entry, and dependable email delivery; evaluate the resulting burden through usability testing.

- Magic links may reduce entry but add mobile redirects and cross-device failure cases; not selected as primary. Invitation links remain separate.
- Conventional passwords add remembered secrets, reuse risk, reset flows, and support burden; deferred for the MVP.
- Passkeys offer phishing resistance and convenient device prompts but introduce enrollment, native integration, migration, and recovery considerations; deferred for the MVP. Official Supabase documentation reviewed during recommendation marked support experimental; reassess if reconsidered.

## Consequences and unresolved choices

Mailbox compromise, shared inboxes, phishing, delivery failure, and code-request abuse remain risks. Secure session retention is not permission for unlimited unattended access. Revoking refresh sessions must not be assumed to immediately invalidate all issued access tokens; sensitive-operation enforcement needs explicit review. Session revocation cannot necessarily retrieve offline, previously viewed, or externally shared information.

Invitation eligibility/redemption, detailed authorization, session lifetimes and revocation semantics, additional verification, lost-email recovery, email changes, email vendor, storage library, and expiry/attempt/resend settings require separate review before dependent tickets are finalized. This decision resolves ADR 0001's originally open authentication-method question without selecting its other implementation choices.

Use synthetic development data until ADR 0001 and specification legal, contractual, privacy, and security gates are validated. No HIPAA exemption or Supabase contractual permission is established here. No implementation, organizational capability, or additional technology is authorized.
