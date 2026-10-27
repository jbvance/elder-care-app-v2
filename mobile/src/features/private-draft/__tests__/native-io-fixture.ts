import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { DraftPlatform } from '../protected-store';

// Real SQLite/file I/O with only the native cipher/key boundary simulated.
// Synthetic test payloads only. This does NOT demonstrate SQLCipher encryption.
export function nativeIoFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'synthetic-private-draft-'));
  const filename = join(directory, 'draft.db');
  const state = { key: null as string | null, failWrite: false, failClose: false, cipher: true };
  const platform: DraftPlatform = {
    async open() {
      const existed = existsSync(filename);
      const db = new DatabaseSync(filename);
      return {
        existed,
        database: {
          async getFirstAsync<T>(sql: string) {
            if (sql === 'PRAGMA cipher_version') {
              return (state.cipher ? { cipher_version: 'simulated-native-boundary' } : null) as T | null;
            }
            return (db.prepare(sql).get() ?? null) as T | null;
          },
          async execAsync(sql) {
            if (sql.startsWith('PRAGMA key')) return;
            db.exec(sql);
          },
          async runAsync(sql, value) {
            if (state.failWrite) throw new Error('Simulated interrupted native write');
            return db.prepare(sql).run(value);
          },
          async closeAsync() {
            db.close();
            if (state.failClose) throw new Error('Simulated native close failure after commit');
          },
        },
      };
    },
    async readKey() { return state.key; },
    async writeKey(key) { state.key = key; },
    async removeKey() { state.key = null; },
    async generateKey() { return 'a'.repeat(64); },
    async removeDatabase() { rmSync(filename, { force: true }); },
  };
  return { platform, state, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}
