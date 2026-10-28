import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Clipboard } from 'react-native';
import type { Account } from '../account/account-service';
import { AccountScreen } from '../account/account-screen';
import { Action, Copy, Field } from '../private-draft/draft-ui';
import { coordinationRights, type Participation, type Rights, type ScopeContext, type ScopeEntry } from './participation-service';
import type { Invitations } from '../invitations/invitation-service';

const separatePowers: [keyof Omit<Rights, 'preset' | 'practical'>, string][] = [
  ['manage', 'Invite and remove within this need'], ['delegate', 'Delegate participation management'],
  ['background', 'Read restricted background'], ['share_background', 'Authorize restricted readers'],
  ['disclose', 'Broaden the practical audience'], ['cancel', 'Cancellation authority for later workflows'],
  ['resolve', 'Resolution capability for later workflows'], ['external', 'External disclosure authority for later workflows'],
];
export function rightsDescription(r: Rights) {
  return [r.preset === 'coordinator' ? 'Coordinator for this need' : 'Helper for this need', r.practical ? 'practical information' : 'practical access paused', ...separatePowers.filter(([key]) => r[key]).map(([,label]) => label)].join('; ');
}

export function ParticipationScreen({ account, participation, invitations, initialId }: { account: Account; participation: Participation; invitations?: Pick<Invitations, 'issue'>; initialId?: string }) {
  const [entries, setEntries] = useState<ScopeEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(initialId ?? null);
  const [view, setView] = useState<ScopeContext | null>(null);
  const [source, setSource] = useState('');
  const [kind, setKind] = useState<'reported' | 'direct'>('reported');
  const [initialRights, setInitialRights] = useState<Rights>(coordinationRights);
  const [target, setTarget] = useState<string | null>(null);
  const [proposed, setProposed] = useState<Rights | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [background, setBackground] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [additional, setAdditional] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const active = useRef(false);
  const foreground = useRef(true);
  const invalidate = useCallback(() => {
    ++generation.current; setView(null); setEntries([]); setTarget(null); setProposed(null);
    setDescription(''); setLocation(''); setBackground(''); setSource(''); setAdvanced(false);
    setSuggestion(''); setAdditional(''); setKind('reported'); setInitialRights(coordinationRights);
    setRecipient('');
  }, []);
  const load = useCallback(async () => {
    invalidate(); const request = generation.current;
    if (!active.current || !foreground.current) return;
    try {
      const list = await participation.list();
      const entry = list.find(e => e.id === selected);
      const context = entry?.prepared ? await participation.read(entry.id) : null;
      if (!active.current || !foreground.current || request !== generation.current) return;
      setEntries(list); setView(context);
      if (context) { setSource(context.permission_source ?? ''); setDescription(context.summary?.description ?? ''); setLocation(context.summary?.location ?? ''); setBackground(context.background ?? ''); }
    } catch { if (active.current && request === generation.current) setNotice('Current access could not be confirmed. Reconnect and check again.'); }
  }, [invalidate, participation, selected]);
  useFocusEffect(useCallback(() => { active.current = true; setBusy(false); void load(); return () => { active.current = false; invalidate(); }; }, [load, invalidate]));
  useEffect(() => {
    const refresh = () => { invalidate(); if (active.current && foreground.current) void load(); };
    const unsubAccount = account.subscribe(refresh), unsubParticipation = participation.subscribe(refresh);
    const app = AppState.addEventListener('change', state => { foreground.current = state === 'active'; invalidate(); if (foreground.current && active.current) void load(); });
    return () => { unsubAccount(); unsubParticipation(); app.remove(); };
  }, [account, participation, invalidate, load]);
  async function perform(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true); setNotice('');
    try { await action(); if (active.current) { await load(); setNotice(success); } }
    catch (error) { if (active.current) { invalidate(); setNotice(error instanceof Error ? error.message : 'Operation could not be confirmed. Check current access.'); } }
    finally { if (active.current) setBusy(false); }
  }
  const entry = entries.find(e => e.id === selected);
  function powerButtons(rights: Rights, change: (next: Rights) => void) {
    return separatePowers.map(([key,label]) => <Action key={key} secondary disabled={busy || (key === 'resolve' && rights.preset === 'coordinator')} onPress={() => {
      const next = { ...rights, [key]: !rights[key] };
      if (key === 'delegate' && next.delegate) next.manage = true;
      if (key === 'manage' && !next.manage) next.delegate = false;
      if (key === 'share_background' && next.share_background) next.background = true;
      if (key === 'background' && !next.background) next.share_background = false;
      change(next);
    }}>{rights[key] ? 'Included: ' : 'Not included: '}{label}</Action>);
  }
  return <AccountScreen account={account} invitationMode header={<>
    <Copy heading>Scoped participation</Copy>
    <Copy>Fictional development only. A preset establishes no legal authority. Joining and suggestions accept no assistance responsibility.</Copy>
    <Action disabled={busy} onPress={() => { setNotice(''); void load(); }}>Check current access</Action>
    {entries.map(item => <Action key={item.id} secondary disabled={busy} onPress={() => { setSelected(item.id); setNotice(''); }}>{item.prepared ? 'Open scope: ' : 'Prepare scoped permission: '}{item.title}</Action>)}
    {entry && !entry.prepared && <>
      <Copy heading>Record applicable permission</Copy>
      <Copy>For ongoing coordination of prepared need scopes in this arrangement: coordinate, invite and remove, and disclose the practical summary to designated helpers. Coordinator resolution capability is recorded for later use. Other powers remain separate. Nothing is shared by ownership alone.</Copy>
      <Field label="Who authorized this scope?" value={source} onChangeText={setSource} editable={!busy} maxLength={254} />
      <Action secondary disabled={busy} onPress={() => setAdvanced(!advanced)}>Additional permission already obtained</Action>
      {advanced && powerButtons(initialRights, setInitialRights)}
      <Copy>{rightsDescription(initialRights)}</Copy>
      <Action disabled={busy || !source.trim()} onPress={() => void perform(() => participation.start(entry.id, 'reported', source, initialRights), 'Reported permission recorded. This is not independently verified consent.')}>Record reported coordination permission</Action>
      <Action secondary disabled={busy} onPress={() => void perform(() => participation.start(entry.id, 'direct', 'Own permission', initialRights), 'Own permission recorded.')}>I am the older adult: record my own permission</Action>
    </>}
    {view && <>
      <Copy heading>Current involvement</Copy>
      <Copy>{rightsDescription(view.rights)}</Copy>
      {view.summary ? <Copy>{Object.values(view.summary).filter(Boolean).join(' — ')}</Copy> : <Copy>Practical information is not available with this involvement.</Copy>}
      <Copy>Visible to authorized practical readers of this need. Restricted background is separate. Broadening this audience reveals existing practical content.</Copy>
      {view.background !== undefined && <><Copy heading>Restricted background</Copy><Copy>{view.background || 'No restricted note entered.'}</Copy></>}
      {view.can_invite && view.summary && invitations && <>
        <Copy heading>Invite within this need</Copy>
        <Copy>Invited by {view.invitation_sender ?? 'the signed-in participant'}. Available to the designated recipient only after explicit Join: {Object.values(view.summary).filter(Boolean).join(' — ')}. Restricted background and owner-private information are excluded. Joining accepts no assistance responsibility.</Copy>
        <Field label="Scoped invitation recipient email" value={recipient} onChangeText={setRecipient} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!busy} maxLength={254} />
        <Action disabled={busy || !recipient.trim()} onPress={() => void perform(async () => { Clipboard.setString(await invitations.issue(view.id, recipient)); }, 'Scoped invitation link copied. It expires seven days after issuance; treat it as sensitive link material.')}>Copy scoped invitation link</Action>
        <Action secondary disabled={busy || !recipient.trim()} onPress={() => void perform(async () => { Clipboard.setString(await invitations.issue(view.id, recipient, true)); }, 'Replacement scoped link copied. The prior pending invitation is invalid.')}>Replace scoped invitation and copy link</Action>
      </>}
      {view.rights.preset === 'coordinator' && view.summary && <>
        <Field label="Authorized practical instructions" value={description} onChangeText={setDescription} multiline editable={!busy} maxLength={8000} />
        <Field label="Practical place" value={location} onChangeText={setLocation} editable={!busy} maxLength={8000} />
        {view.background !== undefined && <Field label="Restricted background note" value={background} onChangeText={setBackground} multiline editable={!busy} maxLength={8000} />}
        <Action disabled={busy} onPress={() => void perform(() => participation.information(view, { ...view.summary!, description, location }, view.background === undefined ? null : background), 'Information saved for its shown audience.')}>Save scoped information</Action>
      </>}
      {view.rights.manage && <>
        <Copy heading>People in this need</Copy>
        {view.participants?.filter(p => !p.removed && p.rights).map(p => <Action key={p.user_id} secondary disabled={busy} onPress={() => { setTarget(p.user_id); setProposed(p.rights); setAdvanced(false); }}>Change involvement for {p.label}</Action>)}
        {target && proposed && <>
          <Copy>Selected: {view.participants?.find(p => p.user_id === target)?.label}</Copy>
          <Copy>Changes apply only to this need. Adding practical access exposes existing instructions; restricted information needs separate authorization.</Copy>
          <Action secondary disabled={busy} onPress={() => setProposed({ ...proposed, preset: 'helper', resolve: false })}>Helper for this need</Action>
          <Action secondary disabled={busy} onPress={() => setProposed({ ...proposed, preset: 'coordinator', resolve: true })}>Coordinator for this need</Action>
          <Action secondary disabled={busy} onPress={() => setAdvanced(!advanced)}>Separate authority for this participant</Action>
          {advanced && powerButtons(proposed, setProposed)}
          <Copy>{rightsDescription(proposed)}</Copy>
          <Field label="Applicable permission source" value={source} onChangeText={setSource} editable={!busy} maxLength={254} />
          <Action secondary disabled={busy} onPress={() => setKind(kind === 'reported' ? 'direct' : 'reported')}>{kind === 'reported' ? 'Recording reported permission; use my own older-adult statement instead' : 'Recording my own older-adult permission; use a reported statement instead'}</Action>
          <Action disabled={busy || (kind === 'reported' && !source.trim())} onPress={() => void perform(() => participation.change(view, target, proposed, false, kind, kind === 'direct' ? 'Own permission' : source), 'Involvement updated within current authority.')}>Apply scoped involvement</Action>
          <Action secondary disabled={busy || (kind === 'reported' && !source.trim())} onPress={() => void perform(() => participation.change(view, target, proposed, true, kind, kind === 'direct' ? 'Own permission' : source), 'Participant removed from this need. Independent other scopes are preserved.')}>Remove selected participant from this need</Action>
        </>}
        {view.suggestions?.map((s,i) => <Copy key={i}>Suggested helper: {s.address}. No invitation or access has been created.</Copy>)}
      </>}
      {view.rights.preset === 'coordinator' && view.summary && <>
        <Copy heading>Practical audience</Copy>
        <Copy>These controls change practical reading only. Presets, participation and separate powers stay unchanged. Including a reader reveals existing practical instructions; restricted background remains separate.</Copy>
        {view.practical_audience?.map(p => <Action key={p.user_id} secondary disabled={busy || (!p.included && !view.rights.disclose)} onPress={() => void perform(() => participation.setAudience(view, p.user_id, !p.included), p.included ? 'Practical access paused for the selected reader. Other permissions and scopes are unchanged.' : 'Existing practical content is now available to the selected reader. Restricted background remains separate.')}>{p.included ? `Pause practical access for ${p.label}` : `Include ${p.label} in practical audience`}</Action>)}
        {view.candidates?.map(p => <Action key={p.user_id} secondary disabled={busy} onPress={() => void perform(() => participation.audience(view, p.user_id), 'Existing practical content is now available to the selected participant. Restricted background remains separate.')}>Include {p.label} in this practical audience</Action>)}
      </>}
      {view.rights.practical && <>
        <Field label="Suggest a fictional helper email" value={suggestion} onChangeText={setSuggestion} autoCapitalize="none" keyboardType="email-address" editable={!busy} maxLength={254} />
        <Action secondary disabled={busy || !suggestion.trim()} onPress={() => void perform(() => participation.suggest(view.id, suggestion), 'Suggestion recorded for an authorized manager. No invitation, access or commitment was created.')}>Suggest helper without granting access</Action>
      </>}
      {view.rights.preset === 'coordinator' && view.rights.manage && <>
        <Field label="Additional authorized need scope" value={additional} onChangeText={setAdditional} editable={!busy} maxLength={8000} />
        <Action secondary disabled={busy || !additional.trim()} onPress={() => void perform(() => participation.addScope(view, additional), 'Additional scoped information prepared privately to its coordination context. Helpers were not included automatically.')}>Prepare additional scoped information</Action>
      </>}
      <Copy>Cancellation, resolution and external disclosure capabilities are recorded only. Their responsibility and export workflows are not available in this slice.</Copy>
    </>}
    {!!notice && <Copy>{notice}</Copy>}
  </>} />;
}
