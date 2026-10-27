import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { DraftEditor } from '../draft-editor';
import { createPrivateDraftStore } from '../protected-store';
import { nativeIoFixture } from './native-io-fixture';

test('prepare, revisit, edit and discard a private need without authentication', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  try {
    const view = await render(<DraftEditor store={store} onDone={() => {}} />);
    await screen.findByLabelText('Who is the assistance for?');
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional Morgan');
    await fireEvent.changeText(screen.getByLabelText('What assistance is needed?'), 'A ride to an appointment');
    await screen.findByText('Saved privately on this device');
    await view.unmount();

    const reopened = await render(<DraftEditor store={createPrivateDraftStore(fixture.platform)} onDone={() => {}} />);
    expect(await screen.findByDisplayValue('A ride to an appointment')).toBeTruthy();
    expect(screen.getByText('Assistance has not been arranged. Nothing has been shared.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('What assistance is needed?'), 'A ride and return trip');
    await screen.findByText('Saved privately on this device');
    await fireEvent.press(screen.getByRole('button', { name: 'Discard draft' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Discard this draft' }));
    await reopened.unmount();
    await expect(createPrivateDraftStore(fixture.platform).load()).resolves.toBeNull();
  } finally { fixture.cleanup(); }
});

test('failed saving keeps unfinished input and offers retry without mandatory fields', async () => {
  const fixture = nativeIoFixture();
  try {
    await render(<DraftEditor store={createPrivateDraftStore(fixture.platform)} onDone={() => {}} />);
    await screen.findByLabelText('Who is the assistance for?');
    fixture.state.failWrite = true;
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional Morgan');
    await screen.findByText('Save not confirmed on this device');
    expect(screen.getByDisplayValue('Fictional Morgan')).toBeTruthy();
    fixture.state.failWrite = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Try saving again' }));
    await screen.findByText('Saved privately on this device');
    expect((await createPrivateDraftStore(fixture.platform).load())?.olderAdult).toBe('Fictional Morgan');
  } finally { fixture.cleanup(); }
});

test('optional scheduled details retain their named zone and invalid dates do not lose input', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  const onDone = jest.fn();
  try {
    await render(<DraftEditor store={store} onDone={onDone} />);
    await screen.findByLabelText('Who is the assistance for?');
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional Morgan');
    await fireEvent.changeText(screen.getByLabelText('What assistance is needed?'), 'An appointment ride');
    await fireEvent.press(screen.getByRole('button', { name: 'Add date, time or place (optional)' }));
    await fireEvent.changeText(screen.getByLabelText('Date (optional, month/day/year)'), '2/30/2026');
    await fireEvent.changeText(screen.getByLabelText('Time (optional)'), '10:00 AM');
    await fireEvent.press(screen.getByRole('button', { name: 'Done for now' }));
    expect(await screen.findByText(/Use a real date/)).toBeTruthy();
    expect(screen.getByDisplayValue('An appointment ride')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Date (optional, month/day/year)'), '2/28/2026');
    await fireEvent.press(screen.getByRole('button', { name: /^Time zone:/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Central (America/Chicago)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done for now' }));
    await screen.findByText('Saved privately on this device');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(await store.load()).toMatchObject({ date: '2/28/2026', time: '10:00 AM', timeZone: 'America/Chicago', prepared: true });
  } finally { fixture.cleanup(); }
});

test.each([
  ['3/8/2026', '2:30 AM', /does not occur/],
  ['11/1/2026', '1:30 AM', /occurs twice/],
])('does not label ambiguous or skipped local time prepared: %s %s', async (date, time, message) => {
  const fixture = nativeIoFixture();
  const onDone = jest.fn();
  try {
    await render(<DraftEditor store={createPrivateDraftStore(fixture.platform)} onDone={onDone} />);
    await screen.findByLabelText('Who is the assistance for?');
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional Morgan');
    await fireEvent.changeText(screen.getByLabelText('What assistance is needed?'), 'A ride');
    await fireEvent.press(screen.getByRole('button', { name: 'Add date, time or place (optional)' }));
    await fireEvent.changeText(screen.getByLabelText('Date (optional, month/day/year)'), date);
    await fireEvent.changeText(screen.getByLabelText('Time (optional)'), time);
    await fireEvent.press(screen.getByRole('button', { name: /^Time zone:/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Central (America/Chicago)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done for now' }));
    expect(await screen.findByText(message)).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  } finally { fixture.cleanup(); }
});

test('close failure after a committed autosave is shown as unconfirmed and safely retryable', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  try {
    await render(<DraftEditor store={store} onDone={() => {}} />);
    await screen.findByLabelText('Who is the assistance for?');
    fixture.state.failClose = true;
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional committed name');
    expect(await screen.findByText('Save not confirmed on this device')).toBeTruthy();
    expect(screen.queryByText('Not saved on this device')).toBeNull();
    expect(screen.getByDisplayValue('Fictional committed name')).toBeTruthy();
    fixture.state.failClose = false;
    expect((await store.load())?.olderAdult).toBe('Fictional committed name');
    await fireEvent.press(screen.getByRole('button', { name: 'Try saving again' }));
    await screen.findByText('Saved privately on this device');
  } finally { fixture.cleanup(); }
});

test('an unreadable initial database can be kept or deliberately discarded before starting again', async () => {
  const fixture = nativeIoFixture();
  const store = createPrivateDraftStore(fixture.platform);
  const onDone = jest.fn();
  try {
    const interruptedCreation = await fixture.platform.open();
    await interruptedCreation.database.closeAsync();
    const view = await render(<DraftEditor store={store} onDone={onDone} />);
    await screen.findByText(/We could not open protected storage/);
    expect(screen.queryByLabelText('Who is the assistance for?')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Discard draft' }));
    await screen.findByText(/This cannot be undone/);
    await fireEvent.press(screen.getByRole('button', { name: 'Keep draft' }));
    expect(onDone).not.toHaveBeenCalled();
    await expect(store.load()).rejects.toThrow('Protected storage is unavailable');
    expect(fixture.state.key).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Discard draft' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Discard this draft' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    await view.unmount();
    await render(<DraftEditor store={store} onDone={() => {}} />);
    await screen.findByLabelText('Who is the assistance for?');
    await fireEvent.changeText(screen.getByLabelText('Who is the assistance for?'), 'Fictional fresh preparation');
    await screen.findByText('Saved privately on this device');
    expect((await store.load())?.olderAdult).toBe('Fictional fresh preparation');
  } finally { fixture.cleanup(); }
});
