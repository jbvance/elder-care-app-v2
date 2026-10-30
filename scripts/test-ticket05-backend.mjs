// Fictional identities and information only. Never print OTPs, sessions or response bodies.
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const api = 'http://127.0.0.1:54321';
const mail = 'http://127.0.0.1:54324';
let stage = 'preflight';
let key;
const sessions = [];
function check(value, message) { if (!value) throw new Error(message); }
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
const helper = { preset: 'helper', practical: true, manage: false, delegate: false, background: false, share_background: false, disclose: false, cancel: false, resolve: false, external: false };
const full = { ...helper, preset: 'coordinator', manage: true, disclose: true, resolve: true, background: true, share_background: true };
const op = () => randomUUID();
const fields = (task, date = '', time = '', zone = '') => ({ p_task: task, p_place: 'Fictional north pharmacy', p_instructions: 'Ask for the fictional pickup envelope', p_date: date, p_time: time, p_zone: zone });

async function main() {
  const status = JSON.parse(run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', '.\\node_modules\\.bin\\supabase.cmd status -o json']));
  check(status.API_URL === api, 'Unexpected backend'); key = status.PUBLISHABLE_KEY;
  const stamp = Date.now();
  const owner = await login(`t05-${stamp}-owner@example.test`);
  const a = await login(`t05-${stamp}-a@example.test`);
  const b = await login(`t05-${stamp}-b@example.test`);
  const outsider = await login(`t05-${stamp}-outside@example.test`);
  const delegate = await login(`t05-${stamp}-delegate@example.test`);
  const sameHelper = await login(`t05-${stamp}-same@example.test`);
  const root = (await rpc('associate_private_draft', { p_operation_id: op(), p_draft: { olderAdult: 'Fictional T05 Morgan', description: 'Fictional prescription pickup', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }, owner)).body.id;
  check((await rpc('start_coordination', { p_arrangement: root, p_kind: 'reported', p_source: 'Fictional permission for ongoing coordination', p_rights: full, p_operation: op() }, owner)).status === 200, 'Initial authorization');
  async function invite(who, scope = root) {
    const token = (op() + op()).replaceAll('-', '');
    check((await rpc('issue_invitation', { p_scope: scope, p_recipient: who.user.email, p_operation: op(), p_token: token }, owner)).status === 200, 'Recipient-bound invitation');
    check((await rpc('join_invitation', { p_token: token }, who)).status === 200, 'Explicit join');
  }
  await invite(a); await invite(b);
  const rootContext = await rpc('read_scope_context', { p_scope: root }, owner);
  stage = 'request creation and scheduling';
  const base = { p_scope: root, ...fields('Fictional prescription pickup', '03/08/2026', '2:30 AM', 'America/Chicago'), p_revision: rootContext.body.revision, p_operation: op() };
  check((await rpc('create_assistance_request', base, owner)).status === 400, 'Nonexistent wall time was accepted');
  check((await rpc('create_assistance_request', { ...base, p_time: '1:30 AM', p_date: '11/01/2026', p_operation: op() }, owner)).status === 400, 'Ambiguous wall time was accepted');
  const create = { ...base, p_date: '11/01/2026', p_time: '10:00 AM', p_operation: op() };
  check((await rpc('create_assistance_request', create, owner)).status === 200, 'Timed request creation');
  check((await rpc('create_assistance_request', create, owner)).status === 200, 'Creation lost-response retry');
  const rootRead = await rpc('read_assistance', { p_scope: root }, owner);
  check(rootRead.body.scheduled_at === '2026-11-01T16:00:00+00:00' && rootRead.body.schedule_zone === 'America/Chicago', 'Authoritative schedule not stored');
  const protectedContext = await rpc('read_scope_context', { p_scope: root }, owner);
  check((await rpc('write_scope_information', { p_scope: root, p_practical: protectedContext.body.summary, p_background: 'Restricted fictional background marker', p_revision: protectedContext.body.revision, p_operation: op() }, owner)).status === 200, 'Restricted context fixture');
  check((await rpc('list_assistance', {}, a)).body.length === 0, 'Joining implied opportunity eligibility');
  check((await rpc('read_assistance', { p_scope: root }, a)).status === 403, 'Practical access implied request access');
  check((await rpc('read_assistance', { p_scope: root }, outsider)).status === 403, 'Unrelated request read');
  check((await rpc('accept_assistance', { p_scope: root, p_material_revision: 0, p_operation: op() }, a)).status === 403, 'Unrequested acceptance');
  check((await rpc('offer_assistance', { p_scope: root, p_user: outsider.user.id, p_material_revision: 0, p_operation: op() }, owner)).status === 403, 'Outsider audience grant');
  check((await rpc('offer_assistance', { p_scope: root, p_user: b.user.id, p_material_revision: 0, p_operation: op() }, a)).status === 403, 'Helper offered work without coordination authority');
  check((await rpc('set_ongoing_helper_audience', { p_root: root, p_user: b.user.id, p_include: true, p_revision: 0, p_operation: op() }, a)).status === 403, 'Helper granted ongoing access');
  check((await http(`${api}/rest/v1/assistance_requests?select=*`, { headers: headers(a) })).status !== 200, 'Private request table exposed directly');
  const offerA = { p_scope: root, p_user: a.user.id, p_material_revision: 0, p_operation: op() };
  check((await rpc('offer_assistance', offerA, owner)).status === 200, 'Authorized audience choice');
  check((await rpc('offer_assistance', offerA, owner)).status === 200, 'Audience lost-response retry');
  check((await rpc('offer_assistance', { ...offerA, p_user: b.user.id }, owner)).status === 409, 'Conflicting operation reuse');
  const offerB = { p_scope: root, p_user: b.user.id, p_material_revision: 1, p_operation: op() };
  check((await rpc('offer_assistance', offerB, owner)).status === 200, 'Second authorized candidate');
  const current = await rpc('read_assistance', { p_scope: root }, a);
  check(current.body.eligible && !current.body.arranged && !JSON.stringify(current.body).includes('Restricted fictional background marker'), 'Opportunity projection or state');
  check(!JSON.stringify((await rpc('read_scope_context', { p_scope: root }, a)).body).includes('Restricted fictional background marker'), 'Restricted context projection leak');
  check((await rpc('list_assistance', {}, a)).body.some(item => item.id === root), 'Opportunity missing from ordinary list');
  check((await rpc('accept_assistance', { p_scope: root, p_material_revision: 0, p_operation: op() }, a)).status === 409, 'Stale acceptance was admitted');
  const preacceptContext = await rpc('read_scope_context', { p_scope: root }, owner);
  check((await rpc('write_scope_information', { p_scope: root, p_practical: { ...preacceptContext.body.summary, olderAdult: 'Fictional Morgan display name' }, p_background: null, p_revision: preacceptContext.body.revision, p_operation: op() }, owner)).status === 200, 'Nonmaterial context edit');
  check((await rpc('read_assistance', { p_scope: root }, a)).body.material_revision === 2, 'Nonmaterial edit caused stale acceptance conflict');
  stage = 'concurrent acceptance and material freeze';
  const acceptA = { p_scope: root, p_material_revision: 2, p_operation: op() };
  const acceptB = { p_scope: root, p_material_revision: 2, p_operation: op() };
  const both = await Promise.all([rpc('accept_assistance', acceptA, a), rpc('accept_assistance', acceptB, b)]);
  check(both.every(result => result.status === 200) && both.filter(result => result.body.outcome === 'accepted').length === 1 && both.filter(result => result.body.outcome === 'already-arranged').length === 1, 'First-valid committed acceptance race');
  const winner = both[0].body.outcome === 'accepted' ? a : b;
  const loser = winner === a ? b : a;
  const winningInput = winner === a ? acceptA : acceptB;
  check((await rpc('accept_assistance', winningInput, winner)).body.outcome === 'accepted', 'Lost-response acceptance retry');
  check(sql(`select count(*) from private.assistance_commitments where scope_id='${root}'`) === '1', 'Duplicate commitment');
  const ctx = await rpc('read_scope_context', { p_scope: root }, owner);
  const changed = { ...ctx.body.summary, description: 'Different accepted task' };
  check((await rpc('write_scope_information', { p_scope: root, p_practical: changed, p_background: null, p_revision: ctx.body.revision, p_operation: op() }, owner)).status === 409, 'Direct material information edit bypassed freeze');
  check((await rpc('write_scope_information', { p_scope: root, p_practical: { ...ctx.body.summary, time: '11:00 AM' }, p_background: null, p_revision: ctx.body.revision, p_operation: op() }, owner)).status === 409, 'Direct scheduled-time edit bypassed freeze');
  check((await rpc('write_scope_information', { p_scope: root, p_practical: { ...ctx.body.summary, olderAdult: 'Fictional Morgan updated' }, p_background: null, p_revision: ctx.body.revision, p_operation: op() }, owner)).status === 200, 'Unrelated nonmaterial name edit was frozen');
  const acceptedRead = await rpc('read_assistance', { p_scope: root }, owner);
  check(acceptedRead.body.accepted_by === winner.user.email && acceptedRead.body.accepted_at, 'Coordinator cannot identify accepted performer and time');
  check((await rpc('update_assistance_request', { p_scope: root, ...fields('Changed task'), p_material_revision: acceptedRead.body.material_revision, p_operation: op() }, owner)).status === 409, 'Accepted schedule/task update bypassed freeze');
  check((await rpc('answer_assistance', { p_scope: root, p_answer: 'declined', p_material_revision: 2, p_operation: op() }, winner)).status === 409, 'Decline canceled accepted work');
  check((await rpc('answer_assistance', { p_scope: root, p_answer: 'deferred', p_material_revision: 2, p_operation: op() }, loser)).status === 409, 'Defer changed already-arranged work');
  const scopeAfter = await rpc('read_scope_context', { p_scope: root }, owner);
  check((await rpc('set_practical_audience', { p_scope: root, p_user: winner.user.id, p_include: false, p_revision: scopeAfter.body.revision, p_operation: op() }, owner)).status === 200, 'Authorized restriction after acceptance');
  check((await rpc('read_assistance', { p_scope: root }, winner)).status === 403 && (await rpc('accept_assistance', winningInput, winner)).status === 403, 'Old-token retry bypassed restriction');
  check(sql(`select count(*) from private.assistance_commitments where scope_id='${root}'`) === '1', 'Restriction canceled commitment');
  stage = 'ongoing audience and stale edit';
  async function another(task) {
    const rootState = await rpc('read_assistance', { p_scope: root }, owner);
    const result = await rpc('create_assistance_need', { p_root: root, ...fields(task), p_revision: rootState.body.scope_revision, p_operation: op() }, owner);
    check(result.status === 200, 'Additional need creation'); return result.body.id;
  }
  const second = await another('Fictional pickup, second errand');
  check((await rpc('read_assistance', { p_scope: second }, loser)).status === 403, 'Per-need membership inherited without ongoing grant');
  const secondRead = await rpc('read_assistance', { p_scope: second }, owner);
  check((await rpc('assistance_candidates', { p_scope: second }, owner)).body.some(person => person.user_id === loser.user.id), 'Root Coordinator cannot choose existing Helper');
  check((await rpc('offer_assistance', { p_scope: second, p_user: loser.user.id, p_material_revision: secondRead.body.material_revision, p_operation: op() }, owner)).status === 200, 'Simple audience choice on new need');
  const offeredSecond = await rpc('read_assistance', { p_scope: second }, loser);
  const defer = { p_scope: second, p_answer: 'deferred', p_material_revision: offeredSecond.body.material_revision, p_operation: op() };
  check((await rpc('answer_assistance', defer, loser)).body.outcome === 'deferred', 'Defer response');
  check((await rpc('answer_assistance', defer, loser)).body.outcome === 'deferred', 'Defer lost-response retry');
  check((await rpc('answer_assistance', { ...defer, p_answer: 'declined' }, loser)).status === 409, 'Response operation reuse');
  check((await rpc('answer_assistance', { ...defer, p_answer: 'declined', p_operation: op() }, loser)).body.outcome === 'declined', 'Decline response');
  check((await rpc('read_assistance', { p_scope: second }, owner)).body.arranged === false && sql(`select count(*) from private.assistance_commitments where scope_id='${second}'`) === '0', 'Decline/defer implied commitment');
  const third = await another('Fictional pickup, third errand');
  check((await rpc('read_assistance', { p_scope: third }, loser)).status === 403, 'Per-need grant became ongoing');
  const rootBeforeOngoing = await rpc('read_assistance', { p_scope: root }, owner);
  const prepared = await rpc('add_coordination_scope', { p_parent: root, p_description: 'Existing private fictional errand', p_revision: rootBeforeOngoing.body.scope_revision, p_operation: op() }, owner);
  check(prepared.status === 200, 'Existing scope preparation');
  check((await rpc('list_assistance', {}, owner)).body.some(item => item.id === prepared.body && item.coordinator && !item.created), 'Prepared additional need missing from Coordinator work list');
  check(!(await rpc('list_assistance', {}, loser)).body.some(item => item.id === prepared.body) && (await rpc('read_assistance', { p_scope: prepared.body }, loser)).status === 403, 'Unrequested prepared scope leaked to Helper');
  check((await rpc('set_ongoing_helper_audience', { p_root: root, p_user: loser.user.id, p_include: true, p_revision: rootBeforeOngoing.body.scope_revision, p_operation: op() }, owner)).status === 200, 'Deliberate ongoing audience');
  const fourth = await another('Fictional pickup, future errand');
  check((await rpc('read_assistance', { p_scope: fourth }, loser)).body.eligible, 'Applicable ongoing audience failed to inherit');
  check((await rpc('read_assistance', { p_scope: fourth }, winner)).status === 403, 'Revoked Helper inherited ongoing access');
  check((await rpc('create_assistance_request', { p_scope: prepared.body, ...fields('Existing private errand'), p_revision: 0, p_operation: op() }, owner)).status === 200, 'Existing need request creation');
  check((await rpc('read_assistance', { p_scope: prepared.body }, loser)).status === 403, 'Future audience disclosed an existing need');
  const fourthRead = await rpc('read_assistance', { p_scope: fourth }, loser);
  const edit = { p_scope: fourth, ...fields('Materially changed fictional pickup'), p_material_revision: fourthRead.body.material_revision, p_operation: op() };
  check((await rpc('update_assistance_request', edit, owner)).status === 200, 'Authorized preacceptance edit');
  check((await rpc('accept_assistance', { p_scope: fourth, p_material_revision: fourthRead.body.material_revision, p_operation: op() }, loser)).status === 409, 'Stale material details accepted');
  const fresh = await rpc('read_assistance', { p_scope: fourth }, loser);
  check((await rpc('accept_assistance', { p_scope: fourth, p_material_revision: fresh.body.material_revision, p_operation: op() }, loser)).body.outcome === 'accepted', 'Fresh details could not be accepted');
  const secondArrangement = (await rpc('associate_private_draft', { p_operation_id: op(), p_draft: { olderAdult: 'Fictional T05 Other', description: 'Other arrangement', location: '', date: '', time: '', timeZone: 'UTC', prepared: true } }, owner)).body.id;
  check((await rpc('start_coordination', { p_arrangement: secondArrangement, p_kind: 'reported', p_source: 'Fictional other permission', p_rights: full, p_operation: op() }, owner)).status === 200, 'Other arrangement authorization');
  check((await rpc('read_assistance', { p_scope: secondArrangement }, loser)).status === 403, 'Cross-arrangement read');
  check((await rpc('create_assistance_request', { p_scope: secondArrangement, ...fields('Other task'), p_revision: 0, p_operation: op() }, loser)).status === 403, 'Cross-arrangement write');
  check((await rpc('assistance_candidates', { p_scope: secondArrangement }, loser)).status === 403, 'Cross-arrangement candidate metadata');
  stage = 'delegated disclosure and prepared-scope navigation';
  const delegatedNeed = await another('Fictional delegated need');
  await invite(delegate, root); await invite(delegate, delegatedNeed);
  await invite(sameHelper, delegatedNeed);
  await invite(outsider, second);
  const delegatedRights = { ...helper, preset: 'coordinator', disclose: true, resolve: true };
  async function grantCoordinator(scope) {
    const context = await rpc('read_scope_context', { p_scope: scope }, owner);
    const result = await rpc('change_involvement', { p_scope: scope, p_user: delegate.user.id, p_rights: delegatedRights, p_remove: false, p_kind: 'reported', p_source: 'Fictional scoped delegation', p_revision: context.body.revision, p_operation: op() }, owner);
    check(result.status === 200, 'Scoped Coordinator grant');
  }
  await grantCoordinator(root); await grantCoordinator(delegatedNeed);
  const delegationView = await rpc('read_assistance', { p_scope: delegatedNeed }, delegate);
  check(delegationView.status === 200 && delegationView.body.coordinator, 'Delegated same-need coordination read');
  check(delegationView.body.candidates.some(person => person.user_id === sameHelper.user.id) && !delegationView.body.candidates.some(person => person.user_id === outsider.user.id), 'Indirect candidate projection crossed delegated scope');
  const delegatedCandidates = await rpc('assistance_candidates', { p_scope: delegatedNeed }, delegate);
  check(delegatedCandidates.status === 200 && delegatedCandidates.body.some(person => person.user_id === sameHelper.user.id) && !delegatedCandidates.body.some(person => person.user_id === outsider.user.id), 'Direct candidate RPC crossed delegated scope');
  check((await rpc('assistance_candidates', { p_scope: second }, delegate)).status === 403 && (await rpc('read_assistance', { p_scope: second }, delegate)).status === 403, 'Direct another-need ID bypassed delegated scope');
  const delegatedRoot = await rpc('read_assistance', { p_scope: root }, delegate);
  check(delegatedRoot.status === 200 && !delegatedRoot.body.can_create_other && !delegatedRoot.body.candidates.some(person => person.user_id === outsider.user.id), 'Root delegation exposed cross-need choices');
  check((await rpc('set_ongoing_helper_audience', { p_root: root, p_user: b.user.id, p_include: true, p_revision: delegatedRoot.body.scope_revision, p_operation: op() }, delegate)).status === 403, 'Delegated Coordinator established arrangement-wide ongoing audience');
  check((await rpc('create_assistance_need', { p_root: root, ...fields('Unauthorized sibling need'), p_revision: delegatedRoot.body.scope_revision, p_operation: op() }, delegate)).status === 403, 'Delegated Coordinator created cross-need scope');
  check((await rpc('offer_assistance', { p_scope: delegatedNeed, p_user: outsider.user.id, p_material_revision: delegationView.body.material_revision, p_operation: op() }, delegate)).status === 403, 'Delegated Coordinator offered to another need only');
  check((await rpc('offer_assistance', { p_scope: delegatedNeed, p_user: sameHelper.user.id, p_material_revision: delegationView.body.material_revision, p_operation: op() }, delegate)).status === 200, 'Delegated same-need offer denied');
  const afterSameOffer = await rpc('read_assistance', { p_scope: delegatedNeed }, owner);
  const crossOffer = { p_scope: delegatedNeed, p_user: outsider.user.id, p_material_revision: afterSameOffer.body.material_revision, p_operation: op() };
  check((await rpc('offer_assistance', crossOffer, owner)).status === 200, 'Authorized author cross-need offer denied');
  const beforeNarrowOffer = await rpc('read_scope_context', { p_scope: delegatedNeed }, owner);
  check((await rpc('set_practical_audience', { p_scope: delegatedNeed, p_user: outsider.user.id, p_include: false, p_revision: beforeNarrowOffer.body.revision, p_operation: op() }, owner)).status === 200, 'Cross-need target practical narrowing');
  const narrowedOfferView = await rpc('read_assistance', { p_scope: delegatedNeed }, owner);
  check((await rpc('offer_assistance', { ...crossOffer, p_material_revision: narrowedOfferView.body.material_revision, p_operation: op() }, owner)).status === 403, 'Offer silently restored narrowed practical access');
  check((await rpc('offer_assistance', crossOffer, owner)).status === 403 && (await rpc('read_assistance', { p_scope: delegatedNeed }, outsider)).status === 403, 'Old offer retry bypassed narrowed access');
  check(!narrowedOfferView.body.candidates.some(person => person.user_id === outsider.user.id) &&
    !(await rpc('assistance_candidates', { p_scope: delegatedNeed }, owner)).body.some(person => person.user_id === outsider.user.id), 'Narrowed target remained an available candidate');
  const beforeRemoval = await rpc('read_scope_context', { p_scope: delegatedNeed }, owner);
  check((await rpc('change_involvement', { p_scope: delegatedNeed, p_user: sameHelper.user.id, p_rights: helper, p_remove: true, p_kind: 'reported', p_source: 'Fictional current restriction', p_revision: beforeRemoval.body.revision, p_operation: op() }, owner)).status === 200, 'Same-need participant restriction');
  const afterRemoval = await rpc('read_assistance', { p_scope: delegatedNeed }, delegate);
  check((await rpc('offer_assistance', { p_scope: delegatedNeed, p_user: sameHelper.user.id, p_material_revision: afterRemoval.body.material_revision, p_operation: op() }, delegate)).status === 403, 'Removed Helper was reoffered work');
  check(!afterRemoval.body.candidates.some(person => person.user_id === sameHelper.user.id) && (await rpc('read_assistance', { p_scope: delegatedNeed }, sameHelper)).status === 403, 'Restricted Helper remained in projection');

  const parentNow = await rpc('read_assistance', { p_scope: root }, owner);
  const preparedDelegated = await rpc('add_coordination_scope', { p_parent: root, p_description: 'Prepared additional fictional pickup', p_revision: parentNow.body.scope_revision, p_operation: op() }, owner);
  check(preparedDelegated.status === 200, 'Additional prepared scope');
  const initialPrepared = await rpc('read_scope_context', { p_scope: preparedDelegated.body }, owner);
  check((await rpc('add_practical_audience', { p_scope: preparedDelegated.body, p_user: delegate.user.id, p_revision: initialPrepared.body.revision, p_operation: op() }, owner)).status === 200, 'Delegated prepared-scope access');
  await grantCoordinator(preparedDelegated.body);
  const preparedList = await rpc('list_assistance', {}, delegate);
  check(preparedList.status === 200 && preparedList.body.some(item => item.id === preparedDelegated.body && item.coordinator && !item.created), 'Delegated prepared scope not reachable through work list');
  check(!(await rpc('list_assistance', {}, sameHelper)).body.some(item => item.id === preparedDelegated.body) && (await rpc('read_assistance', { p_scope: preparedDelegated.body }, sameHelper)).status === 403, 'Prepared scope exposed to Helper');
  const preparedDetails = await rpc('read_assistance', { p_scope: preparedDelegated.body }, delegate);
  check((await rpc('create_assistance_request', { p_scope: preparedDelegated.body, ...fields('Fictional first request on prepared scope'), p_revision: preparedDetails.body.scope_revision, p_operation: op() }, delegate)).status === 200, 'Scoped Coordinator could not record prepared need request');
  check((await rpc('read_assistance', { p_scope: preparedDelegated.body }, delegate)).body.created, 'Prepared need did not become a request');

  stage = 'same-session scoped revocation with independent accepted work';
  const independent = await another('Fictional independent accepted errand');
  const independentView = await rpc('read_assistance', { p_scope: independent }, loser);
  check(independentView.body.eligible && (await rpc('accept_assistance', { p_scope: independent, p_material_revision: independentView.body.material_revision, p_operation: op() }, loser)).body.outcome === 'accepted', 'Independent accepted work fixture');
  const beforeNarrow = await rpc('read_scope_context', { p_scope: fourth }, owner);
  check((await rpc('set_practical_audience', { p_scope: fourth, p_user: loser.user.id, p_include: false, p_revision: beforeNarrow.body.revision, p_operation: op() }, owner)).status === 200, 'Scope-specific accepted-work revocation');
  const retained = await rpc('list_assistance', {}, loser);
  check((await rpc('read_assistance', { p_scope: fourth }, loser)).status === 403 && retained.status === 200 && retained.body.some(item => item.id === independent && item.accepted_by_me) && !retained.body.some(item => item.id === fourth), 'Unrelated accepted work lost after same-session revocation');
  console.log('PASS actual backend: scheduling, acceptance/races/retries, scoped audiences, delegated direct-RPC boundaries, prepared additional scope, same-session revocation isolation');
}
try { await main(); }
catch (error) { console.error(`FAIL ticket 05 backend at ${stage}: ${error.message}`); process.exitCode = 1; }
finally {
  for (const session of sessions) {
    try { await http(`${api}/auth/v1/logout`, { method: 'POST', headers: headers(session) }); } catch { /* Do not mask primary result. */ }
  }
}
