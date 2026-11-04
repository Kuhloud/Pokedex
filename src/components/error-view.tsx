import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { message: string; onRetry: () => void };

export function ErrorView({ message, onRetry }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={{ color: theme.text }}>{message}</Text>
      <Pressable onPress={onRetry} style={[styles.button, { backgroundColor: theme.badge }]}>
        <Text style={{ color: theme.badgeText }}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  button: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.s },
});
