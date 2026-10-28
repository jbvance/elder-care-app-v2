import { useState } from 'react';
import { Action, Copy, Page } from '@/features/private-draft/draft-ui';
import { AccountScreen } from '@/features/account/account-screen';
import { getAccount } from '@/features/account/runtime';
import type { Account } from '@/features/account/account-service';

export default function AccountRoute() {
  const [account, setAccount] = useState<Account | null>(() => { try { return getAccount(); } catch { return null; } });
  if (!account) return <Page>
    <Copy heading>Secure sign-in is not ready</Copy>
    <Copy>Use the native development app with its local backend connection. Your private draft has not been shared.</Copy>
    <Action onPress={() => { try { setAccount(getAccount()); } catch { /* Remain safely unavailable. */ } }}>Try again</Action>
  </Page>;
  return <AccountScreen account={account} />;
}
