import { FlatList, StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";
import { Item } from "@/services/pokeapi";
import { ItemRow } from "./item-row";

export function ItemList({ items }: { items: Item[] }) {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <ItemRow item={item} onPress={() => alert(item.name)} />
      )}
      keyExtractor={(item) => item.id.toString()}
    />
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
