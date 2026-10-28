import { useLocalSearchParams } from 'expo-router';
import { getAccount, getInvitations, getParticipation } from '@/features/account/runtime';
import { ParticipationScreen } from '@/features/participation/participation-screen';
import { Copy, Page } from '@/features/private-draft/draft-ui';

export default function ParticipationRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  let account; let participation;
  try { account = getAccount(); participation = getParticipation(); } catch { /* Protected native configuration required. */ }
  if (!account || !participation) return <Page><Copy>Use the native local development app for scoped participation.</Copy></Page>;
  return <ParticipationScreen account={account} participation={participation} invitations={getInvitations()} initialId={id} />;
}
