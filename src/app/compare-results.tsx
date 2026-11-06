import { useQueries } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePokemonDetails } from '@/hooks/use-pokemon-list';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  fetchPokemonTypeDamageRelations,
  type PokemonDetails,
  type PokemonTypeDamageRelations,
} from '@/services/pokemon-api';

const STATS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Special Attack' },
  { key: 'special-defense', label: 'Special Defense' },
  { key: 'speed', label: 'Speed' },
] as const;
const DATA_STALE_TIME = 1000 * 60 * 60 * 24;

export default function CompareResultsScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [fontsLoaded, fontError] = useFonts({
    Rubik: require('@/assets/fonts/Rubik-Regular.ttf'),
    RubikMedium: require('@/assets/fonts/Rubik-Medium.ttf'),
    RubikBold: require('@/assets/fonts/Rubik-Bold.ttf'),
  });
  const params = useLocalSearchParams<{
    firstId?: string | string[];
    secondId?: string | string[];
    firstShiny?: string | string[];
    secondShiny?: string | string[];
  }>();
  const firstId = parsePokemonId(params.firstId);
  const secondId = parsePokemonId(params.secondId);
  const firstShiny = parseBoolean(params.firstShiny);
  const secondShiny = parseBoolean(params.secondShiny);
  const firstQuery = usePokemonDetails(firstId ?? 0, firstId !== null);
  const secondQuery = usePokemonDetails(secondId ?? 0, secondId !== null);
  const typeNames = useMemo(
    () =>
      [...new Set([...(firstQuery.data?.types ?? []), ...(secondQuery.data?.types ?? [])])].sort(),
    [firstQuery.data, secondQuery.data],
  );
  const typeQueries = useQueries({
    queries: typeNames.map((type) => ({
      queryKey: ['pokemon', 'type-damage-relations', type],
      queryFn: () => fetchPokemonTypeDamageRelations(type),
      staleTime: DATA_STALE_TIME,
    })),
  });
  const relationsByType = new Map<string, PokemonTypeDamageRelations>();
  typeQueries.forEach((query, index) => {
    if (query.data) relationsByType.set(typeNames[index], query.data);
  });
  const isPending = firstQuery.isPending || secondQuery.isPending || typeQueries.some((query) => query.isPending);
  const hasDetailError = firstQuery.isError || secondQuery.isError;
  const hasTypeError = typeQueries.some((query) => query.isError);
  const hasMissingTypeData = typeNames.some((type) => !relationsByType.has(type));
  const hasMissingPokemonTypes =
    (firstQuery.data !== undefined && firstQuery.data.types.length === 0) ||
    (secondQuery.data !== undefined && secondQuery.data.types.length === 0);

  const retryDetails = () => {
    if (firstQuery.isError) void firstQuery.refetch();
    if (secondQuery.isError) void secondQuery.refetch();
  };
  const retryTypeRelations = () => {
    typeQueries.forEach((query) => {
      if (query.isError) void query.refetch();
    });
  };

  if (fontError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.text }}>
            {`The Rubik font could not be loaded: ${fontError.message}`}
          </Text>
        </SafeAreaView>
      </>
    );
  }

  if (!fontsLoaded) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator color={theme.badge} />
        </SafeAreaView>
      </>
    );
  }

  if (firstId === null || secondId === null) {
    return (
      <MessageState
        message="The selected Pokémon could not be identified."
        buttonLabel="Back to selection"
        onPress={() => router.replace('/compare')}
        theme={theme}
      />
    );
  }

  if (isPending) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.badge} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading comparison…
        </Text>
      </SafeAreaView>
    );
  }

  if (hasDetailError) {
    const error = firstQuery.isError ? firstQuery.error : secondQuery.error;
    return (
      <MessageState
        message={error instanceof Error ? error.message : 'Unable to load Pokémon comparison data.'}
        buttonLabel="Retry"
        onPress={retryDetails}
        theme={theme}
      />
    );
  }

  if (hasMissingPokemonTypes) {
    return (
      <MessageState
        message="Pokémon type information is unavailable."
        buttonLabel="Retry"
        onPress={retryDetails}
        theme={theme}
      />
    );
  }

  if (hasTypeError || hasMissingTypeData) {
    const failedQuery = typeQueries.find((query) => query.isError);
    return (
      <MessageState
        message={
          failedQuery?.error instanceof Error
            ? failedQuery.error.message
            : 'Type damage relations could not be loaded completely.'
        }
        buttonLabel="Retry"
        onPress={retryTypeRelations}
        theme={theme}
      />
    );
  }

  if (!firstQuery.data || !secondQuery.data) {
    return (
      <MessageState
        message="Pokémon comparison data is unavailable."
        buttonLabel="Retry"
        onPress={retryDetails}
        theme={theme}
      />
    );
  }

  const first = firstQuery.data;
  const second = secondQuery.data;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Pokémon selection"
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.text }]}>‹  Back to selection</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Compare Pokémon</Text>
          <View style={styles.pokemonRow}>
            <PokemonCard
              pokemon={first}
              shiny={firstShiny}
              hasTypeAdvantage={hasTypeAdvantage(first, second, relationsByType)}
              theme={theme}
            />
            <Text style={[styles.versus, { color: theme.textSecondary }]}>VS</Text>
            <PokemonCard
              pokemon={second}
              shiny={secondShiny}
              hasTypeAdvantage={hasTypeAdvantage(second, first, relationsByType)}
              theme={theme}
            />
          </View>

          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Base stats</Text>
            {STATS.map(({ key, label }) => (
              <StatRow
                key={key}
                label={label}
                firstValue={getStatValue(first, key)}
                secondValue={getStatValue(second, key)}
                theme={theme}
              />
            ))}
          </View>

          <View style={styles.typeSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Type effectiveness</Text>
            <TypeEffectiveness
              attacker={first}
              defender={second}
              relationsByType={relationsByType}
              theme={theme}
            />
            <TypeEffectiveness
              attacker={second}
              defender={first}
              relationsByType={relationsByType}
              theme={theme}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function PokemonCard({
  pokemon,
  shiny,
  hasTypeAdvantage,
  theme,
}: {
  pokemon: PokemonDetails;
  shiny: boolean;
  hasTypeAdvantage: boolean;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  const spriteUrl = shiny && pokemon.shinySpriteUrl ? pokemon.shinySpriteUrl : pokemon.spriteUrl;
  return (
    <View style={[styles.pokemonCard, { backgroundColor: theme.card }]}>
      <View style={[styles.artworkPanel, { backgroundColor: theme.backgroundElement }]}>
        {spriteUrl ? (
          <Image
            accessibilityLabel={`${pokemon.name} sprite`}
            source={{ uri: spriteUrl }}
            style={styles.artwork}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.spriteFallback, { color: theme.textSecondary }]}>
            Sprite unavailable
          </Text>
        )}
      </View>
      <Text numberOfLines={2} style={[styles.pokemonName, { color: theme.text }]}>
        {pokemon.name}
      </Text>
      <View style={styles.typeChips}>
        {pokemon.types.map((type) => (
          <Text
            key={type}
            style={[styles.typeChip, { backgroundColor: theme.backgroundSelected, color: theme.text }]}>
            {titleCase(type)}
          </Text>
        ))}
      </View>
      {hasTypeAdvantage ? (
        <Text style={[styles.advantageBadge, { backgroundColor: theme.badge, color: theme.badgeText }]}>
          Type advantage
        </Text>
      ) : null}
    </View>
  );
}

