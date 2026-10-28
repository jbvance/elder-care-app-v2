import type { SupabaseClient } from '@supabase/supabase-js';
import type { Summary } from '../invitations/invitation-service';

export type Rights = { preset: 'helper' | 'coordinator'; practical: boolean; manage: boolean; delegate: boolean; background: boolean; share_background: boolean; disclose: boolean; cancel: boolean; resolve: boolean; external: boolean };
export const helperRights: Rights = { preset: 'helper', practical: true, manage: false, delegate: false, background: false, share_background: false, disclose: false, cancel: false, resolve: false, external: false };
export const coordinationRights: Rights = { ...helperRights, preset: 'coordinator', manage: true, disclose: true, resolve: true };
export type ScopeEntry = { id: string; arrangement_id: string; title: string; prepared: boolean };
export type Participant = { user_id: string; label: string; rights: Rights | null; removed: boolean };
export type ScopeContext = Omit<Summary, 'summary'> & { arrangement_id: string; revision: number; rights: Rights; can_invite?: boolean; invitation_sender?: string; practical_audience?: { user_id: string; label: string; included: boolean }[]; summary?: Record<string, string>; background?: string; permission_kind?: string; permission_source?: string; participants?: Participant[]; candidates?: { user_id: string; label: string }[]; suggestions?: { address: string; author: string }[] };

const listeners = new Set<() => void>();
export function subscribeScopeChanges(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

export function createParticipationService(client: SupabaseClient, uuid: () => string) {
  let pending: { key: string; operation: string; owner: string } | undefined; // One in-memory uncertain request, no cache/outbox.
  client.auth.onAuthStateChange?.((event, session) => {
    if (event === 'SIGNED_OUT' || (pending && session?.user.id !== pending.owner)) pending = undefined;
  });
  async function call<T>(name: string, input: Record<string, unknown>, mutation = false): Promise<T> {
    const { data: { session } } = await client.auth.getSession();
    if (!session) throw new Error('Sign in again to open scoped participation.');
    let params = input;
    if (mutation) {
      const key = JSON.stringify([session.user.id, name, input]);
      if (pending?.key !== key) pending = { key, operation: uuid(), owner: session.user.id };
      params = { ...input, p_operation: pending.operation };
    }
    const result = await client.rpc(name, params).setHeader('Authorization', `Bearer ${session.access_token}`);
    const current = await client.auth.getSession();
    if (current.data.session?.user.id !== session.user.id) throw new Error('Account changed. Reopen scoped participation.');
    if (result.error) throw new Error(result.error.code === 'PT409' ? 'This scope changed or this retry conflicts. Check current access before editing again.' : 'This operation is unavailable with your current permission. Reconnect and check current access.');
    if (mutation) { pending = undefined; listeners.forEach(listener => listener()); }
    return result.data as T;
  }
  return {
    subscribe: subscribeScopeChanges,
    list: () => call<ScopeEntry[]>('list_participation', {}),
    read: (id: string) => call<ScopeContext>('read_scope_context', { p_scope: id }),
    start: (id: string, kind: string, source: string, rights: Rights) => call<string>('start_coordination', { p_arrangement: id, p_kind: kind, p_source: source, p_rights: rights }, true),
    change: (view: ScopeContext, user: string, rights: Rights, remove: boolean, kind: string, source: string) => call<ScopeContext | null>('change_involvement', { p_scope: view.id, p_user: user, p_rights: rights, p_remove: remove, p_kind: kind, p_source: source, p_revision: view.revision }, true),
    information: (view: ScopeContext, summary: Record<string, string>, background: string | null) => call<ScopeContext>('write_scope_information', { p_scope: view.id, p_practical: summary, p_background: background, p_revision: view.revision }, true),
    suggest: (id: string, address: string) => call<boolean>('suggest_helper', { p_scope: id, p_address: address }, true),
    addScope: (view: ScopeContext, description: string) => call<string>('add_coordination_scope', { p_parent: view.id, p_description: description, p_revision: view.revision }, true),
    audience: (view: ScopeContext, user: string) => call<ScopeContext>('add_practical_audience', { p_scope: view.id, p_user: user, p_revision: view.revision }, true),
    setAudience: (view: ScopeContext, user: string, include: boolean) => call<ScopeContext>('set_practical_audience', { p_scope: view.id, p_user: user, p_include: include, p_revision: view.revision }, true),
  };
}
export type Participation = ReturnType<typeof createParticipationService>;
