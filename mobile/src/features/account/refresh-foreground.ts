import type { SupabaseClient } from '@supabase/supabase-js';

// Ask Auth to evaluate its own refresh-based policy. No client inactivity clock.
export async function refreshForeground(client: SupabaseClient, storage: { removeItem(key: string): Promise<void> }, storageKey: string): Promise<boolean> {
  const terminal = (code: string | undefined) => ['session_expired', 'session_not_found', 'refresh_token_not_found', 'refresh_token_already_used'].includes(code ?? '');
  async function endExpiredSession() {
    await client.auth.stopAutoRefresh();
    const ended = await client.auth.signOut({ scope: 'local' });
    if (ended.error) {
      // A terminal refresh error during getSession can prevent SDK signOut from
      // reaching local removal. Remove only this configured adapter entry, then
      // let supported signOut clear SDK state/notify observers. This does not
      // claim server revocation was acknowledged.
      await storage.removeItem(storageKey);
      const local = await client.auth.signOut({ scope: 'local' });
      if (local.error) throw new Error('Device sign-in cleanup could not be confirmed.');
    }
    return false;
  }
  const restored = await client.auth.getSession();
  if (restored.error && terminal(restored.error.code)) return endExpiredSession();
  if (restored.error) throw new Error('Protected sign-in could not be restored.');
  if (!restored.data.session) return false;
  const refreshed = await client.auth.refreshSession();
  if (!refreshed.error) return !!refreshed.data.session;
  if (terminal(refreshed.error.code)) return endExpiredSession();
  // Connectivity and retryable service errors do not erase a legitimate session.
  throw new Error('Sign-in could not be refreshed. Reconnect and try again.');
}
