import type { SupabaseClient } from '@supabase/supabase-js';
import { AssistanceAccessDeniedError, AssistanceStaleError, AssistanceTemporaryError, AssistanceUncertainError, createAssistanceService, type WorkItem } from '../assistance-service';
import { localSchedule, scheduleLabels } from '../schedule';

test('acceptance retry keeps its operation identity and checks the current account', async () => {
  let user = 'helper-a', fail = true, sequence = 0;
  const calls: Record<string, unknown>[] = [];
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: user }, access_token: 'fixture-token' } } }) },
    rpc: (name: string, input: Record<string, unknown>) => { expect(name).toBe('accept_assistance'); calls.push(input); return { setHeader: async () => ({ data: fail ? null : { outcome: 'accepted' }, status: fail ? 0 : 200, error: fail ? { code: '', message: 'TypeError: Failed to fetch' } : null }) }; } } as unknown as SupabaseClient;
  const service = createAssistanceService(client, () => `operation-${++sequence}`);
  const item = { id: 'need', material_revision: 8 } as WorkItem;
  await expect(service.accept(item)).rejects.toBeInstanceOf(AssistanceUncertainError);
  fail = false;
  await service.accept(item);
  expect(calls[1]).toEqual(calls[0]);
  user = 'helper-b';
  await service.accept(item);
  expect(calls[2].p_operation).not.toBe(calls[0].p_operation);
  expect(calls[0]).toEqual({ p_scope: 'need', p_material_revision: 8, p_operation: 'operation-1' });
});

test('a definitive access denial has no uncertain operation to retry', async () => {
  let denied = true, sequence = 0;
  const calls: Record<string, unknown>[] = [];
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'helper' }, access_token: 'fixture-token' } } }) },
    rpc: (_name: string, input: Record<string, unknown>) => { calls.push(input); return { setHeader: async () => ({ data: denied ? null : { outcome: 'accepted' }, status: denied ? 403 : 200, error: denied ? { code: 'PT403', message: 'Permission denied' } : null }) }; } } as unknown as SupabaseClient;
  const service = createAssistanceService(client, () => `operation-${++sequence}`);
  const item = { id: 'need', material_revision: 8 } as WorkItem;
  await expect(service.accept(item)).rejects.toThrow('This action is unavailable with current access');
  denied = false;
  await service.accept(item);
  expect(calls[1].p_operation).not.toBe(calls[0].p_operation);
});

test('completion sends captured commitment and material revision, then retries an uncertain report with the same operation', async () => {
  let uncertain = true, sequence = 0;
  const calls: Record<string, unknown>[] = [];
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'performer' }, access_token: 'fixture-token' } } }) },
    rpc: (name: string, input: Record<string, unknown>) => { expect(name).toBe('report_assistance_completion'); calls.push(input); return { setHeader: async () => ({ data: uncertain ? null : { outcome: 'reported', reported_at: '2026-11-01T12:00:00Z' }, status: uncertain ? 0 : 200, error: uncertain ? { code: '', message: 'Network unavailable' } : null }) }; } } as unknown as SupabaseClient;
  const service = createAssistanceService(client, () => `operation-${++sequence}`);
  const opened = { id: 'need', accepted_by_me: true, commitment_id: 'accepted-commitment', material_revision: 8 } as WorkItem;
  await expect(service.complete(opened)).rejects.toBeInstanceOf(AssistanceUncertainError);
  uncertain = false;
  await expect(service.complete(opened)).resolves.toEqual({ outcome: 'reported', reported_at: '2026-11-01T12:00:00Z' });
  expect(calls).toEqual([{
    p_scope: 'need', p_commitment: 'accepted-commitment', p_material_revision: 8, p_operation: 'operation-1',
  }, calls[0]]);
  await service.complete(opened);
  expect(calls[2].p_operation).toBe('operation-2');
});

test('completion distinguishes stale intent from definitive access denial and clears its uncertain operation', async () => {
  let status = 409, sequence = 0;
  const calls: Record<string, unknown>[] = [];
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'performer' }, access_token: 'fixture-token' } } }) },
    rpc: (_name: string, input: Record<string, unknown>) => { calls.push(input); return { setHeader: async () => ({ data: status === 200 ? { outcome: 'reported' } : null, status, error: status === 200 ? null : { code: status === 409 ? 'PT409' : 'PT403', message: 'Current state denied' } }) }; } } as unknown as SupabaseClient;
  const service = createAssistanceService(client, () => `operation-${++sequence}`);
  const opened = { id: 'need', accepted_by_me: true, commitment_id: 'accepted-commitment', material_revision: 8 } as WorkItem;
  await expect(service.complete(opened)).rejects.toBeInstanceOf(AssistanceStaleError);
  status = 403;
  await expect(service.complete(opened)).rejects.toBeInstanceOf(AssistanceAccessDeniedError);
  status = 200;
  await service.complete(opened);
  expect(calls.map(call => call.p_operation)).toEqual(['operation-1', 'operation-2', 'operation-3']);
});

