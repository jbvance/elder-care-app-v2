import { createParticipationService } from '../participation/participation-service';
import { createAssistanceService } from '../assistance/assistance-service';
import { createInvitationService } from '../invitations/invitation-service';
import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import { randomUUID } from 'expo-crypto';
import { AppState, Platform } from 'react-native';
import { privateDraftStore } from '../private-draft/device-store';
import { accountStorage } from './account-storage';
import { createAccountService, type Account } from './account-service';
import { refreshForeground } from './refresh-foreground';

let participation: ReturnType<typeof createParticipationService> | undefined;
export function getParticipation() { getAccount(); return participation!; }
let assistance: ReturnType<typeof createAssistanceService> | undefined;
export function getAssistance() { getAccount(); return assistance!; }
let invitations: ReturnType<typeof createInvitationService> | undefined;
export function getInvitations() { getAccount(); return invitations!; }
let account: Account | undefined;
export function getAccount(): Account {
  if (account) return account;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (Platform.OS === 'web' || !key?.startsWith('sb_publishable_')) throw new Error('Secure sign-in needs the native local development configuration.');
  // Physical Android reaches this address through USB adb reverse, never LAN.
  const endpoint = 'http://127.0.0.1:54321';
  const localFetch: typeof fetch = (input, options) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (new URL(url).origin !== endpoint) return Promise.reject(new Error('Only the local development backend is allowed.'));
    return fetch(input, { ...options, redirect: 'error' });
  };
  const client = createClient(endpoint, key, {
    auth: { storage: accountStorage, storageKey: 'eldercare.auth.v1', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, lock: processLock, debug: false },
    global: { fetch: localFetch },
  });
  let generation = 0;
  const updateRefresh = () => {
    const current = ++generation;
    void (async () => {
      await client.auth.stopAutoRefresh();
      if (AppState.currentState !== 'active') return;
      const signedIn = await refreshForeground(client, accountStorage, 'eldercare.auth.v1');
      if (signedIn && current === generation && AppState.currentState === 'active') await client.auth.startAutoRefresh();
    })().catch(() => { /* Account open shows recoverable connection errors. */ });
  };
  updateRefresh();
  AppState.addEventListener('change', updateRefresh);
  client.auth.onAuthStateChange(event => { if (event === 'SIGNED_IN') setTimeout(updateRefresh, 0); });
  participation = createParticipationService(client, randomUUID);
  assistance = createAssistanceService(client, randomUUID);
  invitations = createInvitationService(client, accountStorage, randomUUID);
  account = createAccountService(client, accountStorage, privateDraftStore, randomUUID);
  return account;
}
