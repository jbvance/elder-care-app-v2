import { router, usePreventRemove } from 'expo-router';
import { useCallback, useState } from 'react';

import { privateDraftStore } from '@/features/private-draft/device-store';
import { DraftEditor } from '@/features/private-draft/draft-editor';

export default function DraftScreen() {
  const [unsaved, setUnsaved] = useState(false);
  const [notice, setNotice] = useState('');
  const disablePrevention = usePreventRemove(unsaved, () => {
    setNotice('Your latest save has not been confirmed. Stay here to retry saving, or deliberately discard the draft before leaving.');
  });
  const onUnsavedChange = useCallback((value: boolean) => {
    setUnsaved(value);
    if (!value) setNotice('');
  }, []);
  return <DraftEditor store={privateDraftStore} onUnsavedChange={onUnsavedChange} navigationNotice={notice} onDone={() => {
    setUnsaved(false);
    disablePrevention();
    router.replace('/');
  }} />;
}
