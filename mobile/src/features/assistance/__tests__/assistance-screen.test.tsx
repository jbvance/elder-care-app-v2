import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { Account } from '../../account/account-service';
import { AssistanceScreen } from '../assistance-screen';
import { AssistanceAccessDeniedError, AssistanceStaleError, AssistanceTemporaryError, AssistanceUncertainError, type Assistance, type WorkItem } from '../assistance-service';
import { AccountScreen } from '../../account/account-screen';

const root: WorkItem = {
  id: 'root', arrangement_id: 'root', older_adult: 'Fictional Morgan', task: 'Fictional prescription pickup',
  place: 'Fictional north pharmacy', instructions: '', scheduled_at: null, schedule_zone: null,
  local_date: '', local_time: '', material_revision: null, scope_revision: 3, created: false,
  coordinator: true, can_create_other: true, can_offer: false, eligible: false,
  accepted_by_me: false, arranged: false, accepted_at: null, my_answer: null, audience_count: 0,
  candidates: [{ user_id: 'helper', label: 'helper@example.test', offered: false, ongoing: false }],
};
function fixture(first = root) {
  let item = { ...first };
  const listeners = new Set<() => void>();
  const account = { open: async () => ({ user: { id: 'coordinator', email: 'owner@example.test' }, arrangements: [], hasDraft: false }), subscribe: (f: () => void) => { listeners.add(f); return () => listeners.delete(f); } } as unknown as Account;
  const createFirst = jest.fn(async () => { item = { ...item, created: true, material_revision: 0, scope_revision: 4, can_offer: true }; return { id: item.id, created: true }; });
  const offer = jest.fn(async () => { item = { ...item, material_revision: 1, audience_count: 1, candidates: [{ user_id: 'helper', label: 'helper@example.test', offered: true, ongoing: false }] }; return { offered: true }; });
  const assistance = { list: async () => [item], read: async () => item, preparedTiming: async () => ({ date: '', time: '', zone: 'America/Chicago' }), candidates: async () => item.candidates, createFirst, offer } as unknown as Assistance;
  return { account, assistance, createFirst, offer };
}

test('signed-in account navigation reaches the needs and accepted-work views', async () => {
  const f = fixture();
  await renderRouter({ index: () => <AccountScreen account={f.account} />, work: () => <AssistanceScreen {...f} /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Open needs and opportunities' }));
  await screen.findByText('Needs and opportunities');
  expect(screen.getByText('My accepted work')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Open Fictional Morgan: Fictional prescription pickup — unresolved' }));
  await screen.findByRole('button', { name: 'Record this first need' });
});

test('normal coordination path records a need then offers it without implying commitment', async () => {
  const f = fixture();
  await renderRouter({ index: () => <AssistanceScreen {...f} initialId="root" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Record this first need' }));
  await fireEvent.changeText(screen.getByLabelText('Assistance needed'), 'Fictional prescription pickup');
  await fireEvent.press(screen.getByRole('button', { name: 'Save need' }));
  expect(f.createFirst).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }), expect.objectContaining({ task: 'Fictional prescription pickup', date: '', time: '', zone: '' }));
  await screen.findByText(/Assistance is not arranged until a Helper accepts/);
  await fireEvent.press(screen.getByRole('button', { name: 'Make available to helper@example.test' }));
  expect(f.offer).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }), 'helper');
  await screen.findByText(/Assistance is still unclaimed/);
  expect(screen.getByText('Assistance is not arranged yet.')).toBeTruthy();
});

test('Helper has ordinary accept, decline and defer actions, then accepted-work navigation', async () => {
  let item: WorkItem = { ...root, id: 'request', created: true, coordinator: false, can_create_other: false, eligible: true, material_revision: 2, candidates: undefined };
  const account = { open: async () => ({ user: { id: 'helper', email: 'helper@example.test' }, arrangements: [], hasDraft: false }), subscribe: () => () => {} } as unknown as Account;
  const answer = jest.fn(async (_item, response) => ({ outcome: response }));
  const accept = jest.fn(async () => { item = { ...item, accepted_by_me: true, arranged: true, accepted_at: '2026-10-29T12:00:00Z' }; return { outcome: 'accepted' }; });
  const assistance = { list: async () => [item], read: async () => item, accept, answer } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId="request" /> });
  await screen.findByRole('button', { name: 'Accept responsibility' });
  await fireEvent.press(screen.getByRole('button', { name: 'Defer for now' }));
  expect(answer).toHaveBeenCalledWith(expect.objectContaining({ id: 'request' }), 'deferred');
  await screen.findByText(/No commitment was made/);
  await fireEvent.press(screen.getByRole('button', { name: 'Accept responsibility' }));
  expect(accept).toHaveBeenCalledWith(expect.objectContaining({ material_revision: 2 }));
  expect((await screen.findAllByText('You accepted this assistance responsibility.')).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Open accepted work for Fictional Morgan: Fictional prescription pickup' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Decline this request' })).toBeNull();
});

