import { useLocalSearchParams } from 'expo-router';
import { getAccount, getAssistance } from '@/features/account/runtime';
import { AssistanceScreen } from '@/features/assistance/assistance-screen';
import { Copy, Page } from '@/features/private-draft/draft-ui';

export default function WorkRoute() {
  const { id, view } = useLocalSearchParams<{ id?: string; view?: string }>();
  let account; let assistance;
  try { account = getAccount(); assistance = getAssistance(); } catch { /* Protected native configuration required. */ }
  if (!account || !assistance) return <Page><Copy>Use the native local development app for needs and opportunities.</Copy></Page>;
  return <AssistanceScreen account={account} assistance={assistance} initialId={id} initialView={view} />;
}
