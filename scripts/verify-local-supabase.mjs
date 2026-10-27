// Local infrastructure smoke check. Never prints API keys, codes, or sessions.
// Run only against this repository's synthetic local stack.
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const mode = process.argv[2] ?? 'health';
const project = 'elder-care-app-v2';
const email = 'infra-probe-20261027@example.test';
let step = 'preflight';
function assert(value, message) { if (!value) throw new Error(message); }
function docker(...args) {
  const result = spawnSync('docker.exe', args, { encoding: 'utf8', windowsHide: true });
  assert(result.status === 0, 'Docker operation failed; raw output suppressed');
  return result.stdout.trim();
}
async function request(url, options) {
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) });
  return { status: response.status, body: await response.json() };
}
async function main() {
  assert(['health', 'signup', 'returning'].includes(mode), 'Use health, signup, or returning');
  const names = ['db', 'auth', 'kong', 'rest', 'inbucket'].map(s => `supabase_${s}_${project}`);
  for (const name of names) {
    const [container] = JSON.parse(docker('inspect', name));
    assert(container.State.Running, 'Required container is stopped');
    if (container.State.Health) assert(container.State.Health.Status === 'healthy', 'Container unhealthy');
    for (const bindings of Object.values(container.NetworkSettings.Ports)) {
      for (const binding of bindings ?? []) {
        assert(['127.0.0.1', '::1'].includes(binding.HostIp), 'Non-loopback publication detected');
      }
    }
  }
  console.log('PASS: five required containers running; health checks and loopback mappings valid');
  const [auth] = JSON.parse(docker('inspect', names[1]));
  const env = Object.fromEntries(auth.Config.Env.map(item => {
    const index = item.indexOf('='); return [item.slice(0, index), item.slice(index + 1)];
  }));
  for (const [key, value] of Object.entries({
    GOTRUE_MAILER_OTP_EXP: '600', GOTRUE_MAILER_OTP_LENGTH: '6',
    GOTRUE_SMTP_MAX_FREQUENCY: '1m0s', GOTRUE_JWT_EXP: '3600',
    GOTRUE_RATE_LIMIT_EMAIL_SENT: '360000', GOTRUE_RATE_LIMIT_VERIFY: '30',
    GOTRUE_MAILER_AUTOCONFIRM: 'false', GOTRUE_SESSIONS_INACTIVITY_TIMEOUT: '720h0m0s',
    GOTRUE_SMTP_HOST: `supabase_inbucket_${project}`, GOTRUE_SMTP_PORT: '1025',
  })) assert(env[key] === value, `Effective non-secret setting mismatch: ${key}`);
  console.log('PASS: effective Auth OTP, resend, email/verification limits, JWT, inactivity and local SMTP settings');
  console.log('LIMITATION: CLI built-in Mailpit overrides hourly email limit to 360000; configured 2/hour is not enforced locally');
  const status = spawnSync(process.env.ComSpec ?? 'cmd.exe',
    ['/d', '/s', '/c', '.\\node_modules\\.bin\\supabase.cmd status -o json'],
    { encoding: 'utf8', windowsHide: true, cwd: path.resolve('.') });
  assert(status.status === 0, 'CLI status failed; raw output suppressed');
  const settings = JSON.parse(status.stdout);
  const api = 'http://127.0.0.1:54321';
  const mail = 'http://127.0.0.1:54324';
  assert(settings.API_URL === api, 'Unexpected API URL');
  const headers = { apikey: settings.PUBLISHABLE_KEY, 'Content-Type': 'application/json' };
  step = 'connectivity';
  assert((await request(`${api}/auth/v1/health`, { headers })).status === 200, 'Auth health failed');
  assert((await request(`${api}/rest/v1/`, { headers })).status === 200, 'PostgREST connectivity failed');
  assert((await fetch(mail, { redirect: 'error', signal: AbortSignal.timeout(10000) })).status === 200, 'Mailpit UI failed');
  assert((await request(`${mail}/api/v1/messages`)).status === 200, 'Mailpit API failed');
  await new Promise((resolve, reject) => {
    const socket = net.connect(54322, '127.0.0.1');
    socket.setTimeout(5000);
    socket.once('connect', () => { socket.destroy(); resolve(); });
    socket.once('error', () => reject(new Error('PostgreSQL host TCP connection failed')));
    socket.once('timeout', () => { socket.destroy(); reject(new Error('PostgreSQL host TCP timed out')); });
  });
  assert(docker('exec', names[0], 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', 'select 1;') === '1', 'SQL query failed');
  console.log('PASS: CLI status, PostgreSQL SQL/host TCP, Auth, PostgREST and Mailpit UI/API');
  if (mode === 'health') return;
  const existing = docker('exec', names[0], 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc',
    `select id from auth.users where email = '${email}';`);
  assert(mode === 'returning' ? !!existing : !existing, 'Unexpected fixture state; use the matching mode');
  const previousMail = await request(`${mail}/api/v1/messages`);
  const previousIds = new Set(previousMail.body.messages?.map(item => item.ID) ?? []);
  step = 'request numeric email';
  const sent = await request(`${api}/auth/v1/otp`, {
    method: 'POST', headers, body: JSON.stringify({ email, create_user: mode === 'signup' }),
  });
  assert(sent.status === 200, `OTP request HTTP ${sent.status}; response suppressed`);
  const resend = await request(`${api}/auth/v1/otp`, {
    method: 'POST', headers, body: JSON.stringify({ email, create_user: mode === 'signup' }),
  });
  assert(resend.status === 429, `Expected immediate resend HTTP 429, received ${resend.status}`);
  let message;
  for (let attempt = 0; attempt < 10; attempt++) {
    const list = await request(`${mail}/api/v1/messages`);
    message = list.body.messages?.find(item => !previousIds.has(item.ID) && item.To?.some(to => to.Address === email));
    if (message) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert(message, 'Mailpit did not capture the fictional email');
  const captured = await request(`${mail}/api/v1/message/${encodeURIComponent(message.ID)}`);
  const html = captured.body.HTML ?? '';
  const match = html.match(/<strong>\s*(\d{6})\s*<\/strong>/i);
  assert(match && !/href\s*=/i.test(html), 'Expected a numeric code without a magic link');
  step = 'verify numeric email';
  const verified = await request(`${api}/auth/v1/verify`, {
    method: 'POST', headers, body: JSON.stringify({ email, token: match[1], type: 'email' }),
  });
  assert(verified.status === 200 && verified.body.access_token && verified.body.refresh_token,
    `Numeric verification failed (HTTP ${verified.status}); response suppressed`);
  assert(verified.body.user.email === email && verified.body.user.email_confirmed_at, 'Identity not confirmed');
  if (existing) assert(verified.body.user.id === existing, 'Returning identity changed');
  const logout = await fetch(`${api}/auth/v1/logout?scope=local`, {
    method: 'POST', redirect: 'error', headers: { ...headers, Authorization: `Bearer ${verified.body.access_token}` },
    signal: AbortSignal.timeout(10000),
  });
  assert(logout.status === 204, `Fixture session sign-out HTTP ${logout.status}`);
  console.log(`PASS: ${mode} numeric email captured by local Mailpit, immediate resend denied (429), code exchanged for confirmed session, fixture session signed out`);
  if (existing) console.log('PASS: same synthetic identity retained across stop/restart');
}
main().catch(error => {
  // No response bodies or runtime exception text: either may carry credentials.
  console.error(`FAIL during ${step}; sensitive diagnostic output suppressed`);
  if (error.message.startsWith('Effective non-secret setting mismatch:')) console.error(error.message);
  process.exitCode = 1;
});
