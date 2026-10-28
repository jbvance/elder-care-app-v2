import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Clipboard } from 'react-native';
import type { Account } from '../../account/account-service';
import { ParticipationScreen } from '../participation-screen';
import { coordinationRights, helperRights, type Participation, type ScopeContext } from '../participation-service';

function fixture(manager = true) {
  let signedIn = true;
  const authListeners = new Set<() => void>(), scopeListeners = new Set<() => void>();
  let view: ScopeContext = { id: 'scope', arrangement_id: 'arrangement', revision: 0, rights: manager ? { ...coordinationRights, background: true } : helperRights, summary: { olderAdult: 'Fictional Morgan', description: 'Authorized groceries', location: 'Fictional shop', date: '', time: '', timeZone: 'America/Chicago' }, inviter: 'owner@example.test', recorded_at: '2026-10-28', permission_kind: 'reported', permission_source: 'Fictional Morgan', ...(manager ? { background: 'Restricted fictional note', participants: [ { user_id: 'stable-a', label: 'helper-a@example.test', rights: helperRights, removed: false }, { user_id: 'stable-b', label: 'helper-b@example.test', rights: helperRights, removed: false } ] } : {}) };
  const account = { open: async () => ({ user: signedIn ? { id: 'current', email: 'current@example.test' } : null, arrangements: [], hasDraft: false }), subscribe: (f: () => void) => { authListeners.add(f); return () => { authListeners.delete(f); }; }, signOut: async () => { signedIn = false; authListeners.forEach(f => f()); } } as unknown as Account;
  const read = jest.fn(async () => ({ ...view }));
  const change = jest.fn(async (_view, user, rights, remove) => { view = { ...view, revision: view.revision+1, participants: view.participants?.map(p => p.user_id === user ? { ...p, rights, removed: remove } : p) }; scopeListeners.forEach(f => f()); return view; });
  const information = jest.fn(async (_view, summary, background) => { view = { ...view, summary, background, revision: view.revision+1 }; scopeListeners.forEach(f => f()); return view; });
  const suggest = jest.fn(async () => true);
  const participation = { list: async () => signedIn ? [{ id: 'scope', arrangement_id: 'arrangement', title: 'Authorized groceries', prepared: true }] : [], read, change, information, suggest, subscribe: (f: () => void) => { scopeListeners.add(f); return () => { scopeListeners.delete(f); }; } } as unknown as Participation;
  return { account, participation, read, change, information, suggest };
}

test('Helper sees practical information and can suggest without management or restricted data', async () => {
  const f = fixture(false);
  await renderRouter({ index: () => <ParticipationScreen {...f} initialId="scope" /> });
  await screen.findByText(/Authorized groceries.*Fictional shop/);
  expect(screen.queryByText('Restricted fictional note')).toBeNull();
  expect(screen.queryByText('People in this need')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Suggest a fictional helper email'), 'suggested@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'Suggest helper without granting access' }));
  expect(f.suggest).toHaveBeenCalledWith('scope', 'suggested@example.test');
  expect(f.change).not.toHaveBeenCalled();
  await screen.findByText(/No invitation, access or commitment was created/);
});

