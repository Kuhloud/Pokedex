import { FlatList, StyleSheet } from "react-native";

import { Item } from "@/constants/items";
import { Spacing } from "@/constants/theme";
import { ItemRow } from "./item-row";

export function ItemList({ items }: { items: Item[] }) {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemRow item={item} onPress={() => {}} />}
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
