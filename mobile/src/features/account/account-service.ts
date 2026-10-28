import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { isPrivateDraft, samePrivateDraft as sameDraft, type PrivateDraft, type PrivateDraftStore } from '../private-draft/protected-store';
import type { ProtectedSessionStorage } from './protected-session-store';

export class AccountError extends Error {}
export type AssociationResult = 'saved' | 'newer-draft-retained';

export type Arrangement = { id: string; owner_id: string; draft: PrivateDraft };
export type AccountView = { user: { id: string; email: string } | null; arrangements: Arrangement[]; hasDraft: boolean };
export type Account = {
  open(): Promise<AccountView>;
  requestCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  associate(owner: string): Promise<AssociationResult>;
  signOut(discardDraft?: boolean): Promise<void>;
  revokeOthers(email: string, code: string): Promise<void>;
  subscribe(listener: () => void): () => void;
};

// A minimal adapter around supported Auth and PostgREST, not a second auth system.
export function createAccountService(client: SupabaseClient, storage: ProtectedSessionStorage, drafts: PrivateDraftStore, uuid: () => string, storageKey = 'eldercare.auth.v1'): Account {
  const receiptKey = 'private-association-v1';
  let pendingAssociation: { owner: string; promise: Promise<AssociationResult> } | undefined;
  async function session(expected?: string): Promise<Session> {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session || (expected && data.session.user.id !== expected)) throw new AccountError('Sign in again before continuing.');
    return data.session;
  }
  async function stillOwner(owner: string) { await session(owner); }
  function failed(error: { code?: string; status?: number } | null) {
    if (!error) return;
    if (error.code === 'PT401' || error.status === 401) throw new AccountError('Your session has ended. Sign out here and sign in again.');
    throw new AccountError('We could not confirm the request. Your private draft stays on this device. Please try again when connected.');
  }
  async function verify(email: string, code: string) {
    const existing = await client.auth.getSession();
    if (existing.error) throw new AccountError('Protected sign-in is unavailable. Please try again.');
    if (existing.data.session && existing.data.session.user.email?.toLowerCase() !== email.trim().toLowerCase()) throw new AccountError('Sign out before changing accounts.');
    if (!/^\d{6}$/.test(code)) throw new AccountError('Enter the six-digit code from your email.');
    const { data, error } = await client.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: 'email' });
    if (error || !data.session) throw new AccountError(error?.status === 429 ? 'Too many attempts. Please wait before trying again.' : 'That code is incorrect, expired or already used. Try again, or request a new code.');
  }
  return {
    async open() {
      const { data, error } = await client.auth.getSession();
      if (error) throw new AccountError('Protected sign-in could not be restored. Please try again.');
      const draft = await drafts.load();
      if (!data.session) return { user: null, arrangements: [], hasDraft: !!draft };
      const current = data.session;
      const authorization = `Bearer ${current.access_token}`;
      const valid = await client.rpc('check_private_session').setHeader('Authorization', authorization);
      failed(valid.error);
      const rows = await client.from('private_arrangements').select('id,owner_id,draft').order('created_at').setHeader('Authorization', authorization);
      failed(rows.error);
      await stillOwner(current.user.id);
      const arrangements = (rows.data ?? []) as Arrangement[];
      if (arrangements.some(row => row.owner_id !== current.user.id || !isPrivateDraft(row.draft))) throw new AccountError('Private arrangements could not be opened safely.');
      return { user: { id: current.user.id, email: current.user.email ?? '' }, arrangements, hasDraft: !!draft };
    },
    async requestCode(email) {
      const address = email.trim().toLowerCase();
      // This build is deliberately restricted to the approved local synthetic environment.
      if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@example\.test$/i.test(address)) throw new AccountError('For local development, use a fictional address ending in @example.test.');
      const { error } = await client.auth.signInWithOtp({ email: address });
      if (error) throw new AccountError(error.status === 429 ? 'Please wait at least one minute before requesting another code.' : 'We could not request a code. Check the connection and try again.');
    },
    verifyCode: verify,
    associate(owner) {
      if (pendingAssociation) {
        if (pendingAssociation.owner !== owner) return Promise.reject(new AccountError('Wait for the current account operation to finish.'));
        return pendingAssociation.promise;
      }
      const promise = (async (): Promise<AssociationResult> => {
        const current = await session(owner);
        const intended = await drafts.load();
        if (intended && !intended.prepared) throw new AccountError('Finish your private draft with Done for now before saving it to your account.');
        const saved = await storage.getItem(receiptKey);
        let receipt: { owner: string; operation: string; draft: PrivateDraft } | null = saved ? JSON.parse(saved) : null;
        if (receipt && (receipt.owner !== owner || !isPrivateDraft(receipt.draft) || !/^[\da-f-]{36}$/i.test(receipt.operation))) throw new AccountError('This pending draft belongs to a different sign-in. Sign out and discard it before changing accounts.');
        // At most two uploads: reconcile an older durable receipt, then the exact
        // version explicitly selected by this action. Never send intervening edits.
        for (let attempt = 0; attempt < 2; attempt++) {
          if (!receipt) {
            if (!intended) return 'saved';
            receipt = { owner, operation: uuid(), draft: intended };
            await storage.setItem(receiptKey, JSON.stringify(receipt));
          }
          await stillOwner(owner);
          const response = await client.rpc('associate_private_draft', { p_operation_id: receipt.operation, p_draft: receipt.draft })
            .setHeader('Authorization', `Bearer ${current.access_token}`);
          failed(response.error);
          if (response.data?.owner_id !== owner || !isPrivateDraft(response.data?.draft) || !sameDraft(response.data.draft, receipt.draft)) throw new AccountError('Saved contents could not be confirmed. Your device draft was retained.');
          await stillOwner(owner);
          const acknowledgedIntended = !intended || sameDraft(intended, receipt.draft);
          await drafts.discardIfUnchanged(receipt.draft);
          const latest = await drafts.load();
          await storage.removeItem(receiptKey);
          if (acknowledgedIntended) return latest ? 'newer-draft-retained' : 'saved';
          // Old receipt reconciled. Only proceed if the current draft is still
          // exactly the version selected when the user pressed Save.
          if (!latest || !intended || !sameDraft(latest, intended)) return 'newer-draft-retained';
          receipt = null;
        }
        throw new AccountError('Your newer private draft remains on this device. Please try again.');
      })().finally(() => { pendingAssociation = undefined; });
      pendingAssociation = { owner, promise };
      return promise;
    },
    async signOut(discardDraft = false) {
      const draft = await drafts.load();
      if (draft && !discardDraft) throw new AccountError('Keep your draft by canceling, or discard it and sign out.');
      if (draft) await drafts.discard();
      await storage.removeItem(receiptKey);
      let serverConfirmed = false;
      try {
        await client.auth.stopAutoRefresh();
        try { serverConfirmed = !(await client.auth.signOut({ scope: 'local' })).error; }
        catch { /* Connectivity errors may throw before SDK local cleanup. */ }
        // Forget only this client's configured session. A second supported signOut
        // with empty storage clears SDK state and emits SIGNED_OUT without a token.
        await storage.removeItem(storageKey);
        const local = await client.auth.signOut({ scope: 'local' });
        if (local.error) throw new Error();
        const remaining = await client.auth.getSession();
        if (remaining.error || remaining.data.session || await storage.getItem(storageKey) !== null) throw new Error();
        await client.auth.stopAutoRefresh();
      } catch {
        throw new AccountError('Sign-out could not be completed safely. Local credential removal could not be confirmed. Reconnect and try again.');
      }
      if (!serverConfirmed) throw new AccountError('This device removed its sign-in, but server revocation was not confirmed. When connected, sign in by email code and use Sign out other devices.');
    },
    async revokeOthers(email, code) {
      const original = await session();
      if (original.user.email?.toLowerCase() !== email.trim().toLowerCase()) throw new AccountError('Use the email address for this account.');
      // A fresh email OTP creates an authenticated session for this same identity.
      await verify(email, code);
      await stillOwner(original.user.id);
      const { error } = await client.auth.signOut({ scope: 'others' });
      if (error) throw new AccountError('Other-device sign-out was not confirmed. Please try again when connected.');
    },
    subscribe(listener) {
      const { data } = client.auth.onAuthStateChange(() => { listener(); });
      return () => data.subscription.unsubscribe();
    },
  };
}
