import { router } from 'expo-router';
import { FlatList } from 'react-native';

import { ItemRow } from '@/components/item-row';
import { ItemListItem } from '@/services/pokeapi';
import { Spacing } from '@/constants/theme';

export function ItemList({ items }: { items: ItemListItem[] }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.three }}
      renderItem={({ item }) => <ItemRow item={item} onPress={() => router.push(`/item/${item.id}`)} />}
    />
  );
}
