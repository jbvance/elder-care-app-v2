import type { DraftDatabase, DraftPlatform } from '../private-draft/protected-store';

// Supabase storage adapter. Entire serialized sessions go into SQLCipher;
// SecureStore holds only a generated database key, never session-sized values.
export function createProtectedSessionStorage(platform: DraftPlatform) {
  let pending: Promise<unknown> = Promise.resolve();
  function run<T>(operation: (values: Record<string, string>, db: DraftDatabase) => Promise<T>) {
    const result = pending.then(async () => {
      let database: DraftDatabase | undefined;
      try {
        const opened = await platform.open();
        database = opened.database;
        const cipher = await database.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
        if (!cipher?.cipher_version) throw new Error();
        let key = await platform.readKey();
        if (opened.existed && !key) throw new Error();
        if (!opened.existed) {
          key = await platform.generateKey();
          if (!/^[a-f0-9]{64}$/.test(key)) throw new Error();
          await platform.writeKey(key);
        }
        if (!key || !/^[a-f0-9]{64}$/.test(key)) throw new Error();
        await database.execAsync(`PRAGMA key = "x'${key}'";`);
        await database.getFirstAsync('SELECT count(*) FROM sqlite_master');
        await database.execAsync('PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS protected_state (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL);');
        const row = await database.getFirstAsync<{ payload: string }>('SELECT payload FROM protected_state WHERE id = 1');
        const values: unknown = row ? JSON.parse(row.payload) : {};
        if (!values || typeof values !== 'object' || Array.isArray(values) || Object.values(values).some(value => typeof value !== 'string')) throw new Error();
        return await operation(values as Record<string, string>, database);
      } finally { await database?.closeAsync(); }
    }).catch(() => { throw new Error('Protected account storage is unavailable. Please try again.'); });
    pending = result.catch(() => undefined);
    return result;
  }
  async function write(values: Record<string, string>, database: DraftDatabase) {
    await database.runAsync('INSERT INTO protected_state(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload', JSON.stringify(values));
  }
  return {
    getItem(key: string): Promise<string | null> { return run(async values => Object.hasOwn(values, key) ? values[key] : null); },
    setItem(key: string, value: string): Promise<void> { return run(async (values, db) => { await write({ ...values, [key]: value }, db); }); },
    removeItem(key: string): Promise<void> { return run(async (values, db) => { delete values[key]; await write(values, db); }); },
  };
}
export type ProtectedSessionStorage = ReturnType<typeof createProtectedSessionStorage>;
