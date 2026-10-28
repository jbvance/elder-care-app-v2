// Synthetic-only integration tests against the real local Auth/PostgREST boundary.
// Never print server bodies, email codes, sessions or credentials.
import { spawnSync } from 'node:child_process';
import { randomUUID, createPrivateKey, sign } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../mobile/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');
// Node 24 strips TypeScript types; this is the same foreground policy used by the app.
const { refreshForeground } = await import('../mobile/src/features/account/refresh-foreground.ts');

const api = 'http://127.0.0.1:54321';
const mail = 'http://127.0.0.1:54324';
const project = 'elder-care-app-v2';
let stage = 'local preflight';
const sessions = [];
class CheckFailure extends Error {}
function check(ok, message) { if (!ok) throw new CheckFailure(message); }
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  check(result.status === 0, 'Local command failed (output suppressed)');
  return result.stdout.trim();
}
function sql(query) {
  return run('docker.exe', ['exec', `supabase_db_${project}`, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-Atc', query]);
}
async function http(url, options = {}) {
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = null; }
  return { status: response.status, body };
}
let publicKey;
function headers(session) {
  return { apikey: publicKey, 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) };
}
async function rpc(name, body, session) {
  return http(`${api}/rest/v1/rpc/${name}`, { method: 'POST', headers: headers(session), body: JSON.stringify(body) });
}
async function emailCode(email, create = true) {
  const before = await http(`${mail}/api/v1/messages`);
  const ids = new Set(before.body.messages.map(item => item.ID));
  const sent = await http(`${api}/auth/v1/otp`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, create_user: create }) });
  check(sent.status === 200, `OTP request HTTP ${sent.status}`);
  let message;
  for (let i = 0; i < 20; i++) {
    const inbox = await http(`${mail}/api/v1/messages`);
    message = inbox.body.messages.find(item => !ids.has(item.ID) && item.To.some(to => to.Address === email));
    if (message) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  check(message, 'Fictional email was not captured');
  const captured = await http(`${mail}/api/v1/message/${encodeURIComponent(message.ID)}`);
  const code = captured.body.HTML?.match(/<strong>\s*(\d{6})\s*<\/strong>/i)?.[1];
  check(code, 'Expected numeric email code');
  return code;
}
async function login(email, create = true) {
  const code = await emailCode(email, create);
  const verified = await http(`${api}/auth/v1/verify`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, token: code, type: 'email' }) });
  check(verified.status === 200 && verified.body.access_token, `OTP verification HTTP ${verified.status}`);
  sessions.push(verified.body);
  return verified.body;
}

