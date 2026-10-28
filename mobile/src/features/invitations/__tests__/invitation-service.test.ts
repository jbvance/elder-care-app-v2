import type { SupabaseClient } from '@supabase/supabase-js';
import { createInvitationService } from '../invitation-service';

test('issuance retry preserves operation and link through a lost response, including replacement', async () => {
  const memory = new Map<string, string>();
  const storage = { getItem: async (key: string) => memory.get(key) ?? null, setItem: async (key: string, value: string) => { memory.set(key, value); }, removeItem: async (key: string) => { memory.delete(key); } };
  let fail = true;
  const inputs: Record<string, unknown>[] = [];
  let sequence = 0;
  const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'owner' }, access_token: 'test-only' } } }) }, rpc: (_name: string, params: Record<string, unknown>) => { inputs.push(params); return { setHeader: async () => ({ data: 'invitation', error: fail ? {} : null }) }; } } as unknown as SupabaseClient;
  const service = createInvitationService(client, storage, () => `${++sequence}`.padStart(32, '0'));
  await expect(service.issue('scope', ' Recipient@example.test ', true)).rejects.toThrow();
  fail = false;
  const retry = service.issue('scope', 'recipient@example.test', true);
  const concurrent = service.issue('scope', 'recipient@example.test', true);
  expect(concurrent).toBe(retry);
  const link = await retry;
  expect(inputs[1]).toEqual(inputs[0]);
  expect(await service.issue('scope', 'recipient@example.test')).toBe(link);
  const replacement = await service.issue('scope', 'recipient@example.test', true);
  expect(replacement).not.toBe(link);
  expect(inputs[3].p_operation).not.toBe(inputs[0].p_operation);
});
