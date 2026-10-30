import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Account } from '../account/account-service';
import { AccountScreen } from '../account/account-screen';
import { Action, Copy, Field } from '../private-draft/draft-ui';
import { AssistanceAccessDeniedError, AssistanceStaleError, AssistanceUncertainError, type Assistance, type NeedInput, type WorkItem, type WorkOutcome } from './assistance-service';
import { localSchedule, namedZones, scheduleLabels } from './schedule';

type Mode = 'first' | 'another' | 'edit' | null;
function emptyNeed(): NeedInput { return { task: '', place: '', instructions: '', date: '', time: '', zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }; }
function fromItem(item: WorkItem): NeedInput { return { task: item.task || '', place: item.place || '', instructions: item.instructions || '', date: item.local_date || '', time: item.local_time || '', zone: item.schedule_zone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }; }

export function AssistanceScreen({ account, assistance, initialId, initialView }: {
  account: Account; assistance: Assistance; initialId?: string; initialView?: string;
}) {
  const [list, setList] = useState<WorkItem[]>([]);
  const [selected, setSelected] = useState<string | null>(initialId ?? null);
  const selectedRef = useRef<string | null>(initialId ?? null);
  const [item, setItem] = useState<WorkItem | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [formBase, setFormBase] = useState<WorkItem | null>(null);
  const [staleRejected, setStaleRejected] = useState(false);
  const [need, setNeed] = useState<NeedInput>(emptyNeed);
  const [choosingZone, setChoosingZone] = useState(false);
  const [notice, setNotice] = useState('');
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState<(() => Promise<WorkOutcome>) | null>(null);
  const generation = useRef(0);
  const active = useRef(false);
  const foreground = useRef(true);
  const [view, setView] = useState(initialView === 'accepted' ? 'accepted' : 'all');

  const load = useCallback(async (id = selectedRef.current) => {
    const request = ++generation.current;
    setItem(null); setDetailUnavailable(false);
    if (!active.current || !foreground.current) return false;
    try {
      const entries = await assistance.list();
      if (!active.current || !foreground.current || request !== generation.current) return false;
      setList(entries);
      if (!id) return true;
      try {
        const detail = await assistance.read(id);
        if (!detail.created && detail.coordinator) {
          const prepared = await assistance.preparedTiming(detail.id);
          detail.local_date = prepared.date; detail.local_time = prepared.time; detail.schedule_zone = prepared.zone || null;
        }
        if (detail.coordinator && detail.can_offer) detail.candidates = await assistance.candidates(detail.id);
        if (active.current && foreground.current && request === generation.current) { setItem(detail); setNotice(''); return true; }
        return false;
      } catch (error) {
        if (!active.current || request !== generation.current) return false;
        if (error instanceof AssistanceAccessDeniedError) {
          selectedRef.current = null; setSelected(null); setMode(null); setFormBase(null); setStaleRejected(false); setRetry(null); setItem(null);
          setNotice('That need is no longer available with current access. Your other authorized work is still listed.');
        } else {
          setDetailUnavailable(true);
          setNotice('Current details could not be loaded. Your unsaved entries are still here. Retry current details when the connection is available.');
        }
        return false;
      }
    } catch {
      if (active.current && request === generation.current) {
        setList([]); setDetailUnavailable(!!id); setNotice('Current access could not be confirmed. Reconnect and check current requests.');
      }
      return false;
    }
  }, [assistance]);
  useFocusEffect(useCallback(() => {
    active.current = true; setList([]); setItem(null); void load();
    const unsub = account.subscribe(() => {
      ++generation.current; selectedRef.current = null; setSelected(null);
      setList([]); setItem(null); setDetailUnavailable(false); setMode(null); setFormBase(null); setStaleRejected(false); setRetry(null); setNotice(''); void load(null);
    });
    const app = AppState.addEventListener('change', state => {
      foreground.current = state === 'active'; ++generation.current; setList([]); setItem(null);
      if (foreground.current) void load();
    });
    return () => { active.current = false; ++generation.current; setList([]); setItem(null); unsub(); app.remove(); };
  }, [account, load]));

  function select(id: string) { selectedRef.current = id; setSelected(id); setDetailUnavailable(false); setMode(null); setFormBase(null); setStaleRejected(false); setRetry(null); setNotice(''); void load(id); }

  async function perform(action: () => Promise<WorkOutcome>, success: (outcome: WorkOutcome) => string) {
    if (busy) return;
    setBusy(true); setNotice(''); setRetry(null);
    try {
      const outcome = await action();
      if (!active.current) return;
      setMode(null); setFormBase(null); setStaleRejected(false); setChoosingZone(false);
      const next = outcome.id ?? selected;
      if (next !== selected) { selectedRef.current = next ?? null; setSelected(next ?? null); }
      if (await load(next)) setNotice(success(outcome));
    } catch (error) {
      if (!active.current) return;
      if (error instanceof AssistanceUncertainError) {
        setNotice(error.message); setRetry(() => action);
      } else if (error instanceof AssistanceStaleError && mode) {
        setStaleRejected(true);
        setNotice(`${error.message} Your entries are still here. Review current details before editing again.`);
      } else {
        setNotice(error instanceof Error ? error.message : 'This action is unavailable. Check the request again.');
      }
    } finally { if (active.current) setBusy(false); }
  }
  function change<K extends keyof NeedInput>(key: K, value: NeedInput[K]) { setNeed(current => ({ ...current, [key]: value })); }
  function openForm(next: Mode) {
    if (!item) return;
    setFormBase({ ...item }); setStaleRejected(false);
    setMode(next); setNeed(next === 'another' ? { ...emptyNeed(), zone: item.schedule_zone || emptyNeed().zone } : fromItem(item));
    setNotice('');
  }
  function save() {
    if (!formBase || !mode) return;
    if (!need.task.trim()) { setNotice('Add a brief task. Your entries are still here.'); return; }
    if (Boolean(need.date) !== Boolean(need.time)) { setNotice('Add both a date and a time, or leave this need unscheduled. Your entries are still here.'); return; }
    const schedule = localSchedule(need.date, need.time, need.zone);
    if (schedule.error) { setNotice(schedule.error); return; }
    const payload = { ...need, zone: schedule.instant ? need.zone : '' };
    const action = mode === 'first' ? () => assistance.createFirst(formBase, payload) : mode === 'another' ? () => assistance.createAnother(formBase, payload) : () => assistance.update(formBase, payload);
    void perform(action, () => mode === 'edit' ? 'Need details saved. The request remains unresolved until someone accepts.' : 'Need recorded. Assistance is not arranged until a Helper accepts.');
  }
  const accepted = list.filter(entry => entry.accepted_by_me);
  const opportunities = list.filter(entry => entry.eligible && !entry.arranged && entry.my_answer !== 'declined');
  const declined = list.filter(entry => entry.eligible && !entry.arranged && entry.my_answer === 'declined');
  const coordination = list.filter(entry => entry.coordinator);
  const formStale = !!(mode && formBase && item && (formBase.id !== item.id ||
    (mode === 'edit' ? formBase.material_revision !== item.material_revision : formBase.scope_revision !== item.scope_revision)));
  const showAll = view !== 'accepted';
  return <AccountScreen account={account} invitationMode header={<>
    <Copy heading>Needs and opportunities</Copy>
    <Copy>Fictional development only. Seeing or joining a request is not accepting responsibility.</Copy>
    <Action secondary disabled={busy} onPress={() => { setNotice(''); void load(); }}>Check current requests</Action>
    <Action secondary onPress={() => setView(view === 'accepted' ? 'all' : 'accepted')}>{view === 'accepted' ? 'Show all needs and opportunities' : 'Show my accepted work'}</Action>
    <Copy heading>My accepted work</Copy>
    {accepted.length ? accepted.map(entry => <Action key={`mine-${entry.id}`} secondary onPress={() => select(entry.id)}>Open accepted work for {entry.older_adult}: {entry.task}</Action>) : <Copy>No accepted work in your current authorized scopes.</Copy>}
    {showAll && <>
      <Copy heading>Available requests</Copy>
      {opportunities.length ? opportunities.map(entry => <Action key={`open-${entry.id}`} secondary onPress={() => select(entry.id)}>Open request for {entry.older_adult}: {entry.task}</Action>) : <Copy>No available requests in your current authorized scopes.</Copy>}
      {!!declined.length && <><Copy heading>Previously declined</Copy>{declined.map(entry => <Action key={`declined-${entry.id}`} secondary onPress={() => select(entry.id)}>Reconsider {entry.task} for {entry.older_adult}</Action>)}</>}
      <Copy heading>Coordination needs</Copy>
      {coordination.length ? coordination.map(entry => <Action key={`coordinate-${entry.id}`} secondary onPress={() => select(entry.id)}>Open {entry.older_adult}: {entry.task || 'record first need'} — {entry.arranged ? 'arranged' : 'unresolved'}</Action>) : <Copy>No authorized coordination needs here. Record applicable permission in Scoped participation if you are coordinating.</Copy>}
    </>}
    {item && <>
      <Copy heading>Request details for {item.older_adult}</Copy>
      <Copy>{item.task || 'This need has not been recorded as a request yet.'}</Copy>
      {!!item.place && <Copy>Place: {item.place}</Copy>}
      {!!item.instructions && <Copy>Practical instructions: {item.instructions}</Copy>}
      {item.scheduled_at && item.schedule_zone ? <>
        <Copy>Scheduled time: {scheduleLabels(item.scheduled_at, item.schedule_zone).authoritative}</Copy>
        <Copy>Your local time: {scheduleLabels(item.scheduled_at, item.schedule_zone).participant}</Copy>
      </> : <Copy>No scheduled time.</Copy>}
      <Copy>{item.arranged ? item.accepted_by_me ? 'You accepted this assistance responsibility.' : 'This assistance is already arranged.' : 'Assistance is not arranged yet.'}</Copy>
      {item.coordinator && item.arranged && item.accepted_by && <Copy>Accepted by {item.accepted_by}{item.accepted_at ? ` at ${new Date(item.accepted_at).toLocaleString()}` : ''}.</Copy>}
      {item.my_answer === 'deferred' && !item.arranged && <Copy>You deferred this request. You can reconsider while it remains available.</Copy>}
      {item.coordinator && !item.created && <Action disabled={busy} onPress={() => openForm('first')}>Record this first need</Action>}
      {item.can_create_other && <Action secondary disabled={busy} onPress={() => openForm('another')}>Create another need for {item.older_adult}</Action>}
      {item.coordinator && item.created && !item.arranged && <Action secondary disabled={busy} onPress={() => openForm('edit')}>Edit unaccepted need</Action>}
      {item.coordinator && item.arranged && <Copy>Accepted task, place, scheduled time and essential instructions need an explicit change workflow. This slice preserves the commitment.</Copy>}
      {item.can_offer && <>
        <Copy heading>Make this request available</Copy>
        <Copy>Choosing a Helper also shares this need&apos;s existing practical details. It does not grant restricted background or accept work for them.</Copy>
        {item.candidates?.filter(candidate => candidate.offered).map(candidate => <Copy key={`offered-${candidate.user_id}`}>Available to {candidate.label}; no commitment yet.</Copy>)}
        {item.candidates?.filter(candidate => !candidate.offered).map(candidate => <Action key={candidate.user_id} secondary disabled={busy} onPress={() => void perform(() => assistance.offer(item, candidate.user_id), () => `Available to ${candidate.label}. Assistance is still unclaimed.`)}>Make available to {candidate.label}</Action>)}
        {!item.candidates?.length && <Copy>Invite an eligible Helper through Scoped participation, then return here.</Copy>}
        <Action secondary onPress={() => router.push({ pathname: '/participation', params: { id: item.id } })}>Open scoped participation for this need</Action>
      </>}
      {item.can_create_other && !!item.candidates?.length && <>
        <Copy heading>Future need audience</Copy>
        <Copy>Deliberately include an authorized Helper in all new needs created in this coordination context after this choice. Their practical details will be visible to that Helper. Existing needs do not change.</Copy>
        {item.candidates.filter(candidate => !candidate.ongoing).map(candidate => <Action key={`ongoing-${candidate.user_id}`} secondary disabled={busy} onPress={() => void perform(() => assistance.ongoing(item, candidate.user_id, true), () => `Future need audience includes ${candidate.label}.`)}>Include {candidate.label} for future needs</Action>)}
        {item.candidates.filter(candidate => candidate.ongoing).map(candidate => <Action key={`stop-ongoing-${candidate.user_id}`} secondary disabled={busy} onPress={() => void perform(() => assistance.ongoing(item, candidate.user_id, false), () => `Future new needs will no longer automatically include ${candidate.label}. Existing access is unchanged.`)}>Stop automatic inclusion for {candidate.label}</Action>)}
      </>}
      {item.eligible && !item.arranged && <>
        <Action disabled={busy} onPress={() => void perform(() => assistance.accept(item), outcome => outcome.outcome === 'already-arranged' ? 'Someone else already arranged this assistance. Your response did not replace it.' : 'You accepted this assistance responsibility.')}>Accept responsibility</Action>
        <Action secondary disabled={busy} onPress={() => void perform(() => assistance.answer(item, 'declined'), () => 'You declined this request. The need remains unresolved for others.')}>Decline this request</Action>
        <Action secondary disabled={busy} onPress={() => void perform(() => assistance.answer(item, 'deferred'), () => 'You deferred this request. No commitment was made.')}>Defer for now</Action>
      </>}
    </>}
    {mode && item && <>
      <Copy heading>{mode === 'edit' ? 'Edit unaccepted need' : 'Record a need'}</Copy>
      {(formStale || staleRejected) && <>
        <Copy>This need changed while the form was open. Your entries are still here. Saving uses the revision from when you opened it.</Copy>
        <Action secondary disabled={busy} onPress={() => { setMode(null); setFormBase(null); setStaleRejected(false); setNotice(''); void load(); }}>Review current details</Action>
      </>}
      <Field label="Assistance needed" value={need.task} onChangeText={value => change('task', value)} multiline maxLength={8000} editable={!busy} />
      <Field label="Practical place (optional)" value={need.place} onChangeText={value => change('place', value)} maxLength={8000} editable={!busy} />
      <Field label="Performance-critical practical instructions (optional)" value={need.instructions} onChangeText={value => change('instructions', value)} multiline maxLength={8000} editable={!busy} />
      <Copy>Leave date and time blank if this need is unscheduled.</Copy>
      <Field label="Date (month/day/year)" value={need.date} onChangeText={value => change('date', value)} maxLength={10} editable={!busy} />
      <Field label="Time (for example 10:00 AM)" value={need.time} onChangeText={value => change('time', value)} maxLength={8} editable={!busy} />
      <Action secondary disabled={busy} onPress={() => setChoosingZone(!choosingZone)}>Time zone: {need.zone.replaceAll('_', ' ')}</Action>
      {choosingZone && namedZones.map(([zone, label]) => <Action key={zone} secondary onPress={() => { change('zone', zone); setChoosingZone(false); }}>{label} ({zone.replaceAll('_', ' ')})</Action>)}
      <Action disabled={busy} onPress={save}>Save need</Action>
      <Action secondary disabled={busy} onPress={() => { setMode(null); setFormBase(null); setStaleRejected(false); setNotice(''); }}>Close without saving</Action>
    </>}
    {detailUnavailable && selected && <Action secondary disabled={busy} onPress={() => void load(selectedRef.current)}>Retry current details</Action>}
    {retry && <Action secondary disabled={busy} onPress={() => void perform(retry, () => 'Action confirmed. Check the current request state above.')}>Retry the same action</Action>}
    {!!notice && <Copy>{notice}</Copy>}
  </>} />;
}
