import { nativeIoFixture } from '../../private-draft/__tests__/native-io-fixture';
import { createProtectedSessionStorage } from '../protected-session-store';

test('complete large sessions survive reopening without storing session data in the key store', async () => {
  const fixture = nativeIoFixture();
  const serializedSession = JSON.stringify({ access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', user: { metadata: 'x'.repeat(12000) } });
  try {
    const storage = createProtectedSessionStorage(fixture.platform);
    await storage.setItem('auth', serializedSession);
    expect(await createProtectedSessionStorage(fixture.platform).getItem('auth')).toBe(serializedSession);
    expect(fixture.state.key).toMatch(/^[a-f0-9]{64}$/);
    await storage.removeItem('auth');
    expect(await createProtectedSessionStorage(fixture.platform).getItem('auth')).toBeNull();
  } finally { fixture.cleanup(); }
});

test('missing keys and missing native cipher fail closed without replacing existing account data', async () => {
  const fixture = nativeIoFixture();
  try {
    await createProtectedSessionStorage(fixture.platform).setItem('auth', 'synthetic session');
    const key = fixture.state.key;
    fixture.state.key = null;
    await expect(createProtectedSessionStorage(fixture.platform).getItem('auth')).rejects.toThrow('Protected account storage is unavailable');
    expect(fixture.state.key).toBeNull();
    fixture.state.key = key;
    fixture.state.cipher = false;
    await expect(createProtectedSessionStorage(fixture.platform).setItem('auth', 'replacement')).rejects.toThrow('Protected account storage is unavailable');
    fixture.state.cipher = true;
    expect(await createProtectedSessionStorage(fixture.platform).getItem('auth')).toBe('synthetic session');
  } finally { fixture.cleanup(); }
});

test('an interrupted session write preserves the last durable value and a retry succeeds', async () => {
  const fixture = nativeIoFixture();
  try {
    const store = createProtectedSessionStorage(fixture.platform);
    await store.setItem('auth', 'synthetic old');
    fixture.state.failWrite = true;
    await expect(store.setItem('auth', 'synthetic new')).rejects.toThrow('Protected account storage is unavailable');
    expect(await store.getItem('auth')).toBe('synthetic old');
    fixture.state.failWrite = false;
    await store.setItem('auth', 'synthetic new');
    expect(await createProtectedSessionStorage(fixture.platform).getItem('auth')).toBe('synthetic new');
  } finally { fixture.cleanup(); }
});
