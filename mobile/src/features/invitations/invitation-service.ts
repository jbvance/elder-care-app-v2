import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProtectedSessionStorage } from '../account/protected-session-store';
import { readPendingInvitation, replacePendingInvitation } from './pending-invitation';

export type Summary = { id: string; summary: Record<string, string>; inviter: string; recorded_at: string };
export type Scope = Summary & { permission_kind: string; permission_source: string; authority_active: boolean; shareable: boolean; invitations: { id: string; recipient: string; state: string; expires_at: string }[]; participants: { user_id: string; label: string; removed: boolean }[] };
export const unavailable = 'This invitation is unavailable. Sign in with the intended address or ask an authorized participant for a new invitation.';

export function createInvitationService(client: SupabaseClient, storage: ProtectedSessionStorage, uuid: () => string) {
  async function rpc<T>(name: string, params: Record<string, unknown>): Promise<T> {
    const { data: { session } } = await client.auth.getSession();
    if (!session) throw new Error(unavailable);
    const result = await client.rpc(name, params).setHeader('Authorization', `Bearer ${session.access_token}`);
    const current = await client.auth.getSession();
    if (result.error || current.data.session?.user.id !== session.user.id) throw new Error(unavailable);
    return result.data as T;
  }
  let issuing: { request: string; promise: Promise<string> } | undefined;
  async function issue(id: string, recipient: string, replace = false) {
      const { data: { session } } = await client.auth.getSession();
      if (!session) throw new Error(unavailable);
      const key = 'invitation-issuance-v1';
      const saved = await storage.getItem(key);
      const address = recipient.trim().toLowerCase();
      let receipt = saved ? JSON.parse(saved) : null;
      if ((replace && !receipt?.pending) || !receipt || receipt.owner !== session.user.id || receipt.scope !== id || receipt.recipient !== address) {
        receipt = { owner: session.user.id, scope: id, recipient: address, pending: true, operation: uuid(), token: (uuid() + uuid()).replaceAll('-', '') };
        await storage.setItem(key, JSON.stringify(receipt));
      }
      await rpc('issue_invitation', { p_scope: id, p_recipient: address, p_operation: receipt.operation, p_token: receipt.token });
      receipt.pending = false;
      await storage.setItem(key, JSON.stringify(receipt));
      return `mobile://invitation?t=${receipt.token}`;
    }
  return {
    async pending() { return readPendingInvitation(storage); },
    async forget() { await replacePendingInvitation(storage, null); },
    scope: (id: string) => rpc<Scope | null>('list_invitation_scope', { p_scope: id }),
    prepare: (id: string, kind: string, source: string) => rpc('prepare_invitation_scope', { p_scope: id, p_kind: kind, p_source: source, p_delegation: true }),
    read: (id: string) => rpc<Summary>('read_prompting_summary', { p_scope: id }),
    join: (token: string) => rpc<Summary>('join_invitation', { p_token: token }),
    manage: (id: string, action: string, target: string | null = null) => rpc('manage_invitation_scope', { p_scope: id, p_action: action, p_target: target }),
    issue(id: string, recipient: string, replace = false) {
      const request = JSON.stringify([id, recipient.trim().toLowerCase(), replace]);
      if (issuing) return issuing.request === request ? issuing.promise : Promise.reject(new Error('Wait for the current invitation operation.'));
      const promise = issue(id, recipient, replace).finally(() => { issuing = undefined; });
      issuing = { request, promise };
      return promise;
    },
  };
}
export type Invitations = ReturnType<typeof createInvitationService>;