test('a skipped or ambiguous local time leaves form entries recoverable', async () => {
  const f = fixture();
  await renderRouter({ index: () => <AssistanceScreen {...f} initialId="root" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Record this first need' }));
  await fireEvent.changeText(screen.getByLabelText('Date (month/day/year)'), '11/01/2026');
  await fireEvent.changeText(screen.getByLabelText('Time (for example 10:00 AM)'), '1:30 AM');
  if (screen.queryByRole('button', { name: 'Time zone: UTC' })) {
    await fireEvent.press(screen.getByRole('button', { name: 'Time zone: UTC' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Central (America/Chicago)' }));
  }
  expect(screen.getByRole('button', { name: 'Time zone: America/Chicago' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Save need' }));
  await screen.findByText(/occurs twice because the clocks change/);
  expect(screen.getByLabelText('Date (month/day/year)').props.value).toBe('11/01/2026');
  expect(f.createFirst).not.toHaveBeenCalled();
});

test('ordinary account navigation reaches a prepared additional need and records its first request', async () => {
  const additional: WorkItem = { ...root, id: 'prepared-additional', arrangement_id: 'root', task: 'Fictional additional pickup', can_create_other: false, candidates: [] };
  const f = fixture(additional);
  await renderRouter({ index: () => <AccountScreen account={f.account} />, work: () => <AssistanceScreen {...f} /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Open needs and opportunities' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Open Fictional Morgan: Fictional additional pickup — unresolved' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Record this first need' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save need' }));
  expect(f.createFirst).toHaveBeenCalledWith(expect.objectContaining({ id: 'prepared-additional', created: false }), expect.objectContaining({ task: 'Fictional additional pickup' }));
  await screen.findByText(/Assistance is not arranged until a Helper accepts/);
});

test('a revoked selected scope clears its details while another accepted responsibility remains reachable', async () => {
  let revoked = false;
  const oldWork: WorkItem = { ...root, id: 'old-work', task: 'Old fictional pickup', place: 'Old restricted place', created: true, coordinator: false, can_create_other: false, eligible: true, accepted_by_me: true, arranged: true, material_revision: 2 };
  const otherWork: WorkItem = { ...oldWork, id: 'other-work', task: 'Other fictional pickup', place: 'Other authorized place' };
  const account = { open: async () => ({ user: { id: 'helper', email: 'helper@example.test' }, arrangements: [], hasDraft: false }), subscribe: () => () => {} } as unknown as Account;
  const assistance = {
    list: async () => revoked ? [otherWork] : [oldWork, otherWork],
    read: async (id: string) => { if (id === oldWork.id && revoked) throw new AssistanceAccessDeniedError(); return id === oldWork.id ? oldWork : otherWork; },
  } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId={oldWork.id} /> });
  await screen.findByText('Place: Old restricted place');
  revoked = true;
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByText('That need is no longer available with current access. Your other authorized work is still listed.');
  expect(screen.queryByText('Place: Old restricted place')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Open accepted work for Fictional Morgan: Old fictional pickup' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Open accepted work for Fictional Morgan: Other fictional pickup' }));
  await screen.findByText('Place: Other authorized place');
});

test('account switch drops a stale selected ID before loading the new account list', async () => {
  let user = 'first';
  const listeners = new Set<() => void>();
  const oldWork: WorkItem = { ...root, id: 'old-work', task: 'Old account need', place: 'Old account place', created: true, coordinator: false, can_create_other: false, eligible: true, material_revision: 1 };
  const newWork: WorkItem = { ...oldWork, id: 'new-work', task: 'New account need', place: 'New account place' };
  const account = { open: async () => ({ user: { id: user, email: `${user}@example.test` }, arrangements: [], hasDraft: false }), subscribe: (f: () => void) => { listeners.add(f); return () => listeners.delete(f); } } as unknown as Account;
  const read = jest.fn(async (id: string) => { if (user === 'second' && id === oldWork.id) throw new Error('Wrong account'); return id === oldWork.id ? oldWork : newWork; });
  const assistance = { list: async () => user === 'first' ? [oldWork] : [newWork], read } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId={oldWork.id} /> });
  await screen.findByText('Place: Old account place');
  read.mockClear();
  await act(async () => { user = 'second'; listeners.forEach(listener => listener()); });
  await screen.findByRole('button', { name: 'Open request for Fictional Morgan: New account need' });
  expect(screen.queryByText('Place: Old account place')).toBeNull();
  expect(read).not.toHaveBeenCalledWith(oldWork.id);
  await fireEvent.press(screen.getByRole('button', { name: 'Open request for Fictional Morgan: New account need' }));
  await screen.findByText('Place: New account place');
});

test('a refreshed edit keeps its opening material revision and the unsaved input', async () => {
  let current: WorkItem = { ...root, created: true, material_revision: 2, scope_revision: 5, place: 'Fictional old place', can_offer: false };
  const account = { subscribe: () => () => {} } as unknown as Account;
  const update = jest.fn(async (base: WorkItem) => {
    if (base.material_revision !== current.material_revision) throw new AssistanceStaleError('Opportunity changed. Reopen it.');
    return { updated: true };
  });
  const assistance = { list: async () => [current], read: async () => current, update } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId="root" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Edit unaccepted need' }));
  await fireEvent.changeText(screen.getByLabelText('Assistance needed'), 'My unsaved fictional pickup');
  current = { ...current, task: 'Concurrent fictional change', place: 'Fictional new place', material_revision: 3 };
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByText('Place: Fictional new place');
  expect(screen.getByLabelText('Assistance needed').props.value).toBe('My unsaved fictional pickup');
  await fireEvent.press(screen.getByRole('button', { name: 'Save need' }));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ material_revision: 2 }), expect.objectContaining({ task: 'My unsaved fictional pickup' }));
  await screen.findByText(/Your entries are still here. Review current details before editing again/);
  expect(screen.getByLabelText('Assistance needed').props.value).toBe('My unsaved fictional pickup');
  await fireEvent.press(screen.getByRole('button', { name: 'Review current details' }));
  expect(screen.queryByRole('button', { name: 'Save need' })).toBeNull();
  await screen.findByText('Place: Fictional new place');
});

