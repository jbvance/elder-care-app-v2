import type { ProtectedSessionStorage } from '../account/protected-session-store';

const key = 'pending-invitation-v1';
const listeners = new Set<(changing: boolean) => void>();
let revision = 0;
let writing: Promise<void> = Promise.resolve();

export function subscribePendingInvitation(listener: (changing: boolean) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function readPendingInvitation(storage: ProtectedSessionStorage) {
  await writing; // A failed incoming write must not fall back to an older link.
  return storage.getItem(key);
}

export function replacePendingInvitation(storage: ProtectedSessionStorage, token: string | null) {
  const request = ++revision;
  listeners.forEach(listener => listener(true)); // Invalidate displayed/in-flight context before I/O.
  writing = writing.catch(() => {}).then(() => token ? storage.setItem(key, token) : storage.removeItem(key));
  const result = writing;
  return result.finally(() => {
    if (request === revision) listeners.forEach(listener => listener(false));
  });
}
