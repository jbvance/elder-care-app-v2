import type { SupabaseClient } from '@supabase/supabase-js';

export type Candidate = { user_id: string; label: string; offered: boolean; ongoing: boolean };
export type WorkItem = {
  id: string; arrangement_id: string; older_adult: string; task: string; place: string; instructions: string;
  scheduled_at: string | null; schedule_zone: string | null; local_date: string; local_time: string;
  material_revision: number | null; scope_revision: number; created: boolean; coordinator: boolean;
  can_create_other: boolean; can_offer: boolean; eligible: boolean; accepted_by_me: boolean;
  arranged: boolean; accepted_at: string | null; my_answer: 'declined' | 'deferred' | null;
  accepted_by?: string | null;
  commitment_id?: string | null; completion_reported_at?: string | null; completion_reported_by_me?: boolean;
  can_resolve?: boolean; resolved?: boolean; resolved_at?: string | null; resolved_by?: string | null;
  resolution_snapshot?: string | null;
  audience_count: number; candidates?: Candidate[];
};
export type NeedInput = { task: string; place: string; instructions: string; date: string; time: string; zone: string };
export type WorkOutcome = { id?: string; outcome?: 'accepted' | 'already-arranged' | 'declined' | 'deferred' | 'reported' | 'resolved' | 'already-resolved' | 'completed-and-resolved'; reported_at?: string; resolved_at?: string; created?: boolean; updated?: boolean; offered?: boolean; ongoing?: boolean };

export class AssistanceTemporaryError extends Error {
  constructor(message = 'Current details could not be loaded. Retry when the connection is available.') { super(message); this.name = 'AssistanceTemporaryError'; }
}

export class AssistanceAccessDeniedError extends Error {
  constructor() { super('This need is no longer available with current access.'); this.name = 'AssistanceAccessDeniedError'; }
}

export class AssistanceUncertainError extends AssistanceTemporaryError {
  constructor(message = 'We could not confirm whether that action completed. Retry the same action to check its outcome.') { super(message); this.name = 'AssistanceUncertainError'; }
}

export class AssistanceStaleError extends Error {
  constructor(message: string) { super(message); this.name = 'AssistanceStaleError'; }
}

