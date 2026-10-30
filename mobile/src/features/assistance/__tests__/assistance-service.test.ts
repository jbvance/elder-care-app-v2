import type { SupabaseClient } from '@supabase/supabase-js';
import { AssistanceAccessDeniedError, AssistanceTemporaryError, AssistanceUncertainError, createAssistanceService, type WorkItem } from '../assistance-service';
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
