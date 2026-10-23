import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ItemList } from "@/components/item-list";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchItemList, Item } from "@/services/pokeapi";
import { useEffect, useState } from "react";

export default function BagScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetchItemList().then(setItems);
  }, []);
  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Bag</Text>
      <ItemList items={items} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.three },
  title: { fontSize: 28, fontWeight: "bold", paddingVertical: Spacing.two },
});
