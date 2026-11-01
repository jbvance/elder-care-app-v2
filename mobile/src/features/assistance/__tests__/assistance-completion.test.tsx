import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { Account } from '../../account/account-service';
import { AccountScreen } from '../../account/account-screen';
import { AssistanceScreen } from '../assistance-screen';
import { AssistanceAccessDeniedError, AssistanceStaleError, AssistanceUncertainError, type Assistance, type WorkItem } from '../assistance-service';

function accepted(id = 'need'): WorkItem {
  return {
    id, arrangement_id: 'root', older_adult: 'Fictional Morgan', task: 'Fictional prescription envelope pickup',
    place: 'Fictional north pharmacy', instructions: 'Ask for the fictional sealed pickup envelope',
    scheduled_at: null, schedule_zone: null, local_date: '', local_time: '', material_revision: 4,
    scope_revision: 7, created: true, coordinator: false, can_create_other: false, can_offer: false,
    eligible: true, accepted_by_me: true, arranged: true, accepted_at: '2026-11-01T10:00:00Z',
    commitment_id: `commit-${id}`, completion_reported_at: null, completion_reported_by_me: false,
    my_answer: null, audience_count: 1,
  };
}
function account() {
  return { open: async () => ({ user: { id: 'performer', email: 'helper@example.test' }, arrangements: [], hasDraft: false }), subscribe: () => () => {} } as unknown as Account;
}

