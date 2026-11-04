import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { Account } from '../../account/account-service';
import { AssistanceScreen } from '../assistance-screen';
import { AssistanceStaleError, AssistanceUncertainError, type Assistance, type WorkItem } from '../assistance-service';

function work(): WorkItem {
  return {
    id: 'need', arrangement_id: 'root', older_adult: 'Fictional Morgan', task: 'Fictional prescription pickup',
    place: 'Fictional north pharmacy', instructions: 'Fictional sealed envelope',
    scheduled_at: null, schedule_zone: null, local_date: '', local_time: '', material_revision: 4,
    scope_revision: 7, created: true, coordinator: true, can_create_other: false, can_offer: false,
    can_resolve: true, resolved: false, resolved_at: null, resolved_by: null, resolution_snapshot: 'opened-target',
    eligible: true, accepted_by_me: true, arranged: true, accepted_at: '2026-11-01T10:00:00Z',
    commitment_id: 'commitment-1', completion_reported_at: null, completion_reported_by_me: false,
    my_answer: null, audience_count: 1,
  };
}
function account() {
  return { open: async () => ({ user: { id: 'performer', email: 'helper@example.test' }, arrangements: [], hasDraft: false }), subscribe: () => () => {} } as unknown as Account;
}

test('a resolved historical request has explicit list/detail status and no new response controls', async () => {
  const current = { ...work(), coordinator: false, accepted_by_me: false, arranged: false, commitment_id: null,
    can_resolve: false, resolved: true, resolved_at: '2026-11-01T12:00:00Z', resolved_by: 'Fictional coordinator', my_answer: 'declined' as const };
  const assistance = { list: async () => [current], read: async () => current } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} /> });
  const historical = await screen.findByRole('button', { name: 'Open resolved need for Fictional Morgan: Fictional prescription pickup' });
  expect(screen.queryByRole('button', { name: /Reconsider/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /Open request for Fictional Morgan/ })).toBeNull();
  await fireEvent.press(historical);
  expect(await screen.findByText(/Need resolved at .* by Fictional coordinator/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Accept responsibility' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Decline this request' })).toBeNull();
  expect(screen.queryByText('The need is unresolved until someone expressly resolves it.')).toBeNull();
});

test('express resolution preserves outstanding accepted work and later completion reporting', async () => {
  let current = work();
  const resolve = jest.fn(async (opened: WorkItem) => {
    current = { ...current, resolved: true, resolved_at: '2026-11-01T12:00:00Z', resolved_by: 'Fictional coordinator' };
    return { id: current.id, outcome: 'resolved' as const, resolved_at: current.resolved_at };
  });
  const complete = jest.fn(async () => {
    current = { ...current, completion_reported_at: '2026-11-01T12:30:00Z', completion_reported_by_me: true };
    return { id: current.id, outcome: 'reported' as const, reported_at: current.completion_reported_at };
  });
  const assistance = { list: async () => [current], read: async () => current, resolve, complete } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Resolve this need' }));
  expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ resolution_snapshot: 'opened-target', material_revision: 4 }));
  await screen.findByText(/Accepted assistance remains outstanding and needs follow-up/);
  expect(screen.getByRole('button', { name: /Open accepted work.*need resolved/ })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Report my assistance complete' }));
  expect(complete).toHaveBeenCalledWith(expect.objectContaining({ commitment_id: 'commitment-1', material_revision: 4 }));
  await screen.findByText(/Completion report saved by the backend/);
  expect(screen.getByText(/Need resolution was expressly recorded/)).toBeTruthy();
});