function StatRow({
  label,
  firstValue,
  secondValue,
  theme,
}: {
  label: string;
  firstValue: number | null;
  secondValue: number | null;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <View style={styles.statRow}>
      <StatValue value={firstValue} theme={theme} />
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <StatValue value={secondValue} theme={theme} />
    </View>
  );
}

function StatValue({
  value,
  theme,
}: {
  value: number | null;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  const width = value === null ? '0%' : `${(Math.min(value, 255) / 255) * 100}%`;
  return (
    <View style={styles.statValueColumn}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value ?? '—'}</Text>
      <View style={[styles.statTrack, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.statFill, { backgroundColor: theme.badge, width }]} />
      </View>
    </View>
  );
}

function TypeEffectiveness({
  attacker,
  defender,
  relationsByType,
  theme,
}: {
  attacker: PokemonDetails;
  defender: PokemonDetails;
  relationsByType: Map<string, PokemonTypeDamageRelations>;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <View style={[styles.effectCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.effectTitle, { color: theme.text }]}>{attacker.name} attacks</Text>
      <Text style={[styles.effectSubtitle, { color: theme.textSecondary }]}>
        Against {defender.name} ({defender.types.map(titleCase).join(' / ')})
      </Text>
      {attacker.types.map((attackingType) => {
        const multiplier = getDamageMultiplier(
          defender.types,
          relationsByType.get(attackingType),
        );
        return (
          <View
            key={attackingType}
            style={[styles.effectRow, { borderTopColor: theme.backgroundSelected }]}>
            <Text style={[styles.effectType, { color: theme.text }]}>{titleCase(attackingType)}</Text>
            <Text style={[styles.effectLabel, { color: theme.badge }]}>
              {effectivenessLabel(multiplier)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MessageState({
  message,
  buttonLabel,
  onPress,
  theme,
}: {
  message: string;
  buttonLabel: string;
  onPress: () => void;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text accessibilityRole="alert" style={[styles.errorMessage, { color: theme.text }]}>
          {message}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={[styles.retryButton, { backgroundColor: theme.badge }]}>
          <Text style={[styles.retryText, { color: theme.badgeText }]}>{buttonLabel}</Text>
        </Pressable>
      </SafeAreaView>
    </>
  );
}

function parsePokemonId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue || !/^\d+$/.test(rawValue)) return null;
  const id = Number(rawValue);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseBoolean(value: string | string[] | undefined): boolean {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'true';
}

function getStatValue(pokemon: PokemonDetails, statName: string): number | null {
  return pokemon.stats.find((stat) => stat.name === statName)?.value ?? null;
}

function hasTypeAdvantage(
  attacker: PokemonDetails,
  defender: PokemonDetails,
  relationsByType: Map<string, PokemonTypeDamageRelations>,
) {
  return attacker.types.some((type) => {
    const multiplier = getDamageMultiplier(
      defender.types,
      relationsByType.get(type),
    );
    return multiplier !== null && multiplier > 1;
  });
}

function getDamageMultiplier(
  defendingTypes: string[],
  relations: PokemonTypeDamageRelations | undefined,
): number | null {
  if (!relations) return null;
  return defendingTypes.reduce((multiplier, defendingType) => {
    if (relations.noDamageTo.includes(defendingType)) return 0;
    if (relations.doubleDamageTo.includes(defendingType)) return multiplier * 2;
    if (relations.halfDamageTo.includes(defendingType)) return multiplier * 0.5;
    return multiplier;
  }, 1);
}

function effectivenessLabel(multiplier: number | null): string {
  if (multiplier === null) return 'unavailable';
  if (multiplier === 0) return 'no effect';
  if (multiplier > 1) return 'super effective';
  if (multiplier < 1) return 'not very effective';
  return 'normal damage';
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three, gap: Spacing.two },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.four, gap: Spacing.three },
  backButton: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  backText: { fontFamily: 'Rubik', fontSize: 15 },
  title: { fontFamily: 'RubikBold', fontSize: 23, paddingHorizontal: Spacing.one },
  pokemonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  pokemonCard: {
    flex: 1,
    minWidth: 0,
    padding: Spacing.two,
    borderRadius: Radius.m,
    alignItems: 'center',
    gap: Spacing.one,
    elevation: 3,
    shadowColor: '#192345',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  artworkPanel: { width: '100%', aspectRatio: 1, borderRadius: Radius.s, alignItems: 'center', justifyContent: 'center' },
  artwork: { width: '90%', height: '90%' },
  spriteFallback: { padding: Spacing.two, fontFamily: 'Rubik', fontSize: 11, textAlign: 'center' },
  pokemonName: { width: '100%', minHeight: 40, fontFamily: 'RubikBold', fontSize: 15, textAlign: 'center' },
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.one },
  typeChip: { overflow: 'hidden', borderRadius: 16, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontFamily: 'RubikMedium', fontSize: 10 },
  advantageBadge: { overflow: 'hidden', borderRadius: 16, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontFamily: 'RubikMedium', fontSize: 10, textAlign: 'center' },
  versus: { fontFamily: 'RubikBold', fontSize: 12 },
  section: { padding: Spacing.three, borderRadius: Radius.m, gap: Spacing.two },
  sectionTitle: { fontFamily: 'RubikBold', fontSize: 18 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, minHeight: 40 },
  statValueColumn: { flex: 1, minWidth: 0, gap: Spacing.one },
  statValue: { fontFamily: 'RubikMedium', fontSize: 14 },
  statLabel: { width: 92, fontFamily: 'RubikMedium', fontSize: 11, textAlign: 'center' },
  statTrack: { height: 4, width: '100%', borderRadius: 4, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 4 },
  typeSection: { gap: Spacing.two },
  effectCard: { padding: Spacing.three, borderRadius: Radius.m, gap: Spacing.one },
  effectTitle: { fontFamily: 'RubikBold', fontSize: 15 },
  effectSubtitle: { fontFamily: 'Rubik', fontSize: 12, marginBottom: Spacing.one },
  effectRow: { minHeight: 36, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  effectType: { fontFamily: 'RubikMedium', fontSize: 13 },
  effectLabel: { fontFamily: 'RubikBold', fontSize: 12, textAlign: 'right' },
  loadingText: { fontFamily: 'Rubik', fontSize: 14 },
  errorMessage: { fontFamily: 'Rubik', fontSize: 15, textAlign: 'center' },
  retryButton: { minHeight: 42, borderRadius: Radius.s, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: 'RubikMedium', fontSize: 14 },
});