test('recognizable target can receive a scoped preset change without changing the other participant', async () => {
  const f=fixture();
  await renderRouter({ index: () => <ParticipationScreen {...f} initialId="scope" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Change involvement for helper-a@example.test' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Coordinator for this need' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply scoped involvement' }));
  expect(f.change).toHaveBeenCalledWith(expect.objectContaining({revision:0}), 'stable-a', expect.objectContaining({preset:'coordinator',resolve:true,practical:true}),false,'reported','Fictional Morgan');
  expect(await screen.findByRole('button',{name:'Change involvement for helper-b@example.test'})).toBeTruthy();
});

test('delegated invitation copying uses only the additional need practical projection and hides on authority loss', async () => {
  const f=fixture(false);const base=await f.read();let canInvite=true;
  f.participation.list=async()=>[{id:'additional-need',arrangement_id:'arrangement',title:'Additional practical need',prepared:true}];
  f.read.mockImplementation(async()=>({...base,id:'additional-need',rights:{...helperRights,manage:canInvite,disclose:canInvite},can_invite:canInvite,invitation_sender:'manager@example.test'}));
  const issue=jest.fn(async()=>`mobile://invitation?t=${'e'.repeat(64)}`); // Non-issued fixture.
  const copied=jest.spyOn(Clipboard,'setString').mockImplementation(()=>{});
  await renderRouter({index:()=> <ParticipationScreen {...f} invitations={{issue}} initialId="additional-need" />});
  await screen.findByText(/Invited by manager@example.test/);
  expect(screen.queryByText('Restricted fictional note')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Scoped invitation recipient email'),'recipient@example.test');
  await fireEvent.press(screen.getByRole('button',{name:'Copy scoped invitation link'}));
  expect(issue).toHaveBeenCalledWith('additional-need','recipient@example.test');
  expect(copied).toHaveBeenCalledTimes(1);
  await screen.findByText(/Scoped invitation link copied/);
  await fireEvent.changeText(screen.getByLabelText('Scoped invitation recipient email'),'recipient@example.test');
  await fireEvent.press(screen.getByRole('button',{name:'Replace scoped invitation and copy link'}));
  expect(issue).toHaveBeenLastCalledWith('additional-need','recipient@example.test',true);
  await screen.findByText(/Replacement scoped link copied/);
  canInvite=false;
  await fireEvent.press(screen.getByRole('button',{name:'Check current access'}));
  await screen.findByText(/Helper for this need; practical information/);
  expect(screen.queryByRole('button',{name:'Copy scoped invitation link'})).toBeNull();
  expect(issue).toHaveBeenCalledTimes(2);
});

test('a Coordinator without management narrows the practical audience without changing other powers', async () => {
  const f=fixture(false);const base=await f.read();
  let context: ScopeContext={...base,rights:{...helperRights,preset:'coordinator',resolve:true},practical_audience:[{user_id:'stable-a',label:'helper-a@example.test',included:true},{user_id:'stable-b',label:'helper-b@example.test',included:true}]};
  f.read.mockImplementation(async()=>({...context}));
  const setAudience=jest.fn(async(_view,user,include)=>{context={...context,revision:context.revision+1,practical_audience:context.practical_audience!.map(p=>p.user_id===user?{...p,included:include}:p)};return context;});
  f.participation.setAudience=setAudience;
  await renderRouter({index:()=> <ParticipationScreen {...f} initialId="scope" />});
  await fireEvent.press(await screen.findByRole('button',{name:'Pause practical access for helper-a@example.test'}));
  expect(setAudience).toHaveBeenCalledWith(expect.objectContaining({revision:0}),'stable-a',false);
  expect(f.change).not.toHaveBeenCalled();
  expect(screen.queryByText('People in this need')).toBeNull();
  expect(screen.getByRole('button',{name:'Include helper-a@example.test in practical audience'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Pause practical access for helper-b@example.test'})).toBeTruthy();
});

test('minimal information entry keeps the displayed audiences distinct', async () => {
  const f=fixture();
  await renderRouter({ index: () => <ParticipationScreen {...f} initialId="scope" /> });
  await screen.findByText('Restricted fictional note');
  await fireEvent.changeText(screen.getByLabelText('Authorized practical instructions'), 'New practical instructions');
  await fireEvent.changeText(screen.getByLabelText('Restricted background note'), 'New restricted note');
  await fireEvent.press(screen.getByRole('button', { name: 'Save scoped information' }));
  expect(f.information).toHaveBeenCalledWith(expect.objectContaining({revision:0}),expect.objectContaining({description:'New practical instructions'}),'New restricted note');
  await screen.findByText(/Information saved for its shown audience/);
});

test('a delayed protected read cannot restore content after sign-out', async () => {
  const f=fixture();let resolve!: (value: ScopeContext) => void;
  f.read.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await renderRouter({ index: () => <ParticipationScreen {...f} initialId="scope" /> });
  await act(async () => { await f.account.signOut(); });
  await act(async () => { resolve({id:'scope',arrangement_id:'a',revision:0,rights:coordinationRights,summary:{description:'Must stay hidden'},inviter:'owner',recorded_at:''}); });
  expect(screen.queryByText('Must stay hidden')).toBeNull();
});

test('new setup records the explicitly shown Coordinator defaults without bundling restricted or onward powers', async () => {
  const f=fixture();let prepared=false;
  f.participation.list=async()=>[{id:'scope',arrangement_id:'arrangement',title:'Private preparation',prepared}];
  const start=jest.fn(async()=>{prepared=true;return 'scope';});f.participation.start=start;
  await renderRouter({index:()=> <ParticipationScreen {...f} initialId="scope" />});
  await screen.findByLabelText('Who authorized this scope?');expect(start).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Who authorized this scope?'),'Fictional Morgan');
  await fireEvent.press(screen.getByRole('button',{name:'Record reported coordination permission'}));
  expect(start).toHaveBeenCalledWith('scope','reported','Fictional Morgan',expect.objectContaining({preset:'coordinator',resolve:true,manage:true,disclose:true,delegate:false,background:false,cancel:false,external:false}));
});

test('broadening an existing practical audience uses the recognizable candidate and explains existing disclosure', async () => {
  const f=fixture();const view=await f.read();
  f.read.mockResolvedValue({...view,candidates:[{user_id:'candidate-stable',label:'candidate@example.test'}]});
  const audience=jest.fn(async()=>view);f.participation.audience=audience;
  await renderRouter({index:()=> <ParticipationScreen {...f} initialId="scope" />});
  await screen.findByText(/Broadening this audience reveals existing practical content/);
  await fireEvent.press(screen.getByRole('button',{name:'Include candidate@example.test in this practical audience'}));
  expect(audience).toHaveBeenCalledWith(expect.objectContaining({id:'scope',revision:0}),'candidate-stable');
  await screen.findByText(/Restricted background remains separate/);
});

test('a denied or stale change clears protected editing context and offers current-access recovery', async () => {
  const f=fixture();f.change.mockRejectedValueOnce(new Error('This scope changed. Check current access.'));
  await renderRouter({index:()=> <ParticipationScreen {...f} initialId="scope" />});
  await fireEvent.press(await screen.findByRole('button',{name:'Change involvement for helper-a@example.test'}));
  await fireEvent.press(screen.getByRole('button',{name:'Apply scoped involvement'}));
  await screen.findByText('This scope changed. Check current access.');
  expect(screen.queryByText('Restricted fictional note')).toBeNull();
  await fireEvent.press(screen.getByRole('button',{name:'Check current access'}));
  await screen.findByText('Restricted fictional note');
});
