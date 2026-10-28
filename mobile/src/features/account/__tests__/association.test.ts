import { createClient } from '@supabase/supabase-js';
import { nativeIoFixture } from '../../private-draft/__tests__/native-io-fixture';
import { samePrivateDraft, type PrivateDraft } from '../../private-draft/protected-store';
import { createAccountService } from '../account-service';
import { createProtectedSessionStorage } from '../protected-session-store';

// Real SDK and SQLite I/O; only the HTTP server and native cipher/key are fixtures.
// Real authorization/idempotency are separately exercised by the local backend suite.
async function fixture() {
  const io = nativeIoFixture();
  const store = createProtectedSessionStorage(io.platform);
  const owner = '00000000-0000-4000-8000-000000000001';
  await store.setItem('fixture.auth', JSON.stringify({ access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_at: Math.floor(Date.now()/1000)+3600, user: { id: owner, email: 'morgan@example.test' } }));
  const original: PrivateDraft = { olderAdult: 'Fictional Morgan', description: 'Synthetic groceries', location: '', date: '', time: '', timeZone: 'UTC', prepared: true };
  let draft: PrivateDraft | null = { ...original };
  const rows = new Map<string, PrivateDraft>();
  let loseResponse = false;
  let duringRequest: (() => void) | undefined;
  let logoutUnavailable = false;
  const client = createClient('http://127.0.0.1:54321', 'sb_publishable_synthetic_fixture', {
    auth: { storage: store, storageKey: 'fixture.auth', autoRefreshToken: false, persistSession: true, detectSessionInUrl: false },
    global: { fetch: async (url, options) => {
      if (String(url).includes('/logout')) return logoutUnavailable ? new Response(JSON.stringify({ message: 'Synthetic service unavailable' }), { status: 503 }) : new Response(null, { status: 204 });
      const body = JSON.parse(options!.body as string);
      rows.set(body.p_operation_id, body.p_draft);
      duringRequest?.(); duringRequest = undefined;
      if (loseResponse) return new Response(JSON.stringify({ message: 'Synthetic uncertain response' }), { status: 503 });
      return new Response(JSON.stringify({ id: body.p_operation_id, owner_id: owner, draft: body.p_draft }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } },
  });
  let operation = 0;
  let failReceiptCleanup = false;
  let failSessionCleanup = false;
  const storage = { ...store, async removeItem(key: string) { if (failReceiptCleanup || (failSessionCleanup && key === 'fixture.auth')) throw new Error('Synthetic cleanup interruption'); await store.removeItem(key); } };
  const account = createAccountService(client, storage, { async load() { return draft ? { ...draft } : null; }, async save(value) { draft = { ...value }; }, async discard() { draft = null; }, async discardIfUnchanged(expected) { if (!draft || !samePrivateDraft(draft, expected)) return false; draft = null; return true; } },
    () => `00000000-0000-4000-8000-${String(++operation).padStart(12, '0')}`, 'fixture.auth');
  return { account, owner, rows, original, store, client, io,
    get draft() { return draft; },
    set draft(value: PrivateDraft | null) { draft = value; },
    set loseResponse(value: boolean) { loseResponse = value; },
    set failReceiptCleanup(value: boolean) { failReceiptCleanup = value; },
    set failSessionCleanup(value: boolean) { failSessionCleanup = value; },
    set duringRequest(value: (() => void) | undefined) { duringRequest = value; },
    set logoutUnavailable(value: boolean) { logoutUnavailable = value; },
  };
}

test('overlapping association actions share one operation identity and create one arrangement', async () => {
  const f = await fixture();
  try {
    await Promise.all([f.account.associate(f.owner), f.account.associate(f.owner)]);
    expect(f.rows.size).toBe(1);
    expect(f.draft).toBeNull();
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('sign-out requires a deliberate discard and removes the complete local session', async () => {
  const f = await fixture();
  try {
    await expect(f.account.signOut()).rejects.toThrow('canceling');
    expect(f.draft).toEqual(f.original);
    expect(await f.store.getItem('fixture.auth')).not.toBeNull();
    await f.account.signOut(true);
    expect(f.draft).toBeNull();
    expect(await f.store.getItem('fixture.auth')).toBeNull();
    expect((await f.account.open()).user).toBeNull();
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('unacknowledged server sign-out distinguishes local removal from revocation', async () => {
  const f = await fixture();
  try {
    f.draft = null;
    f.logoutUnavailable = true;
    await expect(f.account.signOut()).rejects.toThrow('server revocation was not confirmed');
    expect(await f.store.getItem('fixture.auth')).toBeNull();
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('uncertain responses retry the exact durable operation without losing the private draft', async () => {
  const f = await fixture();
  try {
    f.loseResponse = true;
    await expect(f.account.associate(f.owner)).rejects.toThrow('could not confirm');
    expect(f.draft).toEqual(f.original);
    expect(f.rows.size).toBe(1);
    f.loseResponse = false;
    expect(await f.account.associate(f.owner)).toBe('saved');
    expect(f.rows.size).toBe(1);
    expect(f.draft).toBeNull();
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('newer edits made during upload remain on device and are not falsely acknowledged', async () => {
  const f = await fixture();
  try {
    const newer = { ...f.original, description: 'Synthetic intervening edit', prepared: false };
    f.duringRequest = () => { f.draft = newer; };
    expect(await f.account.associate(f.owner)).toBe('newer-draft-retained');
    expect(f.rows.size).toBe(1);
    expect([...f.rows.values()]).toEqual([f.original]);
    expect(f.draft).toEqual(newer);
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('another account cannot reuse an owner-bound pending association receipt', async () => {
  const f = await fixture();
  try {
    f.loseResponse = true;
    await expect(f.account.associate(f.owner)).rejects.toThrow();
    const another = '00000000-0000-4000-8000-000000000099';
    await f.store.setItem('fixture.auth', JSON.stringify({ access_token: 'synthetic-other-access', refresh_token: 'synthetic-other-refresh', expires_at: Math.floor(Date.now()/1000)+3600, user: { id: another, email: 'other@example.test' } }));
    f.loseResponse = false;
    await expect(f.account.associate(another)).rejects.toThrow('different sign-in');
    expect(f.rows.size).toBe(1);
    expect(f.draft).toEqual(f.original);
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('cleanup interruption followed by a newer draft acknowledges the intended new contents', async () => {
  const f = await fixture();
  try {
    f.failReceiptCleanup = true;
    await expect(f.account.associate(f.owner)).rejects.toThrow();
    expect(f.draft).toBeNull();
    const newer = { ...f.original, description: 'Synthetic newer appointment' };
    f.draft = newer;
    f.failReceiptCleanup = false;
    await f.account.associate(f.owner);
    expect([...f.rows.values()]).toContainEqual(newer);
    expect(f.rows.size).toBe(2);
    expect(f.draft).toBeNull();
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('early SDK sign-out failure still forgets credentials and cannot restore them', async () => {
  const f = await fixture();
  try {
    f.draft = null;
    await f.client.auth.getSession();
    const original = f.client.auth.signOut.bind(f.client.auth);
    let first = true;
    jest.spyOn(f.client.auth, 'signOut').mockImplementation(async options => {
      if (first) { first = false; return { error: new Error('Synthetic early failure') as never }; }
      return original(options);
    });
    await expect(f.account.signOut()).rejects.toThrow('server revocation was not confirmed');
    expect(await f.store.getItem('fixture.auth')).toBeNull();
    expect((await f.client.auth.getSession()).data.session).toBeNull();
    expect((await f.account.open()).user).toBeNull();
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('thrown connectivity failure completes local sign-out and stops refresh', async () => {
  const f = await fixture();
  try {
    f.draft = null;
    await f.client.auth.getSession();
    const stop = jest.spyOn(f.client.auth, 'stopAutoRefresh');
    jest.spyOn(f.client.auth, 'signOut').mockRejectedValueOnce(new TypeError('Synthetic offline'));
    await expect(f.account.signOut()).rejects.toThrow('server revocation was not confirmed');
    expect(stop).toHaveBeenCalled();
    expect((await f.client.auth.getSession()).data.session).toBeNull();
    const reopened = createClient('http://127.0.0.1:54321', 'sb_publishable_synthetic_fixture', {
      auth: { storage: f.store, storageKey: 'fixture.auth', autoRefreshToken: false, persistSession: true, detectSessionInUrl: false },
    });
    try { expect((await reopened.auth.getSession()).data.session).toBeNull(); }
    finally { await reopened.auth.stopAutoRefresh(); }
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});

test('failed scoped credential cleanup never reports safe local sign-out', async () => {
  const f = await fixture();
  try {
    f.draft = null;
    await f.client.auth.getSession();
    jest.spyOn(f.client.auth, 'signOut').mockRejectedValueOnce(new TypeError('Synthetic offline'));
    f.failSessionCleanup = true;
    await expect(f.account.signOut()).rejects.toThrow('Local credential removal could not be confirmed');
    expect(await f.store.getItem('fixture.auth')).not.toBeNull();
  } finally { await f.client.auth.stopAutoRefresh(); f.io.cleanup(); }
});