async function main() {
  const status=JSON.parse(run(process.env.ComSpec??'cmd.exe',['/d','/s','/c','.\\node_modules\\.bin\\supabase.cmd status -o json']));
  publicKey=status.PUBLISHABLE_KEY;check(status.API_URL===api,'Unexpected backend');
  const stamp=Date.now();
  const owner=await login(`t04-${stamp}-owner@example.test`),a=await login(`t04-${stamp}-a@example.test`),b=await login(`t04-${stamp}-b@example.test`);
  const helper={preset:'helper',practical:true,manage:false,delegate:false,background:false,share_background:false,disclose:false,cancel:false,resolve:false,external:false};
  const coordinator={...helper,preset:'coordinator',manage:true,disclose:true,resolve:true};
  const full={...coordinator,delegate:true,background:true,share_background:true,cancel:true,external:true};
  const ctx=(id,who=owner)=>rpc('read_scope_context',{p_scope:id},who);
  const read=(id,who=a)=>rpc('read_prompting_summary',{p_scope:id},who);
  async function arrangement(){const r=await rpc('associate_private_draft',{p_operation_id:randomUUID(),p_draft:{olderAdult:'Fictional T04 Morgan',description:'Synthetic groceries',location:'Fictional shop',date:'',time:'',timeZone:'America/Chicago',prepared:true}},owner);check(r.status===200,'Private preparation');return r.body.id;}
  async function start(id,rights=full){return rpc('start_coordination',{p_arrangement:id,p_kind:'reported',p_source:'Fictional Morgan authorized ongoing coordination in this arrangement',p_rights:rights,p_operation:randomUUID()},owner);}
  async function invite(id,who){const token=(randomUUID()+randomUUID()).replaceAll('-','');check((await rpc('issue_invitation',{p_scope:id,p_recipient:who.user.email,p_operation:randomUUID(),p_token:token},owner)).status===200,'Invitation');check((await rpc('join_invitation',{p_token:token},who)).status===200,'Join');return token;}
  async function change(id,who,rights,remove=false,actor=owner){const current=await ctx(id,actor);const input={p_scope:id,p_user:who.user.id,p_rights:rights,p_remove:remove,p_kind:'reported',p_source:'Fictional Morgan',p_revision:current.body.revision,p_operation:randomUUID()};return {result:await rpc('change_involvement',input,actor),input};}

  const legacy=await arrangement();
  await rpc('prepare_invitation_scope',{p_scope:legacy,p_kind:'reported',p_source:'Fictional Morgan',p_delegation:true},owner);
  const legacyLink=await invite(legacy,a);
  check((await ctx(legacy,a)).body.rights.preset==='helper'&&!(await ctx(legacy,a)).body.rights.manage,'Legacy helper broadened');
  const legacyOwner=(await ctx(legacy)).body.rights;
  check(legacyOwner.manage&&!legacyOwner.disclose&&!legacyOwner.resolve&&!legacyOwner.background&&legacyOwner.preset==='helper','Legacy author promoted');
  check((await start(legacy)).status===403,'Repeated statement expanded legacy');
  check((await change(legacy,a,coordinator)).result.status===403,'Legacy manager self/escalation');

  const first=await arrangement();check((await start(first)).status===200,'Initial coordination');
  const second=await arrangement();check((await start(second,coordinator)).status===200,'Second arrangement');
  const ta=await invite(first,a),tb=await invite(first,b);await invite(second,a);
  const initial=await ctx(first);check(initial.body.rights.resolve&&initial.body.rights.background,'Explicit root rights missing');
  const add={p_parent:first,p_description:'Synthetic pharmacy scope',p_revision:initial.body.revision,p_operation:randomUUID()};
  const added=await rpc('add_coordination_scope',add,owner);check(added.status===200,'Second need scope');const need=added.body;
  check((await rpc('add_coordination_scope',add,owner)).body===need,'Scope retry duplicated');
  check((await read(need)).status===403,'Helper audience inherited without authorization');
  const candidates=(await ctx(need)).body.candidates;
  check(candidates.some(p=>p.user_id===a.user.id&&p.label===a.user.email)&&candidates.some(p=>p.user_id===b.user.id&&p.label===b.user.email),'Contextual audience candidates missing');
  const broad={p_scope:need,p_user:a.user.id,p_revision:0,p_operation:randomUUID()};
  check((await rpc('add_practical_audience',broad,owner)).status===200,'Authorized broadening');
  check((await rpc('add_practical_audience',broad,owner)).status===200,'Audience retry');
  check((await ctx(need,a)).body.rights.preset==='helper'&&(await read(need)).status===200,'Need-scoped practical grant');
  check((await read(need,b)).status===403,'Other participant inherited scope');
  check((await rpc('add_practical_audience',{...broad,p_scope:second,p_user:b.user.id,p_operation:randomUUID()},owner)).status===403,'Cross-arrangement audience bypass');

  let current=await ctx(first);
  const information={p_scope:first,p_practical:{...current.body.summary,description:'Visible practical instructions'},p_background:'Restricted synthetic background',p_revision:current.body.revision,p_operation:randomUUID()};
  check((await rpc('write_scope_information',information,owner)).status===200,'Authorized information');
  check((await rpc('write_scope_information',information,owner)).status===200,'Information retry');
  check((await rpc('write_scope_information',{...information,p_background:'Changed reuse'},owner)).status===409,'Conflicting information reuse');
  const helperView=await ctx(first,a);check(!('background' in helperView.body)&&!JSON.stringify(helperView.body).includes('Restricted synthetic'),'Restricted payload leak');
  check((await http(`${api}/rest/v1/private_arrangements?id=eq.${first}&select=*`,{headers:headers(a)})).body.length===0,'Private draft leak');
  check((await change(first,a,full,false,a)).result.status===403,'Self escalation');
  check((await change(first,a,{...helper,preset:'coordinator',resolve:false})).result.status===400,'Coordinator resolution default lost');
  check((await change(first,a,coordinator)).result.status===200,'Scoped Coordinator grant');
  let ca=(await ctx(first,a)).body;
  check(ca.rights.resolve&&!ca.rights.cancel&&!ca.rights.background&&!ca.rights.external&&!ca.rights.delegate,'Coordinator bundled separate powers');
  check((await change(first,b,{...helper,manage:true},false,a)).result.status===403,'Unauthorized onward management');
  check((await change(first,b,{...helper,background:true},false,a)).result.status===403,'Restricted grant without authority');
  check((await change(first,b,{...helper,cancel:true},false,a)).result.status===403,'Over-delegation');
  check((await change(first,a,{...coordinator,delegate:true,background:true,share_background:true,cancel:true,external:true})).result.status===200,'Explicit separate powers');
  check((await ctx(first,a)).body.background==='Restricted synthetic background','Authorized restricted read');
  check((await change(first,b,{...helper,manage:true},false,a)).result.status===200,'Authorized onward management');

  const suggestion={p_scope:first,p_address:`suggestion-${stamp}@example.test`,p_operation:randomUUID()};
  const invitationsBefore=sql(`select count(*) from private.invitations where scope_id='${first}'`),membersBefore=sql(`select count(*) from private.scope_involvement where scope_id='${first}'`);
  check((await rpc('suggest_helper',suggestion,b)).status===200&&(await rpc('suggest_helper',suggestion,b)).status===200,'Suggestion retry');
  check(sql(`select count(*) from private.invitations where scope_id='${first}'`)===invitationsBefore&&sql(`select count(*) from private.scope_involvement where scope_id='${first}'`)===membersBefore,'Suggestion granted access');
  check(sql(`select count(*) from private.helper_suggestions where scope_id='${first}'`) === '1','Duplicate suggestion');

  const narrow=await change(first,a,{...coordinator,practical:false});check(narrow.result.status===200,'Practical restriction');
  check((await read(first)).status===403&&(await rpc('join_invitation',{p_token:ta},a)).status===403,'Consumed replay widened narrowed access');
  check((await read(need)).status===200&&(await read(second)).status===200&&(await read(first,b)).status===200,'Narrowing affected independent grants');
  check(!('summary' in (await ctx(first,a)).body),'Restricted practical projection');
  check((await change(first,a,coordinator)).result.status===200,'Authorized audience restoration');
  await change(first,a,helper,true);
  check((await ctx(first,a)).status===403&&(await rpc('join_invitation',{p_token:ta},a)).status===403,'Removed participant replay');
  check((await change(first,a,full)).result.status===403,'Statement restored removed access');
  check((await read(first,b)).status===200,'Other participant lost authorization');
  check((await read(legacy)).status===200&&(await rpc('join_invitation',{p_token:legacyLink},a)).status===200,'Legacy unrelated access lost');
  check((await rpc('manage_invitation_scope',{p_scope:need,p_action:'remove',p_target:a.user.id},owner)).status===200,'Preserved removal RPC');
  check((await ctx(need,a)).status===403,'Preserved removal missed audience-only participation');
  console.log('PASS legacy preservation; two arrangements/multiple needs; defaults/separate powers; isolation; suggestions; restriction/replay');

  const projection=await arrangement();await start(projection);
  check((await change(projection,owner,{...full,practical:false})).result.status===200,'Self narrowing');
  check((await rpc('prepare_invitation_scope',{p_scope:projection,p_kind:'reported',p_source:'Fictional Morgan authorized ongoing coordination in this arrangement',p_delegation:true},owner)).status===403,'Legacy preparation leaked narrowed summary');
  check((await rpc('list_invitation_scope',{p_scope:projection},owner)).body===null,'Legacy management listing leaked narrowed summary');
  check((await read(projection,owner)).status===403,'Summary ignored author restriction');
  console.log('PASS preserved legacy preparation/list endpoints respect narrowed practical access');

  current=await ctx(first);
  const conflict={p_scope:first,p_user:b.user.id,p_rights:helper,p_remove:false,p_kind:'reported',p_source:'Fictional Morgan',p_revision:current.body.revision,p_operation:randomUUID()};
  const results=await Promise.all([rpc('change_involvement',conflict,owner),rpc('change_involvement',{...conflict,p_rights:{...helper,practical:false},p_operation:randomUUID()},owner)]);
  check(results.filter(r=>r.status===200).length===1&&results.filter(r=>r.status===409).length===1,'Silent concurrent overwrite');
  const success=results[0].status===200?conflict:{...conflict,p_rights:{...helper,practical:false}};
  if(results[0].status===200){check((await rpc('change_involvement',success,owner)).status===200,'Lost-response retry');check((await rpc('change_involvement',{...success,p_source:'different'},owner)).status===409,'Conflicting operation reuse');}
  console.log('PASS controlled simultaneous involvement changes, version conflicts and retries');

  const authority=await arrangement();await start(authority);await invite(authority,a);
  await change(authority,a,coordinator);
  const pendingToken=(randomUUID()+randomUUID()).replaceAll('-','');
  const issuance={p_scope:authority,p_recipient:b.user.email,p_operation:randomUUID(),p_token:pendingToken};
  check((await rpc('issue_invitation',issuance,a)).status===200,'Delegated invitation');
  await change(authority,a,{...coordinator,disclose:false});
  check((await rpc('join_invitation',{p_token:pendingToken},b)).status===403,'Lost disclosure still redeemed');
  await change(authority,a,coordinator);
  check((await rpc('join_invitation',{p_token:pendingToken},b)).status===403,'Restored authority revived outstanding invitation');
  console.log('PASS delegated disclosure loss permanently invalidates pending invitations');

  // Removal commits first while target grant waits at the shared arrangement lock.
  const source=await arrangement();await start(source);await invite(source,b);
  const target=(await rpc('add_coordination_scope',{p_parent:source,p_description:'Race target',p_revision:0,p_operation:randomUUID()},owner)).body;
  const {spawn}=await import('node:child_process');const label='t04race_'+randomUUID().replaceAll('-','');
  const blocker=spawn('docker.exe',['exec',`supabase_db_${project}`,'psql','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-Atc',`set application_name='${label}';begin;select id from public.private_arrangements where id='${source}' for update;update private.prompting_participants set removed_at=now() where scope_id='${source}' and user_id='${b.user.id}';select pg_sleep(3);commit;`],{windowsHide:true,stdio:'ignore'});
  let ready=false;for(let attempt=0;attempt<40;attempt++){if(sql(`select count(*) from pg_stat_activity where application_name='${label}' and wait_event='PgSleep'`)==='1'){ready=true;break;}await new Promise(r=>setTimeout(r,50));}
  check(ready,'Source removal race readiness');
  check((await rpc('add_practical_audience',{p_scope:target,p_user:b.user.id,p_revision:0,p_operation:randomUUID()},owner)).status===403,'Stale source eligibility granted target');
  check(blocker.exitCode===null||blocker.exitCode===0,'Source race fixture failed');
  // Opposite order: an independently committed target grant survives subsequent source removal.
  const source2=await arrangement();await start(source2);await invite(source2,b);
  const target2=(await rpc('add_coordination_scope',{p_parent:source2,p_description:'Independent target',p_revision:0,p_operation:randomUUID()},owner)).body;
  check((await rpc('add_practical_audience',{p_scope:target2,p_user:b.user.id,p_revision:0,p_operation:randomUUID()},owner)).status===200,'Target-first grant');
  await change(source2,b,helper,true);
  check((await read(source2,b)).status===403&&(await read(target2,b)).status===200,'Source removal revoked independent target grant');
  console.log('PASS arrangement-serialized source-removal vs target-audience grant; independent committed target survives');
  const correction=await arrangement();await start(correction);
  await invite(correction,a);
  const delegated={...helper,manage:true,disclose:true};
  await change(correction,a,delegated);
  const practical=(await ctx(correction)).body;
  await rpc('write_scope_information',{p_scope:correction,p_practical:practical.summary,p_background:'Restricted correction fixture',p_revision:practical.revision,p_operation:randomUUID()},owner);
  async function delegatedIssue(scope,who=a) {
    const input={p_scope:scope,p_recipient:b.user.email,p_operation:randomUUID(),p_token:(randomUUID()+randomUUID()).replaceAll('-','')};
    return {input,result:await rpc('issue_invitation',input,who)};
  }
  const delegateContext=(await ctx(correction,a)).body;
  check(delegateContext.can_invite===true&&!('background' in delegateContext)&&!('invitations' in delegateContext),'Delegated invitation projection leaked information');
  check((await http(`${api}/rest/v1/private_arrangements?id=eq.${correction}&select=*`,{headers:headers(a)})).body.length===0,'Delegate accessed owner-private arrangement');
  check((await rpc('list_invitation_scope',{p_scope:correction},a)).body===null,'Legacy owner-only invitation metadata broadened');
  const issued=await delegatedIssue(correction);check(issued.result.status===200,'Delegated need issuance');
  check((await rpc('issue_invitation',issued.input,a)).body===issued.result.body,'Delegated issuance retry');
  const readerLink=issued.input.p_token;
  const delegatedJoin=await rpc('join_invitation',{p_token:issued.input.p_token},b);
  check(delegatedJoin.status===200&&delegatedJoin.body.inviter===a.user.email&&Object.keys(delegatedJoin.body.summary).length===6&&!JSON.stringify(delegatedJoin.body).includes('Restricted correction fixture'),'Delegated join disclosed private/restricted payload');
  check((await delegatedIssue(second)).result.status===403,'Delegated issuance outside scope');
  const parent=(await ctx(correction)).body;
  const additional=(await rpc('add_coordination_scope',{p_parent:correction,p_description:'Additional delegated need',p_revision:parent.revision,p_operation:randomUUID()},owner)).body;
  await rpc('add_practical_audience',{p_scope:additional,p_user:a.user.id,p_revision:0,p_operation:randomUUID()},owner);
  await change(additional,a,delegated);
  const additionalIssue=await delegatedIssue(additional);check(additionalIssue.result.status===200,'Additional need invitation issuance');
  const additionalJoin=await rpc('join_invitation',{p_token:additionalIssue.input.p_token},b);
  check(additionalJoin.status===200&&additionalJoin.body.inviter===a.user.email&&additionalJoin.body.id===additional,'Additional need join destination');
  const invalidated=await delegatedIssue(additional);
  await change(additional,a,{...delegated,disclose:false});
  check((await ctx(additional,a)).body.can_invite===false&&(await delegatedIssue(additional)).result.status===403,'Lost authority still issues');
  check((await rpc('join_invitation',{p_token:invalidated.input.p_token},b)).status===403,'Lost authority pending link redeemed');
  await change(additional,a,delegated);
  check((await rpc('join_invitation',{p_token:invalidated.input.p_token},b)).status===403,'Restoration revived delegated link');
  console.log('PASS delegated invitations for original/additional need; scope/authority denial; private/restricted isolation');

  const audienceCoordinator={...helper,preset:'coordinator',resolve:true};
  await change(correction,a,audienceCoordinator);
  let audienceContext=(await ctx(correction,a)).body;
  check(!audienceContext.rights.manage&&!audienceContext.rights.disclose&&!audienceContext.can_invite,'Coordinator silently got management/disclosure');
  check(!('participants' in audienceContext)&&!('suggestions' in audienceContext)&&!('permission_source' in audienceContext)&&!('background' in audienceContext),'Audience projection widened management metadata');
  check(audienceContext.practical_audience.some(p=>p.user_id===b.user.id&&p.included)&&audienceContext.practical_audience.every(p=>Object.keys(p).sort().join(',')==='included,label,user_id'),'Narrow practical audience projection');
  const beforeReader=sql(`select private.involvement('${correction}','${b.user.id}')::text`);
  const narrowAudience={p_scope:correction,p_user:b.user.id,p_include:false,p_revision:audienceContext.revision,p_operation:randomUUID()};
  check((await rpc('set_practical_audience',narrowAudience,a)).status===200,'Coordinator without management could not narrow');
  check((await rpc('set_practical_audience',narrowAudience,a)).status===200,'Narrow audience retry');
  check((await rpc('set_practical_audience',{...narrowAudience,p_include:true},a)).status===409,'Conflicting audience operation reuse');
  check((await rpc('set_practical_audience',{...narrowAudience,p_user:owner.user.id,p_operation:randomUUID()},a)).status===409,'Stale audience update overwrote current state');
  const afterReader=JSON.parse(sql(`select private.involvement('${correction}','${b.user.id}')::text`));
  check(JSON.stringify({...JSON.parse(beforeReader),practical:false})===JSON.stringify(afterReader),'Audience operation changed other powers');
  check((await read(correction,b)).status===403&&(await rpc('join_invitation',{p_token:readerLink},b)).status===403,'Narrowed reader still reads/replays');
  check((await read(correction,a)).status===200&&(await read(correction,owner)).status===200&&(await read(additional,b)).status===200,'Audience narrowing affected independent access');
  check((await change(correction,b,coordinator,false,a)).result.status===403,'Nonmanager changed preset');
  check((await change(correction,b,helper,true,a)).result.status===403,'Nonmanager removed participation');
  check((await change(correction,b,{...helper,manage:true,delegate:true},false,a)).result.status===403,'Nonmanager delegated management');
  check((await change(correction,b,{...helper,background:true,cancel:true},false,a)).result.status===403,'Nonmanager changed unrelated powers');
  check((await rpc('manage_invitation_scope',{p_scope:correction,p_action:'remove',p_target:b.user.id},a)).status===403,'Nonmanager used old removal');
  audienceContext=(await ctx(correction,a)).body;
  const broaden={...narrowAudience,p_include:true,p_revision:audienceContext.revision,p_operation:randomUUID()};
  check((await rpc('set_practical_audience',broaden,a)).status===403,'Broadening without disclosure');
  check((await rpc('set_practical_audience',{...broaden,p_rights:full},a)).status>=400,'Forged unrelated audience powers');
  check((await rpc('set_practical_audience',{...broaden,p_scope:second,p_operation:randomUUID()},a)).status===403,'Audience action outside scope');
  const simultaneousRevision=(await ctx(correction)).body.revision;
  const simultaneousAudience=await Promise.all([true,false].map(include=>rpc('set_practical_audience',{...broaden,p_include:include,p_revision:simultaneousRevision,p_operation:randomUUID()},owner)));
  check(simultaneousAudience.map(result=>result.status).sort().join(',')==='200,409','Simultaneous audience changes silently overwrote');
  const ownerAudience=(await ctx(correction)).body;
  check((await rpc('set_practical_audience',{...broaden,p_revision:ownerAudience.revision,p_operation:randomUUID()},owner)).status===200,'Authorized practical broadening');
  await change(correction,b,helper,true);
  const removedRevision=(await ctx(correction,a)).body.revision;
  check((await rpc('set_practical_audience',{...narrowAudience,p_include:true,p_revision:removedRevision,p_operation:randomUUID()},owner)).status===403,'Audience restored removed participation');
  console.log('PASS Coordinator-only audience changes; no management/other powers; disclosure/replay/removal isolation and retries');
  for(const session of sessions)await http(`${api}/auth/v1/logout?scope=local`,{method:'POST',headers:headers(session)});
  check((await ctx(first,owner)).status===401,'Revoked session read');
  console.log('PASS live session denial; no cancellation/resolution/acceptance execution endpoints added');
}
main().catch(error=>{console.error(error instanceof CheckFailure?error.message:'Backend check failed; sensitive details suppressed');process.exitCode=1;});
