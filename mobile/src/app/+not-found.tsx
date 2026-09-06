import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotFound() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <Stack.Screen options={{ title: 'Nicht gefunden' }} />
      <EmptyState emoji="🧭" title="Hier gibt es nichts" message="Der Link führt ins Leere. Vielleicht wurde der Artikel verschoben." actionLabel="Zur Startseite" onAction={() => router.replace('/')} />
    </View>
  );
}
