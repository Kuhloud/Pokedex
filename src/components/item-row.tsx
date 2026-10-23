import { Image, Pressable, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Item } from "@/services/pokeapi";
import { ThemedText } from "./themed-text";

type ItemRowProps = {
  item: Item;
  onPress: () => void;
};

export function ItemRow({ item, onPress }: ItemRowProps) {
  const theme = useTheme();
  const spacing = Spacing.two;
  const radius = Radius.s;
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: "row",
          padding: spacing,
          borderRadius: radius,
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
        }}
      >
        <ThemedText
          style={{
            padding: spacing,
            borderRadius: radius,
            color: theme.textSecondary,
          }}
        >
          {item.name}
        </ThemedText>
        <Image
          source={{ uri: item.spriteUrl }}
          style={{ width: 40, height: 40 }}
        />
      </Pressable>
    </View>
  );
}
