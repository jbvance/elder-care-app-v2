import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Account } from '../../account/account-service';
import { InvitationScreen } from '../invitation-screen';
import type { Invitations } from '../invitation-service';
import { accountStorage } from '../../account/account-storage';
import { redirectSystemPath } from '../../../app/+native-intent';

const mockPending = new Map<string, string>();
jest.mock('../../account/account-storage', () => ({ accountStorage: {
  getItem: async (key: string) => mockPending.get(key) ?? null,
  setItem: async (key: string, value: string) => { mockPending.set(key, value); },
  removeItem: async (key: string) => { mockPending.delete(key); },
} }));

function fixture() {
  let signedIn = false;
  let listener = () => {};
  const account: Account = {
    open: async () => ({ user: signedIn ? { id: 'recipient', email: 'recipient@example.test' } : null, arrangements: signedIn ? [{ id: 'private', owner_id: 'recipient', draft: { olderAdult: 'Owner-only name', description: 'Owner-only payload', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }] : [], hasDraft: false }),
    requestCode: async () => {},
    verifyCode: async () => { signedIn = true; listener(); },
    associate: async () => 'saved', revokeOthers: async () => {},
    signOut: async () => { signedIn = false; listener(); },
    // Two screens observe authentication independently.
    subscribe: callback => { const previous = listener; listener = () => { previous(); callback(); }; return () => {}; },
  };
  const join = jest.fn(async () => ({ id: 'scope', summary: { description: 'Synthetic authorized groceries' }, inviter: 'fictional-author', recorded_at: '2026-10-28' }));
  const invitations = { pending: async () => 'fictional-link-material', forget: async () => {}, join } as unknown as Invitations;
  return { account, invitations, join };
}

test('link and email-code sign-in reveal no summary; explicit Join opens only the practical destination', async () => {
  const f = fixture(); await render(<InvitationScreen {...f} />);
  expect(f.join).not.toHaveBeenCalled();
  expect(screen.queryByText(/Synthetic authorized groceries/)).toBeNull();
  await fireEvent.changeText(await screen.findByLabelText('Email address'), 'recipient@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }));
  await fireEvent.changeText(await screen.findByLabelText('Six-digit code'), '123456');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText(/Signed in as recipient/);
  expect(f.join).not.toHaveBeenCalled();
  expect(screen.queryByText(/Owner-only/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Join' }));
  await screen.findByText('Synthetic authorized groceries');
  expect(f.join).toHaveBeenCalledTimes(1);
  await screen.findByText(/Joining has not accepted an assistance responsibility/);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out on this device' }));
  expect(screen.queryByText('Synthetic authorized groceries')).toBeNull();
});

test('mismatch uses generic recovery, retains the pending link and allows retry', async () => {
  const f = fixture(); await f.account.verifyCode('', '');
  f.join.mockRejectedValueOnce(new Error('private backend details'));
  await render(<InvitationScreen {...f} />);
  await screen.findByText(/Signed in as recipient/);
  await fireEvent.press(screen.getByRole('button', { name: 'Join' }));
  await screen.findByText(/This invitation is unavailable/);
  expect(screen.queryByText(/private backend details/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Join' }));
  await screen.findByText('Synthetic authorized groceries');
});

test('an in-flight join cannot redisplay data after sign-out', async () => {
  const f = fixture(); await f.account.verifyCode('', '');
  let resolve!: (value: Awaited<ReturnType<typeof f.join>>) => void;
  f.join.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await render(<InvitationScreen {...f} />); await screen.findByText(/Signed in as recipient/);
  await fireEvent.press(screen.getByRole('button', { name: 'Join' }));
  await act(async () => { await f.account.signOut(); });
  await act(async () => { resolve({ id: 'scope', summary: { description: 'Must not reappear' }, inviter: 'author', recorded_at: '' }); });
  expect(screen.queryByText('Must not reappear')).toBeNull();
});

test('a different link delivered to a mounted invitation replaces the explicit Join target without redeeming', async () => {
  const f = fixture(); await f.account.verifyCode('', '');
  const first = 'a'.repeat(64), replacement = 'b'.repeat(64); // Non-issued fixtures.
  await redirectSystemPath({ path: `mobile://invitation?t=${first}`, initial: true });
  f.invitations.pending = () => accountStorage.getItem('pending-invitation-v1');
  await render(<InvitationScreen {...f} />);
  await screen.findByText(/Signed in as recipient/);
  await fireEvent.press(screen.getByRole('button', { name: 'Join' }));
  await screen.findByText('Synthetic authorized groceries');
  await act(async () => { await redirectSystemPath({ path: `mobile://invitation?t=${replacement}`, initial: false }); });
  expect(screen.queryByText('Synthetic authorized groceries')).toBeNull();
  expect(f.join).toHaveBeenCalledTimes(1);
  await fireEvent.press(await screen.findByRole('button', { name: 'Join' }));
  expect(f.join).toHaveBeenLastCalledWith(replacement);
  await act(async () => { await redirectSystemPath({ path: 'mobile://invitation?t=invalid', initial: false }); });
  expect(screen.queryByText('Synthetic authorized groceries')).toBeNull();
  expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled();
  expect(f.join).toHaveBeenCalledTimes(2);
});

test('a newly opened link invalidates an older in-flight Join response without redeeming the new link', async () => {
  const f = fixture(); await f.account.verifyCode('', '');
  const first = 'c'.repeat(64), next = 'd'.repeat(64); // Non-issued fixtures.
  await redirectSystemPath({ path: `mobile://invitation?t=${first}`, initial: true });
  f.invitations.pending = () => accountStorage.getItem('pending-invitation-v1');
  let resolve!: (value: Awaited<ReturnType<typeof f.join>>) => void;
  f.join.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await render(<InvitationScreen {...f} />); await screen.findByText(/Signed in as recipient/);
  await fireEvent.press(screen.getByRole('button', { name: 'Join' }));
  await act(async () => { await redirectSystemPath({ path: `mobile://invitation?t=${next}`, initial: false }); });
  await act(async () => { resolve({ id: 'old-scope', summary: { description: 'Stale response must stay hidden' }, inviter: 'author', recorded_at: '' }); });
  expect(screen.queryByText('Stale response must stay hidden')).toBeNull();
  expect(f.join).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Join' }));
  expect(f.join).toHaveBeenLastCalledWith(next);
});
