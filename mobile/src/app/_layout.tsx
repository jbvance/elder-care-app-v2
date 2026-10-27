import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDraftColors } from '@/features/private-draft/draft-ui';

export default function RootLayout() {
  const colors = useDraftColors();
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerTitleStyle: { fontSize: 20 }, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" options={{ title: 'Elder Care' }} />
        <Stack.Screen name="draft" options={{ title: 'Private draft' }} />
        <Stack.Screen name="explore" options={{ title: 'How it helps' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
