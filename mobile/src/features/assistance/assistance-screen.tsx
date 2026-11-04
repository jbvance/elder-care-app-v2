import { router, useFocusEffect } from 'expo-router';
import { Fragment, useCallback, useRef, useState } from 'react';
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
  const completionBase = useRef<WorkItem | null>(null);
  const resolutionBase = useRef<WorkItem | null>(null);
  const [completionStale, setCompletionStale] = useState(false);
  const [resolutionStale, setResolutionStale] = useState(false);
  const [pendingCompletionScopes, setPendingCompletionScopes] = useState<string[]>([]);
  const [pendingResolutionScopes, setPendingResolutionScopes] = useState<string[]>([]);
  const [pendingCombinedScopes, setPendingCombinedScopes] = useState<string[]>([]);
  const [staleRejected, setStaleRejected] = useState(false);
  const [need, setNeed] = useState<NeedInput>(emptyNeed);
  const [choosingZone, setChoosingZone] = useState(false);
  const [notice, setNotice] = useState('');
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState<{ action: () => Promise<WorkOutcome>; success: (outcome: WorkOutcome) => string; completion: boolean; scope?: string; resolution: boolean } | null>(null);
  const generation = useRef(0);
  const active = useRef(false);
  const foreground = useRef(true);
  const [view, setView] = useState(initialView === 'accepted' ? 'accepted' : 'all');

  const load = useCallback(async (id = selectedRef.current) => {
    const request = ++generation.current;
    setItem(null); setDetailUnavailable(false);
    if (!active.current || !foreground.current) return false;
    let pendingResolutions: string[] = [], pendingCombined: string[] = [];
    try {
      pendingResolutions = await assistance.pendingResolutionScopes?.() ?? [];
      pendingCombined = await assistance.pendingCombinedScopes?.() ?? [];
      const entries = await assistance.list();
      const pending = await assistance.pendingCompletionScopes?.() ?? [];
      if (!active.current || !foreground.current || request !== generation.current) return false;
      setList(entries);
      setPendingCompletionScopes(pending.filter(scope => entries.some(entry => entry.id === scope && entry.accepted_by_me && !entry.completion_reported_at)));
      setPendingResolutionScopes(pendingResolutions);
      setPendingCombinedScopes(pendingCombined);
      if (!id) return true;
      try {
        const detail = await assistance.read(id);
        if (!detail.created && detail.coordinator) {
          const prepared = await assistance.preparedTiming(detail.id);
          detail.local_date = prepared.date; detail.local_time = prepared.time; detail.schedule_zone = prepared.zone || null;
        }
        if (detail.coordinator && detail.can_offer) detail.candidates = await assistance.candidates(detail.id);
        if (active.current && foreground.current && request === generation.current) {
          if (!completionBase.current && detail.accepted_by_me) completionBase.current = { ...detail };
          if (!resolutionBase.current && detail.can_resolve && !detail.resolved) resolutionBase.current = { ...detail };
          setItem(detail); setNotice(''); return true;
        }
        return false;
      } catch (error) {
        if (!active.current || request !== generation.current) return false;
        if (error instanceof AssistanceAccessDeniedError) {
          selectedRef.current = null; setSelected(null); setMode(null); setFormBase(null); completionBase.current = null; resolutionBase.current = null; setCompletionStale(false); setResolutionStale(false); setStaleRejected(false); setRetry(null); setItem(null);
          setNotice('That need is no longer available with current access. Your other authorized work is still listed.');
        } else {
          setDetailUnavailable(true);
          setNotice('Current details could not be loaded. Your unsaved entries are still here. Retry current details when the connection is available.');
        }
        return false;
      }
    } catch {
      if (active.current && request === generation.current) {
        setList([]); setPendingCompletionScopes([]); setPendingResolutionScopes(pendingResolutions); setPendingCombinedScopes(pendingCombined); setDetailUnavailable(!!id); setNotice('Current access could not be confirmed. Reconnect and check current requests.');
      }
      return false;
    }
  }, [assistance]);
  useFocusEffect(useCallback(() => {
    active.current = true; setList([]); setPendingCompletionScopes([]); setPendingResolutionScopes([]); setPendingCombinedScopes([]); setItem(null); void load();
    const unsub = account.subscribe(() => {
      ++generation.current; selectedRef.current = null; setSelected(null); completionBase.current = null; resolutionBase.current = null; setCompletionStale(false); setResolutionStale(false);
      setList([]); setPendingCompletionScopes([]); setPendingResolutionScopes([]); setPendingCombinedScopes([]); setItem(null); setDetailUnavailable(false); setMode(null); setFormBase(null); setStaleRejected(false); setRetry(null); setNotice(''); void load(null);
    });
    const app = AppState.addEventListener('change', state => {
      foreground.current = state === 'active'; ++generation.current; setList([]); setPendingCompletionScopes([]); setPendingResolutionScopes([]); setPendingCombinedScopes([]); setItem(null);
      if (foreground.current) void load();
    });
    return () => { active.current = false; ++generation.current; setList([]); setPendingCompletionScopes([]); setPendingResolutionScopes([]); setPendingCombinedScopes([]); setItem(null); unsub(); app.remove(); };
  }, [account, load]));

  function select(id: string) { selectedRef.current = id; setSelected(id); completionBase.current = list.find(entry => entry.id === id && entry.accepted_by_me) ?? null; resolutionBase.current = list.find(entry => entry.id === id && entry.can_resolve && !entry.resolved) ?? null; setCompletionStale(false); setResolutionStale(false); setDetailUnavailable(false); setMode(null); setFormBase(null); setStaleRejected(false); setRetry(null); setNotice(''); void load(id); }

  async function perform(action: () => Promise<WorkOutcome>, success: (outcome: WorkOutcome) => string, completion = false, completionScope?: string, resolution = false) {
    if (busy) return;
    setBusy(true); setNotice(''); setRetry(null); if (completion) setCompletionStale(false); if (resolution) setResolutionStale(false);
    try {
      const outcome = await action();
      if (!active.current) return;
      setMode(null); setFormBase(null); setStaleRejected(false); setChoosingZone(false);
      const next = outcome.id ?? completionScope ?? selected;
      if (completion && outcome.outcome === 'reported') resolutionBase.current = null;
      if (next !== selected) { selectedRef.current = next ?? null; setSelected(next ?? null); }
      if (await load(next)) setNotice(success(outcome));
      else if (completion && outcome.outcome === 'reported') setNotice('The backend acknowledged your completion report. Current details could not be confirmed; check current requests.');
      else if (resolution && (outcome.outcome === 'resolved' || outcome.outcome === 'already-resolved' || outcome.outcome === 'completed-and-resolved')) setNotice('The backend acknowledged need resolution. Current details could not be confirmed; check current needs.');
    } catch (error) {
      if (!active.current) return;
      if (resolution) {
        const pending = await assistance.pendingResolutionScopes?.() ?? [];
        const combined = await assistance.pendingCombinedScopes?.() ?? [];
        if (!active.current) return;
        setPendingResolutionScopes(pending); setPendingCombinedScopes(combined);
      }
      if (error instanceof AssistanceUncertainError) {
        setNotice(error.message); setRetry({ action, success, completion, scope: completionScope, resolution });
        if (completion) {
          const pending = await assistance.pendingCompletionScopes?.() ?? [];
          if (active.current) setPendingCompletionScopes(pending.filter(scope => list.some(entry => entry.id === scope && entry.accepted_by_me && !entry.completion_reported_at)));
        }
      } else if (error instanceof AssistanceStaleError && mode) {
        setStaleRejected(true);
        setNotice(`${error.message} Your entries are still here. Review current details before editing again.`);
      } else if (error instanceof AssistanceStaleError && completion) {
        if (completionScope && completionScope !== selected) {
          selectedRef.current = completionScope; setSelected(completionScope); completionBase.current = null;
          if (!await load(completionScope)) return;
        }
        setCompletionStale(true);
        setNotice('This responsibility changed before the report was accepted. Review current details before reporting again.');
      } else if (error instanceof AssistanceStaleError && resolution) {
        if (completionScope && completionScope !== selected) {
          selectedRef.current = completionScope; setSelected(completionScope); resolutionBase.current = null;
          if (!await load(completionScope)) return;
        }
        setResolutionStale(true);
        setNotice('This need changed before resolution was accepted. Review current details before choosing again.');
      } else if (error instanceof AssistanceAccessDeniedError && completion) {
        const retained = completionScope && completionScope !== selected ? selected : null;
        if (!retained) { selectedRef.current = null; setSelected(null); setItem(null); completionBase.current = null; setCompletionStale(false); }
        await load(retained);
        if (active.current) setNotice('Current access to this responsibility was denied. Your other authorized work is still listed.');
      } else if (error instanceof AssistanceAccessDeniedError && resolution) {
        const retained = completionScope && completionScope !== selected ? selected : null;
        if (!retained) { selectedRef.current = null; setSelected(null); setItem(null); resolutionBase.current = null; setResolutionStale(false); }
        await load(retained);
        if (active.current) setNotice('Current access to need resolution was denied. Your other authorized work is still listed.');
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
  const opportunities = list.filter(entry => !entry.resolved && entry.eligible && !entry.arranged && entry.my_answer !== 'declined');
  const declined = list.filter(entry => !entry.resolved && entry.eligible && !entry.arranged && entry.my_answer === 'declined');
  const coordination = list.filter(entry => entry.coordinator);
  const resolvedHistory = list.filter(entry => entry.resolved && !entry.coordinator && !entry.accepted_by_me);
  const formStale = !!(mode && formBase && item && (formBase.id !== item.id ||
    (mode === 'edit' ? formBase.material_revision !== item.material_revision : formBase.scope_revision !== item.scope_revision)));
  const showAll = view !== 'accepted';
  const combinedPending = !!item && pendingCombinedScopes.includes(item.id);
  return <AccountScreen account={account} invitationMode header={<>
    <Copy heading>Needs and opportunities</Copy>
    <Copy>Fictional development only. Seeing or joining a request is not accepting responsibility.</Copy>
    <Action secondary disabled={busy} onPress={() => { setNotice(''); void load(); }}>Check current requests</Action>
    <Action secondary onPress={() => setView(view === 'accepted' ? 'all' : 'accepted')}>{view === 'accepted' ? 'Show all needs and opportunities' : 'Show my accepted work'}</Action>
    <Copy heading>My accepted work</Copy>
    {accepted.length ? accepted.map(entry => <Fragment key={`mine-${entry.id}`}>
      <Action secondary onPress={() => select(entry.id)}>Open accepted work for {entry.older_adult}: {entry.task}{entry.completion_reported_at ? ' — reported complete' : ''}{entry.resolved ? ' — need resolved' : ''}</Action>
      {pendingCompletionScopes.includes(entry.id) && !entry.completion_reported_at && <>
        <Copy>Completion report unconfirmed for {entry.older_adult}: {entry.task}. It has not been shown as shared.</Copy>
        <Action secondary disabled={busy} onPress={() => void perform(() => assistance.retryPendingCompletion(entry.id), () => 'Completion report saved by the backend. Check the need status above.', true, entry.id)}>Retry the same completion report for {entry.older_adult}: {entry.task}</Action>
      </>}
    </Fragment>) : <Copy>No accepted work in your current authorized scopes.</Copy>}
    {pendingResolutionScopes.map(scope => {
      const entry = list.find(current => current.id === scope);
      const label = entry ? ` for ${entry.older_adult}: ${entry.task}` : '';
      return <Fragment key={`pending-resolution-${scope}`}>
        <Copy>Need resolution is unconfirmed{label}. Retry the same action to confirm its outcome.</Copy>
        <Action secondary disabled={busy} onPress={() => void perform(() => assistance.retryPendingResolution(scope), outcome => outcome.outcome === 'already-resolved' ? 'This need was already resolved.' : 'Need resolution saved by the backend.', false, scope, true)}>Retry the same resolution action{label}</Action>
      </Fragment>;
    })}
    {showAll && <>
      <Copy heading>Available requests</Copy>
      {opportunities.length ? opportunities.map(entry => <Action key={`open-${entry.id}`} secondary onPress={() => select(entry.id)}>Open request for {entry.older_adult}: {entry.task}</Action>) : <Copy>No available requests in your current authorized scopes.</Copy>}
      {!!declined.length && <><Copy heading>Previously declined</Copy>{declined.map(entry => <Action key={`declined-${entry.id}`} secondary onPress={() => select(entry.id)}>Reconsider {entry.task} for {entry.older_adult}</Action>)}</>}
      {!!resolvedHistory.length && <><Copy heading>Resolved needs</Copy>{resolvedHistory.map(entry => <Action key={`resolved-${entry.id}`} secondary onPress={() => select(entry.id)}>Open resolved need for {entry.older_adult}: {entry.task}</Action>)}</>}
      <Copy heading>Coordination needs</Copy>
      {coordination.length ? coordination.map(entry => <Action key={`coordinate-${entry.id}`} secondary onPress={() => select(entry.id)}>Open {entry.older_adult}: {entry.task || 'record first need'} — {entry.resolved ? 'need resolved' : entry.arranged ? 'arranged, need unresolved' : 'unresolved'}</Action>) : <Copy>No authorized coordination needs here. Record applicable permission in Scoped participation if you are coordinating.</Copy>}
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
      <Copy>{item.arranged ? item.accepted_by_me ? 'You accepted this assistance responsibility.' : 'This assistance is already arranged.' : item.resolved ? 'No assistance commitment was recorded before resolution.' : 'Assistance is not arranged yet.'}</Copy>
      {item.resolved ? <>
        <Copy>Need resolved at {new Date(item.resolved_at!).toLocaleString()} by {item.resolved_by || 'an authorized participant'}. This is an attributable report, not independent verification.</Copy>
        {item.arranged && !item.completion_reported_at && <Copy>Accepted assistance remains outstanding and needs follow-up. Resolution did not complete or cancel it.</Copy>}
      </> : <Copy>The need is unresolved until someone expressly resolves it.</Copy>}
      {item.coordinator && item.arranged && item.accepted_by && <Copy>Accepted by {item.accepted_by}{item.accepted_at ? ` at ${new Date(item.accepted_at).toLocaleString()}` : ''}.</Copy>}
      {item.completion_reported_at && <>
        <Copy>{item.completion_reported_by_me ? 'You reported this assistance complete' : item.coordinator && item.accepted_by ? `Reported complete by ${item.accepted_by}` : 'This assistance was reported complete'} at {new Date(item.completion_reported_at).toLocaleString()}.</Copy>
        <Copy>This is a report, not independent verification. {item.resolved ? 'Need resolution was expressly recorded.' : 'The need remains unresolved until someone expressly resolves it.'}</Copy>
      </>}
      {item.accepted_by_me && !item.completion_reported_at && !!item.commitment_id && <>
        <Action disabled={busy || completionStale || combinedPending} onPress={() => {
          const opened = completionBase.current;
          if (opened) void perform(() => assistance.complete(opened), () => 'Completion report saved by the backend. Check the need status above.', true, opened.id);
        }}>Report my assistance complete</Action>
        <Copy>Report only the assistance you accepted. This does not verify the outcome or resolve the need.</Copy>
      </>}
      {completionStale && <Action secondary disabled={busy} onPress={() => { completionBase.current = null; setCompletionStale(false); setNotice(''); void load(selectedRef.current); }}>Review current responsibility</Action>}
      {item.can_resolve && !item.resolved && <>
        {item.arranged && !item.completion_reported_at && <Copy>Accepted assistance is still outstanding. Resolve only if the underlying need was genuinely addressed; this action will leave that responsibility requiring follow-up.</Copy>}
        <Action disabled={busy || resolutionStale || combinedPending} onPress={() => {
          const opened = resolutionBase.current;
          if (opened) void perform(() => assistance.resolve(opened), outcome => outcome.outcome === 'already-resolved' ? 'This need was already resolved.' : 'Need resolution saved by the backend.', false, opened.id, true);
        }}>Resolve this need</Action>
        {item.accepted_by_me && !item.completion_reported_at && !!item.commitment_id && <Action secondary disabled={busy || resolutionStale || completionStale || combinedPending} onPress={() => {
          const opened = resolutionBase.current;
          if (opened) void perform(() => assistance.completeAndResolve(opened), () => 'Your completion report and express need resolution were saved together by the backend.', false, opened.id, true);
        }}>Report my assistance complete and resolve this need</Action>}
      </>}
      {resolutionStale && <Action secondary disabled={busy} onPress={() => { resolutionBase.current = null; setResolutionStale(false); setNotice(''); void load(selectedRef.current); }}>Review current need</Action>}
      {item.my_answer === 'deferred' && !item.arranged && !item.resolved && <Copy>You deferred this request. You can reconsider while it remains available.</Copy>}
      {item.coordinator && !item.created && !item.resolved && <Action disabled={busy} onPress={() => openForm('first')}>Record this first need</Action>}
      {item.can_create_other && <Action secondary disabled={busy} onPress={() => openForm('another')}>Create another need for {item.older_adult}</Action>}
      {item.coordinator && item.created && !item.arranged && !item.resolved && <Action secondary disabled={busy} onPress={() => openForm('edit')}>Edit unaccepted need</Action>}
      {item.coordinator && item.arranged && <Copy>Accepted task, place, scheduled time and essential instructions need an explicit change workflow. This slice preserves the commitment.</Copy>}
      {item.can_offer && !item.resolved && <>
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
      {item.eligible && !item.arranged && !item.resolved && <>
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
    {retry && <Action secondary disabled={busy} onPress={() => void perform(retry.action, retry.completion || retry.resolution ? retry.success : () => 'Action confirmed. Check the current request state above.', retry.completion, retry.scope, retry.resolution)}>Retry the same action</Action>}
    {!!notice && <Copy>{notice}</Copy>}
  </>} />;
}
