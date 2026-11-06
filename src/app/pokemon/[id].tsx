import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { Radius, Spacing } from '@/constants/theme';
import {
  getPokemonSelection,
  setPokemonSelection,
  useFavoriteIds,
  useFavoriteMutation,
  usePokemonDetails,
  usePokemonForms,
  type PokemonSelection,
} from '@/hooks/use-pokemon-list';
import { useTheme } from '@/hooks/use-theme';

const TYPE_COLORS: Record<string, string> = {
  bug: '#729F3F',
  dark: '#4F3F3A',
  dragon: '#7038F8',
  electric: '#F7D02C',
  fairy: '#D685AD',
  fighting: '#C22E28',
  fire: '#EE8130',
  flying: '#A98FF3',
  ghost: '#735797',
  grass: '#7AC74C',
  ground: '#E2BF65',
  ice: '#96D9D6',
  normal: '#A8A77A',
  poison: '#A33EA1',
  psychic: '#F95587',
  rock: '#B6A136',
  steel: '#B7B7CE',
  water: '#6390F0',
};

export default function PokemonDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id: idParam, formId: formIdParam, shiny: shinyParam } =
    useLocalSearchParams<{ id?: string; formId?: string; shiny?: string }>();
  const id = idParam ? Number(idParam) : Number.NaN;
  const [fontsLoaded, fontError] = useFonts({
    Rubik: require('@/assets/fonts/Rubik-Regular.ttf'),
    RubikMedium: require('@/assets/fonts/Rubik-Medium.ttf'),
    RubikBold: require('@/assets/fonts/Rubik-Bold.ttf'),
  });
  const [selection, setSelection] = useState<PokemonSelection>(() => {
    const stored = getPokemonSelection(id);
    return {
      formId: Number(formIdParam) || stored.formId,
      shiny: shinyParam === undefined ? stored.shiny : shinyParam === 'true',
    };
  });
  const pokemonQuery = usePokemonDetails(selection.formId);
  const formsQuery = usePokemonForms(id);
  const favoritesQuery = useFavoriteIds();
  const favoriteMutation = useFavoriteMutation();
  const isFavorite = favoritesQuery.data?.includes(id) ?? false;

  const updateSelection = (next: PokemonSelection) => {
    setSelection(next);
    setPokemonSelection(id, next);
    router.setParams({ formId: String(next.formId), shiny: String(next.shiny) });
  };

  if (fontError) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>The Rubik font could not be loaded.</Text>
      </SafeAreaView>
    );
  }
  if (!fontsLoaded) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.badge} />
      </SafeAreaView>
    );
  }
  if (!Number.isInteger(id) || id < 1) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <ErrorView message="The Pokémon ID is invalid." onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }
  if (!pokemonQuery.data) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Pokémon', headerBackButtonDisplayMode: 'minimal' }} />
        {pokemonQuery.isPending ? (
          <ActivityIndicator style={styles.centered} color={theme.badge} />
        ) : (
          <ErrorView
            message={
              pokemonQuery.error instanceof Error
                ? pokemonQuery.error.message
                : 'Unable to load this Pokémon.'
            }
            onRetry={() => void pokemonQuery.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: pokemonQuery.data.name,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.spritePanel, { backgroundColor: theme.backgroundElement }]}>
          {pokemonQuery.data.spriteUrl ? (
            <Image
              source={{
                uri:
                  selection.shiny && pokemonQuery.data.shinySpriteUrl
                    ? pokemonQuery.data.shinySpriteUrl
                    : pokemonQuery.data.spriteUrl,
              }}
              style={styles.sprite}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: theme.textSecondary }}>Sprite unavailable</Text>
          )}
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{pokemonQuery.data.name}</Text>
        <Text style={[styles.number, { color: theme.textSecondary }]}>
          #{String(id).padStart(3, '0')}
        </Text>

        <View style={styles.controls}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Form</Text>
          {formsQuery.isPending ? <ActivityIndicator color={theme.badge} /> : null}
          {formsQuery.isError ? (
            <ErrorView
              message={formsQuery.error.message}
              onRetry={() => void formsQuery.refetch()}
            />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {(formsQuery.data ?? []).map((form) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selection.formId === form.id }}
                  key={form.id}
                  onPress={() => updateSelection({ ...selection, formId: form.id })}
                  style={[
                    styles.formChip,
                    {
                      backgroundColor:
                        selection.formId === form.id ? theme.badge : theme.card,
                    },
                  ]}>
                  <Text
                    style={{
                      color: selection.formId === form.id ? theme.badgeText : theme.text,
                      fontFamily: 'RubikMedium',
                    }}>
                    {form.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {pokemonQuery.data.shinySpriteUrl ? (
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: selection.shiny }}
              onPress={() => updateSelection({ ...selection, shiny: !selection.shiny })}
              style={[styles.shinyButton, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text, fontFamily: 'RubikMedium' }}>
                {selection.shiny ? 'Shiny sprite' : 'Regular sprite'}
              </Text>
              <Text style={{ color: theme.badge }}>{selection.shiny ? 'On' : 'Off'}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.controls}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Type</Text>
          <View style={styles.chipRow}>
            {pokemonQuery.data.types.map((type) => (
              <View key={type} style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[type] ?? theme.badge }]}>
                <Text style={styles.typeText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={favoriteMutation.isPending || favoritesQuery.isPending}
          onPress={() =>
            favoriteMutation.mutate({
              id,
              favorite: !isFavorite,
            })
          }
          style={[styles.favoriteButton, { backgroundColor: theme.badge }]}>
          <Text style={{ color: theme.badgeText, fontFamily: 'RubikMedium' }}>
            {favoriteMutation.isPending
              ? 'Saving...'
              : isFavorite
                ? 'Remove from Favorites'
                : 'Add to Favorites'}
          </Text>
        </Pressable>
        {favoriteMutation.isError ? (
          <Text accessibilityRole="alert" style={{ color: theme.text }}>
            {favoriteMutation.error.message}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  spritePanel: { minHeight: 240, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.l },
  sprite: { width: 220, height: 220 },
  title: { fontFamily: 'RubikBold', fontSize: 28, textAlign: 'center' },
  number: { fontFamily: 'RubikMedium', textAlign: 'center', marginTop: -Spacing.two },
  controls: { gap: Spacing.two },
  sectionTitle: { fontFamily: 'RubikBold', fontSize: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  formChip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.m },
  shinyButton: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.m,
  },
  typeBadge: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.m },
  typeText: { color: '#FFFFFF', fontFamily: 'RubikMedium' },
  favoriteButton: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.m,
  },
});
