// Actual local Auth/PostgREST/PostgreSQL boundary. Fictional identities only; never print credentials or response bodies.
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const api = 'http://127.0.0.1:54321';
const mail = 'http://127.0.0.1:54324';
const sessions = [];
let key, stage = 'preflight';
const op = () => randomUUID();
function check(ok, message) { if (!ok) throw new Error(message); }
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  check(result.status === 0, 'Local command failed (output suppressed)');
  return result.stdout.trim();
}
function sql(query) { return run('docker.exe', ['exec', 'supabase_db_elder-care-app-v2', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-Atc', query]); }
async function http(url, options = {}) {
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
  const raw = await response.text(); let body;
  try { body = JSON.parse(raw); } catch { body = null; }
  return { status: response.status, body };
}
function headers(session) { return { apikey: key, 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) }; }
async function rpc(name, body, session) { return http(`${api}/rest/v1/rpc/${name}`, { method: 'POST', headers: headers(session), body: JSON.stringify(body) }); }
async function login(email) {
  const before = await http(`${mail}/api/v1/messages`);
  const ids = new Set(before.body.messages.map(item => item.ID));
  check((await http(`${api}/auth/v1/otp`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, create_user: true }) })).status === 200, 'OTP request');
  let message;
  for (let i = 0; i < 20; i++) {
    const inbox = await http(`${mail}/api/v1/messages`);
    message = inbox.body.messages.find(item => !ids.has(item.ID) && item.To.some(to => to.Address === email));
    if (message) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  check(message, 'Fictional mail capture');
  const captured = await http(`${mail}/api/v1/message/${encodeURIComponent(message.ID)}`);
  const code = captured.body.HTML?.match(/<strong>\s*(\d{6})\s*<\/strong>/i)?.[1];
  check(code, 'Email code capture');
  const verified = await http(`${api}/auth/v1/verify`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, token: code, type: 'email' }) });
  check(verified.status === 200 && verified.body.access_token, 'Email code verification');
  sessions.push(verified.body);
  return verified.body;
}
const helperRights = { preset: 'helper', practical: true, manage: false, delegate: false, background: false, share_background: false, disclose: false, cancel: false, resolve: false, external: false };
const coordinatorRights = { ...helperRights, preset: 'coordinator', manage: true, disclose: true, resolve: true, background: true, share_background: true };
const fields = task => ({ p_task: task, p_place: 'Fictional north pharmacy', p_instructions: 'Ask for the fictional sealed pickup envelope', p_date: '', p_time: '', p_zone: '' });

