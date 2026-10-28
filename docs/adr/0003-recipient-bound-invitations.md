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

## Approved invitation execution contract (2026-10-28)

The user approved the following rules for ticket 03. They resolve its invitation design gate; feature implementation still requires a separate explicit instruction.

### Recipient and stable identity

Trim surrounding whitespace and lowercase the complete designated email address, consistently with the existing email-code sign-in flow. Do not rewrite aliases, dots, plus tags or domains, or treat different provider addresses as equivalent. Redemption must compare the designated address with the authenticated recipient's current confirmed Auth email obtained server-side, not a client-supplied address, editable metadata or a stale token email claim. Successful participation binds to the stable Auth user ID; a consumed invitation cannot transfer participation to a different identity.

For a mismatch, offer sign-in with the intended address or a corrected invitation from a currently authorized inviter. Show only the user's own signed-in address and generic recovery instructions, without disclosing the designated address or private arrangement information. Account switching preserves the existing sign-out and anonymous-draft safeguards. The synthetic local build retains its fictional-address restriction; no new email-identity or recovery architecture is introduced.

The existing application trims/lowercases sign-in input. The pinned Auth implementation lowercases validated email and performs case-insensitive email lookup: [Auth validation](https://github.com/supabase/auth/blob/v2.197.0/internal/api/mail.go#L659-L670), [Auth lookup](https://github.com/supabase/auth/blob/v2.197.0/internal/models/user.go#L652-L655).

### Lifetime, replacement and atomic joining

- Invitations expire seven elapsed days after issuance. At the locked redemption validation point, database time must be strictly before expiry; opening a link does not extend its lifetime.
- Explicit replacement/resend atomically invalidates the prior pending invitation for the same recipient and prompting scope and issues a new seven-day invitation. Retrying the same issuance operation is idempotent and does not rotate again.
- Opening a link grants no access and never redeems it. One explicit authenticated Join action atomically checks current session validity, confirmed recipient identity, invitation state, current permission, delegation, scope and inviter authority before recording one attributable redemption and the intended scoped participation.
- Concurrent submissions and lost-response retries must not create duplicate grants. A same-recipient retry can report the existing join only with a valid session and current access; it cannot recreate revoked participation. A fresh invitation cannot bypass an active restriction.
- Losing relevant inviter authority invalidates outstanding invitations; regaining authority does not revive them. Serialize authority/invitation changes with redemption so revocation winning the race denies the join. If the prompting need is withdrawn or no longer shareable, deny redemption.
- Expiry after successful joining does not expire participation. Revoking a pending invitation is distinct from removing a participant. Existing participation follows independently valid current authorization; inviter departure alone does not automatically remove everyone they previously invited.

Use the existing Supabase Auth/PostgreSQL architecture and narrow transactional operations. An opaque high-entropy invitation token identifies the invitation, with its hash stored server-side; it never substitutes for authentication or authorization. No expiry scheduler, gateway or custom authentication infrastructure is required. Routine schema, token/link representation and transaction details remain delegated within this contract.

### Link journey and authorized destination

Copy invitation link is the delivery mechanism for this synthetic slice. Demonstrate opening the copied link on the native development device, retaining the pending invitation through email-code sign-in, returning to it and explicitly joining. Use the existing local-development/USB approach and local Mailpit authentication. Link opening and sign-in alone neither redeem nor disclose private information. Pending link handling must preserve account separation and avoid sensitive logging or plaintext persistence.

Before successful joining, provide generic invitation/sign-in or unavailable-link instructions only: no older-adult name, need, location, inviter identity or designated recipient address. Expired, revoked, replaced, invalid and wrong-account links disclose no private information or arrangement existence through their recovery response.

After joining, show only the deliberately authorized practical summary of the prompting need, including inviter and available timing/place within the authorized audience. Make that disclosure clear in the ordinary invitation preparation flow without requiring reentry of known information or an extra approval screen. Do not expose the owner-private arrangement payload, restricted background or unrelated needs. State that joining has not accepted assistance responsibility. This read-only destination does not implement ticket 05 acceptance, scheduling or completion functionality.

Ticket 03 includes only the authorized participant removal necessary to enforce and test immediate loss of the affected access, including requests with previously issued tokens. It must not depend on ticket 04 to establish basic revocation. Broader participant management, preset/scope editing and separately controlled authority workflows remain in ticket 04; no general-purpose permissions editor is introduced.

## Safeguards and retained gates

Test matching/mismatch, invalid/expired/revoked/replaced links, inviter-authority loss, atomic redemption/retries/races, cross-arrangement isolation, limited audiences and revoked/restricted-participant denial at the actual backend boundary. Preserve the approved initial direct/reported-permission and delegated-authority contract without claiming verified legal consent or treating private ownership as sharing authority.

Production hosting, automatic invitation email and paid services are outside this synthetic slice. Preserve ADR 0001's consumer-only and real-data contractual gates, ADR 0002's authentication boundaries, outstanding native/platform acceptance and the approved offline, privacy and usability requirements. This refines ADR 0002's open invitation questions without superseding its authentication decision. The decisions are approved; this documentation update authorizes no feature implementation or commit.