test.each([
  ['first', false, 'Record this first need'],
  ['another', true, 'Create another need for Fictional Morgan'],
] as const)('%s need form retains its opening scope revision across refresh', async (kind, created, button) => {
  let current: WorkItem = { ...root, created, scope_revision: 3 };
  const account = { subscribe: () => () => {} } as unknown as Account;
  const create = jest.fn(async () => { throw new AssistanceStaleError('Coordination context changed. Reopen it.'); });
  const assistance = { list: async () => [current], read: async () => current, preparedTiming: async () => ({ date: '', time: '', zone: 'America/Chicago' }), createFirst: create, createAnother: create } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId="root" /> });
  await fireEvent.press(await screen.findByRole('button', { name: button }));
  await fireEvent.changeText(screen.getByLabelText('Assistance needed'), 'Unsaved fictional errand');
  current = { ...current, scope_revision: 4 };
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByRole('button', { name: 'Review current details' });
  await fireEvent.press(screen.getByRole('button', { name: 'Save need' }));
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ scope_revision: 3 }), expect.objectContaining({ task: 'Unsaved fictional errand' }));
});

test('an uncertain acceptance shows a same-action retry, while a definitive denial does not', async () => {
  const item: WorkItem = { ...root, id: 'request', created: true, coordinator: false, can_create_other: false, eligible: true, material_revision: 2 };
  const account = { subscribe: () => () => {} } as unknown as Account;
  const accept = jest.fn().mockRejectedValueOnce(new AssistanceUncertainError()).mockResolvedValueOnce({ outcome: 'accepted' });
  const assistance = { list: async () => [item], read: async () => item, accept } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId="request" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Accept responsibility' }));
  await screen.findByText(/could not confirm whether that action completed/);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry the same action' }));
  expect(accept).toHaveBeenCalledTimes(2);
  expect(accept.mock.calls[1][0]).toEqual(accept.mock.calls[0][0]);
  await screen.findByText(/Action confirmed/);
  expect(screen.queryByRole('button', { name: 'Retry the same action' })).toBeNull();
});

