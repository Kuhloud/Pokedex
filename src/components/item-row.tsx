import { Image, Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ItemListItem } from '@/services/pokeapi';

type Props = { item: ItemListItem; onPress: () => void };

export function ItemRow({ item, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.card, opacity: pressed ? 0.6 : 1 }]}>
      <Image source={{ uri: item.spriteUrl }} style={styles.sprite} />
      <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.m,
    boxShadow: '0 1px 4px rgba(34, 48, 60, 0.12)',
  },
  sprite: { width: 40, height: 40 },
  name: { fontSize: 17, fontWeight: 'bold' },
});
