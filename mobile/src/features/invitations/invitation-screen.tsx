import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { AppState } from 'react-native';
import type { Account } from '../account/account-service';
import { AccountScreen } from '../account/account-screen';
import { Action, Copy } from '../private-draft/draft-ui';
import type { Invitations, Summary } from './invitation-service';
import { unavailable } from './invitation-service';
import { subscribePendingInvitation } from './pending-invitation';
import { subscribeScopeChanges } from '../participation/participation-service';

export function InvitationScreen({ account, invitations }: { account: Account; invitations: Invitations }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [notice, setNotice] = useState('');
  const revision = useRef(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const invalidate = () => { ++revision.current; };
    let active = true;
    let generation = 0;
    const refresh = () => {
      const request = ++generation; invalidate();
      setSummary(null); setUser(null); setToken(null); setNotice('');
      void Promise.all([account.open(), invitations.pending()]).then(([view, pending]) => {
        if (active && request === generation) { setUser(view.user?.email ?? null); setToken(pending); }
      }).catch(() => { if (active) setNotice(unavailable); });
    };
    refresh();
    const unsub = account.subscribe(refresh);
    const unsubScope = subscribeScopeChanges(refresh);
    const unsubLink = subscribePendingInvitation(changing => {
      if (changing) { ++generation; invalidate(); setSummary(null); setToken(null); setNotice(''); }
      else refresh();
    });
    const app = AppState.addEventListener('change', state => { ++generation; invalidate(); setSummary(null); setUser(null); if (state === 'active') refresh(); });
    return () => { active = false; ++generation; invalidate(); unsub(); unsubScope(); unsubLink(); app.remove(); };
  }, [account, invitations]);
  async function join() {
    if (!token || busy) return;
    const request = ++revision.current;
    setBusy(true); setNotice('');
    try { const result = await invitations.join(token); if (request === revision.current) setSummary(result); }
    catch { if (request === revision.current) { setSummary(null); setNotice(unavailable); } }
    finally { setBusy(false); }
  }
  return <AccountScreen account={account} invitationMode header={<>
      <Copy heading>{summary ? 'Authorized prompting request' : 'Invitation'}</Copy>
      {summary ? <>
        <Copy>{Object.values(summary.summary).filter(Boolean).join(' — ')}</Copy>
        <Copy>Invited by participant {summary.inviter}. Permission recorded {summary.recorded_at}.</Copy>
        <Copy>Joining has not accepted an assistance responsibility. Assistance is not arranged.</Copy>
        <Action secondary onPress={() => router.push({ pathname: '/work', params: { id: summary.id } })}>Open needs and opportunities</Action>
        <Action disabled={busy} onPress={() => { setSummary(null); void join(); }}>Check current access</Action>
      </> : <>
        <Copy>Sign in with the intended address, then choose Join. Opening this link or signing in does not join or share private information.</Copy>
        {!!user && <Copy>Signed in as {user}. For a different address, sign out below or ask for a corrected invitation.</Copy>}
        <Action disabled={busy || !user || !token} onPress={() => void join()}>Join</Action>
      </>}
      <Action secondary disabled={busy} onPress={() => { void invitations.forget().catch(() => setNotice(unavailable)); }}>Forget invitation on this device</Action>
      {!!notice && <Copy>{notice}</Copy>}
  </>} />;
}
