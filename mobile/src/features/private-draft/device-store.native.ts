import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { createPrivateDraftStore, type DraftPlatform } from './protected-store';

const directory = new Directory(Paths.document, 'PrivateDrafts');
const databaseName = 'anonymous-v1.db';
const keyName = 'eldercare.anonymous-draft.v1';
const keyOptions: SecureStore.SecureStoreOptions = {
  keychainService: 'eldercare.private-draft',
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

const platform: DraftPlatform = {
  async open() {
    // Created by the native CNG plugin only after backup protections are set.
    if (!new File(directory, '.backup-excluded').exists) throw new Error('Protected directory is unavailable');
    const existed = new File(directory, databaseName).exists;
    const database = await SQLite.openDatabaseAsync(databaseName, { useNewConnection: true }, directory.uri);
    return { database, existed };
  },
  readKey: () => SecureStore.getItemAsync(keyName, keyOptions),
  writeKey: (key) => SecureStore.setItemAsync(keyName, key, keyOptions),
  removeKey: () => SecureStore.deleteItemAsync(keyName, keyOptions),
  generateKey: async () => Array.from(await Crypto.getRandomBytesAsync(32), (byte) => byte.toString(16).padStart(2, '0')).join(''),
  async removeDatabase() {
    for (const suffix of ['', '-wal', '-shm', '-journal']) {
      const file = new File(directory, databaseName + suffix);
      if (file.exists) file.delete();
    }
  },
};

// Only an anonymous store exists here: no account, server or sharing path.
export const privateDraftStore = createPrivateDraftStore(platform);