test('an intervening assistance mutation cannot replace an uncertain completion operation', async () => {
  let completionUncertain = true, sequence = 0;
  const calls: { name: string; input: Record<string, unknown> }[] = [];
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'performer' }, access_token: 'fixture-token' } } }) },
    rpc: (name: string, input: Record<string, unknown>) => {
      calls.push({ name, input });
      const lost = name === 'report_assistance_completion' && completionUncertain;
      return { setHeader: async () => ({ data: lost ? null : { outcome: name === 'answer_assistance' ? 'deferred' : 'reported' }, status: lost ? 0 : 200, error: lost ? { code: '', message: 'Transport interrupted' } : null }) };
    } } as unknown as SupabaseClient;
  const service = createAssistanceService(client, () => `operation-${++sequence}`);
  const opened = { id: 'need', accepted_by_me: true, commitment_id: 'commitment-1', material_revision: 4 } as WorkItem;
  await expect(service.complete(opened)).rejects.toBeInstanceOf(AssistanceUncertainError);
  expect(await service.pendingCompletionScopes()).toEqual(['need']);
  await service.answer({ id: 'other', material_revision: 2 } as WorkItem, 'deferred');
  completionUncertain = false;
  await service.retryPendingCompletion('need');
  expect(calls.map(call => call.name)).toEqual(['report_assistance_completion', 'answer_assistance', 'report_assistance_completion']);
  expect(calls[2].input).toEqual(calls[0].input);
  expect(calls[1].input.p_operation).not.toBe(calls[0].input.p_operation);
  expect(await service.pendingCompletionScopes()).toEqual([]);
});

test.each([['stale', 409, AssistanceStaleError], ['denied', 403, AssistanceAccessDeniedError]] as const)(
  'an uncertain completion still uses its first operation after another action and a definitive %s response', async (_label, finalStatus, errorType) => {
    let completionStatus = 0, sequence = 0;
    const calls: { name: string; input: Record<string, unknown> }[] = [];
    const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'performer' }, access_token: 'fixture-token' } } }) },
      rpc: (name: string, input: Record<string, unknown>) => {
        calls.push({ name, input });
        const status = name === 'answer_assistance' ? 200 : completionStatus;
        return { setHeader: async () => ({ data: status === 200 ? { outcome: 'deferred' } : null, status, error: status === 200 ? null : { code: status === 409 ? 'PT409' : status === 403 ? 'PT403' : '', message: 'Current state changed' } }) };
      } } as unknown as SupabaseClient;
    const service = createAssistanceService(client, () => `operation-${++sequence}`);
    const opened = { id: 'need', accepted_by_me: true, commitment_id: 'commitment-1', material_revision: 4 } as WorkItem;
    await expect(service.complete(opened)).rejects.toBeInstanceOf(AssistanceUncertainError);
    await service.answer({ id: 'other', material_revision: 2 } as WorkItem, 'deferred');
    completionStatus = finalStatus;
    await expect(service.retryPendingCompletion('need')).rejects.toBeInstanceOf(errorType);
    expect(calls[2].input).toEqual(calls[0].input);
    expect(await service.pendingCompletionScopes()).toEqual([]);
    await expect(service.retryPendingCompletion('need')).rejects.toThrow('No pending completion report remains');
  },
);

test('a pending completion is unavailable to another signed-in account', async () => {
  let user = 'performer';
  let authChange: ((event: string, session: { user: { id: string } } | null) => void) | undefined;
  const client = { auth: {
    getSession: async () => ({ data: { session: { user: { id: user }, access_token: 'fixture-token' } } }),
    onAuthStateChange: (callback: typeof authChange) => { authChange = callback; return { data: { subscription: { unsubscribe: () => {} } } }; },
  }, rpc: () => ({ setHeader: async () => ({ data: null, status: 0, error: { code: '', message: 'Transport interrupted' } }) }) } as unknown as SupabaseClient;
  const service = createAssistanceService(client, () => 'completion-operation');
  const opened = { id: 'need', accepted_by_me: true, commitment_id: 'commitment-1', material_revision: 4 } as WorkItem;
  await expect(service.complete(opened)).rejects.toBeInstanceOf(AssistanceUncertainError);
  user = 'different-account';
  expect(await service.pendingCompletionScopes()).toEqual([]);
  await expect(service.retryPendingCompletion('need')).rejects.toThrow('No pending completion report remains');
  authChange?.('SIGNED_IN', { user: { id: user } });
  user = 'performer';
  expect(await service.pendingCompletionScopes()).toEqual([]);
});

test.each([
  ['read_assistance', (service: ReturnType<typeof createAssistanceService>) => service.read('need')],
  ['read_scope_context', (service: ReturnType<typeof createAssistanceService>) => service.preparedTiming('need')],
  ['assistance_candidates', (service: ReturnType<typeof createAssistanceService>) => service.candidates('need')],
] as const)('%s distinguishes temporary detail failure from definitive access denial', async (expectedName, call) => {
  let denied = false;
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'coordinator' }, access_token: 'fixture-token' } } }) },
    rpc: (name: string) => { expect(name).toBe(expectedName); return { setHeader: async () => ({ data: null, status: denied ? 403 : 0, error: denied ? { code: 'PT403', message: 'Current access denied' } : { code: '', message: 'TypeError: Failed to fetch' } }) }; } } as unknown as SupabaseClient;
  const service = createAssistanceService(client, () => 'unused-operation');
  await expect(call(service)).rejects.toBeInstanceOf(AssistanceTemporaryError);
  denied = true;
  await expect(call(service)).rejects.toBeInstanceOf(AssistanceAccessDeniedError);
});

test('scheduled wall times reject DST gaps and folds and display a local equivalent', () => {
  expect(localSchedule('03/08/2026', '2:30 AM', 'America/Chicago').error).toMatch(/does not occur/);
  expect(localSchedule('11/01/2026', '1:30 AM', 'America/Chicago').error).toMatch(/occurs twice/);
  const valid = localSchedule('11/01/2026', '10:00 AM', 'America/Chicago');
  expect(valid.error).toBeNull();
  const labels = scheduleLabels(valid.instant!, 'America/Chicago', 'America/New_York');
  expect(labels.authoritative).toContain('10:00 AM');
  expect(labels.authoritative).toContain('America/Chicago');
  expect(labels.participant).toContain('11:00 AM');
  expect(labels.participant).toContain('America/New_York');
  expect(localSchedule('', '', 'America/Chicago')).toEqual({ instant: null, error: null });
});
