import { readPendingInvitation, replacePendingInvitation } from '../pending-invitation';

test('incoming writes are ordered and a failed write cannot restore a stale Join target', async () => {
  let stored: string | null = 'previous-non-issued-fixture';
  let release!: () => void;
  const storage = {
    getItem: async () => stored,
    setItem: jest.fn(async (_key: string, value: string) => { await new Promise<void>(resolve => { release = resolve; }); stored = value; }),
    removeItem: async () => { stored = null; },
  };
  const writing = replacePendingInvitation(storage, 'next-non-issued-fixture');
  await Promise.resolve(); await Promise.resolve();
  const invalidating = replacePendingInvitation(storage, null);
  release(); await writing; await invalidating;
  expect(await readPendingInvitation(storage)).toBeNull();
  stored = 'stale-non-issued-fixture';
  storage.setItem.mockRejectedValueOnce(new Error('Protected write failed'));
  await expect(replacePendingInvitation(storage, 'unconfirmed-non-issued-fixture')).rejects.toThrow('Protected write failed');
  await expect(readPendingInvitation(storage)).rejects.toThrow('Protected write failed');
  await replacePendingInvitation(storage, null);
  expect(await readPendingInvitation(storage)).toBeNull();
});
