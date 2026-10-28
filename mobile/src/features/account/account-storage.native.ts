import { createDevicePlatform } from '../private-draft/device-store.native';
import { createProtectedSessionStorage } from './protected-session-store';

// Separate encrypted database and device-only key from anonymous preparation.
// The existing native plugin excludes their shared parent directory from backups.
export const accountStorage = createProtectedSessionStorage(
  createDevicePlatform('account-v1.db', 'eldercare.account.v1'),
);
