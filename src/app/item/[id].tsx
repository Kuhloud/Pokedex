import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchItemList, Item } from "@/services/pokeapi";
import { useEffect, useState } from "react";

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetchItemList().then(setItems);
  }, []);

  const item = items.find((i) => i.id === Number(id));

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Item {id} not found.</Text>
      </View>
    );
  } else {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: item.name }} />
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={{ color: theme.textSecondary }}>#{item.id}</Text>
        <View style={[styles.badge, { backgroundColor: theme.badge }]}>
          <Text style={{ color: theme.badgeText }}>{item.category}</Text>
        </View>
        <Text style={[styles.effect, { color: theme.text }]}>
          {item.effect}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.three, gap: Spacing.two },
  name: { fontSize: 28, fontWeight: "bold" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
  effect: { fontSize: 17, marginTop: Spacing.two },
});
