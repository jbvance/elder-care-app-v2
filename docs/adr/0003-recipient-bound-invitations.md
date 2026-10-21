# Use recipient-bound invitations for coordination participation

Select expiring, revocable invitations associated with a designated recipient, ordinarily identified by email, to combine simple family invitations with protection against forwarded links granting unintended access. Authenticate through ADR 0002, then validate joining in the backend; possession of an invitation link alone must never grant sensitive coordination access.

## Approved boundaries

- An authorized participant can invite a recipient with minimal effort, ordinarily using the recipient's email. Avoid redundant routine approvals, unnecessary account administration, and elaborate permission configuration.
- Before joining, authenticate the recipient and have the backend verify that the identity satisfies the recipient restriction, the invitation remains valid, and the inviter's relevant authority remains valid. Do not rely on interface restrictions or link possession as authorization.
- Authentication and invitation acceptance do not establish legal authority or broader information-access rights. Joining remains distinct from accepting an assistance responsibility; requests remain unaccepted until acceptance is established under the approved coordination rules.
- Emails, links, previews, and unauthenticated screens disclose only minimal authorized information. Make relevant request details available after appropriate authentication and authorization, not merely after opening a link.
- For a different sign-in email, explain the mismatch simply and provide a secure way to obtain a corrected invitation from an authorized participant. Do not bypass restrictions or silently transfer the invitation to that account.
- Email inbox control is not independent verification of real-world identity or legal authority. Stable participant identity remains distinct from email and each care relationship.
- Participants may join arrangements concerning multiple older adults, but authorization remains specific to each relationship. One accepted invitation must not grant access to another arrangement.
- Non-user helpers can have outside agreements recorded without accounts, installation, or invitations. This invitation model does not replace that pathway.

## Rationale and alternatives

Recipient binding prevents a forwarded link from acting as sufficient authority to join. It adds friction for alternate email addresses, addressed through simple explanation and corrected invitations rather than relaxed access checks.

Unrestricted bearer invitations would be easier to forward but could disclose sensitive information to an unintended recipient. Requiring repeated manual approval for every routine join would add family administration without replacing backend validation. Neither is selected. The application should manage complexity behind the scenes rather than expose detailed permission administration.

## Unresolved details and safeguards

Invitation expiration duration, exact recipient/email matching rules, revocation mechanics, token/link implementation, and detailed authorization policies remain for separate decisions before dependent implementation tickets are finalized. No normalization, alias handling, automatic account linking, or exceptional recovery rule is selected here.

Define and test validation when an invitation expires or is revoked, inviter authority changes, a link is forwarded, or an alternate identity attempts to join. This names required security behavior, not a selected schema or transaction mechanism. Preserve ADR 0001's consumer-only and real-data contractual gates, ADR 0002's authentication boundaries, and the approved offline, privacy, and usability requirements.

This decision refines the invitation questions intentionally left open in ADR 0002; it does not supersede its authentication decision. ADR 0002 and associated documentation, together with this ADR, remain uncommitted pending user review. No ticketing, implementation, or additional technology selection is authorized.
