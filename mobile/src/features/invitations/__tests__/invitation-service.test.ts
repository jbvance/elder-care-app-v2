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

test('a delegated caller issues for an additional scope without an owner-private lookup and cannot issue after authority loss',async()=>{
  const storageValues=new Map<string,string>();
  const storage={getItem:async(k:string)=>storageValues.get(k)??null,setItem:async(k:string,v:string)=>{storageValues.set(k,v);},removeItem:async(k:string)=>{storageValues.delete(k);}};
  let denied=false,sequence=0;
  const rpc=jest.fn((_name:string,_input:Record<string,unknown>)=>({setHeader:async()=>({data:'invitation-id',error:denied?{code:'PT403'}:null})}));
  const client={auth:{getSession:async()=>({data:{session:{user:{id:'delegated-manager'},access_token:'non-issued-fixture'}}})},rpc} as unknown as SupabaseClient;
  const service=createInvitationService(client,storage,()=>String(++sequence).padStart(32,'0'));
  await service.issue('additional-authorized-need',' RECIPIENT@example.test ');
  expect(rpc).toHaveBeenLastCalledWith('issue_invitation',expect.objectContaining({p_scope:'additional-authorized-need',p_recipient:'recipient@example.test'}));
  expect(Object.keys(rpc.mock.calls[0][1]).sort()).toEqual(['p_operation','p_recipient','p_scope','p_token']);
  denied=true;
  await expect(service.issue('additional-authorized-need','recipient@example.test')).rejects.toThrow();
});