test('an uncertain combined action stays unconfirmed and retries the same captured intent', async () => {
  let current = work(), pending = false;
  const completeAndResolve = jest.fn(async () => { pending = true; throw new AssistanceUncertainError('Resolution outcome unconfirmed. Retry the same action.'); });
  const retryPendingResolution = jest.fn(async () => {
    pending = false;
    current = { ...current, resolved: true, resolved_at: '2026-11-01T12:00:00Z', resolved_by: 'Fictional coordinator', completion_reported_at: '2026-11-01T12:00:00Z', completion_reported_by_me: true };
    return { id: current.id, outcome: 'completed-and-resolved' as const };
  });
  const assistance = { list: async () => [current], read: async () => current, completeAndResolve,
    pendingResolutionScopes: async () => pending ? ['need'] : [], retryPendingResolution } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete and resolve this need' }));
  await screen.findByText(/Need resolution is unconfirmed/);
  expect(screen.queryByText(/Need resolved at/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry the same resolution action for Fictional Morgan: Fictional prescription pickup' }));
  expect(retryPendingResolution).toHaveBeenCalledWith('need');
  await screen.findByText(/Need resolution saved by the backend/);
  expect(screen.getByText(/Need resolved at/)).toBeTruthy();
});

test('pending combined work keeps its retry across navigation and a resolved list refresh while separate actions stay blocked', async () => {
  let current = work(), pending = false;
  const other = { ...work(), id: 'other', task: 'Fictional other errand' };
  const complete = jest.fn(async () => ({ outcome: 'reported' as const }));
  const resolve = jest.fn(async () => ({ outcome: 'resolved' as const }));
  const completeAndResolve = jest.fn(async () => { pending = true; throw new AssistanceUncertainError('Combined outcome unconfirmed.'); });
  const retryPendingResolution = jest.fn(async () => {
    pending = false;
    return { id: current.id, outcome: 'completed-and-resolved' as const };
  });
  const assistance = { list: async () => [current, other], read: async (id: string) => id === 'need' ? current : other,
    complete, resolve, completeAndResolve, pendingResolutionScopes: async () => pending ? ['need'] : [],
    pendingCombinedScopes: async () => pending ? ['need'] : [], retryPendingResolution } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete and resolve this need' }));
  await screen.findByText(/Need resolution is unconfirmed/);
  expect(screen.getByRole('button', { name: 'Report my assistance complete' }).props.accessibilityState?.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Resolve this need' }).props.accessibilityState?.disabled).toBe(true);
  expect(complete).not.toHaveBeenCalled();
  expect(resolve).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Open accepted work for Fictional Morgan: Fictional other errand' }));
  expect((await screen.findByRole('button', { name: 'Report my assistance complete' })).props.accessibilityState?.disabled).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Open accepted work for Fictional Morgan: Fictional prescription pickup' }));
  current = { ...current, resolved: true, resolved_at: '2026-11-01T12:00:00Z', completion_reported_at: '2026-11-01T12:00:00Z' };
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByText(/Need resolved at/);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry the same resolution action for Fictional Morgan: Fictional prescription pickup' }));
  expect(retryPendingResolution).toHaveBeenCalledWith('need');
  await screen.findByText(/Need resolution saved by the backend/);
});

test('acknowledged completion refreshes the opened resolution snapshot before express resolution', async () => {
  let current = work();
  const complete = jest.fn(async () => {
    current = { ...current, completion_reported_at: '2026-11-01T12:30:00Z', completion_reported_by_me: true, resolution_snapshot: 'after-completion' };
    return { id: current.id, outcome: 'reported' as const, reported_at: current.completion_reported_at };
  });
  const resolve = jest.fn(async (opened: WorkItem) => {
    if (opened.resolution_snapshot !== current.resolution_snapshot) throw new AssistanceStaleError('Target need changed.');
    current = { ...current, resolved: true, resolved_at: '2026-11-01T12:35:00Z', resolved_by: 'Fictional performer' };
    return { id: current.id, outcome: 'resolved' as const, resolved_at: current.resolved_at };
  });
  const assistance = { list: async () => [current], read: async () => current, complete, resolve } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete' }));
  await screen.findByText(/Completion report saved by the backend/);
  await fireEvent.press(screen.getByRole('button', { name: 'Resolve this need' }));
  expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ resolution_snapshot: 'after-completion' }));
  await screen.findByText(/Need resolved at/);
});

test('independent material change after completion still requires resolution review', async () => {
  let current = work();
  const complete = jest.fn(async () => {
    current = { ...current, completion_reported_at: '2026-11-01T12:30:00Z', resolution_snapshot: 'after-completion' };
    return { id: current.id, outcome: 'reported' as const };
  });
  const resolve = jest.fn(async (opened: WorkItem) => { throw new AssistanceStaleError('Target need changed.'); });
  const assistance = { list: async () => [current], read: async () => current, complete, resolve } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete' }));
  await screen.findByText(/Completion report saved by the backend/);
  current = { ...current, resolution_snapshot: 'independent-change' };
  await fireEvent.press(screen.getByRole('button', { name: 'Resolve this need' }));
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ resolution_snapshot: 'after-completion' }));
  await screen.findByRole('button', { name: 'Review current need' });
});

test('unconfirmed completion does not refresh resolution intent even when current details change', async () => {
  let current = work();
  const complete = jest.fn(async () => {
    current = { ...current, completion_reported_at: '2026-11-01T12:30:00Z', resolution_snapshot: 'after-unconfirmed-completion' };
    throw new AssistanceUncertainError('Completion outcome unconfirmed.');
  });
  const resolve = jest.fn(async (opened: WorkItem) => { throw new AssistanceStaleError('Target need changed.'); });
  const assistance = { list: async () => [current], read: async () => current, complete, resolve } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Report my assistance complete' }));
  await screen.findByText('Completion outcome unconfirmed.');
  await fireEvent.press(screen.getByRole('button', { name: 'Check current requests' }));
  await screen.findByText(/This assistance was reported complete at/);
  await fireEvent.press(screen.getByRole('button', { name: 'Resolve this need' }));
  expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ resolution_snapshot: 'opened-target' }));
  await screen.findByRole('button', { name: 'Review current need' });
});

test('materially stale resolution asks for current-detail review', async () => {
  const current = work();
  const resolve = jest.fn(async () => { throw new AssistanceStaleError('Target need changed.'); });
  const assistance = { list: async () => [current], read: async () => current, resolve } as unknown as Assistance;
  await renderRouter({ index: () => <AssistanceScreen account={account()} assistance={assistance} initialId="need" /> });
  await fireEvent.press(await screen.findByRole('button', { name: 'Resolve this need' }));
  await screen.findByRole('button', { name: 'Review current need' });
  expect(screen.getByRole('button', { name: 'Resolve this need' }).props.accessibilityState?.disabled).toBe(true);
});
