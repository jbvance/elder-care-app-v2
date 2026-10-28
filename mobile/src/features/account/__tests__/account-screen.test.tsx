import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccountScreen } from '../account-screen';
import { AccountError, type Account } from '../account-service';

test('sign-in keeps the draft private until a deliberate account association', async () => {
  const associate = jest.fn(async () => 'saved' as const);
  let signedIn = false;
  const account = {
    async open() { return { user: signedIn ? { id: 'fictional-owner', email: 'morgan@example.test' } : null, arrangements: [], hasDraft: true }; },
    async requestCode() {},
    async verifyCode() { signedIn = true; },
    associate,
    async signOut() {},
    async revokeOthers() {},
    subscribe: () => () => {},
  };
  await render(<AccountScreen account={account} />);
  await fireEvent.changeText(await screen.findByLabelText('Email address'), 'morgan@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }));
  await fireEvent.changeText(await screen.findByLabelText('Six-digit code'), '123456');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText('morgan@example.test');
  expect(associate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Save my draft to this account' }));
  expect(associate).toHaveBeenCalledWith('fictional-owner');
});

function signOutFixture(hasDraft: boolean) {
  let signedIn = false;
  return {
    async open() { return { user: signedIn ? { id: 'fictional-owner', email: 'morgan@example.test' } : null, arrangements: [], hasDraft }; },
    async requestCode() {},
    async verifyCode() { signedIn = true; },
    async associate() { return 'saved' as const; },
    signOut: jest.fn(async (_discardDraft?: boolean) => { signedIn = false; }),
    async revokeOthers() {},
    subscribe: () => () => {},
  } satisfies Account;
}

async function enterAccountAndConfirmationCode(account: Account) {
  await render(<AccountScreen account={account} />);
  await fireEvent.changeText(await screen.findByLabelText('Email address'), 'morgan@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }));
  await fireEvent.changeText(await screen.findByLabelText('Six-digit code'), '123456');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText('morgan@example.test');
  await act(async () => { jest.advanceTimersByTime(61_000); });
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out other devices' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Email a confirmation code' }));
  await fireEvent.changeText(await screen.findByLabelText('Six-digit code'), '654321');
}

describe('current-device sign-out form cleanup', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  test.each([false, true])('successful sign-out clears email, code and account form state (draft: %s)', async hasDraft => {
    const account = signOutFixture(hasDraft);
    await enterAccountAndConfirmationCode(account);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign out on this device' }));
    if (hasDraft) await fireEvent.press(screen.getByRole('button', { name: 'Discard device draft and sign out' }));

    expect(await screen.findByLabelText('Email address')).toHaveDisplayValue('');
    expect(screen.queryByLabelText('Six-digit code')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Discard device draft and sign out' })).toBeNull();
    expect(screen.queryByText(/Another code can be requested/)).toBeNull();
    expect(account.signOut).toHaveBeenCalledWith(hasDraft);
    // The next identity starts with an empty code field and no inherited resend wait.
    await fireEvent.changeText(screen.getByLabelText('Email address'), 'next@example.test');
    await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }));
    expect(await screen.findByLabelText('Six-digit code')).toHaveDisplayValue('');
  });

  test('failed sign-out preserves the confirmation input and offers recovery', async () => {
    const account = signOutFixture(true);
    account.signOut.mockRejectedValueOnce(new AccountError('Local credential removal could not be confirmed.'));
    await enterAccountAndConfirmationCode(account);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign out on this device' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Discard device draft and sign out' }));

    await screen.findByText('Local credential removal could not be confirmed.');
    expect(screen.getByRole('button', { name: 'Discard device draft and sign out' })).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Try opening again' }));
    await screen.findByText('morgan@example.test');
    expect(screen.getByLabelText('Six-digit code')).toHaveDisplayValue('654321');
  });

  test('canceling sign-out keeps the draft and authentication input', async () => {
    const account = signOutFixture(true);
    await enterAccountAndConfirmationCode(account);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign out on this device' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel and keep draft' }));

    expect(account.signOut).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Six-digit code')).toHaveDisplayValue('654321');
    expect(screen.getByRole('button', { name: 'Save my draft to this account' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Discard device draft and sign out' })).toBeNull();
  });
});
