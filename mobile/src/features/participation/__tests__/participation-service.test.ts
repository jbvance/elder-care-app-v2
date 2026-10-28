import type { SupabaseClient } from '@supabase/supabase-js';
import { createParticipationService } from '../participation-service';
import { coordinationRights, type ScopeContext } from '../participation-service';

test('uncertain mutation retries reuse an operation; account changes cannot receive old responses', async () => {
  let user='first', fail=true, sequence=0;
  const inputs: Record<string, unknown>[]=[];
  const client={auth:{getSession:async()=>({data:{session:{user:{id:user},access_token:'non-issued-fixture'}}})},rpc:(_name:string,input:Record<string,unknown>)=>{inputs.push(input);return {setHeader:async()=>({data:true,error:fail?{code:'network'}:null})};}} as unknown as SupabaseClient;
  const service=createParticipationService(client,()=>String(++sequence));
  await expect(service.suggest('scope','helper@example.test')).rejects.toThrow();fail=false;
  await service.suggest('scope','helper@example.test');expect(inputs[1].p_operation).toBe(inputs[0].p_operation);
  user='second';await service.suggest('scope','helper@example.test');expect(inputs[2].p_operation).not.toBe(inputs[0].p_operation);
});

test('the audience request carries only target, inclusion, revision and retry identity',async()=>{
  let failed=true;const inputs:Record<string,unknown>[]=[];
  const client={auth:{getSession:async()=>({data:{session:{user:{id:'coordinator-without-management'},access_token:'non-issued-fixture'}}})},rpc:(name:string,input:Record<string,unknown>)=>{expect(name).toBe('set_practical_audience');inputs.push(input);return{setHeader:async()=>({data:{},error:failed?{code:'network'}:null})};}} as unknown as SupabaseClient;
  const service=createParticipationService(client,()=> 'operation-fixture');
  const view={id:'additional-need',revision:7,rights:{...coordinationRights,manage:false,disclose:false}} as ScopeContext;
  await expect(service.setAudience(view,'stable-reader',false)).rejects.toThrow();failed=false;
  await service.setAudience(view,'stable-reader',false);
  expect(inputs[0]).toEqual({p_scope:'additional-need',p_user:'stable-reader',p_include:false,p_revision:7,p_operation:'operation-fixture'});
  expect(inputs[1]).toEqual(inputs[0]);
});
