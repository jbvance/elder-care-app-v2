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
async function testVerificationLimit(email) {
  stage = 'direct verification rate limit';
  let rateLimited = false;
  for (let attempt = 0; attempt < 35; attempt++) {
    const invalid = await http(`${api}/auth/v1/verify`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, token: '000000', type: 'email' }) });
    if (invalid.status === 429) { rateLimited = true; break; }
    check(invalid.status === 403, 'Unexpected direct verification response');
  }
  check(rateLimited, 'Direct verification requests were not throttled');
  console.log('PASS: direct-endpoint verification rate limit enforced (429)');
}
async function main() {
  for (const suffix of ['db', 'auth', 'kong', 'rest', 'inbucket']) {
    const [container] = JSON.parse(run('docker.exe', ['inspect', `supabase_${suffix}_${project}`]));
    check(container.State.Running, 'Required local container stopped');
    for (const bindings of Object.values(container.NetworkSettings.Ports))
      for (const binding of bindings ?? []) check(['127.0.0.1', '::1'].includes(binding.HostIp), 'Non-loopback port detected');
  }
  const status = JSON.parse(run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', '.\\node_modules\\.bin\\supabase.cmd status -o json']));
  check(status.API_URL === api, 'Unexpected project API');
  publicKey = status.PUBLISHABLE_KEY;
  stage = 'database function privilege boundary';
  check(sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('check_private_session','associate_private_draft') and not p.prosecdef and p.proconfig @> array['search_path=\"\"'];") === '2', 'Public RPCs must be invoker functions with controlled search paths');
  check(sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname in ('current_session_valid','associate_private_draft') and p.prosecdef and pg_get_userbyid(p.proowner)='postgres' and p.proconfig @> array['search_path=\"\"'] and has_function_privilege('authenticated',p.oid,'execute') and not has_function_privilege('anon',p.oid,'execute');") === '2', 'Private definer ownership or grants differ');
  const hidden = await http(`${api}/rest/v1/rpc/associate_private_draft`, { method: 'POST', headers: { ...headers(), 'Content-Profile': 'private' }, body: '{}' });
  check(hidden.status === 406, 'Private schema was exposed through the Data API');
  if (process.argv.includes('--verify-rate-limit-only')) {
    const email = sql("select email from auth.users where email like 't02-%-codes@example.test' order by created_at desc limit 1;");
    check(/^t02-\d+-codes@example\.test$/.test(email), 'Expected existing synthetic OTP fixture');
    await testVerificationLimit(email);
    return;
  }
  stage = 'anonymous private arrangement access';
  const denied = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers() });
  check([401, 403].includes(denied.status), `Expected anonymous permission denial, received HTTP ${denied.status}`);
  console.log('PASS: anonymous private-arrangement reads denied at actual backend');
  const runId = Date.now();
  const owner = await login(`t02-${runId}-owner@example.test`);
  const hiddenOwner = await http(`${api}/rest/v1/rpc/associate_private_draft`, { method: 'POST', headers: { ...headers(owner), 'Content-Profile': 'private' }, body: '{}' });
  check(hiddenOwner.status === 406, 'Authenticated caller reached private-schema API');
  console.log('PASS: public invoker/private definer metadata and non-exposed schema boundary');
  stage = 'deliberate owner association';
  const operation = randomUUID();
  const draft = { olderAdult: 'Fictional Morgan', description: 'Synthetic grocery trip', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true };
  const input = { p_operation_id: operation, p_draft: draft };
  const created = await rpc('associate_private_draft', input, owner);
  check(created.status === 200 && created.body?.owner_id === owner.user.id,
    `Expected private owner association, received HTTP ${created.status}`);
  const retry = await rpc('associate_private_draft', input, owner);
  check(retry.status === 200 && retry.body.id === created.body.id, 'Association retry duplicated an arrangement');
  const changedRetry = await rpc('associate_private_draft', { ...input, p_draft: { ...draft, description: 'Changed' } }, owner);
  check(changedRetry.status === 409, 'An altered retry silently overwrote the acknowledged arrangement');
  const read = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers(owner) });
  check(read.status === 200 && read.body.length === 1 && read.body[0].draft.description === draft.description, 'Owner could not retrieve exact arrangement');
  console.log('PASS: owner persistence and uncertain-response retry retain one unchanged arrangement');
  console.log('Waiting for the supported email resend interval before a second-device sign-in');
  await new Promise(resolve => setTimeout(resolve, 60_000));
  const secondDevice = await login(owner.user.email, false);
  stage = 'cross-account and forged ownership';
  const other = await login(`t02-${runId}-other@example.test`);
  const crossRead = await http(`${api}/rest/v1/private_arrangements?id=eq.${created.body.id}&select=*`, { headers: headers(other) });
  check(crossRead.status === 200 && crossRead.body.length === 0, 'Other account read private content');
  const forgedInsert = await http(`${api}/rest/v1/private_arrangements`, { method: 'POST', headers: headers(other), body: JSON.stringify({ owner_id: owner.user.id, operation_id: randomUUID(), draft }) });
  check(forgedInsert.status === 403, 'Forged direct insert was allowed');
  const forgedRpc = await rpc('associate_private_draft', { ...input, p_owner_id: owner.user.id }, other);
  check(forgedRpc.status >= 400, 'RPC accepted client-supplied ownership');
  const otherSameOp = await rpc('associate_private_draft', input, other);
  check(otherSameOp.status === 200 && otherSameOp.body.owner_id === other.user.id && otherSameOp.body.id !== created.body.id, 'Operation identifier crossed account boundary');
  console.log('PASS: cross-account identifier reads and forged ownership denied; operation IDs owner-scoped');
  stage = 'revoked current session';
  const signedOut = await http(`${api}/auth/v1/logout?scope=local`, { method: 'POST', headers: headers(owner) });
  check(signedOut.status === 204, 'Local sign-out failed');
  const staleRead = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers(owner) });
  check(staleRead.status === 200 && staleRead.body.length === 0, 'Revoked JWT read protected content');
  const staleWrite = await rpc('associate_private_draft', { ...input, p_operation_id: randomUUID() }, owner);
  check(staleWrite.status === 401, 'Revoked JWT performed a protected write');
  console.log('PASS: previously issued still-unexpired JWT denied protected reads/writes after local sign-out');
  const secondRead = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers(secondDevice) });
  check(secondRead.status === 200 && secondRead.body.length === 1, 'Local sign-out unexpectedly terminated another device');
  console.log('PASS: current-device sign-out preserves another device session');
  stage = 'native Supabase refresh-based inactivity';
  const inactive = await login(`t02-${runId}-inactive@example.test`);
  const inactiveRow = await rpc('associate_private_draft', { p_operation_id: randomUUID(), p_draft: draft }, inactive);
  check(inactiveRow.status === 200, 'Inactive fixture setup failed');
  // Synthetic session fixture only. Exercise the service timeout without a custom timer
  // or restarting Auth; its configured native duration remains 720h.
  sql(`update auth.sessions set created_at=now()-interval '31 days', refreshed_at=(now()-interval '31 days') at time zone 'UTC' where user_id='${inactive.user.id}'::uuid;`);
  const expiredRefresh = await http(`${api}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: inactive.refresh_token }) });
  check(expiredRefresh.status >= 400, 'Native inactivity did not reject refresh');
  check(expiredRefresh.body?.error_code === 'session_expired', 'Expected native session_expired rejection');
  const expiredRead = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers(inactive) });
  // Approved contract: inactivity ends refreshability, not the remaining JWT lifetime.
  // This artificial backdated fixture deliberately retains an unexpired access JWT.
  check(expiredRead.status === 200 && expiredRead.body.length === 1, 'Unexpected remaining-JWT behavior after inactivity rejection');
  const tokenClaims = JSON.parse(Buffer.from(inactive.access_token.split('.')[1], 'base64url'));
  check(tokenClaims.exp > Date.now() / 1000 && tokenClaims.exp - tokenClaims.iat === 3600, 'Unexpected access-token lifetime');
  console.log('PASS: native inactivity rejects refresh; otherwise unexpired one-hour JWT retains its documented remaining validity');

  stage = 'client stops refreshing native-expired session';
  const protectedFixture = new Map([['test-session', JSON.stringify(inactive)]]);
  const clientStorage = {
    getItem: async key => protectedFixture.get(key) ?? null,
    setItem: async (key, value) => { protectedFixture.set(key, value); },
    removeItem: async key => { protectedFixture.delete(key); },
  };
  let refreshRequests = 0;
  const client = createClient(api, publicKey, {
    auth: { storageKey: 'test-session', storage: clientStorage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options) => {
      check(new URL(url).origin === api, 'SDK attempted a non-local request');
      if (String(url).includes('grant_type=refresh_token')) refreshRequests++;
      return fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
    } },
  });
  check(await refreshForeground(client, clientStorage, 'test-session') === false, 'Foreground policy retained expired refresh session');
  check(!(await client.auth.getSession()).data.session, 'SDK restored a native-expired session');
  await client.auth.startAutoRefresh();
  await new Promise(resolve => setTimeout(resolve, 100));
  await client.auth.stopAutoRefresh();
  check(refreshRequests === 1 && !protectedFixture.has('test-session'), 'SDK continued refreshing or retained ended session credentials');
  console.log('PASS: actual supported client clears ended session and does not continue refresh requests');

  stage = 'JWT expiry at actual protected backend';
  const expirySession = await login(`t02-${runId}-jwt-expiry@example.test`);
  check((await rpc('associate_private_draft', { p_operation_id: randomUUID(), p_draft: draft }, expirySession)).status === 200, 'JWT expiry arrangement fixture failed');
  const expiryClaims = JSON.parse(Buffer.from(expirySession.access_token.split('.')[1], 'base64url'));
  // Test-only signer from this local fixture's actual Auth key. Never used by the app,
  // never printed or written to disk. A valid control proves expiry, not bad signature.
  const [authContainer] = JSON.parse(run('docker.exe', ['inspect', `supabase_auth_${project}`]));
  const signingKeys = JSON.parse(authContainer.Config.Env.find(value => value.startsWith('GOTRUE_JWT_KEYS=')).slice('GOTRUE_JWT_KEYS='.length));
  const jwk = signingKeys.find(key => key.kty === 'EC' && key.crv === 'P-256' && key.d);
  check(jwk, 'Expected local Auth signing fixture');
  const jwt = expiry => {
    const head = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: jwk.kid })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...expiryClaims, exp: expiry })).toString('base64url');
    const input = `${head}.${body}`;
    return `${input}.${sign('sha256', Buffer.from(input), { key: createPrivateKey({ key: jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
  };
  const control = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers({ access_token: jwt(Math.floor(Date.now()/1000)+120) }) });
  check(control.status === 200 && control.body.length === 1, 'JWT expiry fixture control failed');
  const expiredToken = { access_token: jwt(Math.floor(Date.now()/1000)-120) };
  check((await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers(expiredToken) })).status === 401, 'Expired JWT read protected information');
  check((await rpc('associate_private_draft', input, expiredToken)).status === 401, 'Expired JWT wrote protected information');
  console.log('PASS: expired correctly signed JWT denied both protected reads and writes');
  stage = 'numeric OTP safeguards';
  const otpEmail = `t02-${runId}-codes@example.test`;
  const code = await emailCode(otpEmail);
  const resend = await http(`${api}/auth/v1/otp`, { method: 'POST', headers: headers(), body: JSON.stringify({ email: otpEmail }) });
  check(resend.status === 429, 'Immediate code resend was not throttled');
  const wrongCode = `${(Number(code[0])+1)%10}${code.slice(1)}`;
  const verifyCode = (email, token) => http(`${api}/auth/v1/verify`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, token, type: 'email' }) });
  check((await verifyCode(otpEmail, wrongCode)).status === 403, 'Incorrect numeric code authenticated');
  const correct = await verifyCode(otpEmail, code);
  check(correct.status === 200 && correct.body.user.email === otpEmail, 'Correct numeric code did not authenticate');
  sessions.push(correct.body);
  check((await verifyCode(otpEmail, code)).status === 403, 'A reused numeric code authenticated');
  const expiredEmail = `t02-${runId}-expired-code@example.test`;
  const expiredCode = await emailCode(expiredEmail);
  // Fixture-only elapsed email timestamp; no global setting or production clock change.
  sql(`update auth.users set confirmation_sent_at=now()-interval '11 minutes' where email='${expiredEmail}';`);
  const expiredCodeResult = await verifyCode(expiredEmail, expiredCode);
  check(expiredCodeResult.status === 403, 'Elapsed ten-minute code expiry was not enforced');
  console.log('PASS: immediate resend, incorrect, reused and elapsed-expired numeric codes denied');

  stage = 'fresh email reauthentication and other-session revocation';
  console.log('Waiting for the supported resend interval before explicit email reauthentication');
  await new Promise(resolve => setTimeout(resolve, 60_000));
  const freshOwner = await login(owner.user.email, false);
  const revokedOthers = await http(`${api}/auth/v1/logout?scope=others`, { method: 'POST', headers: headers(freshOwner) });
  check(revokedOthers.status === 204, 'Other-session revocation failed');
  const otherDeviceRead = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers(secondDevice) });
  check(otherDeviceRead.status === 200 && otherDeviceRead.body.length === 0, 'Other-device stale JWT retained private access after explicit revocation');
  const freshOwnerRead = await http(`${api}/rest/v1/private_arrangements?select=*`, { headers: headers(freshOwner) });
  check(freshOwnerRead.status === 200 && freshOwnerRead.body.length === 1, 'Other-session revocation ended the fresh current session');
  console.log('PASS: fresh same-identity numeric reauthentication; other-device JWT denied while current session retained');

  if (process.argv.includes('--core')) {
    console.log('LOCAL LIMITATION: native verification IP throttling is not reproduced by pinned CLI; mandatory before real-data/live use. Strict failing probe remains --verify-rate-limit-only.');
  } else await testVerificationLimit(otpEmail);
}
try { await main(); }
catch (error) { console.error(`FAIL: ${stage}: ${error instanceof CheckFailure ? error.message : 'details suppressed'}`); process.exitCode = 1; }
finally {
  for (const session of sessions) await http(`${api}/auth/v1/logout?scope=local`, { method: 'POST', headers: headers(session) }).catch(() => {});
}
