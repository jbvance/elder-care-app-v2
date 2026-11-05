import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import AccountRoute from '../../../app/account';
import InviteRoute from '../../../app/invite';
import ParticipationRoute from '../../../app/participation';
import type { Arrangement } from '../account-service';
import type { ScopeContext } from '../../participation/participation-service';

// Replace the native runtime boundary; routes, screens and Router stay real.
let mockRuntime: ReturnType<typeof fixture>;
jest.mock('../runtime', () => ({
  getAccount: () => mockRuntime.account,
  getInvitations: () => mockRuntime.invitations,
  getParticipation: () => mockRuntime.participation,
}));

function fixture(narrow = false) {
  const arrangements: Arrangement[] = ['Morgan', 'Riley'].map(name => ({
    id: `arrangement-${name.toLowerCase()}`, owner_id: 'owner',
    draft: { olderAdult: `Fictional ${name}`, description: `${name} groceries`, location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true },
  }));
  const account = {
    open: async () => ({ user: { id: 'owner', email: 'owner@example.test' }, arrangements, hasDraft: false }),
    subscribe: () => () => {}, associate: jest.fn(),
  };
  const participation = {
    list: async () => arrangements.map(a => ({ id: a.id, arrangement_id: a.id, title: a.draft.description, prepared: narrow })),
    read: jest.fn(async (id: string): Promise<ScopeContext> => ({
      id, arrangement_id: id, revision: 0, inviter: 'owner@example.test', recorded_at: '2026-11-04',
      summary: { description: arrangements.find(a => a.id === id)!.draft.description },
      rights: { preset: 'helper', practical: true, manage: true, delegate: false, background: false, share_background: false, disclose: false, cancel: false, resolve: false, external: false },
    })),
    subscribe: () => () => {}, start: jest.fn(async (id: string) => id),
    change: jest.fn(), information: jest.fn(), suggest: jest.fn(), addScope: jest.fn(), audience: jest.fn(), setAudience: jest.fn(),
  };
  const invitations = { scope: jest.fn(async () => null), prepare: jest.fn(), issue: jest.fn(), manage: jest.fn(), join: jest.fn() };
  return { account, participation, invitations };
}

function expectNoMutation() {
  const { account, participation: p, invitations: i } = mockRuntime;
  for (const mutation of [account.associate, p.start, p.change, p.information, p.suggest, p.addScope, p.audience, p.setAudience, i.prepare, i.issue, i.manage, i.join]) {
    expect(mutation).not.toHaveBeenCalled();
  }
}

async function openAccount() {
  return renderRouter({ account: AccountRoute, invite: InviteRoute, participation: ParticipationRoute }, { initialUrl: '/account' });
}

beforeEach(() => { mockRuntime = fixture(); });

test.each([
  ['Fictional Morgan', 'arrangement-morgan'],
  ['Fictional Riley', 'arrangement-riley'],
])('account opens and explicitly sets up only the selected arrangement: %s', async (olderAdult, id) => {
  const navigation = await openAccount();
  await fireEvent.press(await screen.findByRole('button', { name: `Coordinate and invite for ${olderAdult}` }));
  await screen.findByLabelText('Who authorized this scope?');
  expect(navigation.getPathname()).toBe('/participation');
  expect(navigation.getSearchParams()).toEqual({ id });
  expect(mockRuntime.participation.read).not.toHaveBeenCalled();
  expectNoMutation();

  await fireEvent.changeText(screen.getByLabelText('Who authorized this scope?'), olderAdult);
  await fireEvent.press(screen.getByRole('button', { name: 'Record reported coordination permission' }));
  expect(mockRuntime.participation.start).toHaveBeenCalledTimes(1);
  expect(mockRuntime.participation.start).toHaveBeenCalledWith(id, 'reported', olderAdult, {
    preset: 'coordinator', practical: true, manage: true, delegate: false, background: false,
    share_background: false, disclose: true, cancel: false, resolve: true, external: false,
  });
  expect(mockRuntime.invitations.prepare).not.toHaveBeenCalled();
});

test.each([
  ['Fictional Morgan', 'arrangement-morgan'],
  ['Fictional Riley', 'arrangement-riley'],
])('existing-link entry preserves the arrangement ID and fresh setup only navigates: %s', async (olderAdult, id) => {
  const navigation = await openAccount();
  await fireEvent.press(await screen.findByRole('button', { name: `Manage existing links and invitation authority for ${olderAdult}` }));
  const coordinate = await screen.findByRole('button', { name: `Coordinate and invite for ${olderAdult}` });
  expect(navigation.getPathname()).toBe('/invite');
  expect(navigation.getSearchParams()).toEqual({ id });
  expect(mockRuntime.invitations.scope).toHaveBeenCalledWith(id);
  expect(screen.queryByLabelText(/Who gave permission/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Record their reported permission and delegation' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'I am the older adult: give my own permission and delegation' })).toBeNull();
  expectNoMutation();

  await fireEvent.press(coordinate);
  await screen.findByLabelText('Who authorized this scope?');
  expect(navigation.getPathname()).toBe('/participation');
  expect(navigation.getSearchParams()).toEqual({ id });
  expectNoMutation();
});

test('opening an existing narrow scope reads its current Helper rights without restarting setup', async () => {
  mockRuntime = fixture(true);
  await openAccount();
  await fireEvent.press(await screen.findByRole('button', { name: 'Coordinate and invite for Fictional Riley' }));
  await screen.findByText('Helper for this need; practical information; Invite and remove within this need');
  expect(mockRuntime.participation.read).toHaveBeenCalledWith('arrangement-riley');
  expect(screen.queryByLabelText('Who authorized this scope?')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Record reported coordination permission' })).toBeNull();
  expect(screen.queryByLabelText('Authorized practical instructions')).toBeNull();
  expect(screen.queryByText('Practical audience')).toBeNull();
  expectNoMutation();
  await fireEvent.press(screen.getByRole('button', { name: 'Check current access' }));
  await screen.findByText('Helper for this need; practical information; Invite and remove within this need');
  expectNoMutation();
});
