import { createClient } from '@supabase/supabase-js';
import { nativeIoFixture } from '../../private-draft/__tests__/native-io-fixture';
import { createProtectedSessionStorage } from '../protected-session-store';
import { refreshForeground } from '../refresh-foreground';

test('terminal refresh rejection during restoration of an expired JWT ends local sign-in', async () => {
  const io = nativeIoFixture();
  const storage = createProtectedSessionStorage(io.platform);
  try {
    await storage.setItem('fixture.auth', JSON.stringify({ access_token: 'synthetic-expired-access', refresh_token: 'synthetic-expired-refresh', expires_at: Math.floor(Date.now()/1000)-120, user: { id: 'fictional-owner', email: 'morgan@example.test' } }));
    const client = createClient('http://127.0.0.1:54321', 'sb_publishable_synthetic_fixture', {
      auth: { storage, storageKey: 'fixture.auth', autoRefreshToken: false, persistSession: true, detectSessionInUrl: false },
      global: { fetch: async () => new Response(JSON.stringify({ error_code: 'session_expired', msg: 'Synthetic terminal expiry' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) },
    });
    expect(await refreshForeground(client, storage, 'fixture.auth')).toBe(false);
    expect(await storage.getItem('fixture.auth')).toBeNull();
    expect((await client.auth.getSession()).data.session).toBeNull();
    await client.auth.stopAutoRefresh();
  } finally { io.cleanup(); }
});

test('service throttling during foreground refresh preserves the protected session for retry', async () => {
  const io = nativeIoFixture();
  const storage = createProtectedSessionStorage(io.platform);
  try {
    await storage.setItem('fixture.auth', JSON.stringify({ access_token: 'synthetic-valid-access', refresh_token: 'synthetic-valid-refresh', expires_at: Math.floor(Date.now()/1000)+3600, user: { id: 'fictional-owner', email: 'morgan@example.test' } }));
    const client = createClient('http://127.0.0.1:54321', 'sb_publishable_synthetic_fixture', {
      auth: { storage, storageKey: 'fixture.auth', autoRefreshToken: false, persistSession: true, detectSessionInUrl: false },
      global: { fetch: async () => new Response(JSON.stringify({ error_code: 'over_request_rate_limit', msg: 'Synthetic temporary throttling' }), { status: 429, headers: { 'Content-Type': 'application/json' } }) },
    });
    await expect(refreshForeground(client, storage, 'fixture.auth')).rejects.toThrow('Reconnect');
    expect(await storage.getItem('fixture.auth')).not.toBeNull();
    expect((await client.auth.getSession()).data.session?.user.email).toBe('morgan@example.test');
    await client.auth.stopAutoRefresh();
  } finally { io.cleanup(); }
});
