import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text } from 'react-native';
import { Action, Copy, Field, Page, useDraftColors } from '../private-draft/draft-ui';
import type { Account, AccountView } from './account-service';
import { AccountError } from './account-service';

export function AccountScreen({ account }: { account: Account }) {
  const colors = useDraftColors();
  const [view, setView] = useState<AccountView | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmOut, setConfirmOut] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const revision = useRef(0);
  const mounted = useRef(true);
  const foreground = useRef(true);
  const refresh = useCallback(async () => {
    const request = ++revision.current;
    const next = await account.open();
    if (mounted.current && foreground.current && request === revision.current) setView(next);
  }, [account]);
  useEffect(() => {
    mounted.current = true;
    const reload = () => {
      ++revision.current;
      setView(null); // Old account data disappears before any asynchronous restoration.
      // Do not await SDK calls inside its synchronous auth callback.
      setTimeout(() => { if (mounted.current && foreground.current) void refresh().catch(() => setNotice('We could not confirm your sign-in. Reconnect and try again.')); }, 0);
    };
    const unsubscribe = account.subscribe(reload);
    void refresh().catch(() => setNotice('We could not open protected sign-in. Reconnect and try again.'));
    const app = AppState.addEventListener('change', state => {
      foreground.current = state === 'active';
      ++revision.current;
      setView(null);
      if (foreground.current) void refresh().catch(() => setNotice('Reconnect to reopen your private account.'));
    });
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => { mounted.current = false; unsubscribe(); app.remove(); clearInterval(timer); };
  }, [account, refresh]);
  async function perform(action: () => Promise<void | string>, success = '') {
    if (busy) return;
    setBusy(true); setNotice('');
    try { const message = await action(); await refresh(); if (mounted.current) setNotice(message ?? success); }
    catch (error) { if (mounted.current) setNotice(error instanceof AccountError ? error.message : 'Protected sign-in could not be confirmed. Check your connection and try again.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  const remaining = Math.max(0, Math.ceil((resendAt - clock) / 1000));
  async function send() {
    await account.requestCode(revoking ? view!.user!.email : email);
    setCode(''); setSent(true); setResendAt(Date.now() + 60_000); setClock(Date.now());
  }
  return <Page>
    <Copy heading>Your private account</Copy>
    <Copy>Fictional local development only. Signing in does not share your draft or arrange assistance.</Copy>
    {!view ? <>
      <Copy>Opening protected sign-in…</Copy>
      <Action disabled={busy} onPress={() => void perform(async () => {})}>Try opening again</Action>
      <Action secondary disabled={busy} onPress={() => setConfirmOut(true)}>Sign out here</Action>
    </> : view.user ? <>
      <Copy>{view.user.email}</Copy>
      {view.hasDraft && <>
        <Copy>Your device draft is still private. Save it to this account to retrieve it on another device. This does not invite anyone or share it.</Copy>
        <Action disabled={busy} onPress={() => void perform(async () => {
          const outcome = await account.associate(view.user!.id);
          return outcome === 'newer-draft-retained' ? 'The earlier version is saved. Your newer edits remain private on this device; finish preparing them before saving again.' : 'Saved privately to your account. Assistance is not arranged.';
        })}>Save my draft to this account</Action>
      </>}
      {view.arrangements.map(item => <Copy key={item.id}>{item.draft.olderAdult}: {item.draft.description}{item.draft.date ? ` — ${item.draft.date} ${item.draft.time} (${item.draft.timeZone})` : ''}{item.draft.location ? ` — ${item.draft.location}` : ''}</Copy>)}
      {!view.arrangements.length && <Copy>No private arrangements saved to this account yet.</Copy>}
      <Action secondary disabled={busy} onPress={() => {
        if (view.hasDraft) setConfirmOut(true);
        else { setView(null); void perform(() => account.signOut()); }
      }}>Sign out on this device</Action>
      <Action secondary disabled={busy} onPress={() => { setRevoking(true); setSent(false); setCode(''); }}>Sign out other devices</Action>
    </> : <>
      <Field label="Email address" value={email} onChangeText={value => { setEmail(value); setSent(false); setCode(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} maxLength={254} />
      <Action disabled={busy || remaining > 0} onPress={() => void perform(send, 'Check the local development inbox for your code.')}>{sent ? 'Email a new code' : 'Email me a code'}</Action>
    </>}
    {revoking && view?.user && <>
      <Copy>A lost device? Confirm a new email code for {view.user.email}. This keeps this sign-in and ends other sessions. Previously viewed offline copies cannot be recalled.</Copy>
      <Action disabled={busy || remaining > 0} onPress={() => void perform(send, 'A new code was requested.')}>Email a confirmation code</Action>
      <Action secondary disabled={busy} onPress={() => { setRevoking(false); setSent(false); setCode(''); }}>Cancel other-device sign-out</Action>
    </>}
    {sent && (!view?.user || revoking) && <>
      <Copy>Enter the six-digit code. It expires after ten minutes.</Copy>
      <Field label="Six-digit code" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" editable={!busy} maxLength={6} />
      <Action disabled={busy || code.length !== 6} onPress={() => void perform(async () => {
        if (revoking) await account.revokeOthers(view!.user!.email, code);
        else await account.verifyCode(email, code);
        setCode(''); setSent(false); setRevoking(false);
      }, revoking ? 'Other-device sessions ended. Offline copies cannot be recalled.' : 'Signed in. Your device draft has not been uploaded.')}>{revoking ? 'Confirm and sign out other devices' : 'Sign in'}</Action>
    </>}
    {remaining > 0 && <Copy>Another code can be requested in {remaining} seconds.</Copy>}
    {confirmOut && <>
      <Copy>Signing out or changing accounts requires discarding any unassociated private draft. Cancel to keep it. Saved account arrangements remain private to their owner.</Copy>
      <Action disabled={busy} onPress={() => { setView(null); void perform(async () => { await account.signOut(true); setConfirmOut(false); setSent(false); setCode(''); }); }}>Discard device draft and sign out</Action>
      <Action secondary disabled={busy} onPress={() => setConfirmOut(false)}>Cancel and keep draft</Action>
    </>}
    {!!notice && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ fontSize: 18, lineHeight: 28, color: colors.danger }}>{notice}</Text>}
  </Page>;
}
