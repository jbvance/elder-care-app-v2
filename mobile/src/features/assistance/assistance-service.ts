import type { SupabaseClient } from '@supabase/supabase-js';

export type Candidate = { user_id: string; label: string; offered: boolean; ongoing: boolean };
export type WorkItem = {
  id: string; arrangement_id: string; older_adult: string; task: string; place: string; instructions: string;
  scheduled_at: string | null; schedule_zone: string | null; local_date: string; local_time: string;
  material_revision: number | null; scope_revision: number; created: boolean; coordinator: boolean;
  can_create_other: boolean; can_offer: boolean; eligible: boolean; accepted_by_me: boolean;
  arranged: boolean; accepted_at: string | null; my_answer: 'declined' | 'deferred' | null;
  accepted_by?: string | null;
  audience_count: number; candidates?: Candidate[];
};
export type NeedInput = { task: string; place: string; instructions: string; date: string; time: string; zone: string };
export type WorkOutcome = { id?: string; outcome?: 'accepted' | 'already-arranged' | 'declined' | 'deferred'; created?: boolean; updated?: boolean; offered?: boolean; ongoing?: boolean };

export class AssistanceTemporaryError extends Error {
  constructor(message = 'Current details could not be loaded. Retry when the connection is available.') { super(message); this.name = 'AssistanceTemporaryError'; }
}

export class AssistanceAccessDeniedError extends Error {
  constructor() { super('This need is no longer available with current access.'); this.name = 'AssistanceAccessDeniedError'; }
}

export class AssistanceUncertainError extends AssistanceTemporaryError {
  constructor() { super('We could not confirm whether that action completed. Retry the same action to check its outcome.'); this.name = 'AssistanceUncertainError'; }
}

export class AssistanceStaleError extends Error {
  constructor(message: string) { super(message); this.name = 'AssistanceStaleError'; }
}

export function createAssistanceService(client: SupabaseClient, uuid: () => string) {
  let uncertain: { key: string; operation: string; owner: string } | undefined;
  client.auth.onAuthStateChange?.((event, session) => {
    if (event === 'SIGNED_OUT' || (uncertain && session?.user.id !== uncertain.owner)) uncertain = undefined;
  });
  async function call<T>(name: string, input: Record<string, unknown>, mutation = false): Promise<T> {
    const { data: { session } } = await client.auth.getSession();
    if (!session) throw new Error('Sign in to open current needs and opportunities.');
    const key = JSON.stringify([session.user.id, name, input]);
    if (mutation && uncertain?.key !== key) uncertain = { key, operation: uuid(), owner: session.user.id };
    const params = mutation ? { ...input, p_operation: uncertain!.operation } : input;
    let result;
    try { result = await client.rpc(name, params).setHeader('Authorization', `Bearer ${session.access_token}`); }
    catch { result = null; }
    const current = await client.auth.getSession();
    if (current.data.session?.user.id !== session.user.id) throw new Error('Account changed. Reopen needs and opportunities.');
    if (!result || result.status === 0 || result.status >= 500) throw mutation ? new AssistanceUncertainError() : new AssistanceTemporaryError();
    if (result.error) {
      if (mutation) uncertain = undefined;
      if (result.error.code === 'PT409') throw new AssistanceStaleError(result.error.message);
      if (result.error.code === 'PT400') throw new Error(result.error.message);
      if (!mutation && (result.error.code === 'PT403' || result.status === 401 || result.status === 403)) throw new AssistanceAccessDeniedError();
      throw new Error('This action is unavailable with current access. Check the request again.');
    }
    if (mutation) uncertain = undefined;
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
  };
}
export type Assistance = ReturnType<typeof createAssistanceService>;
