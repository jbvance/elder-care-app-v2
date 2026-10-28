import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccountScreen } from '../account-screen';

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