async function main() {
  const status = JSON.parse(run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', '.\\node_modules\\.bin\\supabase.cmd status -o json']));
  check(status.API_URL === api, 'Unexpected backend'); key = status.PUBLISHABLE_KEY;
  const stamp = Date.now();
  const owner = await login(`t06-${stamp}-owner@example.test`);
  const performer = await login(`t06-${stamp}-performer@example.test`);
  const other = await login(`t06-${stamp}-other@example.test`);
  const outsider = await login(`t06-${stamp}-outsider@example.test`);
  stage = 'coordination and acceptance fixture';
  const root = (await rpc('associate_private_draft', { p_operation_id: op(), p_draft: { olderAdult: 'Fictional T06 Morgan', description: 'Fictional prescription envelope pickup', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }, owner)).body.id;
  check((await rpc('start_coordination', { p_arrangement: root, p_kind: 'reported', p_source: 'Fictional permission for assistance coordination', p_rights: coordinatorRights, p_operation: op() }, owner)).status === 200, 'Initial scope authorization');
  for (const recipient of [performer, other]) {
    const token = (op() + op()).replaceAll('-', '');
    check((await rpc('issue_invitation', { p_scope: root, p_recipient: recipient.user.email, p_operation: op(), p_token: token }, owner)).status === 200, 'Scoped invitation');
    check((await rpc('join_invitation', { p_token: token }, recipient)).status === 200, 'Explicit scoped Join');
  }
  const rootContext = await rpc('read_scope_context', { p_scope: root }, owner);
  check((await rpc('create_assistance_request', { p_scope: root, ...fields('Fictional prescription envelope pickup'), p_revision: rootContext.body.revision, p_operation: op() }, owner)).status === 200, 'First request creation');
  let rootView = await rpc('read_assistance', { p_scope: root }, owner);
  check((await rpc('offer_assistance', { p_scope: root, p_user: performer.user.id, p_material_revision: rootView.body.material_revision, p_operation: op() }, owner)).status === 200, 'Offer to performer');
  rootView = await rpc('read_assistance', { p_scope: root }, performer);
  check((await rpc('accept_assistance', { p_scope: root, p_material_revision: rootView.body.material_revision, p_operation: op() }, performer)).body.outcome === 'accepted', 'Explicit performer acceptance');
  const accepted = await rpc('read_assistance', { p_scope: root }, performer);
  check(accepted.status === 200 && accepted.body.commitment_id && accepted.body.accepted_by_me && !accepted.body.completion_reported_at, 'Accepted-work projection');
  const input = { p_scope: root, p_commitment: accepted.body.commitment_id, p_material_revision: accepted.body.material_revision, p_operation: op() };

  stage = 'direct denied and materially stale reporting';
  const unrelated = (await rpc('associate_private_draft', { p_operation_id: op(), p_draft: { olderAdult: 'Fictional other person', description: 'Fictional separate arrangement', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }, outsider)).body.id;
  check((await rpc('start_coordination', { p_arrangement: unrelated, p_kind: 'reported', p_source: 'Fictional separate coordination', p_rights: coordinatorRights, p_operation: op() }, outsider)).status === 200, 'Independent arrangement authorization');
  check((await rpc('report_assistance_completion', input, other)).status === 403, 'Other Helper reported another performer complete');
  check((await rpc('report_assistance_completion', input, owner)).status === 403, 'Coordinator reported own completion without acceptance');
  check((await rpc('report_assistance_completion', input, outsider)).status === 403, 'Outsider reported or disclosed completion');
  check((await rpc('read_assistance', { p_scope: root }, outsider)).status === 403 && (await rpc('report_assistance_completion', { ...input, p_scope: unrelated, p_operation: op() }, performer)).status === 403, 'Cross-arrangement completion boundary');
  check((await rpc('report_assistance_completion', input)).status !== 200, 'Anonymous completion endpoint');
  check((await http(`${api}/rest/v1/assistance_completion_reports?select=*`, { headers: headers(performer) })).status !== 200, 'Private completion table exposed');
  check((await rpc('report_assistance_completion', { ...input, p_commitment: op(), p_operation: op() }, performer)).status === 409, 'Different commitment identity accepted');
  check((await rpc('report_assistance_completion', { ...input, p_material_revision: accepted.body.material_revision - 1, p_operation: op() }, performer)).status === 409, 'Stale material revision accepted');
  check(sql(`select count(*) from private.assistance_completion_reports where scope_id='${root}'`) === '0', 'Denied/stale action wrote report');

  stage = 'nonmaterial edit and simultaneous completion';
  const context = await rpc('read_scope_context', { p_scope: root }, owner);
  check((await rpc('write_scope_information', { p_scope: root, p_practical: { ...context.body.summary, olderAdult: 'Fictional Morgan display update' }, p_background: 'Fictional restricted background', p_revision: context.body.revision, p_operation: op() }, owner)).status === 200, 'Nonmaterial display/background edit');
  check((await rpc('read_assistance', { p_scope: root }, performer)).body.material_revision === accepted.body.material_revision, 'Nonmaterial edit changed responsibility revision');
  const competing = { ...input, p_operation: op() };
  const both = await Promise.all([rpc('report_assistance_completion', input, performer), rpc('report_assistance_completion', competing, performer)]);
  check(both.every(x => x.status === 200 && x.body.outcome === 'reported') && both[0].body.reported_at === both[1].body.reported_at, 'Simultaneous reports did not converge on original time');
  const reportedAt = both[0].body.reported_at;
  check((await rpc('report_assistance_completion', input, performer)).body.reported_at === reportedAt, 'Same-operation lost-response retry changed report');
  check((await rpc('report_assistance_completion', { ...input, p_operation: op() }, performer)).body.reported_at === reportedAt, 'New-operation duplicate changed report');
  check(sql(`select count(*) from private.assistance_completion_reports where scope_id='${root}'`) === '1', 'Duplicate completion rows');
  check(sql(`select performer=reporter and performer='${performer.user.id}' and reported_at='${reportedAt}'::timestamptz from private.assistance_completion_reports where scope_id='${root}'`) === 't', 'Performer/reporter/time attribution changed');
  const performerRead = await rpc('read_assistance', { p_scope: root }, performer);
  const ownerRead = await rpc('read_assistance', { p_scope: root }, owner);
  check(performerRead.body.completion_reported_by_me && performerRead.body.completion_reported_at === reportedAt && performerRead.body.arranged, 'Own acknowledged completion projection');
  check(ownerRead.body.completion_reported_at === reportedAt && ownerRead.body.accepted_by === performer.user.email && !JSON.stringify(performerRead.body).includes('Fictional restricted background'), 'Coordinator attribution or restricted projection');
  check(!('resolved' in ownerRead.body) && sql(`select count(*) from private.assistance_commitments where scope_id='${root}'`) === '1', 'Completion silently resolved need or removed commitment');

  stage = 'revocation and independent accepted work';
  const rootNow = await rpc('read_assistance', { p_scope: root }, owner);
  const child = (await rpc('create_assistance_need', { p_root: root, ...fields('Fictional separate errand'), p_revision: rootNow.body.scope_revision, p_operation: op() }, owner)).body.id;
  let childView = await rpc('read_assistance', { p_scope: child }, owner);
  check((await rpc('offer_assistance', { p_scope: child, p_user: performer.user.id, p_material_revision: childView.body.material_revision, p_operation: op() }, owner)).status === 200, 'Separate offer');
  childView = await rpc('read_assistance', { p_scope: child }, performer);
  check((await rpc('accept_assistance', { p_scope: child, p_material_revision: childView.body.material_revision, p_operation: op() }, performer)).body.outcome === 'accepted', 'Separate accepted work');
  const childInput = { p_scope: child, p_commitment: (await rpc('read_assistance', { p_scope: child }, performer)).body.commitment_id, p_material_revision: childView.body.material_revision, p_operation: op() };
  const beforeNarrow = await rpc('read_scope_context', { p_scope: child }, owner);
  check((await rpc('set_practical_audience', { p_scope: child, p_user: performer.user.id, p_include: false, p_revision: beforeNarrow.body.revision, p_operation: op() }, owner)).status === 200, 'Current practical restriction');
  check((await rpc('report_assistance_completion', childInput, performer)).status === 403, 'Revoked accepted performer reported with old token');
  check((await rpc('read_assistance', { p_scope: child }, performer)).status === 403, 'Restricted detail disclosed');
  check((await rpc('report_assistance_completion', input, performer)).body.reported_at === reportedAt, 'Unrelated authorized completed work lost');
  const beforeRootNarrow = await rpc('read_scope_context', { p_scope: root }, owner);
  check((await rpc('set_practical_audience', { p_scope: root, p_user: performer.user.id, p_include: false, p_revision: beforeRootNarrow.body.revision, p_operation: op() }, owner)).status === 200, 'Completed-work access restriction');
  check((await rpc('report_assistance_completion', input, performer)).status === 403, 'Successful operation receipt bypassed current restriction');
  check(sql(`select count(*) from private.assistance_completion_reports where scope_id='${root}'`) === '1', 'Restriction altered history');
  console.log('PASS actual backend: own completion, direct denials, material stale checks, nonmaterial edit, races/retries, attribution, revocation and unresolved need');
}
try { await main(); }
catch (error) { console.error(`FAIL ticket 06 backend at ${stage}: ${error.message}`); process.exitCode = 1; }
finally {
  for (const session of sessions) {
    try { await http(`${api}/auth/v1/logout`, { method: 'POST', headers: headers(session) }); } catch { /* Preserve primary result. */ }
  }
}
