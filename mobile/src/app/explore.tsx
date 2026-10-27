import { router } from 'expo-router';

import { Action, Copy, Page } from '@/features/private-draft/draft-ui';

export default function ExploreScreen() {
  return (
    <Page>
      <Copy heading>Begin with one real need</Copy>
      <Copy>A ride to an appointment, grocery shopping or help around the house: start with a brief description. No detailed profile or medical information is required.</Copy>
      <Copy heading>Prepare at your own pace</Copy>
      <Copy>You can explore without making a draft. On a supported mobile build, a private draft stays on this device until you discard it or deliberately associate it with an account.</Copy>
      <Copy heading>Preparation is not permission</Copy>
      <Copy>Making a draft does not mean the older adult agreed to share information. It does not invite anyone or mean someone has agreed to help.</Copy>
      <Copy>During this development stage, use fictional information only. Anyone using an already-unlocked device may see a draft. Uninstalling or losing the device or its protection keys may make the draft unrecoverable.</Copy>
      <Action onPress={() => router.push('/draft')}>Prepare an assistance need</Action>
      <Action secondary onPress={() => router.replace('/')}>Return to home</Action>
    </Page>
  );
}
