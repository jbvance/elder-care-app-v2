import { accountStorage } from '../../account/account-storage';
import { redirectSystemPath } from '../../../app/+native-intent';

jest.mock('../../account/account-storage', () => ({ accountStorage: { setItem: jest.fn(async () => {}), removeItem: jest.fn(async () => {}) } }));

test('native link stores only token in protected storage and strips it from Router state', async () => {
  const token = 'a'.repeat(64); // Non-issued parser fixture, never a usable invitation.
  expect(await redirectSystemPath({ path: `mobile://invitation?t=${token}`, initial: true })).toBe('/invitation');
  expect(accountStorage.setItem).toHaveBeenCalledWith('pending-invitation-v1', token);
  expect(await redirectSystemPath({ path: 'mobile://invitation?t=invalid', initial: false })).toBe('/invitation');
  expect(accountStorage.removeItem).toHaveBeenCalledWith('pending-invitation-v1');
});
