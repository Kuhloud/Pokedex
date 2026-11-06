import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { BagButton } from '@/components/bag-button';
import { ErrorView } from '@/components/error-view';
import { Radius, Spacing } from '@/constants/theme';
import { useItem } from '@/hooks/use-item';
import { useTheme } from '@/hooks/use-theme';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: item, isPending, error, refetch } = useItem(Number(id));

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {isPending ? (
          <ActivityIndicator style={styles.center} />
        ) : (
          <ErrorView message={error.message} onRetry={refetch} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: item.name }} />
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Image source={{ uri: item.spriteUrl }} style={styles.sprite} />
      </View>
      <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
      <Text style={{ color: theme.textSecondary }}>#{item.id}</Text>
      <View style={[styles.badge, { backgroundColor: theme.badge }]}>
        <Text style={{ color: theme.badgeText }}>{item.category}</Text>
      </View>
      <Text style={[styles.effect, { color: theme.text }]}>{item.effect}</Text>
      <BagButton item={item} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.three, gap: Spacing.two },
  center: { flex: 1 },
  card: { alignItems: 'center', padding: Spacing.four, borderRadius: Radius.l },
  sprite: { width: 96, height: 96 },
  name: { fontSize: 28, fontWeight: 'bold' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: Spacing.half, borderRadius: Radius.s },
  effect: { fontSize: 17, marginTop: Spacing.two },
});
