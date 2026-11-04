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
  const owner = await login(`t07-${stamp}-owner@example.test`);
  const performer = await login(`t07-${stamp}-performer@example.test`);
  const other = await login(`t07-${stamp}-other@example.test`);
  const outsider = await login(`t07-${stamp}-outsider@example.test`);
  stage = 'prepared resolution and first-request guard';
  const root = (await rpc('associate_private_draft', { p_operation_id: op(), p_draft: { olderAdult: 'Fictional T07 Morgan', description: 'Fictional prescription envelope pickup', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }, owner)).body.id;
  check((await rpc('start_coordination', { p_arrangement: root, p_kind: 'reported', p_source: 'Fictional permission for assistance coordination', p_rights: coordinatorRights, p_operation: op() }, owner)).status === 200, 'Initial scope authorization');
  const prepared = await rpc('read_assistance', { p_scope: root }, owner);
  check(prepared.status === 200 && prepared.body.can_resolve && !prepared.body.created && !prepared.body.resolved, 'Prepared need resolution projection');
  const resolvePrepared = { p_scope: root, p_snapshot: prepared.body.resolution_snapshot, p_operation: op() };
  const preparedResolved = await rpc('resolve_assistance', resolvePrepared, owner);
  check(preparedResolved.status === 200 && preparedResolved.body.outcome === 'resolved', 'Express prepared need resolution');
  check((await rpc('resolve_assistance', resolvePrepared, owner)).body.resolved_at === preparedResolved.body.resolved_at, 'Prepared resolution retry changed original time');
  check((await rpc('create_assistance_request', { p_scope: root, ...fields('Stale fictional first request'), p_revision: prepared.body.scope_revision, p_operation: op() }, owner)).status === 409, 'Resolved need admitted first request');
  check((await rpc('resolve_assistance', resolvePrepared, outsider)).status === 403, 'Unrelated actor read resolution receipt');
  check((await rpc('resolve_assistance', resolvePrepared)).status !== 200, 'Anonymous resolution endpoint');
  check((await http(`${api}/rest/v1/assistance_resolution_history?select=*`, { headers: headers(owner) })).status !== 200, 'Private resolution table exposed');
  const otherArrangement = (await rpc('associate_private_draft', { p_operation_id: op(), p_draft: { olderAdult: 'Fictional T07 Other', description: 'Separate fictional errand', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }, outsider)).body.id;
  check((await rpc('start_coordination', { p_arrangement: otherArrangement, p_kind: 'reported', p_source: 'Fictional separate permission', p_rights: coordinatorRights, p_operation: op() }, outsider)).status === 200, 'Separate arrangement authorization');
  check((await rpc('read_assistance', { p_scope: otherArrangement }, owner)).status === 403 &&
    (await rpc('resolve_assistance', { p_scope: otherArrangement, p_snapshot: prepared.body.resolution_snapshot, p_operation: op() }, owner)).status === 403, 'Cross-arrangement resolution boundary');
  const otherContext = await rpc('read_scope_context', { p_scope: otherArrangement }, outsider);
  const firstRequest = { p_scope: otherArrangement, ...fields('Fictional separate request'), p_revision: otherContext.body.revision, p_operation: op() };
  check((await rpc('create_assistance_request', firstRequest, outsider)).status === 200, 'Separate first request');
  const otherView = await rpc('read_assistance', { p_scope: otherArrangement }, outsider);
  check((await rpc('resolve_assistance', { p_scope: otherArrangement, p_snapshot: otherView.body.resolution_snapshot, p_operation: op() }, outsider)).status === 200, 'Separate resolution');
  check((await rpc('create_assistance_request', firstRequest, outsider)).status === 200, 'Historical first-request receipt lost after resolution');

  async function another(task) {
    const rootView = await rpc('read_assistance', { p_scope: root }, owner);
    const made = await rpc('create_assistance_need', { p_root: root, ...fields(task), p_revision: rootView.body.scope_revision, p_operation: op() }, owner);
    check(made.status === 200 && made.body.id, 'Resolved root blocked distinct sibling need');
    return made.body.id;
  }
  async function invite(session, scope) {
    const token = (op() + op()).replaceAll('-', '');
    check((await rpc('issue_invitation', { p_scope: scope, p_recipient: session.user.email, p_operation: op(), p_token: token }, owner)).status === 200, 'Scoped invitation');
    check((await rpc('join_invitation', { p_token: token }, session)).status === 200, 'Scoped Join');
  }
  async function setRights(scope, session, rights) {
    const context = await rpc('read_scope_context', { p_scope: scope }, owner);
    check(context.status === 200, 'Current involvement context');
    const changed = await rpc('change_involvement', {
      p_scope: scope, p_user: session.user.id, p_rights: rights, p_remove: false,
      p_kind: 'reported', p_source: 'Fictional scoped resolution delegation',
      p_revision: context.body.revision, p_operation: op(),
    }, owner);
    check(changed.status === 200, `Scoped resolution delegation (${changed.status}, ${changed.body?.code ?? 'no-code'})`);
  }

  stage = 'direct resolution requires current read eligibility before receipts';
  const audienceScope = await another('Fictional audience-restricted need');
  await invite(other, audienceScope);
  const limitedCoordinator = { ...helperRights, preset: 'coordinator', resolve: true };
  const limitedResolver = { ...helperRights, resolve: true };
  await setRights(audienceScope, other, limitedCoordinator);
  const savedCoordinatorView = await rpc('read_assistance', { p_scope: audienceScope }, other);
  check(savedCoordinatorView.status === 200 && !savedCoordinatorView.body.eligible && !savedCoordinatorView.body.accepted_by_me, 'Coordinator snapshot without request audience');
  const savedResolveInput = { p_scope: audienceScope, p_snapshot: savedCoordinatorView.body.resolution_snapshot, p_operation: op() };
  await setRights(audienceScope, other, limitedResolver);
  check((await rpc('read_assistance', { p_scope: audienceScope }, other)).status === 403, 'Audience-restricted Helper read need');
  check((await rpc('resolve_assistance', savedResolveInput, other)).status === 403, 'Audience-restricted Helper resolved with saved Coordinator snapshot');
  check(sql(`select count(*) from private.assistance_resolution_history where scope_id='${audienceScope}'`) === '0', 'Denied direct resolution wrote history');
  await setRights(audienceScope, other, limitedCoordinator);
  check((await rpc('resolve_assistance', savedResolveInput, other)).status === 200, 'Current Coordinator resolution');
  await setRights(audienceScope, other, limitedResolver);
  check((await rpc('resolve_assistance', savedResolveInput, other)).status === 403, 'Old resolution receipt bypassed current request audience');
  check(sql(`select count(*) from private.assistance_resolution_history where scope_id='${audienceScope}'`) === '1', 'Denied receipt retry changed history');

  const preparedParent = await rpc('read_assistance', { p_scope: root }, owner);
  const preparedScope = await rpc('add_coordination_scope', { p_parent: root, p_description: 'Fictional prepared audience-restricted need', p_revision: preparedParent.body.scope_revision, p_operation: op() }, owner);
  check(preparedScope.status === 200 && preparedScope.body, 'Prepared child need');
  await invite(other, preparedScope.body);
  const preparedChildView = await rpc('read_assistance', { p_scope: preparedScope.body }, owner);
  check(preparedChildView.status === 200 && !preparedChildView.body.created, 'Prepared child snapshot');
  await setRights(preparedScope.body, other, limitedResolver);
  check((await rpc('read_assistance', { p_scope: preparedScope.body }, other)).status === 403, 'Helper read prepared need without request');
  check((await rpc('resolve_assistance', { p_scope: preparedScope.body, p_snapshot: preparedChildView.body.resolution_snapshot, p_operation: op() }, other)).status === 403, 'Helper resolved prepared need without request');
  check(sql(`select count(*) from private.assistance_resolution_history where scope_id='${preparedScope.body}'`) === '0', 'Denied prepared resolution wrote history');

  const delegatedScope = await another('Fictional delegated express resolution');
  await invite(performer, delegatedScope);
  const beforeOffer = await rpc('read_assistance', { p_scope: delegatedScope }, owner);
  check((await rpc('offer_assistance', { p_scope: delegatedScope, p_user: performer.user.id, p_material_revision: beforeOffer.body.material_revision, p_operation: op() }, owner)).status === 200, 'Delegated Helper request audience');
  await setRights(delegatedScope, performer, limitedResolver);
  const delegatedView = await rpc('read_assistance', { p_scope: delegatedScope }, performer);
  check(delegatedView.status === 200 && delegatedView.body.eligible && delegatedView.body.can_resolve, 'Delegated Helper read eligibility');
  check((await rpc('resolve_assistance', { p_scope: delegatedScope, p_snapshot: delegatedView.body.resolution_snapshot, p_operation: op() }, performer)).status === 200, 'Authorized delegated Helper express resolution');

  stage = 'resolved unclaimed opportunity and historical receipts';
  const unclaimed = await another('Fictional unclaimed errand');
  await invite(performer, unclaimed); await invite(other, unclaimed);
  const initial = await rpc('read_assistance', { p_scope: unclaimed }, owner);
  const offerInput = { p_scope: unclaimed, p_user: performer.user.id, p_material_revision: initial.body.material_revision, p_operation: op() };
  check((await rpc('offer_assistance', offerInput, owner)).status === 200, 'Unclaimed offer');
  const offered = await rpc('read_assistance', { p_scope: unclaimed }, performer);
  const deferInput = { p_scope: unclaimed, p_answer: 'deferred', p_material_revision: offered.body.material_revision, p_operation: op() };
  check((await rpc('answer_assistance', deferInput, performer)).body.outcome === 'deferred', 'Pre-resolution defer');
  const ownerView = await rpc('read_assistance', { p_scope: unclaimed }, owner);
  const resolutionInput = { p_scope: unclaimed, p_snapshot: ownerView.body.resolution_snapshot, p_operation: op() };
  const resolved = await rpc('resolve_assistance', resolutionInput, owner);
  check(resolved.status === 200 && resolved.body.outcome === 'resolved', 'Unclaimed express resolution');
  const helperView = await rpc('read_assistance', { p_scope: unclaimed }, performer);
  check(helperView.body.resolved && helperView.body.resolved_at === resolved.body.resolved_at && helperView.body.my_answer === 'deferred' && !helperView.body.can_offer, 'Resolved practical history/status');
  check((await rpc('list_assistance', {}, performer)).body.some(item => item.id === unclaimed && item.resolved), 'Resolved historical need disappeared from authorized list');
  check((await rpc('offer_assistance', { ...offerInput, p_operation: op() }, owner)).status === 409, 'New offer on resolved need');
  check((await rpc('accept_assistance', { p_scope: unclaimed, p_material_revision: offered.body.material_revision, p_operation: op() }, performer)).status === 409, 'New acceptance on resolved need');
  check((await rpc('answer_assistance', { ...deferInput, p_operation: op() }, performer)).status === 409, 'New defer on resolved need');
  check((await rpc('answer_assistance', { ...deferInput, p_answer: 'declined', p_operation: op() }, performer)).status === 409, 'New decline on resolved need');
  check((await rpc('offer_assistance', offerInput, owner)).status === 200 && (await rpc('answer_assistance', deferInput, performer)).body.outcome === 'deferred', 'Historical offer/response receipts lost');
  check((await rpc('resolve_assistance', resolutionInput, owner)).body.resolved_at === resolved.body.resolved_at, 'Same-operation resolution retry changed time');
  check((await rpc('resolve_assistance', { ...resolutionInput, p_operation: op() }, owner)).body.outcome === 'already-resolved', 'New-operation duplicate resolution');
  check(sql(`select count(*) from private.assistance_resolution_history where scope_id='${unclaimed}'`) === '1', 'Duplicate resolution history');
  check(sql(`select actor='${owner.user.id}' and recorded_at='${resolved.body.resolved_at}'::timestamptz from private.assistance_resolution_history where scope_id='${unclaimed}'`) === 't', 'Original resolver/time attribution changed');
  const resolvedContext = await rpc('read_scope_context', { p_scope: unclaimed }, owner);
  check((await rpc('write_scope_information', { p_scope: unclaimed, p_practical: { ...resolvedContext.body.summary, olderAdult: 'Fictional T07 display update' }, p_background: 'Fictional restricted background', p_revision: resolvedContext.body.revision, p_operation: op() }, owner)).status === 200, 'Nonmaterial display/background edit blocked by resolution');
  check((await rpc('update_assistance_request', { p_scope: unclaimed, ...fields('Improper resolved edit'), p_material_revision: ownerView.body.material_revision, p_operation: op() }, owner)).status === 409, 'Resolved request terms were rewritten');
  const afterDisplay = await rpc('read_scope_context', { p_scope: unclaimed }, owner);
  check((await rpc('write_scope_information', { p_scope: unclaimed, p_practical: { ...afterDisplay.body.summary, description: 'Improper direct rewrite' }, p_background: 'Fictional restricted background', p_revision: afterDisplay.body.revision, p_operation: op() }, owner)).status === 409, 'Direct information operation rewrote resolved need');

  stage = 'target-only stale intent and acceptance race';
  const materialScope = await another('Fictional material-change need');
  const materialBefore = await rpc('read_assistance', { p_scope: materialScope }, owner);
  const editedRequest = { p_scope: materialScope, ...fields('Fictional changed request'), p_material_revision: materialBefore.body.material_revision, p_operation: op() };
  check((await rpc('update_assistance_request', editedRequest, owner)).status === 200, 'Pre-resolution request edit');
  check((await rpc('resolve_assistance', { p_scope: materialScope, p_snapshot: materialBefore.body.resolution_snapshot, p_operation: op() }, owner)).status === 409, 'Materially stale need resolved');
  const materialFresh = await rpc('read_assistance', { p_scope: materialScope }, owner);
  await another('Fictional unrelated sibling');
  check((await rpc('resolve_assistance', { p_scope: materialScope, p_snapshot: materialFresh.body.resolution_snapshot, p_operation: op() }, owner)).status === 200, 'Unrelated sibling caused resolution conflict');
  check((await rpc('update_assistance_request', editedRequest, owner)).status === 200, 'Historical request-edit receipt lost after resolution');
  const displayScope = await another('Fictional display-only need');
  const displayBefore = await rpc('read_assistance', { p_scope: displayScope }, owner);
  const displayContext = await rpc('read_scope_context', { p_scope: displayScope }, owner);
  check((await rpc('write_scope_information', { p_scope: displayScope, p_practical: { ...displayContext.body.summary, olderAdult: 'Fictional renamed Morgan' }, p_background: 'Fictional restricted background', p_revision: displayContext.body.revision, p_operation: op() }, owner)).status === 200, 'Display-only edit');
  check((await rpc('resolve_assistance', { p_scope: displayScope, p_snapshot: displayBefore.body.resolution_snapshot, p_operation: op() }, owner)).status === 200, 'Display/background edit falsely staled resolution');
  const raceScope = await another('Fictional race need');
  await invite(performer, raceScope);
  const beforeRaceOffer = await rpc('read_assistance', { p_scope: raceScope }, owner);
  check((await rpc('offer_assistance', { p_scope: raceScope, p_user: performer.user.id, p_material_revision: beforeRaceOffer.body.material_revision, p_operation: op() }, owner)).status === 200, 'Race offer');
  check((await rpc('resolve_assistance', { p_scope: raceScope, p_snapshot: beforeRaceOffer.body.resolution_snapshot, p_operation: op() }, owner)).status === 409, 'New opportunity availability did not stale resolution');
  const raceOwner = await rpc('read_assistance', { p_scope: raceScope }, owner);
  const raceHelper = await rpc('read_assistance', { p_scope: raceScope }, performer);
  const raceResults = await Promise.all([
    rpc('resolve_assistance', { p_scope: raceScope, p_snapshot: raceOwner.body.resolution_snapshot, p_operation: op() }, owner),
    rpc('accept_assistance', { p_scope: raceScope, p_material_revision: raceHelper.body.material_revision, p_operation: op() }, performer),
  ]);
  check(raceResults.filter(result => result.status === 200).length === 1 && raceResults.filter(result => result.status === 409).length === 1, 'Resolution/acceptance race did not serialize');

  stage = 'accepted work remains reportable and target staleness';
  const acceptedScope = await another('Fictional accepted pickup');
  await invite(performer, acceptedScope);
  let ownerAccepted = await rpc('read_assistance', { p_scope: acceptedScope }, owner);
  check((await rpc('offer_assistance', { p_scope: acceptedScope, p_user: performer.user.id, p_material_revision: ownerAccepted.body.material_revision, p_operation: op() }, owner)).status === 200, 'Accepted work offer');
  let performerAccepted = await rpc('read_assistance', { p_scope: acceptedScope }, performer);
  const acceptInput = { p_scope: acceptedScope, p_material_revision: performerAccepted.body.material_revision, p_operation: op() };
  check((await rpc('accept_assistance', acceptInput, performer)).body.outcome === 'accepted', 'Explicit acceptance');
  performerAccepted = await rpc('read_assistance', { p_scope: acceptedScope }, performer);
  ownerAccepted = await rpc('read_assistance', { p_scope: acceptedScope }, owner);
  const oldSnapshot = ownerAccepted.body.resolution_snapshot;
  const acceptedResolve = await rpc('resolve_assistance', { p_scope: acceptedScope, p_snapshot: oldSnapshot, p_operation: op() }, owner);
  check(acceptedResolve.status === 200 && acceptedResolve.body.outcome === 'resolved', 'Resolution with outstanding work');
  const stillAccepted = await rpc('read_assistance', { p_scope: acceptedScope }, performer);
  check(stillAccepted.body.resolved && stillAccepted.body.accepted_by_me && !stillAccepted.body.completion_reported_at && stillAccepted.body.material_revision === performerAccepted.body.material_revision, 'Resolution altered accepted responsibility');
  const report = await rpc('report_assistance_completion', { p_scope: acceptedScope, p_commitment: performerAccepted.body.commitment_id, p_material_revision: performerAccepted.body.material_revision, p_operation: op() }, performer);
  check(report.status === 200 && report.body.outcome === 'reported', 'Outstanding completion blocked after resolution');
  check((await rpc('read_assistance', { p_scope: acceptedScope }, owner)).body.resolved, 'Completion removed resolution');
  check((await rpc('accept_assistance', acceptInput, performer)).body.outcome === 'accepted', 'Historical acceptance receipt lost after resolution');
  check((await rpc('resolve_assistance', { p_scope: acceptedScope, p_snapshot: oldSnapshot, p_operation: op() }, performer)).status === 403, 'Helper resolved without delegation');
  check(sql(`select count(*) from private.assistance_commitments where scope_id='${acceptedScope}'`) === '1', 'Resolution removed accepted commitment');

  stage = 'combined action and authority revocation';
  const combinedScope = await another('Fictional combined pickup');
  await invite(performer, combinedScope);
  let combinedView = await rpc('read_assistance', { p_scope: combinedScope }, owner);
  check((await rpc('offer_assistance', { p_scope: combinedScope, p_user: performer.user.id, p_material_revision: combinedView.body.material_revision, p_operation: op() }, owner)).status === 200, 'Combined offer');
  combinedView = await rpc('read_assistance', { p_scope: combinedScope }, performer);
  check((await rpc('accept_assistance', { p_scope: combinedScope, p_material_revision: combinedView.body.material_revision, p_operation: op() }, performer)).status === 200, 'Combined acceptance');
  const context = await rpc('read_scope_context', { p_scope: combinedScope }, owner);
  check((await rpc('change_involvement', { p_scope: combinedScope, p_user: performer.user.id, p_rights: limitedResolver, p_remove: false, p_kind: 'reported', p_source: 'Fictional limited need resolution delegation', p_revision: context.body.revision, p_operation: op() }, owner)).status === 200, 'Limited Helper resolution delegation');
  combinedView = await rpc('read_assistance', { p_scope: combinedScope }, performer);
  check(combinedView.body.can_resolve && combinedView.body.accepted_by_me, 'Limited Helper projection');
  const combinedInput = { p_scope: combinedScope, p_commitment: combinedView.body.commitment_id, p_material_revision: combinedView.body.material_revision, p_snapshot: combinedView.body.resolution_snapshot, p_operation: op() };
  const unauthorizedCombined = await rpc('complete_and_resolve_assistance', { ...combinedInput, p_operation: op() }, other);
  check(unauthorizedCombined.status === 403 && sql(`select count(*) from private.assistance_completion_reports where scope_id='${combinedScope}'`) === '0', 'Unauthorized combined action wrote completion');
  const combined = await rpc('complete_and_resolve_assistance', combinedInput, performer);
  check(combined.status === 200 && combined.body.outcome === 'completed-and-resolved', `Atomic combined action (${combined.status}, ${combined.body?.code ?? 'no-code'})`);
  check((await rpc('complete_and_resolve_assistance', combinedInput, performer)).body.resolved_at === combined.body.resolved_at, 'Combined lost-response retry');
  check(sql(`select count(*) from private.assistance_completion_reports where scope_id='${combinedScope}'`) === '1' && sql(`select count(*) from private.assistance_resolution_history where scope_id='${combinedScope}'`) === '1', 'Combined duplicate outcomes');
  const combinedAfter = await rpc('read_assistance', { p_scope: combinedScope }, performer);
  check(combinedAfter.body.resolved && combinedAfter.body.completion_reported_at && combinedAfter.body.resolved_at === combined.body.resolved_at, 'Combined projection');
  const restrict = await rpc('read_scope_context', { p_scope: combinedScope }, owner);
  check((await rpc('change_involvement', { p_scope: combinedScope, p_user: performer.user.id, p_rights: helperRights, p_remove: true, p_kind: 'reported', p_source: 'Fictional current restriction', p_revision: restrict.body.revision, p_operation: op() }, owner)).status === 200, 'Current restriction');
  check((await rpc('complete_and_resolve_assistance', combinedInput, performer)).status === 403 && (await rpc('read_assistance', { p_scope: combinedScope }, performer)).status === 403, 'Old token or receipt bypassed restriction');
  check(sql(`select count(*) from private.assistance_resolution_history where scope_id='${combinedScope}'`) === '1', 'Restriction changed history');
  console.log('PASS actual backend: express/contextual/combined resolution, resolved operation guards, current authority, material state, receipts and post-resolution reporting');
}
try { await main(); }
catch (error) { console.error(`FAIL ticket 07 backend at ${stage}: ${error.message}`); process.exitCode = 1; }
finally {
  for (const session of sessions) {
    try { await http(`${api}/auth/v1/logout`, { method: 'POST', headers: headers(session) }); } catch { /* Do not mask primary result. */ }
  }
}
