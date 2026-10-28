import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getAccount, getInvitations } from '@/features/account/runtime';
import type { Arrangement } from '@/features/account/account-service';
import { InviteScreen } from '@/features/invitations/invite-screen';
import { Copy, Page } from '@/features/private-draft/draft-ui';

export default function InviteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  useEffect(() => {
    let account;
    try { account = getAccount(); } catch { return; }
    const currentAccount = account;
    let active = true;
    let revision = 0;
    const load = () => { const request = ++revision; setArrangement(null); void currentAccount.open().then(view => { if (active && revision === request) setArrangement(view.arrangements.find(a => a.id === id) ?? null); }).catch(() => {}); };
    load();
    const unsubscribe = currentAccount.subscribe(load);
    const app = AppState.addEventListener('change', state => { ++revision; setArrangement(null); if (state === 'active') load(); });
    return () => { active = false; ++revision; unsubscribe(); app.remove(); };
  }, [id]);
  return arrangement ? <InviteScreen arrangement={arrangement} invitations={getInvitations()} /> : <Page><Copy>Open a saved private arrangement from your account to prepare an invitation.</Copy></Page>;
}
