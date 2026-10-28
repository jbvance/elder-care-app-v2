export type PrivateDraft = {
  olderAdult: string;
  description: string;
  location: string;
  date: string;
  time: string;
  timeZone: string;
  prepared: boolean;
};

export type DraftDatabase = {
  getFirstAsync<T>(sql: string): Promise<T | null>;
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, value: string): Promise<unknown>;
  closeAsync(): Promise<void>;
};

// This is the native I/O boundary, not an alternative persistence framework.
export type DraftPlatform = {
  open(): Promise<{ database: DraftDatabase; existed: boolean }>;
  readKey(): Promise<string | null>;
  writeKey(key: string): Promise<void>;
  removeKey(): Promise<void>;
  generateKey(): Promise<string>;
  removeDatabase(): Promise<void>;
};

export type PrivateDraftStore = {
  load(): Promise<PrivateDraft | null>;
  save(draft: PrivateDraft): Promise<void>;
  discard(): Promise<void>;
  discardIfUnchanged(expected: PrivateDraft): Promise<boolean>;
};

export function createPrivateDraftStore(platform: DraftPlatform): PrivateDraftStore {
  let pending: Promise<unknown> = Promise.resolve();
  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.catch(() => undefined);
    return result;
  }

  async function protectedDatabase<T>(operation: (db: DraftDatabase) => Promise<T>) {
    const { database, existed } = await platform.open();
    try {
      const cipher = await database.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
      if (!cipher?.cipher_version) throw new Error('SQLCipher is unavailable');
      let key = await platform.readKey();
      if (existed && !key) throw new Error('The existing draft key is unavailable');
      if (!existed) {
        // Rotate orphaned Keychain entries after reinstall/database removal.
        key = await platform.generateKey();
        if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid encryption key');
        await platform.writeKey(key);
      }
      if (!key || !/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid encryption key');
      // The only interpolated value is a validated, generated 256-bit hex key.
      await database.execAsync(`PRAGMA key = "x'${key}'";`);
      await database.getFirstAsync('SELECT count(*) FROM sqlite_master');
      await database.execAsync('PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL;');
      await database.execAsync('CREATE TABLE IF NOT EXISTS private_draft (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);');
      return await operation(database);
    } finally {
      await database.closeAsync();
    }
  }

  function guarded<T>(operation: () => Promise<T>) {
    return serialized(async () => {
      try { return await operation(); }
      // A write may have committed before connection cleanup failed. Do not
      // claim rollback or an unchanged draft when the outcome is unconfirmed.
      catch { throw new Error('Protected storage is unavailable. The last operation could not be confirmed.'); }
    });
  }

  return {
    load() {
      return guarded(() => protectedDatabase(async (database) => {
        const row = await database.getFirstAsync<{ payload: string }>('SELECT payload FROM private_draft WHERE id = 1');
        if (!row) return null;
        const value: unknown = JSON.parse(row.payload);
        if (!isPrivateDraft(value)) throw new Error('Invalid saved draft');
        return value;
      }));
    },
    save(draft) {
      const payload = JSON.stringify(draft);
      return guarded(() => protectedDatabase(async (database) => {
        if (!isPrivateDraft(draft)) throw new Error('Invalid draft');
        // One atomic statement, serialized with load/discard; no temporary plaintext file.
        await database.runAsync('INSERT INTO private_draft (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload', payload);
      }));
    },
    discard() {
      return serialized(async () => {
        // Destroy access first. If file cleanup fails, a retry can still remove it;
        // no later load may silently recreate a key for existing ciphertext.
        try {
          await platform.removeKey();
          await platform.removeDatabase();
        } catch {
          throw new Error('The draft could not be fully discarded. Please try again.');
        }
      });
    },
    discardIfUnchanged(expected) {
      return serialized(async () => {
        try {
          const matches = await protectedDatabase(async database => {
            const row = await database.getFirstAsync<{ payload: string }>('SELECT payload FROM private_draft WHERE id = 1');
            if (!row) return false;
            const value: unknown = JSON.parse(row.payload);
            return isPrivateDraft(value) && samePrivateDraft(value, expected);
          });
          if (!matches) return false;
          // Comparison and destruction share the same queue as editor saves.
          await platform.removeKey();
          await platform.removeDatabase();
          return true;
        } catch { throw new Error('Acknowledged draft cleanup could not be confirmed. Please try again.'); }
      });
    },
  };
}

export function samePrivateDraft(a: PrivateDraft, b: PrivateDraft): boolean {
  return a.olderAdult === b.olderAdult && a.description === b.description && a.location === b.location && a.date === b.date && a.time === b.time && a.timeZone === b.timeZone && a.prepared === b.prepared;
}

export function isPrivateDraft(value: unknown): value is PrivateDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  return ['olderAdult', 'description', 'location', 'date', 'time', 'timeZone'].every(
    (field) => typeof draft[field] === 'string' && (draft[field] as string).length <= 8000,
  ) && typeof draft.prepared === 'boolean';
}
