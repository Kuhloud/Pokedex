import { router } from "expo-router";
import { FlatList } from "react-native";

import { ItemRow } from "@/components/item-row";
import { Spacing } from "@/constants/theme";
import { Item } from "@/services/pokeapi";

export function ItemList({ items }: { items: Item[] }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.three }}
      renderItem={({ item }) => (
        <ItemRow item={item} onPress={() => router.push(`/item/9999`)} />
      )}
    />
  );
}
