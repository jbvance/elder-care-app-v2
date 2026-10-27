import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Text } from 'react-native';

import { Action, Copy, Field, Page, useDraftColors } from './draft-ui';
import type { PrivateDraft, PrivateDraftStore } from './protected-store';

function emptyDraft(): PrivateDraft {
  return { olderAdult: '', description: '', location: '', date: '', time: '', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', prepared: false };
}

const zones = [
  ['America/New_York', 'Eastern'], ['America/Chicago', 'Central'],
  ['America/Denver', 'Mountain'], ['America/Phoenix', 'Arizona'],
  ['America/Los_Angeles', 'Pacific'], ['America/Anchorage', 'Alaska'],
  ['Pacific/Honolulu', 'Hawaii'], ['America/Puerto_Rico', 'Puerto Rico'],
];

function validation(draft: PrivateDraft): string | null {
  if (!draft.olderAdult.trim() || !draft.description.trim()) return 'Add a name or nickname and a brief description. Your unfinished draft stays here.';
  if (draft.date) {
    const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(draft.date);
    const date = parts ? new Date(Date.UTC(+parts[3], +parts[1] - 1, +parts[2])) : null;
    if (!parts || !date || date.getUTCFullYear() !== +parts[3] || date.getUTCMonth() !== +parts[1] - 1 || date.getUTCDate() !== +parts[2]) return 'Use a real date in month/day/year format, such as 10/25/2026. Your entries are still here.';
  }
  if (draft.time && (!draft.date || !/^(0?[1-9]|1[0-2]):[0-5]\d\s?(am|pm)$/i.test(draft.time))) return 'For a timed need, add a date and a time such as 10:00 AM. Your entries are still here.';
  if (draft.time) {
    const [month, day, year] = draft.date.split('/').map(Number);
    const clock = /^(\d{1,2}):(\d{2})\s?(am|pm)$/i.exec(draft.time)!;
    const hour = (+clock[1] % 12) + (clock[3].toLowerCase() === 'pm' ? 12 : 0);
    const minute = +clock[2];
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: draft.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      });
      let matches = 0;
      const wallClock = Date.UTC(year, month - 1, day, hour, minute);
      // Check possible modern named-zone offsets, including quarter-hour offsets.
      // This validates a single private date/time; it is not a recurrence engine.
      for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
        const parts = Object.fromEntries(formatter.formatToParts(new Date(wallClock + offset * 60_000)).map(({ type, value }) => [type, value]));
        if (+parts.year === year && +parts.month === month && +parts.day === day && +parts.hour === hour && +parts.minute === minute) matches++;
      }
      if (matches === 0) return 'That local time does not occur because the clocks change. Choose another time or leave the time blank for now.';
      if (matches > 1) return 'That local time occurs twice because the clocks change. Choose another time or leave the time blank for now.';
    } catch {
      return 'We could not confirm that time zone. Choose a listed time zone or leave the time blank for now.';
    }
  }
  return null;
}