export function createAssistanceService(client: SupabaseClient, uuid: () => string) {
  let uncertain: { key: string; operation: string; owner: string } | undefined;
  const pendingCompletion = new Map<string, { owner: string; scope: string; input: Record<string, unknown>; operation: string }>();
  const pendingResolution = new Map<string, { owner: string; scope: string; name: string; input: Record<string, unknown>; operation: string }>();
  client.auth.onAuthStateChange?.((event, session) => {
    if (event === 'SIGNED_OUT' || (uncertain && session?.user.id !== uncertain.owner)) uncertain = undefined;
    if (event === 'SIGNED_OUT') { pendingCompletion.clear(); pendingResolution.clear(); }
    else if (event === 'SIGNED_IN' && session) {
      for (const [key, pending] of pendingCompletion) if (pending.owner !== session.user.id) pendingCompletion.delete(key);
      for (const [key, pending] of pendingResolution) if (pending.owner !== session.user.id) pendingResolution.delete(key);
    }
  });
  async function call<T>(name: string, input: Record<string, unknown>, mutation = false, retryOnly = false): Promise<T> {
    const { data: { session } } = await client.auth.getSession();
    if (!session) throw new Error('Sign in to open current needs and opportunities.');
    const key = JSON.stringify([session.user.id, name, input]);
    const completion = name === 'report_assistance_completion';
    const resolution = name === 'resolve_assistance' || name === 'complete_and_resolve_assistance';
    const completionKey = JSON.stringify([session.user.id, input.p_scope]);
    const resolutionKey = completionKey;
    if ((completion || name === 'resolve_assistance') && pendingResolution.get(resolutionKey)?.name === 'complete_and_resolve_assistance') {
      throw new Error('Check the pending combined outcome before reporting completion or resolving this need.');
    }
    let captured = completion ? pendingCompletion.get(completionKey) : undefined;
    let capturedResolution = resolution ? pendingResolution.get(resolutionKey) : undefined;
    if (completion && mutation && !captured) {
      if (retryOnly) throw new Error('No pending completion report remains. Check current work before reporting again.');
      captured = { owner: session.user.id, scope: String(input.p_scope), input: { ...input }, operation: uuid() };
      pendingCompletion.set(completionKey, captured);
    }
    if (resolution && mutation && !capturedResolution) {
      if (retryOnly) throw new Error('No pending resolution action remains. Review current need details.');
      capturedResolution = { owner: session.user.id, scope: String(input.p_scope), name, input: { ...input }, operation: uuid() };
      pendingResolution.set(resolutionKey, capturedResolution);
    }
    if (resolution && capturedResolution?.name !== name) throw new Error('Check the pending resolution outcome before choosing another resolution action.');
    if (mutation && !completion && !resolution && uncertain?.key !== key) uncertain = { key, operation: uuid(), owner: session.user.id };
    const params = mutation ? { ...(completion ? captured!.input : resolution ? capturedResolution!.input : input), p_operation: completion ? captured!.operation : resolution ? capturedResolution!.operation : uncertain!.operation } : input;
    let result;
    try { result = await client.rpc(name, params).setHeader('Authorization', `Bearer ${session.access_token}`); }
    catch { result = null; }
    const current = await client.auth.getSession();
    if (current.data.session?.user.id !== session.user.id) {
      if (completion) pendingCompletion.delete(completionKey);
      if (resolution) pendingResolution.delete(resolutionKey);
      throw new Error('Account changed. Reopen needs and opportunities.');
    }
    if (!result || result.status === 0 || result.status >= 500) throw mutation ? new AssistanceUncertainError(completion ? 'We could not confirm whether your completion report was saved. Retry the same action to check its outcome.' : resolution ? 'We could not confirm whether this need was resolved. Retry the same action to check its outcome.' : undefined) : new AssistanceTemporaryError();
    if (result.error) {
      if (completion) pendingCompletion.delete(completionKey);
      if (resolution) pendingResolution.delete(resolutionKey);
      if (mutation && !completion && !resolution) uncertain = undefined;
      if (result.error.code === 'PT409') throw new AssistanceStaleError(result.error.message);
      if (result.error.code === 'PT400') throw new Error(result.error.message);
      if ((!mutation || completion || resolution) && (result.error.code === 'PT403' || result.status === 401 || result.status === 403)) throw new AssistanceAccessDeniedError();
      throw new Error('This action is unavailable with current access. Check the request again.');
    }
    if (completion) pendingCompletion.delete(completionKey);
    if (resolution) pendingResolution.delete(resolutionKey);
    if (mutation && !completion && !resolution) uncertain = undefined;
    return result.data as T;
  }
  const fields = (need: NeedInput) => ({ p_task: need.task, p_place: need.place, p_instructions: need.instructions, p_date: need.date, p_time: need.time, p_zone: need.zone });
  return {
    list: () => call<WorkItem[]>('list_assistance', {}),
    read: (id: string) => call<WorkItem>('read_assistance', { p_scope: id }),
    preparedTiming: async (id: string) => {
      const context = await call<{ summary?: { date?: string; time?: string; timeZone?: string } }>('read_scope_context', { p_scope: id });
      return { date: context.summary?.date || '', time: context.summary?.time || '', zone: context.summary?.timeZone || '' };
    },
    candidates: (id: string) => call<Candidate[]>('assistance_candidates', { p_scope: id }),
    createFirst: (item: WorkItem, need: NeedInput) => call<WorkOutcome>('create_assistance_request', { p_scope: item.id, ...fields(need), p_revision: item.scope_revision }, true),
    createAnother: (item: WorkItem, need: NeedInput) => call<WorkOutcome>('create_assistance_need', { p_root: item.id, ...fields(need), p_revision: item.scope_revision }, true),
    update: (item: WorkItem, need: NeedInput) => call<WorkOutcome>('update_assistance_request', { p_scope: item.id, ...fields(need), p_material_revision: item.material_revision }, true),
    ongoing: (item: WorkItem, user: string, include: boolean) => call<WorkOutcome>('set_ongoing_helper_audience', { p_root: item.id, p_user: user, p_include: include, p_revision: item.scope_revision }, true),
    offer: (item: WorkItem, user: string) => call<WorkOutcome>('offer_assistance', { p_scope: item.id, p_user: user, p_material_revision: item.material_revision }, true),
    accept: (item: WorkItem) => call<WorkOutcome>('accept_assistance', { p_scope: item.id, p_material_revision: item.material_revision }, true),
    answer: (item: WorkItem, answer: 'declined' | 'deferred') => call<WorkOutcome>('answer_assistance', { p_scope: item.id, p_answer: answer, p_material_revision: item.material_revision }, true),
    complete: (item: WorkItem) => {
      if (!item.accepted_by_me || !item.commitment_id || item.material_revision === null) throw new Error('Open your current accepted responsibility before reporting completion.');
      return call<WorkOutcome>('report_assistance_completion', { p_scope: item.id, p_commitment: item.commitment_id, p_material_revision: item.material_revision }, true);
    },
    resolve: (item: WorkItem) => {
      if (!item.can_resolve || !item.resolution_snapshot) throw new Error('Open the current need before resolving it.');
      return call<WorkOutcome>('resolve_assistance', { p_scope: item.id, p_snapshot: item.resolution_snapshot }, true);
    },
    completeAndResolve: (item: WorkItem) => {
      if (!item.can_resolve || !item.accepted_by_me || !item.commitment_id || item.material_revision === null || !item.resolution_snapshot) throw new Error('Open your current accepted responsibility before completing and resolving.');
      return call<WorkOutcome>('complete_and_resolve_assistance', { p_scope: item.id, p_commitment: item.commitment_id, p_material_revision: item.material_revision, p_snapshot: item.resolution_snapshot }, true);
    },
    pendingResolutionScopes: async () => {
      const { data: { session } } = await client.auth.getSession();
      return session ? [...pendingResolution.values()].filter(pending => pending.owner === session.user.id).map(pending => pending.scope) : [];
    },
    pendingCombinedScopes: async () => {
      const { data: { session } } = await client.auth.getSession();
      return session ? [...pendingResolution.values()].filter(pending => pending.owner === session.user.id && pending.name === 'complete_and_resolve_assistance').map(pending => pending.scope) : [];
    },
    retryPendingResolution: async (scope: string) => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) throw new Error('Sign in to check your pending resolution action.');
      const pending = pendingResolution.get(JSON.stringify([session.user.id, scope]));
      if (!pending) throw new Error('No pending resolution action remains. Review current need details.');
      return call<WorkOutcome>(pending.name, pending.input, true, true);
    },
    pendingCompletionScopes: async () => {
      const { data: { session } } = await client.auth.getSession();
      return session ? [...pendingCompletion.values()].filter(pending => pending.owner === session.user.id).map(pending => pending.scope) : [];
    },
    retryPendingCompletion: async (scope: string) => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) throw new Error('Sign in to check your pending completion report.');
      const pending = pendingCompletion.get(JSON.stringify([session.user.id, scope]));
      if (!pending) throw new Error('No pending completion report remains. Check current work before reporting again.');
      return call<WorkOutcome>('report_assistance_completion', pending.input, true, true);
    },
  };
}
export type Assistance = ReturnType<typeof createAssistanceService>;
