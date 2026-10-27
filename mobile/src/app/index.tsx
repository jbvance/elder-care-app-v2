import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { privateDraftStore } from '@/features/private-draft/device-store';
import { Action, Copy, Page } from '@/features/private-draft/draft-ui';
import type { PrivateDraft } from '@/features/private-draft/protected-store';

export default function HomeScreen() {
  const [draft, setDraft] = useState<PrivateDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void privateDraftStore.load().then((value) => {
      if (active) { setDraft(value); setError(false); }
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  return (
    <Page>
      <Copy heading>Make helping easier</Copy>
      <Copy>Start with one thing someone needs help with. Prepare privately, without signing in.</Copy>
      {Platform.OS === 'web' && <Copy>Browser preview: fictional information only. Drafts are not retained after reload.</Copy>}
      {loading ? <Copy>Opening private preparation…</Copy> : error ? <>
        <Copy>Protected storage could not be opened. Nothing has been shared or replaced.</Copy>
        <Action onPress={() => router.push('/draft')}>Open draft options</Action>
      </> : draft ? <>
        <Copy heading>{draft.olderAdult || 'Your private draft'}</Copy>
        <Copy>{draft.description || 'An unfinished assistance need'}</Copy>
        {!!draft.date && <Copy>{draft.date}{draft.time ? ` at ${draft.time}` : ''} ({draft.timeZone.replaceAll('_', ' ')})</Copy>}
        {!!draft.location && <Copy>{draft.location}</Copy>}
        <Copy>Assistance has not been arranged. Nothing has been shared.</Copy>
        <Copy>{Platform.OS === 'web' ? 'In-memory preview only.' : 'Saved privately on this device.'} You can return to edit or discard it.</Copy>
        <Action onPress={() => router.push('/draft')}>Revisit private draft</Action>
      </> : <Action onPress={() => router.push('/draft')}>Prepare an assistance need</Action>}
      <Action secondary onPress={() => router.push('/explore')}>Explore how it helps</Action>
      <Copy>Use fictional information during development. This app does not arrange assistance or share information simply because you make a draft.</Copy>
    </Page>
  );
}
