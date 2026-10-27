import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';

import RootLayout from '../../../app/_layout';
import DraftScreen from '../../../app/draft';
import ExploreScreen from '../../../app/explore';
import HomeScreen from '../../../app/index';
import { createPrivateDraftStore, type PrivateDraftStore } from '../protected-store';
import { nativeIoFixture } from './native-io-fixture';

let mockStore: PrivateDraftStore;
jest.mock('../device-store', () => ({
  privateDraftStore: {
    load: () => mockStore.load(),
    save: (...args: Parameters<PrivateDraftStore['save']>) => mockStore.save(...args),
    discard: () => mockStore.discard(),
  },
}));

test('ordinary navigation permits exploration, preparation and returning to the private need', async () => {
  const fixture = nativeIoFixture();
  mockStore = createPrivateDraftStore(fixture.platform);
  try {
    await renderRouter({ _layout: RootLayout, index: HomeScreen, explore: ExploreScreen, draft: DraftScreen });
    await fireEvent.press(await screen.findByRole('button', { name: 'Explore how it helps' }));
    expect(await screen.findByText('Preparation is not permission')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Prepare an assistance need' }));
    await screen.findByLabelText('Who is the assistance for?');
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional Morgan');
    await fireEvent.changeText(screen.getByLabelText('What assistance is needed?'), 'A grocery trip');
    await fireEvent.press(screen.getByRole('button', { name: 'Done for now' }));
    expect(await screen.findByText('A grocery trip')).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Revisit private draft' })).toBeTruthy();
  } finally { fixture.cleanup(); }
});

test.each(['failWrite', 'failClose'] as const)('Back retains edits while save confirmation is missing: %s', async (failure) => {
  const fixture = nativeIoFixture();
  mockStore = createPrivateDraftStore(fixture.platform);
  try {
    await renderRouter({ _layout: RootLayout, index: HomeScreen, explore: ExploreScreen, draft: DraftScreen });
    await fireEvent.press(await screen.findByRole('button', { name: 'Prepare an assistance need' }));
    await screen.findByLabelText('Who is the assistance for?');
    fixture.state[failure] = true;
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional unsaved name');
    await screen.findByText('Save not confirmed on this device');
    await act(() => router.back());
    expect(screen.getByDisplayValue('Fictional unsaved name')).toBeTruthy();
    expect(await screen.findByText(/Your latest save has not been confirmed/)).toBeTruthy();
    fixture.state[failure] = false;
    if (failure === 'failClose') expect((await mockStore.load())?.olderAdult).toBe('Fictional unsaved name');
    await fireEvent.press(screen.getByRole('button', { name: 'Try saving again' }));
    await screen.findByText('Saved privately on this device');
    await act(() => router.back());
    expect(await screen.findByText('Fictional unsaved name')).toBeTruthy();
  } finally { fixture.cleanup(); }
});
