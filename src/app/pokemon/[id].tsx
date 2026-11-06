import { useQuery } from '@tanstack/react-query';
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
  fetchPokemonAppearances,
  fetchPokemonEvolutionFamily,
  type PokemonAppearance,
  type PokemonEvolution,
} from '@/services/pokemon-api';
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

const DARK_TYPE_TEXT = new Set([
  'electric',
  'fairy',
  'ground',
  'ice',
  'normal',
  'steel',
]);

const STAT_ORDER = [
  ['hp', 'HP'],
  ['attack', 'Attack'],
  ['defense', 'Defense'],
  ['special-attack', 'Special Attack'],
  ['special-defense', 'Special Defense'],
  ['speed', 'Speed'],
] as const;

type DetailTab = 'about' | 'stats' | 'evolution';
type SpriteGender = 'male' | 'female';

const appearanceSelections = new Map<number, string>();
const genderSelections = new Map<number, SpriteGender>();

const EVOLUTION_STAGES = [
  { depth: 0, label: 'Unevolved' },
  { depth: 1, label: 'First Evolution' },
  { depth: 2, label: 'Second Evolution' },
] as const;

function formatMeasurement(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function formatPokedexId(id: number): string {
  return String(id).padStart(3, '0');
}

function EvolutionCard({
  pokemon,
  selected,
  onPress,
}: {
  pokemon: PokemonEvolution;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${pokemon.name}, Pokédex number ${formatPokedexId(pokemon.pokemonId)}`}
      onPress={onPress}
      style={[
        styles.evolutionCard,
        {
          backgroundColor: theme.card,
          borderColor: selected ? theme.badge : theme.backgroundElement,
        },
      ]}>
      <View style={[styles.evolutionSpritePanel, { backgroundColor: theme.backgroundElement }]}>
        {pokemon.spriteUrl ? (
          <Image source={{ uri: pokemon.spriteUrl }} style={styles.evolutionSprite} resizeMode="contain" />
        ) : (
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>?</Text>
        )}
      </View>
      <View style={styles.evolutionInfo}>
        <Text style={[styles.evolutionId, { backgroundColor: theme.badge, color: theme.badgeText }]}>
          {formatPokedexId(pokemon.pokemonId)}
        </Text>
        <Text style={[styles.evolutionName, { color: theme.text }]} numberOfLines={2}>
          {pokemon.name}
        </Text>
        {pokemon.specialForm ? (
          <Text style={[styles.evolutionFormLabel, { color: theme.textSecondary }]}>
            {pokemon.specialForm}
          </Text>
        ) : null}
        {pokemon.genderOnly ? (
          <Text style={[styles.evolutionGender, { color: theme.textSecondary }]}>
            {pokemon.genderOnly === 'male' ? '♂ Male only' : '♀ Female only'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function getSelectedAppearance(
  appearances: PokemonAppearance[] | undefined,
  appearanceKey: string | null,
  formId: number,
  speciesId: number,
): PokemonAppearance | undefined {
  if (!appearances) return undefined;
  if (appearanceKey) {
    return appearances.find((appearance) => appearance.key === appearanceKey);
  }
  const selectedPokemon = appearances.find(
    (appearance) =>
      appearance.key.startsWith('pokemon:') &&
      appearance.pokemonId === formId &&
      !appearance.isDefault,
  );
  if (selectedPokemon) return selectedPokemon;
  if (formId === speciesId) {
    return appearances.find((appearance) => appearance.isDefault);
  }
  return undefined;
}

export default function PokemonDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    id: idParam,
    formId: formIdParam,
    shiny: shinyParam,
    appearance: appearanceParam,
    selectionId: selectionIdParam,
    returnTo: returnToParam,
  } = useLocalSearchParams<{
    id?: string;
    formId?: string;
    shiny?: string;
    appearance?: string;
    selectionId?: string;
    returnTo?: string;
  }>();
  const id = idParam ? Number(idParam) : Number.NaN;
  const parsedSelectionId = Number(selectionIdParam);
  const selectionId =
    Number.isInteger(parsedSelectionId) && parsedSelectionId > 0 ? parsedSelectionId : id;
  const validId = Number.isInteger(id) && id > 0;
  const [fontsLoaded, fontError] = useFonts({
    Rubik: require('@/assets/fonts/Rubik-Regular.ttf'),
    RubikMedium: require('@/assets/fonts/Rubik-Medium.ttf'),
    RubikBold: require('@/assets/fonts/Rubik-Bold.ttf'),
  });
  const [selection, setSelection] = useState<PokemonSelection>(() => {
    const stored = getPokemonSelection(selectionId);
    return {
      formId: Number(formIdParam) || stored.formId,
      shiny: shinyParam === undefined ? stored.shiny : shinyParam === 'true',
    };
  });
  const [appearanceKey, setAppearanceKey] = useState<string | null>(
    () =>
      appearanceParam !== undefined
        ? appearanceParam || null
        : appearanceSelections.get(id) ?? null,
  );
  const [selectedGender, setSelectedGender] = useState<SpriteGender>(
    () => genderSelections.get(id) ?? 'male',
  );
  const [activeTab, setActiveTab] = useState<DetailTab>('about');
  const appearancesQuery = useQuery({
    queryKey: ['pokemon', 'appearances', id],
    queryFn: () => fetchPokemonAppearances(id),
    enabled: validId,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const activeAppearance = getSelectedAppearance(
    appearancesQuery.data,
    appearanceKey,
    selection.formId,
    id,
  );
  const alternateAppearances =
    appearancesQuery.data?.filter((appearance) => !appearance.isDefault) ?? [];
  const activePokemonId = activeAppearance?.pokemonId ?? selection.formId;
  const pokemonQuery = usePokemonDetails(activePokemonId, validId);
  const formsQuery = usePokemonForms(id, validId);
  const isRegionalFormSelected =
    selection.formId !== id &&
    (formsQuery.data?.some((form) => form.id === selection.formId) ?? true);
  const favoritesQuery = useFavoriteIds();
  const favoriteMutation = useFavoriteMutation();
  const evolutionQuery = useQuery({
    queryKey: ['pokemon', 'evolution', id],
    queryFn: () => fetchPokemonEvolutionFamily(id),
    enabled: validId,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const isFavorite = favoritesQuery.data?.includes(activePokemonId) ?? false;
  const favoriteDisabled =
    favoritesQuery.isPending || favoritesQuery.isError || favoriteMutation.isPending;

  const updateSelection = (next: PokemonSelection) => {
    setSelection(next);
    setPokemonSelection(selectionId, next);
    router.setParams({ formId: String(next.formId), shiny: String(next.shiny) });
  };

  const selectAppearance = (appearance: PokemonAppearance) => {
    const nextKey = appearance.isDefault ? null : appearance.key;
    setAppearanceKey(nextKey);
    if (nextKey) appearanceSelections.set(id, nextKey);
    else appearanceSelections.delete(id);

    const nextSelection = isRegionalFormSelected
      ? { ...selection, formId: id }
      : selection;
    if (nextSelection !== selection) {
      setSelection(nextSelection);
      setPokemonSelection(selectionId, nextSelection);
    }
    router.setParams({
      appearance: nextKey ?? '',
      formId: String(id),
    });
  };

  const selectRegionalForm = (formId: number) => {
    setAppearanceKey(null);
    appearanceSelections.delete(id);
    updateSelection({ ...selection, formId });
    router.setParams({ appearance: '' });
  };

  const selectGender = (gender: SpriteGender) => {
    setSelectedGender(gender);
    genderSelections.set(id, gender);
  };

  const screenOptions = <Stack.Screen options={{ headerShown: false }} />;

  if (fontError) {
    return (
      <>
        {screenOptions}
        <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.text }}>The Rubik font could not be loaded.</Text>
        </SafeAreaView>
      </>
    );
  }
  if (!fontsLoaded) {
    return (
      <>
        {screenOptions}
        <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator color={theme.badge} />
        </SafeAreaView>
      </>
    );
  }
  if (!validId) {
    return (
      <>
        {screenOptions}
        <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
          <ErrorView message="The Pokémon ID is invalid." onRetry={() => router.back()} />
        </SafeAreaView>
      </>
    );
  }
  if (!pokemonQuery.data) {
    return (
      <>
        {screenOptions}
        <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
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
      </>
    );
  }

  const details = pokemonQuery.data;
  const genderSprites = activeAppearance
    ? activeAppearance.genderSprites
    : details.genderSprites;
  const selectedRegularSprite =
    selectedGender === 'female' && genderSprites?.female
      ? genderSprites.female
      : genderSprites?.male ?? activeAppearance?.spriteUrl ?? details.spriteUrl;
  const selectedShinySprite =
    (selectedGender === 'female'
      ? genderSprites?.femaleShiny
      : genderSprites?.maleShiny) ??
    activeAppearance?.shinySpriteUrl ??
    details.shinySpriteUrl;
  const spriteUrl = selection.shiny ? selectedShinySprite ?? selectedRegularSprite : selectedRegularSprite;
  const hasGenderDifference = Boolean(
    genderSprites?.male &&
      genderSprites.female &&
      genderSprites.male !== genderSprites.female,
  );
  const hasShinySprite = Boolean(selectedShinySprite);
  const types =
    details.types.length > 0
      ? details.types.map((type) => type.charAt(0).toUpperCase() + type.slice(1))
      : ['Not available'];
  const abilities = details.abilities.length > 0 ? details.abilities.join(', ') : 'Not available';

  const renderAbout = () => (
    <View style={styles.aboutList}>
      <AboutRow label="Name" value={details.name || 'Not available'} />
      <AboutRow label="ID" value={formatPokedexId(details.id)} />
      <AboutRow
        label="Base"
        value={details.baseExperience === null ? 'Not available' : `${details.baseExperience} XP`}
      />
      <AboutRow
        label="Weight"
        value={`${formatMeasurement(details.weight / 10)} kg`}
      />
      <AboutRow
        label="Height"
        value={`${formatMeasurement(details.height / 10)} m`}
      />
      <AboutRow label="Types" value={types.join(', ')} />
      <AboutRow label="Abilities" value={abilities} />
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsList}>
      {STAT_ORDER.map(([name, label]) => {
        const stat = details.stats.find((entry) => entry.name === name);
        const value = stat?.value;

        return (
          <View key={name} style={styles.stat}>
            <View style={styles.statHeading}>
              <Text style={[styles.statLabel, { color: theme.text }]}>{label}</Text>
              <Text style={[styles.statValue, { color: theme.textSecondary }]}>
                {value === undefined ? 'Not available' : value}
              </Text>
            </View>
            <View style={[styles.statTrack, { backgroundColor: theme.backgroundElement }]}>
              {value !== undefined ? (
                <View
                  style={[
                    styles.statFill,
                    {
                      backgroundColor: theme.badge,
                      width: `${(Math.min(value, 255) / 255) * 100}%`,
                    },
                  ]}
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderEvolution = () => {
    if (evolutionQuery.isPending) {
      return <ActivityIndicator style={styles.tabLoading} color={theme.badge} />;
    }

    if (evolutionQuery.isError) {
      return (
        <ErrorView
          message={evolutionQuery.error.message}
          onRetry={() => void evolutionQuery.refetch()}
        />
      );
    }

    return (
      <View style={styles.evolutionList}>
        {EVOLUTION_STAGES.map((stage) => {
          const members = evolutionQuery.data.filter((pokemon) =>
            stage.depth === 2 ? pokemon.depth >= 2 : pokemon.depth === stage.depth,
          );
          if (members.length === 0) return null;

          return (
            <View key={stage.label} style={styles.evolutionStage}>
              <Text style={[styles.evolutionStageTitle, { color: theme.text }]}>
                {stage.label}
              </Text>
              <View style={styles.evolutionStageCards}>
                {members.map((pokemon) => (
                  <EvolutionCard
                    key={`${pokemon.pokemonId}-${pokemon.name}`}
                    pokemon={pokemon}
                    selected={
                      pokemon.speciesId === id && pokemon.pokemonId === activePokemonId
                    }
                    onPress={() =>
                      router.push({
                        pathname: '/pokemon/[id]',
                        params: {
                          id: String(pokemon.speciesId),
                          formId: String(pokemon.pokemonId),
                          appearance: pokemon.specialForm
                            ? `pokemon:${pokemon.pokemonId}`
                            : '',
                          shiny: 'false',
                          returnTo: returnToParam === 'favorites' ? 'favorites' : 'index',
                        },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.card }]}>
      {screenOptions}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.background }]}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() =>
                router.replace(
                  returnToParam === 'favorites' ? '/(tabs)/favorites' : '/(tabs)',
                )
              }
              style={styles.backButton}>
              <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
              <Text style={[styles.backLabel, { color: theme.text }]}>Vorige</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favoritesQuery.isPending
                  ? 'Loading Favorites'
                  : favoritesQuery.isError
                  ? 'Favorites unavailable'
                  : isFavorite
                    ? 'Remove from Favorites'
                    : 'Add to Favorites'
              }
              accessibilityState={{ disabled: favoriteDisabled, selected: isFavorite }}
              disabled={favoriteDisabled}
              onPress={() =>
                favoriteMutation.mutate({
                  id: activePokemonId,
                  favorite: !isFavorite,
                })
              }
              style={styles.favoriteIconButton}>
              <Text
                style={[
                  styles.favoriteIcon,
                  { color: isFavorite ? '#FF5272' : theme.text },
                ]}>
                {favoritesQuery.isPending ? '…' : isFavorite ? '♥' : '♡'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {details.name}
            </Text>
            <Text style={[styles.number, { color: theme.textSecondary }]}>
              #{formatPokedexId(details.id)}
            </Text>
          </View>

          <View style={styles.typeRow}>
            {details.types.map((type) => (
              <View
                key={type}
                style={[
                  styles.typeBadge,
                  { backgroundColor: TYPE_COLORS[type] ?? theme.badge },
                ]}>
                <View style={styles.typeDot} />
                <Text
                  style={[
                    styles.typeText,
                    { color: DARK_TYPE_TEXT.has(type) ? theme.text : '#FFFFFF' },
                  ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </View>
            ))}
          </View>

          {spriteUrl ? (
            <Image source={{ uri: spriteUrl }} style={styles.heroSprite} resizeMode="contain" />
          ) : (
            <View style={[styles.heroSpritePlaceholder, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>?</Text>
            </View>
          )}
        </View>

        <View style={styles.selectionControls}>
          {formsQuery.isError ? (
            <ErrorView message={formsQuery.error.message} onRetry={() => void formsQuery.refetch()} />
          ) : formsQuery.isPending ? (
            <ActivityIndicator color={theme.badge} />
          ) : (formsQuery.data?.length ?? 0) > 1 ? (
            <View style={styles.formSection}>
              <Text style={[styles.formSectionTitle, { color: theme.text }]}>Regional form</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formRow}>
                {formsQuery.data?.map((form) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selection.formId === form.id }}
                    key={form.id}
                    onPress={() => selectRegionalForm(form.id)}
                    style={[
                      styles.formChip,
                      {
                        backgroundColor:
                          selection.formId === form.id ? theme.badge : theme.backgroundElement,
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
            </View>
          ) : null}

          {!isRegionalFormSelected && appearancesQuery.isError ? (
            <ErrorView
              message={appearancesQuery.error.message}
              onRetry={() => void appearancesQuery.refetch()}
            />
          ) : !isRegionalFormSelected && appearancesQuery.isPending ? (
            <ActivityIndicator color={theme.badge} />
          ) : !isRegionalFormSelected && alternateAppearances.length > 0 ? (
            <View style={styles.formSection}>
              <Text style={[styles.formSectionTitle, { color: theme.text }]}>Other forms</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formRow}>
                {alternateAppearances.map((appearance) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: activeAppearance?.key === appearance.key,
                    }}
                    key={appearance.key}
                    onPress={() => selectAppearance(appearance)}
                    style={[
                      styles.formChip,
                      {
                        backgroundColor:
                          activeAppearance?.key === appearance.key
                            ? theme.badge
                            : theme.backgroundElement,
                      },
                    ]}>
                    <Text
                      style={{
                        color:
                          activeAppearance?.key === appearance.key
                            ? theme.badgeText
                            : theme.text,
                        fontFamily: 'RubikMedium',
                      }}>
                      {appearance.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {hasGenderDifference ? (
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Sprite gender"
              accessibilityState={{ checked: selectedGender === 'female' }}
              onPress={() =>
                selectGender(selectedGender === 'male' ? 'female' : 'male')
              }
              style={[styles.shinyButton, { backgroundColor: theme.backgroundElement }]}>
              <Text style={{ color: theme.text, fontFamily: 'RubikMedium' }}>
                {selectedGender === 'male' ? 'Male sprite' : 'Female sprite'}
              </Text>
              <Text style={{ color: theme.badge, fontFamily: 'RubikMedium' }}>Switch</Text>
            </Pressable>
          ) : null}

          {hasShinySprite ? (
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: selection.shiny }}
              onPress={() => updateSelection({ ...selection, shiny: !selection.shiny })}
              style={[styles.shinyButton, { backgroundColor: theme.backgroundElement }]}>
              <Text style={{ color: theme.text, fontFamily: 'RubikMedium' }}>
                {selection.shiny ? 'Shiny sprite' : 'Regular sprite'}
              </Text>
              <Text style={{ color: theme.badge, fontFamily: 'RubikMedium' }}>
                {selection.shiny ? 'On' : 'Off'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/pokemon/simulator/[id]',
                params: {
                  id: String(id),
                  formId: String(selection.formId),
                  appearance: activeAppearance?.key ?? '',
                  gender: selectedGender,
                  shiny: String(selection.shiny),
                },
              })
            }
            style={[styles.catchButton, { backgroundColor: theme.badge }]}>
            <Text style={[styles.catchButtonText, { color: theme.badgeText }]}>Catch</Text>
          </Pressable>

          {favoritesQuery.isError ? (
            <ErrorView
              message={`Favorites could not be loaded: ${favoritesQuery.error.message}`}
              onRetry={() => void favoritesQuery.refetch()}
            />
          ) : null}
          {favoriteMutation.isError ? (
            <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.text }]}>
              {favoriteMutation.error.message}
            </Text>
          ) : null}
        </View>

        <View style={[styles.tabs, { borderBottomColor: theme.backgroundSelected }]}>
          {(['about', 'stats', 'evolution'] as const).map((tab) => {
            const selected = activeTab === tab;
            const label = tab === 'about' ? 'About' : tab === 'stats' ? 'Stats' : 'Evolution';
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  selected && { borderBottomColor: theme.badge },
                ]}>
                <Text
                  style={[
                    styles.tabText,
                    { color: selected ? theme.text : theme.textSecondary },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'about'
            ? renderAbout()
            : activeTab === 'stats'
              ? renderStats()
              : renderEvolution()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.aboutRow}>
      <Text style={[styles.aboutLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.aboutValue, { color: theme.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: Spacing.five },
  hero: { height: 330, paddingHorizontal: Spacing.three, paddingTop: Spacing.one },
  topBar: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  backArrow: { fontSize: 34, lineHeight: 36, marginTop: -4 },
  backLabel: { fontFamily: 'Rubik', fontSize: 16 },
  favoriteIconButton: { minWidth: 40, minHeight: 40, alignItems: 'flex-end', justifyContent: 'center' },
  favoriteIcon: { fontSize: 28, lineHeight: 32 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  title: { flexShrink: 1, fontFamily: 'RubikBold', fontSize: 28 },
  number: { fontFamily: 'Rubik', fontSize: 20 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
  },
  typeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  typeText: { fontFamily: 'RubikMedium', fontSize: 14 },
  heroSprite: {
    position: 'absolute',
    width: 230,
    height: 230,
    bottom: -48,
    alignSelf: 'center',
    zIndex: 2,
  },
  heroSpritePlaceholder: {
    position: 'absolute',
    width: 190,
    height: 190,
    bottom: -38,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.l,
  },
  placeholderText: { fontFamily: 'RubikMedium', fontSize: 28 },
  selectionControls: { paddingHorizontal: Spacing.three, paddingTop: 54, gap: Spacing.two },
  formSection: { gap: Spacing.one },
  formSectionTitle: { fontFamily: 'RubikMedium', fontSize: 13 },
  formRow: { flexDirection: 'row', gap: Spacing.two },
  formChip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.m },
  shinyButton: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.m,
  },
  catchButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.m },
  catchButtonText: { fontFamily: 'RubikMedium', fontSize: 16 },
  errorText: { fontFamily: 'Rubik', fontSize: 13 },
  tabs: {
    flexDirection: 'row',
    marginTop: Spacing.three,
    marginHorizontal: Spacing.three,
    borderBottomWidth: 2,
  },
  tab: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabText: { fontFamily: 'RubikMedium', fontSize: 14 },
  tabContent: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  aboutList: { gap: Spacing.three },
  aboutRow: { flexDirection: 'row', alignItems: 'flex-start' },
  aboutLabel: { width: '35%', fontFamily: 'RubikMedium', fontSize: 14 },
  aboutValue: { flex: 1, fontFamily: 'Rubik', fontSize: 14 },
  statsList: { gap: Spacing.three },
  stat: { gap: Spacing.one },
  statHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontFamily: 'RubikMedium', fontSize: 14 },
  statValue: { fontFamily: 'Rubik', fontSize: 14 },
  statTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 2 },
  tabLoading: { marginVertical: Spacing.four },
  evolutionList: { gap: Spacing.three },
  evolutionStage: { gap: Spacing.two },
  evolutionStageTitle: { fontFamily: 'RubikBold', fontSize: 17 },
  evolutionStageCards: { gap: Spacing.two },
  evolutionCard: {
    minHeight: 80,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.m,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#10113D',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  evolutionSpritePanel: { width: 80, minHeight: 80, alignItems: 'center', justifyContent: 'center' },
  evolutionSprite: { width: 64, height: 64 },
  evolutionInfo: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', padding: Spacing.two, gap: Spacing.one },
  evolutionId: { overflow: 'hidden', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontFamily: 'RubikMedium', fontSize: 11 },
  evolutionName: { fontFamily: 'RubikMedium', fontSize: 16 },
  evolutionFormLabel: { fontFamily: 'RubikMedium', fontSize: 12 },
  evolutionGender: { fontFamily: 'Rubik', fontSize: 12 },
});
