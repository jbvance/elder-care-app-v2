import { InvitationScreen } from '@/features/invitations/invitation-screen';
import { getAccount, getInvitations } from '@/features/account/runtime';
import { Copy, Page } from '@/features/private-draft/draft-ui';

export default function InvitationRoute() {
  let account; let invitations;
  try { account = getAccount(); invitations = getInvitations(); } catch { /* Native protected storage required. */ }
  if (!account || !invitations) return <Page><Copy>Open this invitation in the native local development app.</Copy></Page>;
  return <InvitationScreen account={account} invitations={invitations} />;
}