export function DraftEditor({ store, onDone, onUnsavedChange, navigationNotice }: {
  store: PrivateDraftStore;
  onDone(): void;
  onUnsavedChange?(unsaved: boolean): void;
  navigationNotice?: string;
}) {
  const colors = useDraftColors();
  const [draft, setDraft] = useState<PrivateDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState(false);
  const [choosingZone, setChoosingZone] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const latest = useRef(draft);
  const revision = useRef(0);
  const mounted = useRef(true);
  const canEdit = useRef(false);
  const dirty = useRef(false);

  function restore() {
    canEdit.current = false;
    return store.load().then((saved) => {
      if (!mounted.current) return;
      setError('');
      const restored = saved ?? emptyDraft();
      latest.current = restored;
      setDraft(restored);
      setDetails(Boolean(restored.date || restored.time || restored.location));
      canEdit.current = true;
      setStatus(saved ? savedMessage() : 'Nothing has been shared.');
    }).catch(() => {
      if (mounted.current) setError('We could not open protected storage. Try again, or choose Discard draft to remove the unreadable local draft and start over. Discarding cannot be undone.');
    }).finally(() => { if (mounted.current) setLoading(false); });
  }

  function savedMessage() {
    return Platform.OS === 'web' ? 'Preview only — not saved after reload' : 'Saved privately on this device';
  }

  async function persist(next: PrivateDraft) {
    const currentRevision = ++revision.current;
    dirty.current = true;
    onUnsavedChange?.(true);
    setStatus('Saving privately…');
    try {
      await store.save(next);
      if (!mounted.current || currentRevision !== revision.current) return false;
      dirty.current = false;
      onUnsavedChange?.(false);
      setStatus(savedMessage());
      return true;
    } catch {
      if (mounted.current && currentRevision === revision.current) {
        setStatus('Save not confirmed on this device');
        setError('We could not confirm whether these changes were saved. Your entries are still on this screen. Try saving again before closing the app.');
      }
      return false;
    }
  }

  useEffect(() => {
    mounted.current = true;
    void restore();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && dirty.current && canEdit.current) void persist(latest.current);
    });
    return () => { mounted.current = false; subscription.remove(); };
    // A store is stable for the lifetime of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  function update(patch: Partial<PrivateDraft>) {
    if (busy || confirmDiscard || !canEdit.current) return;
    const next = { ...latest.current, ...patch, prepared: false };
    latest.current = next;
    setDraft(next);
    setError('');
    void persist(next);
  }

  async function finish() {
    const message = validation(latest.current);
    if (message) { setError(message); return; }
    setBusy(true);
    setError('');
    const next = { ...latest.current, prepared: true };
    latest.current = next;
    setDraft(next);
    const saved = await persist(next);
    if (mounted.current) setBusy(false);
    if (saved) onDone();
  }

  async function discard() {
    setBusy(true);
    dirty.current = false;
    canEdit.current = false;
    ++revision.current;
    try {
      await store.discard();
      dirty.current = false;
      onUnsavedChange?.(false);
      latest.current = emptyDraft();
      setDraft(latest.current);
      setConfirmDiscard(false);
      setError('');
      setStatus('Draft discarded');
      canEdit.current = true;
      onDone();
    } catch { setError('The draft could not be fully discarded. Please try again.'); }
    finally { if (mounted.current) setBusy(false); }
  }

  return (
    <Page>
      <Copy heading>Prepare assistance</Copy>
      <Copy>Private preparation. No account needed.</Copy>
      {Platform.OS === 'web' && <Copy>Browser preview: fictional information only. Drafts are held in memory and are lost on reload.</Copy>}
      <Copy>Assistance has not been arranged. Nothing has been shared.</Copy>
      {!!navigationNotice && <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 18, lineHeight: 28 }}>{navigationNotice}</Text>}
      {loading ? <Copy>Opening your private draft…</Copy> : canEdit.current && <>
        <Field label="Who is the assistance for?" placeholder="A name or nickname" editable={!busy && !confirmDiscard} maxLength={120} value={draft.olderAdult} onChangeText={(olderAdult) => update({ olderAdult })} />
        <Field label="What assistance is needed?" placeholder="For example, a ride to an appointment" editable={!busy && !confirmDiscard} multiline maxLength={3000} value={draft.description} onChangeText={(description) => update({ description })} />
        <Action secondary onPress={() => setDetails(!details)}>{details ? 'Hide optional details' : 'Add date, time or place (optional)'}</Action>
        {details && <>
          <Field label="Date (optional, month/day/year)" placeholder="10/25/2026" maxLength={10} value={draft.date} onChangeText={(date) => update({ date })} />
          <Field label="Time (optional)" placeholder="10:00 AM" maxLength={10} value={draft.time} onChangeText={(time) => update({ time })} />
          <Copy>Use the local time where assistance will take place.</Copy>
          <Action secondary onPress={() => setChoosingZone(!choosingZone)}>Time zone: {draft.timeZone.replaceAll('_', ' ')}</Action>
          {choosingZone && zones.map(([timeZone, label]) => <Action key={timeZone} secondary onPress={() => { update({ timeZone }); setChoosingZone(false); }}>{label} ({timeZone.replaceAll('_', ' ')})</Action>)}
          <Field label="Place or address (optional)" maxLength={500} value={draft.location} onChangeText={(location) => update({ location })} />
        </>}
        <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, fontSize: 16, lineHeight: 24 }}>{status}</Text>
      </>}
      {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ color: colors.danger, fontSize: 18, lineHeight: 28 }}>{error}</Text>}
      {!!error && canEdit.current && !confirmDiscard && <Action secondary disabled={busy} onPress={() => { setError(''); void persist(latest.current); }}>Try saving again</Action>}
      {!loading && !canEdit.current && <Action onPress={() => { setLoading(true); void restore(); }}>Try opening again</Action>}
      {!loading && canEdit.current && <Action disabled={busy} onPress={() => void finish()}>Done for now</Action>}
      {!loading && <Action secondary disabled={busy} onPress={() => setConfirmDiscard(true)}>Discard draft</Action>}
      {confirmDiscard && <>
        <Copy>Discard this private draft? Its contents will be removed from this device. This cannot be undone.</Copy>
        <Action disabled={busy} onPress={() => void discard()}>Discard this draft</Action>
        <Action secondary disabled={busy} onPress={() => setConfirmDiscard(false)}>Keep draft</Action>
      </>}
      <Copy>Use fictional information during development. Anyone using an already-unlocked device may be able to view this draft.</Copy>
    </Page>
  );
}
