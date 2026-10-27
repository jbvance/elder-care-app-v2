import { createPrivateDraftStore, type DraftPlatform } from '../protected-store';
import { nativeIoFixture } from './native-io-fixture';

test('refuses protected persistence when the native build has no SQLCipher', async () => {
  const database = {
    getFirstAsync: jest.fn().mockResolvedValue(null),
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    closeAsync: jest.fn(),
  };
  const platform = {
    open: jest.fn().mockResolvedValue({ database, existed: false }),
    readKey: jest.fn(),
    writeKey: jest.fn(),
    removeKey: jest.fn(),
    generateKey: jest.fn(),
    removeDatabase: jest.fn(),
  } satisfies DraftPlatform;
  const store = createPrivateDraftStore(platform);

  await expect(store.load()).rejects.toThrow('Protected storage is unavailable');
  expect(database.execAsync).not.toHaveBeenCalled();
  expect(database.runAsync).not.toHaveBeenCalled();
  expect(platform.generateKey).not.toHaveBeenCalled();
});

test('a private draft survives closing and recreating the store without an account', async () => {
  const fixture = nativeIoFixture();
  const draft = {
    olderAdult: 'Fictional Morgan', description: 'Grocery transportation', location: '',
    date: '', time: '', timeZone: 'America/Chicago', prepared: true,
  };
  try {
    await createPrivateDraftStore(fixture.platform).save(draft);
    await expect(createPrivateDraftStore(fixture.platform).load()).resolves.toEqual(draft);
  } finally { fixture.cleanup(); }
});

test('deliberately discarding a draft removes it and its key without an inactivity timer', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  try {
    await store.save({ olderAdult: 'Fictional Morgan', description: 'Shopping', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: false });
    await store.discard();
    expect(fixture.state.key).toBeNull();
    await expect(createPrivateDraftStore(fixture.platform).load()).resolves.toBeNull();
  } finally { fixture.cleanup(); }
});

test('a missing key never replaces an existing saved draft with a new database', async () => {
  const fixture = nativeIoFixture();
  const draft = { olderAdult: 'Fictional Morgan', description: 'Synthetic instructions', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: false };
  try {
    await createPrivateDraftStore(fixture.platform).save(draft);
    const originalKey = fixture.state.key;
    fixture.state.key = null;
    await expect(createPrivateDraftStore(fixture.platform).save({ ...draft, description: 'Must not overwrite' })).rejects.toThrow('Protected storage is unavailable');
    expect(fixture.state.key).toBeNull();
    fixture.state.key = originalKey;
    await expect(createPrivateDraftStore(fixture.platform).load()).resolves.toEqual(draft);
  } finally { fixture.cleanup(); }
});

test('an interrupted update preserves the last durable draft and supports retry', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  const draft = { olderAdult: 'Fictional Morgan', description: 'Original plan', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: false };
  try {
    await store.save(draft);
    fixture.state.failWrite = true;
    await expect(store.save({ ...draft, description: 'Changed plan' })).rejects.toThrow('Protected storage is unavailable');
    await expect(store.load()).resolves.toEqual(draft);
    fixture.state.failWrite = false;
    await store.save({ ...draft, description: 'Changed plan' });
    await expect(createPrivateDraftStore(fixture.platform).load()).resolves.toEqual({ ...draft, description: 'Changed plan' });
  } finally { fixture.cleanup(); }
});

test('discard stays after queued autosaves rather than resurrecting an old draft', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  try {
    const saves = ['First', 'Latest'].map((description) => store.save({ olderAdult: 'Fictional Morgan', description, location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: false }));
    const discard = store.discard();
    await Promise.all([...saves, discard]);
    await expect(store.load()).resolves.toBeNull();
  } finally { fixture.cleanup(); }
});

test('native random-generation failure never falls back or writes a draft', async () => {
  const fixture = nativeIoFixture();
  const generateKey = jest.fn<Promise<string>, []>().mockRejectedValue(new Error('Native randomness unavailable'));
  const store = createPrivateDraftStore({ ...fixture.platform, generateKey });
  try {
    await expect(store.save({ olderAdult: 'Fictional Morgan', description: 'A ride', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: false })).rejects.toThrow('Protected storage is unavailable');
    expect(fixture.state.key).toBeNull();
    expect(generateKey).toHaveBeenCalledTimes(1);
  } finally { fixture.cleanup(); }
});

test('a committed write followed by close failure reports an unconfirmed outcome, not an unsaved draft', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  const draft = { olderAdult: 'Fictional Morgan', description: 'Original plan', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: false };
  try {
    await store.save(draft);
    fixture.state.failClose = true;
    await expect(store.save({ ...draft, description: 'Committed updated plan' })).rejects.toThrow('The last operation could not be confirmed');
    fixture.state.failClose = false;
    await expect(createPrivateDraftStore(fixture.platform).load()).resolves.toEqual({ ...draft, description: 'Committed updated plan' });
  } finally { fixture.cleanup(); }
});

test('an empty database left before key retention requires deliberate discard before fresh preparation', async () => {
  const fixture = nativeIoFixture();
  const generateKey = jest.fn(fixture.platform.generateKey);
  const store = createPrivateDraftStore({ ...fixture.platform, generateKey });
  const draft = { olderAdult: 'Fictional new draft', description: 'A grocery ride', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: false };
  try {
    const interruptedCreation = await fixture.platform.open();
    await interruptedCreation.database.closeAsync();
    expect(fixture.state.key).toBeNull();
    await expect(store.load()).rejects.toThrow('Protected storage is unavailable');
    await expect(store.save(draft)).rejects.toThrow('Protected storage is unavailable');
    expect(generateKey).not.toHaveBeenCalled();
    // Only the caller's deliberate discard may remove the unreadable database.
    await store.discard();
    await store.save(draft);
    expect(generateKey).toHaveBeenCalledTimes(1);
    await expect(createPrivateDraftStore(fixture.platform).load()).resolves.toEqual(draft);
  } finally { fixture.cleanup(); }
});
