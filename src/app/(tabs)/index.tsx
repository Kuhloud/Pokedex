import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { ItemList } from '@/components/item-list';
import { Spacing } from '@/constants/theme';
import { useItemList } from '@/hooks/use-item-list';
import { useTheme } from '@/hooks/use-theme';

export default function ItemsScreen() {
  const theme = useTheme();
  const { data, isPending, error, refetch } = useItemList();

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>All items</Text>
      {data ? (
        <ItemList items={data} />
      ) : isPending ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <ErrorView message={error.message} onRetry={refetch} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.three },
  title: { fontSize: 28, fontWeight: 'bold', paddingVertical: Spacing.two },
  center: { flex: 1 },
});
