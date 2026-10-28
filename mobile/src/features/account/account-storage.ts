import type { ProtectedSessionStorage } from './protected-session-store';

// Account authentication is native-only until equivalent browser safeguards exist.
const unavailable = async (): Promise<never> => { throw new Error('Use the Android or iOS development app for secure sign-in.'); };
export const accountStorage: ProtectedSessionStorage = { getItem: unavailable, setItem: unavailable, removeItem: unavailable };