test('ordinary accepted-work navigation reports own completion only after backend acknowledgment', async () => {
  let current = accepted();
  const complete = jest.fn(async () => {
    current = { ...current, completion_reported_at: '2026-11-01T12:00:00Z', completion_reported_by_me: true };
    return { outcome: 'reported' as const, reported_at: current.completion_reported_at };
  });
  const assistance = { list: async () => [current], read: async () => current, complete } as unknown as Assistance;
  const user = account();
  await renderRouter({ index: () => <AccountScreen account={user} />, work: () => <AssistanceScreen account={user} assistance={assistance} /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Open needs and opportunities' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Open accepted work for Fictional Morgan: Fictional prescription envelope pickup' }));
  expect(screen.getByText('Place: Fictional north pharmacy')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Report my assistance complete' }));
  expect(complete).toHaveBeenCalledWith(expect.objectContaining({ commitment_id: 'commit-need', material_revision: 4 }));
  await screen.findByText(/Completion report saved by the backend/);
  expect(screen.getByText(/You reported this assistance complete at/)).toBeTruthy();
  expect(screen.getByText(/need remains unresolved until someone expressly resolves it/)).toBeTruthy();
  expect(screen.getByRole('button', { name: /Open accepted work.*reported complete/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Report my assistance complete' })).toBeNull();
});

test('uncertain completion keeps the opened commitment and revision through refresh and same-action retry', async () => {
  let current = accepted(), calls = 0;
  const complete = jest.fn(async (_opened: WorkItem) => {
    calls++;
    if (calls === 1) throw new AssistanceUncertainError('Completion report outcome is unconfirmed. Retry the same action.');
    throw new AssistanceStaleError('Responsibility details changed.');
  });
  const assistance = { list: async () => [current], read: async () => current, complete } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete' }));
  await screen.findByRole('button', { name: 'Retry the same action' });
  expect(screen.queryByText(/You reported this assistance complete at/)).toBeNull();
  current = { ...current, material_revision: 5, task: 'Concurrent fictional change' };
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByText('Concurrent fictional change');
  await fireEvent.press(screen.getByRole('button', { name: 'Retry the same action' }));
  await screen.findByRole('button', { name: 'Review current responsibility' });
  expect(complete).toHaveBeenCalledTimes(2);
  expect(complete.mock.calls[0][0]).toMatchObject({ commitment_id: 'commit-need', material_revision: 4 });
  expect(complete.mock.calls[1][0]).toMatchObject({ commitment_id: 'commit-need', material_revision: 4 });
  expect(screen.queryByRole('button', { name: 'Retry the same action' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Review current responsibility' }));
  await screen.findByText('Concurrent fictional change');
});

test('uncertain completion stays unreported until a same-action retry receives backend acknowledgment', async () => {
  let current = accepted(), calls = 0;
  const complete = jest.fn(async (_opened: WorkItem) => {
    calls++;
    if (calls === 1) throw new AssistanceUncertainError('Completion report outcome is unconfirmed. Retry the same action.');
    current = { ...current, completion_reported_at: '2026-11-01T12:30:00Z', completion_reported_by_me: true };
    return { outcome: 'reported' as const, reported_at: current.completion_reported_at };
  });
  const assistance = { list: async () => [current], read: async () => current, complete } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete' }));
  await screen.findByRole('button', { name: 'Retry the same action' });
  expect(screen.queryByText(/You reported this assistance complete at/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry the same action' }));
  await screen.findByText(/Completion report saved by the backend/);
  expect(complete).toHaveBeenCalledTimes(2);
  expect(complete.mock.calls[1][0]).toEqual(complete.mock.calls[0][0]);
  expect(screen.getByText(/You reported this assistance complete at/)).toBeTruthy();
});

test('definitive reporting denial clears protected selection and keeps other authorized accepted work', async () => {
  const protectedWork = accepted();
  const other = { ...accepted('other'), task: 'Fictional other errand' };
  let denied = false;
  const complete = jest.fn(async () => { denied = true; throw new AssistanceAccessDeniedError(); });
  const assistance = { list: async () => denied ? [other] : [protectedWork, other], read: async (id: string) => id === 'need' ? protectedWork : other, complete } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete' }));
  await screen.findByText(/Current access to this responsibility was denied/);
  expect(screen.queryByText('Place: Fictional north pharmacy')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Retry the same action' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Open accepted work for Fictional Morgan: Fictional prescription envelope pickup' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Open accepted work for Fictional Morgan: Fictional other errand' })).toBeTruthy();
});

function interruptedCompletion(final: 'reported' | 'stale' | 'denied') {
  let first = accepted();
  let other: WorkItem = { ...accepted('other'), task: 'Fictional other errand', place: 'Fictional other place', accepted_by_me: false, arranged: false, commitment_id: null };
  let pending = false, denied = false;
  const complete = jest.fn(async () => { pending = true; throw new AssistanceUncertainError('Completion report unconfirmed. Retry the same action.'); });
  const answer = jest.fn(async () => { other = { ...other, my_answer: 'deferred' }; return { outcome: 'deferred' as const }; });
  const retryPendingCompletion = jest.fn(async (_scope: string) => {
    pending = false;
    if (final === 'stale') throw new AssistanceStaleError('Responsibility changed.');
    if (final === 'denied') { denied = true; throw new AssistanceAccessDeniedError(); }
    first = { ...first, completion_reported_at: '2026-11-01T12:30:00Z', completion_reported_by_me: true };
    return { outcome: 'reported' as const, reported_at: first.completion_reported_at };
  });
  const assistance = {
    list: async () => denied ? [other] : [first, other],
    read: async (id: string) => id === 'need' ? first : other,
    pendingCompletionScopes: async () => pending ? ['need'] : [],
    complete, answer, retryPendingCompletion,
  } as unknown as Assistance;
  return { assistance, complete, answer, retryPendingCompletion };
}

async function switchWorkAfterUncertain(assistance: Assistance) {
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete' }));
  await screen.findByText(/Completion report unconfirmed for Fictional Morgan/);
  await fireEvent.press(screen.getByRole('button', { name: 'Open request for Fictional Morgan: Fictional other errand' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Defer for now' }));
  await screen.findByText(/No commitment was made/);
  expect(screen.queryByRole('button', { name: 'Retry the same action' })).toBeNull();
  await screen.findByRole('button', { name: 'Retry the same completion report for Fictional Morgan: Fictional prescription envelope pickup' });
}

test('pending completion stays reachable after switching work and another action, then shows backend-acknowledged retry', async () => {
  const f = interruptedCompletion('reported');
  await switchWorkAfterUncertain(f.assistance);
  expect(screen.getByText(/Completion report unconfirmed for Fictional Morgan/)).toBeTruthy();
  expect(screen.queryByText(/You reported this assistance complete at/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry the same completion report for Fictional Morgan: Fictional prescription envelope pickup' }));
  await screen.findByText(/Completion report saved by the backend/);
  expect(f.answer).toHaveBeenCalledTimes(1);
  expect(f.retryPendingCompletion).toHaveBeenCalledWith('need');
  expect(screen.getByText(/You reported this assistance complete at/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Retry the same completion report for Fictional Morgan: Fictional prescription envelope pickup' })).toBeNull();
});

test.each(['stale', 'denied'] as const)('pending completion remains distinct from a definitive %s response after another action', async final => {
  const f = interruptedCompletion(final);
  await switchWorkAfterUncertain(f.assistance);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry the same completion report for Fictional Morgan: Fictional prescription envelope pickup' }));
  expect(f.retryPendingCompletion).toHaveBeenCalledWith('need');
  expect(screen.queryByText(/You reported this assistance complete at/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Retry the same completion report for Fictional Morgan: Fictional prescription envelope pickup' })).toBeNull();
  if (final === 'stale') {
    await screen.findByRole('button', { name: 'Review current responsibility' });
    expect(screen.getByRole('button', { name: 'Report my assistance complete' }).props.accessibilityState?.disabled).toBe(true);
  } else {
    await screen.findByText(/Current access to this responsibility was denied/);
    expect(screen.queryByText('Place: Fictional north pharmacy')).toBeNull();
    expect(screen.getByText('Place: Fictional other place')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open request for Fictional Morgan: Fictional other errand' })).toBeTruthy();
  }
});
