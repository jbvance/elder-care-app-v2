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
  const status = JSON.parse(run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', '.\\node_modules\\.bin\\supabase.cmd status -o json']));
  check(status.API_URL === api, 'Unexpected backend'); publicKey = status.PUBLISHABLE_KEY;
  const stamp = Date.now();
  const owner = await login(`t03-${stamp}-owner@example.test`);
  const recipient = await login(`t03-${stamp}-recipient@example.test`);
  const other = await login(`t03-${stamp}-other@example.test`);
  const draft = { olderAdult: 'Fictional Morgan', description: 'Synthetic groceries', location: 'Fictional shop', date: '', time: '', timeZone: 'America/Chicago', prepared: true };
  async function scope(kind = 'reported') {
    const a = await rpc('associate_private_draft', { p_operation_id: randomUUID(), p_draft: draft }, owner);
    check(a.status === 200, 'Private fixture');
    const id = a.body.id;
    check((await rpc('issue_invitation', { p_scope: id, p_recipient: recipient.user.email, p_operation: randomUUID(), p_token: randomUUID().replaceAll('-', '').repeat(2) }, owner)).status === 403, 'Ownership granted sharing');
    check((await rpc('prepare_invitation_scope', { p_scope: id, p_kind: kind, p_source: 'Fictional Morgan', p_delegation: false }, owner)).status === 403, 'Missing delegation accepted');
    check((await rpc('prepare_invitation_scope', { p_scope: id, p_kind: kind, p_source: 'Fictional Morgan', p_delegation: true }, other)).status === 403, 'Other owner setup');
    check((await rpc('prepare_invitation_scope', { p_scope: id, p_kind: kind, p_source: 'Fictional Morgan', p_delegation: true }, owner)).status === 200, 'Permission setup');
    return id;
  }
  async function issue(id, email = recipient.user.email) {
    const input = { p_scope: id, p_recipient: email, p_operation: randomUUID(), p_token: (randomUUID()+randomUUID()).replaceAll('-', '') };
    const result = await rpc('issue_invitation', input, owner);
    check(result.status === 200, 'Issuance');
    check(sql(`select expires_at-issued_at=interval '7 days' from private.invitations where id='${result.body}'`)==='t','Exact seven-day lifetime');
    check((await rpc('issue_invitation', input, owner)).body === result.body, 'Issuance retry rotated');
    return { token: input.p_token, id: result.body, input };
  }
  const join = (i, session = recipient) => rpc('join_invitation', { p_token: i.token }, session);
  const read = (id, session = recipient) => rpc('read_prompting_summary', { p_scope: id }, session);
  const manage = (id, action, target = null, session = owner) => rpc('manage_invitation_scope', { p_scope: id, p_action: action, p_target: target }, session);
  const stableScope = await scope();
  const stableInvite = await issue(stableScope);
  check((await join(stableInvite)).status === 200, 'Stable identity initial join');
  sql(`update auth.users set email='t03-${stamp}-confirmed-change@example.test',email_confirmed_at=now() where id='${recipient.user.id}';`);
  check((await read(stableScope)).status === 200, 'Email change lost stable-user read');
  check((await join(stableInvite)).status === 200, 'Email change lost consumed-link retry');
  sql(`update auth.users set email='${recipient.user.email}',email_confirmed_at=now() where id='${other.user.id}';`);
  check((await join(stableInvite, other)).status === 403 && (await read(stableScope, other)).status === 403, 'Original address transferred participation');
  const labelsAfterChange = await rpc('list_invitation_scope', { p_scope: stableScope }, owner);
  check(labelsAfterChange.body.participants[0].label === recipient.user.email, 'Label exposed unrelated current identity');
  check((await manage(stableScope, 'remove', recipient.user.id)).status === 200, 'Stable-user removal');
  check((await read(stableScope)).status === 403 && (await join(stableInvite)).status === 403, 'Email-changed removed participant retained access');
  sql(`update auth.users set email='${other.user.email}' where id='${other.user.id}'; update auth.users set email='${recipient.user.email}' where id='${recipient.user.id}';`);
  console.log('PASS joined stable ID survives confirmed email change; original address cannot transfer participation; removal denies replay');

  const pairScope = await scope();
  const firstParticipant = await issue(pairScope);
  const secondParticipant = await issue(pairScope, other.user.email);
  check((await join(firstParticipant)).status === 200 && (await join(secondParticipant, other)).status === 200, 'Two-participant join');
  const pair = await rpc('list_invitation_scope', { p_scope: pairScope }, owner);
  check(pair.status === 200 && pair.body.participants.length === 2, 'Two-participant listing');
  check(pair.body.participants.some(p => p.user_id === recipient.user.id && p.label === recipient.user.email) && pair.body.participants.some(p => p.user_id === other.user.id && p.label === other.user.email), 'Recognizable labels not tied to stable targets');
  check((await rpc('list_invitation_scope', { p_scope: pairScope }, other)).body === null, 'Participant identity list disclosed to helper');
  await manage(pairScope, 'remove', recipient.user.id);
  check((await read(pairScope)).status === 403 && (await join(firstParticipant)).status === 403, 'Selected participant still authorized');
  check((await read(pairScope, other)).status === 200 && (await join(secondParticipant, other)).status === 200, 'Removal affected other participant');
  console.log('PASS recognizable contextual labels for two joined participants; selected removal alone loses access');
  const id = await scope();
  const inv = await issue(id, `  ${recipient.user.email.toUpperCase()}  `);
  check((await join(inv, null)).status >= 400, 'Anonymous join');
  check((await read(id, null)).status >= 400 && (await read(id)).status === 403, 'Prejoin disclosure');
  check((await join(inv, other)).status === 403, 'Mismatch accepted');
  check((await rpc('join_invitation', { p_token: inv.token, p_email: recipient.user.email }, other)).status >= 400, 'Forged identity input');
  // Current Auth identity must defeat stale JWT claims and editable metadata.
  sql(`update auth.users set email='t03-${stamp}-changed@example.test' where id='${recipient.user.id}';`);
  check((await join(inv)).status === 403, 'Stale JWT email used');
  sql(`update auth.users set email='${recipient.user.email}',email_confirmed_at=null where id='${recipient.user.id}';`);
  check((await join(inv)).status === 403, 'Unconfirmed email used');
  sql(`update auth.users set email_confirmed_at=now() where id='${recipient.user.id}';`);
  const joins = await Promise.all(Array.from({ length: 5 }, () => join(inv)));
  check(joins.every(r => r.status === 200), 'Concurrent join failed');
  check(sql(`select count(*) from private.prompting_participants where scope_id='${id}'`) === '1', 'Duplicate grant');
  check(!JSON.stringify(joins[0].body).includes('draft') && Object.keys(joins[0].body.summary).length === 6, 'Private payload leak');
  check((await http(`${api}/rest/v1/private_arrangements?id=eq.${id}&select=*`, { headers: headers(recipient) })).body.length === 0, 'Owner payload exposed');
  check((await rpc('issue_invitation', { ...inv.input, p_operation: randomUUID() }, recipient)).status === 403, 'Onward delegation');
  check((await manage(id, 'remove', owner.user.id, recipient)).status === 403, 'Unauthorized removal');
  for (const address of [recipient.user.email.replace('@','+tag@'),recipient.user.email.replace('recipient','rec.ipient')]) { const alias=await issue(id,address); check((await join(alias)).status===403,'Provider alias equivalence accepted'); }
  const unrelated = await scope('direct');
  check((await read(unrelated)).status === 403, 'Cross-scope leak');
  const another = await issue(unrelated); check((await join(another)).status === 200, 'Independent scope');
  check((await manage(id, 'remove', recipient.user.id)).status === 200, 'Removal');
  check((await read(id)).status === 403 && (await join(inv)).status === 403, 'Removed token retained access');
  check((await read(unrelated)).status === 200, 'Removal affected unrelated scope');
  const fresh = await issue(id); check((await join(fresh)).status === 403, 'Fresh invite bypassed restriction');
  console.log('PASS identity, disclosure, atomic retries, scope isolation, delegation and immediate removal');
  const life = await scope();
  const replaced = await issue(life); const replacement = await issue(life);
  check((await join(replaced)).status === 403, 'Replacement kept old link');
  check((await manage(life, 'revoke', replacement.id)).status === 200 && (await join(replacement)).status === 403, 'Revoked link');
  const expired = await issue(life);
  sql(`update private.invitations set expires_at=clock_timestamp()-interval '1 second' where id='${expired.id}';`);
  check((await join(expired)).status === 403, 'Expired accepted');
  check((await join({token: '0'.repeat(64)})).status === 403, 'Invalid accepted');
  const lost = await issue(life);
  check((await manage(life,'end-authority')).status === 200 && (await join(lost)).status === 403, 'Authority loss accepted');
  sql(`update private.prompting_scopes set authority_active=true where id='${life}';`);
  check((await join(lost)).status === 403, 'Authority restoration revived link');
  check((await manage(unrelated, 'withdraw')).status === 200 && (await read(unrelated)).status === 403, 'Scope withdrawal stale access');
  // Authority loss alone preserves independently granted participation.
  const stay = await scope(); const si = await issue(stay); await join(si);
  await manage(stay, 'end-authority'); check((await read(stay)).status === 200, 'Inviter departure removed independent grant');
  sql(`update private.invitations set expires_at=now()-interval '1 day' where id='${si.id}'`);
  check((await join(si)).status === 200, 'Consumed expiry removed participation');
  console.log('PASS expired, revoked, replaced, invalid, authority loss/restoration and consumed expiry');
  // Deterministic lock-winner races: begin a mutation while redemption waits.
  async function race(action) {
    const rid=await scope(); const ri=await issue(rid);
    const { spawn } = await import('node:child_process');
    const label='t03race_'+randomUUID().replaceAll('-','');
    const statement = action === 'replace' ? `update private.invitations set state='replaced' where id='${ri.id}'` : action === 'remove' ? `insert into private.prompting_participants(scope_id,user_id,invitation_id,removed_at) values('${rid}','${recipient.user.id}','${ri.id}',now())` : `update private.prompting_scopes set authority_active=false where id='${rid}'; update private.invitations set state='revoked' where id='${ri.id}'`;
    const child=spawn('docker.exe',['exec',`supabase_db_${project}`,'psql','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-Atc',`set application_name='${label}'; begin; select id from private.prompting_scopes where id='${rid}' for update; ${statement}; select 'LOCK_READY'; select pg_sleep(2); commit;`],{windowsHide:true,stdio:['ignore','pipe','ignore']});
    let ready=false;
    for(let attempt=0;attempt<40;attempt++) { if(sql(`select count(*) from pg_stat_activity where application_name='${label}' and wait_event='PgSleep'`)==='1'){ready=true;break;} await new Promise(r=>setTimeout(r,50)); }
    check(ready,'Race lock readiness');
    check((await join(ri)).status===403, 'Losing redemption granted access');
    await new Promise((resolve,reject)=>{ if(child.exitCode!==null) return child.exitCode===0?resolve():reject(new CheckFailure('Race fixture'));child.on('exit',c=>c===0?resolve():reject(new CheckFailure('Race fixture'))); });
  }
  await race('replace'); await race('remove'); await race('authority');
  console.log('PASS serialized replacement/removal/authority race winners deny redemption');
  const sessionScope=await scope(); const sessionInvite=await issue(sessionScope,other.user.email);
  const { spawn }=await import('node:child_process');
  const label='t03session_'+randomUUID().replaceAll('-','');
  const blocker=spawn('docker.exe',['exec',`supabase_db_${project}`,'psql','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-Atc',`set application_name='${label}'; begin; select id from private.prompting_scopes where id='${sessionScope}' for update; select pg_sleep(4); commit;`],{windowsHide:true,stdio:'ignore'});
  let ready=false;
  for(let attempt=0;attempt<40;attempt++){if(sql(`select count(*) from pg_stat_activity where application_name='${label}' and wait_event='PgSleep'`)==='1'){ready=true;break;}await new Promise(r=>setTimeout(r,50));}
  check(ready,'Session race readiness');
  const waiting=join(sessionInvite,other);
  let blocked=false;
  for(let attempt=0;attempt<40;attempt++){if(Number(sql("select count(*) from pg_stat_activity where wait_event_type='Lock' and query like '%join_invitation%'"))>0){blocked=true;break;}await new Promise(r=>setTimeout(r,50));}
  check(blocked,'Join did not wait for scope');
  await http(`${api}/auth/v1/logout?scope=local`,{method:'POST',headers:headers(other)});
  check((await waiting).status===401,'Session revoked while locked still joined');
  check(sql(`select count(*) from private.prompting_participants where scope_id='${sessionScope}'`)==='0','Revoked session created grant');
  check(blocker.exitCode===null || blocker.exitCode===0,'Session blocker failed');
  console.log('PASS live-session revocation while Join waits on locked scope');
  for (const session of sessions) await http(`${api}/auth/v1/logout?scope=local`, {method:'POST',headers:headers(session)});
  check((await read(stay)).status === 401, 'Revoked session access');
  console.log('PASS revoked sessions; no responsibility table or grant introduced');
}
main().catch(error => { console.error(error instanceof CheckFailure ? error.message : 'Backend check failed; sensitive details suppressed'); process.exitCode=1; });
