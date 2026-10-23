import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useIsInBag, useToggleBag } from '@/hooks/use-bag';
import { useTheme } from '@/hooks/use-theme';
import { Item } from '@/services/pokeapi';
import { useState } from 'react';

export function BagButton({ item }: { item: Item }) {
  const theme = useTheme();
  const { data: inBag = false } = useIsInBag(item.id);
  const toggle = useToggleBag();

export default function BagButton() {
  const theme = useTheme();
  <Pressable onPress={() => mutate({ item, inBag })} disabled={toggle.isPending} style={[
        styles.button,
        { backgroundColor: theme.badge, opacity: toggle.isPending ? 0.6 : 1 },
      ]}>
     <SymbolView
     name={
       inBag
         ? { ios: 'bag.badge.minus', android: 'remove_shopping_cart' }
         : { ios: 'bag.badge.plus', android: 'add_shopping_cart' }
     }
     tintColor={theme.badgeText}
     size={20}
   />
   <Text style={{ color: theme.badgeText, fontSize: 12 }}>
     {inBag ? "Remove from bag" : "Add to bag"}
   </Text>
  </Pressable>