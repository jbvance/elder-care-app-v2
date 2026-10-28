import { fireEvent, render, screen } from '@testing-library/react-native';
import { Clipboard } from 'react-native';
import { openURL } from 'expo-linking';
import { InviteScreen } from '../invite-screen';
import type { Invitations, Scope } from '../invitation-service';

jest.mock('expo-linking', () => ({ openURL: jest.fn(async () => {}) }));

test('ordinary preparation previews the disclosure, records permission, copies and opens the actual clipboard link', async () => {
  let scope: Scope | null = null;
  const prepare = jest.fn(async () => { scope = { permission_kind: 'reported', permission_source: 'Fictional Morgan', shareable: true, authority_active: true, invitations: [], participants: [] } as unknown as Scope; });
  const link = `mobile://invitation?t=${'a'.repeat(64)}`; // Non-issued fixture.
  const issue = jest.fn(async () => link);
  jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
  jest.spyOn(Clipboard, 'getString').mockResolvedValue(link);
  const invitations = { scope: async () => scope, prepare, issue } as unknown as Invitations;
  await render(<InviteScreen arrangement={{ id: 'scope', owner_id: 'owner', draft: { olderAdult: 'Fictional Morgan', description: 'Synthetic groceries', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }} invitations={invitations} />);
  await screen.findByText(/Visible to the designated recipient only after explicit joining/);
  await fireEvent.changeText(screen.getByLabelText(/Who gave permission/), 'Fictional Morgan');
  await fireEvent.press(screen.getByRole('button', { name: 'Record their reported permission and delegation' }));
  expect(prepare).toHaveBeenCalledWith('scope', 'reported', 'Fictional Morgan');
  await fireEvent.changeText(await screen.findByLabelText('Recipient fictional email'), 'helper@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'Copy invitation link' }));
  expect(Clipboard.setString).toHaveBeenCalledWith(link);
  await fireEvent.press(screen.getByRole('button', { name: 'Open copied invitation link on this device' }));
  expect(openURL).toHaveBeenCalledWith(link);
});

test('two recognizable participants have distinct stable removal targets and selecting one preserves the other', async () => {
  const participants = [
    { user_id: 'stable-helper-a', label: 'helper-a@example.test', removed: false },
    { user_id: 'stable-helper-b', label: 'helper-b@example.test', removed: false },
  ];
  const scope = { permission_kind: 'reported', permission_source: 'Fictional Morgan', shareable: true, authority_active: true, invitations: [], participants } as unknown as Scope;
  const manage = jest.fn(async (_id: string, _action: string, target: string | null) => {
    participants.find(p => p.user_id === target)!.removed = true;
  });
  const invitations = { scope: async () => ({ ...scope, participants: participants.map(p => ({ ...p })) }), manage } as unknown as Invitations;
  await render(<InviteScreen arrangement={{ id: 'scope', owner_id: 'owner', draft: { olderAdult: 'Fictional Morgan', description: 'Synthetic groceries', location: '', date: '', time: '', timeZone: 'America/Chicago', prepared: true } }} invitations={invitations} />);
  const removeA = await screen.findByRole('button', { name: 'Remove participant helper-a@example.test' });
  expect(screen.getByRole('button', { name: 'Remove participant helper-b@example.test' })).toBeTruthy();
  expect(screen.queryByText(/stable-helper/)).toBeNull();
  await fireEvent.press(removeA);
  expect(manage).toHaveBeenCalledTimes(1);
  expect(manage).toHaveBeenCalledWith('scope', 'remove', 'stable-helper-a');
  expect(screen.queryByRole('button', { name: 'Remove participant helper-a@example.test' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Remove participant helper-b@example.test' })).toBeTruthy();
});
