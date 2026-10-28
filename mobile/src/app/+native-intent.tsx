import { accountStorage } from '@/features/account/account-storage';
import { replacePendingInvitation } from '@/features/invitations/pending-invitation';

// Remove sensitive link material before Router builds navigation state.
export async function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path, 'mobile://');
    if (url.hostname === 'invitation' || url.pathname === '/invitation') {
      const token = url.searchParams.get('t');
      await replacePendingInvitation(accountStorage, token && /^[a-f0-9]{64}$/.test(token) ? token : null);
      return '/invitation';
    }
  } catch {
    try { await replacePendingInvitation(accountStorage, null); } catch { /* Failed writes keep pending reads unavailable. */ }
    return '/invitation';
  }
  return path;
}
