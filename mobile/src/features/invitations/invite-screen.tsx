import { useEffect, useState } from 'react';
import { Clipboard } from 'react-native';
import { openURL } from 'expo-linking';
import type { Arrangement } from '../account/account-service';
import { Action, Copy, Field, Page } from '../private-draft/draft-ui';
import type { Invitations, Scope } from './invitation-service';

export function InviteScreen({ arrangement, invitations }: { arrangement: Arrangement; invitations: Invitations }) {
  const [scope, setScope] = useState<Scope | null>(null);
  const [source, setSource] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { void invitations.scope(arrangement.id).then(setScope).catch(() => setNotice('Reconnect to check current permission.')); }, [arrangement.id, invitations]);
  async function perform(action: () => Promise<unknown>, message = '') {
    if (busy) return;
    setBusy(true); setNotice('');
    try { await action(); setScope(await invitations.scope(arrangement.id)); setNotice(message); }
    catch { setNotice('Could not confirm this operation. Check current authority and connection, then retry.'); }
    finally { setBusy(false); }
  }
  return <Page>
    <Copy heading>Permission and invitation</Copy>
    <Copy>Visible to the designated recipient only after explicit joining: {arrangement.draft.olderAdult} — {arrangement.draft.description} — {arrangement.draft.date} {arrangement.draft.time} {arrangement.draft.timeZone} — {arrangement.draft.location}.</Copy>
    <Copy>Your signed-in email address will identify you as the inviter. The rest of your private arrangement stays private. Share only practical information authorized for this need. This statement does not verify legal consent or representative authority.</Copy>
    {!scope ? <>
      <Field label="Who gave permission for this need and delegated inviting and removing helpers?" value={source} onChangeText={setSource} maxLength={254} editable={!busy} />
      <Action disabled={busy || !source.trim()} onPress={() => void perform(() => invitations.prepare(arrangement.id, 'reported', source))}>Record their reported permission and delegation</Action>
      <Action secondary disabled={busy} onPress={() => void perform(() => invitations.prepare(arrangement.id, 'direct', 'Own permission'))}>I am the older adult: give my own permission and delegation</Action>
    </> : <>
      <Copy>{scope.permission_kind} permission: {scope.permission_source}. Recorded {scope.recorded_at}. Scope: this need&apos;s practical summary, invitations and removal only. No onward delegation.</Copy>
      {scope.authority_active && scope.shareable ? <>
        <Field label="Recipient fictional email" value={recipient} onChangeText={setRecipient} autoCapitalize="none" keyboardType="email-address" maxLength={254} editable={!busy} />
        <Action disabled={busy || !recipient.trim()} onPress={() => void perform(async () => { Clipboard.setString(await invitations.issue(arrangement.id, recipient)); }, 'Invitation link copied. It expires seven days after issuance. Treat it as private link material.')}>Copy invitation link</Action>
        <Action secondary disabled={busy || !recipient.trim()} onPress={() => void perform(async () => { Clipboard.setString(await invitations.issue(arrangement.id, recipient, true)); }, 'Replacement link copied; the prior pending link is invalid.')}>Replace invitation and copy new link</Action>
        <Action secondary disabled={busy} onPress={() => void perform(async () => {
          const link = await Clipboard.getString();
          if (!/^mobile:\/\/invitation\?t=[a-f0-9]{64}$/.test(link)) throw new Error('Copy an invitation first.');
          await openURL(link);
        })}>Open copied invitation link on this device</Action>
        {scope.invitations.filter(i => i.state === 'pending').map(i => <Action key={i.id} secondary disabled={busy} onPress={() => void perform(() => invitations.manage(arrangement.id, 'revoke', i.id))}>Revoke invitation for {i.recipient}</Action>)}
        {scope.participants.filter(p => !p.removed).map(p => <Action key={p.user_id} secondary disabled={busy} onPress={() => void perform(() => invitations.manage(arrangement.id, 'remove', p.user_id))}>Remove participant {p.label}</Action>)}
        <Action secondary disabled={busy} onPress={() => void perform(() => invitations.manage(arrangement.id, 'withdraw'))}>Withdraw sharing permission for this need</Action>
        <Action secondary disabled={busy} onPress={() => void perform(() => invitations.manage(arrangement.id, 'end-authority'))}>End my invitation authority</Action>
      </> : <Copy>Further sharing is disabled. Outstanding invitations cannot be revived.</Copy>}
    </>}
    {!!notice && <Copy>{notice}</Copy>}
  </Page>;
}