test('a definitive permission denial has no same-action retry control', async () => {
  const item: WorkItem = { ...root, id: 'request', created: true, coordinator: false, can_create_other: false, eligible: true, material_revision: 2 };
  const account = { subscribe: () => () => {} } as unknown as Account;
  const accept = jest.fn(async () => { throw new Error('This action is unavailable with current access. Check the request again.'); });
  const assistance = { list: async () => [item], read: async () => item, accept } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId="request" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Accept responsibility' }));
  await screen.findByText(/unavailable with current access/);
  expect(screen.queryByRole('button', { name: 'Retry the same action' })).toBeNull();
});

test.each(['read', 'preparedTiming', 'candidates'] as const)('%s temporary detail failure keeps an open form and its original revision', async branch => {
  let current: WorkItem = { ...root, created: branch !== 'preparedTiming', material_revision: 2, scope_revision: 5,
    place: 'Fictional protected place', can_offer: branch === 'candidates' };
  let fail = false;
  const account = { subscribe: () => () => {} } as unknown as Account;
  const save = jest.fn(async () => { throw new AssistanceStaleError('Opportunity changed. Reopen it.'); });
  const temporary = () => { if (fail) throw new AssistanceTemporaryError(); };
  const assistance = {
    list: async () => [current],
    read: async () => { if (branch === 'read') temporary(); return { ...current }; },
    preparedTiming: async () => { if (branch === 'preparedTiming') temporary(); return { date: '', time: '', zone: 'America/Chicago' }; },
    candidates: async () => { if (branch === 'candidates') temporary(); return current.candidates || []; },
    createFirst: save, update: save,
  } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId="root" /> });
  await fireEvent.press(await screen.findByRole('button', { name: branch === 'preparedTiming' ? 'Record this first need' : 'Edit unaccepted need' }));
  await fireEvent.changeText(screen.getByLabelText('Assistance needed'), 'My unsaved fictional errand');
  current = { ...current, task: 'Concurrent fictional change', place: 'New protected place', material_revision: 3, scope_revision: 6 };
  fail = true;
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByRole('button', { name: 'Retry current details' });
  expect(screen.queryByText('Place: Fictional protected place')).toBeNull();
  expect(screen.queryByText('Place: New protected place')).toBeNull();
  expect(screen.queryByLabelText('Assistance needed')).toBeNull();
  fail = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Retry current details' }));
  await screen.findByText('Place: New protected place');
  expect(screen.getByLabelText('Assistance needed').props.value).toBe('My unsaved fictional errand');
  await screen.findByRole('button', { name: 'Review current details' });
  await fireEvent.press(screen.getByRole('button', { name: 'Save need' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining(branch === 'preparedTiming' ? { scope_revision: 5 } : { material_revision: 2 }),
    expect.objectContaining({ task: 'My unsaved fictional errand' }));
});

test.each(['preparedTiming', 'candidates'] as const)('%s definitive denial clears the open form', async branch => {
  const current: WorkItem = { ...root, created: branch === 'candidates', material_revision: 2, can_offer: branch === 'candidates', place: 'Fictional protected place' };
  const otherWork: WorkItem = { ...root, id: 'other-work', task: 'Other authorized work', created: true, coordinator: false, accepted_by_me: true, arranged: true };
  let denied = false;
  const account = { subscribe: () => () => {} } as unknown as Account;
  const assistance = {
    list: async () => denied ? [otherWork] : [current, otherWork],
    read: async (id: string) => id === 'root' ? { ...current } : otherWork,
    preparedTiming: async () => { if (branch === 'preparedTiming' && denied) throw new AssistanceAccessDeniedError(); return { date: '', time: '', zone: 'America/Chicago' }; },
    candidates: async () => { if (branch === 'candidates' && denied) throw new AssistanceAccessDeniedError(); return current.candidates || []; },
  } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account} assistance={assistance} initialId="root" /> });
  await fireEvent.press(await screen.findByRole('button', { name: branch === 'preparedTiming' ? 'Record this first need' : 'Edit unaccepted need' }));
  await fireEvent.changeText(screen.getByLabelText('Assistance needed'), 'Unsaved fictional entry');
  denied = true;
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByText('That need is no longer available with current access. Your other authorized work is still listed.');
  expect(screen.queryByText('Place: Fictional protected place')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Save need' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Retry current details' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Open accepted work for Fictional Morgan: Other authorized work' })).toBeTruthy();
});
