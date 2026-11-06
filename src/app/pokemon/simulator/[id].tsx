import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function formatPokedexId(id: number): string {
  return String(id).padStart(3, '0');
}

export default function PokemonSimulatorPlaceholder() {
  const theme = useTheme();
  const router = useRouter();
  const { id: idParam, formId: formIdParam, shiny: shinyParam } =
    useLocalSearchParams<{ id?: string; formId?: string; shiny?: string }>();
  const id = Number(idParam);
  const formId = Number(formIdParam) || id;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={styles.backButton}>
        <Text style={[styles.backText, { color: theme.text }]}>‹  Vorige</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Catching simulator</Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>
          Pokémon #{formatPokedexId(id)}
        </Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>
          Form ID: {formatPokedexId(formId)} · {shinyParam === 'true' ? 'Shiny' : 'Regular'}
        </Text>
        <Text style={[styles.message, { color: theme.text }]}>
          The catching simulator is not implemented yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backButton: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  backText: { fontSize: 16 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.three },
  title: { fontSize: 24, fontWeight: '700' },
  detail: { fontSize: 16 },
  message: { marginTop: Spacing.three, fontSize: 14, textAlign: 'center' },
});