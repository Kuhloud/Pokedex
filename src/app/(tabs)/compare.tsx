import { SymbolView } from 'expo-symbols';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  filterPokemonCatalog,
  getPokemonSelection,
  setPokemonSelection,
  useFavoriteMutation,
  usePokemonCatalog,
  usePokemonDetailsMany,
  usePokemonForms,
  usePokemonRarity,
  type PokemonFilters,
} from '@/hooks/use-pokemon-list';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { PokemonDetails, PokemonSummary, RegionalForm } from '@/services/pokemon-api';

type SortField = 'id' | 'name';
type SortOrder = 'asc' | 'desc';
type MenuPokemon = { pokemon: PokemonSummary } | null;
type FilterKey = 'generations' | 'rarities' | 'types';

const INITIAL_FILTERS: PokemonFilters = { search: '', generations: [], rarities: [], types: [] };
const BATCH_SIZE = 30;

export default function CompareSelectionScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [fontsLoaded, fontError] = useFonts({
    Rubik: require('@/assets/fonts/Rubik-Regular.ttf'),
    RubikMedium: require('@/assets/fonts/Rubik-Medium.ttf'),
    RubikBold: require('@/assets/fonts/Rubik-Bold.ttf'),
  });
  const catalogQuery = usePokemonCatalog();
  const [activeFilters, setFilters] = useState<PokemonFilters>(INITIAL_FILTERS);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [menuPokemon, setMenuPokemon] = useState<MenuPokemon>(null);
  const [formPokemonId, setFormPokemonId] = useState<number | null>(null);
  const [, setSelectionRevision] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const rarityQuery = usePokemonRarity(
    catalogQuery.data?.species ?? [],
    activeFilters.rarities.length > 0,
  );
  const formsQuery = usePokemonForms(formPokemonId ?? 0, formPokemonId !== null);
  const favoriteMutation = useFavoriteMutation();
  const filteredPokemon = useMemo(() => {
    if (!catalogQuery.data) return [];
    return filterPokemonCatalog(catalogQuery.data, activeFilters, rarityQuery.data).sort(
      (a, b) => {
        const comparison = sortField === 'id' ? a.id - b.id : a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      },
    );
  }, [activeFilters, catalogQuery.data, rarityQuery.data, sortField, sortOrder]);
  const visiblePokemon = filteredPokemon.slice(0, visibleCount);
  const selectedFormIds = visiblePokemon.map((pokemon) => getPokemonSelection(pokemon.id).formId);
  const detailsQueries = usePokemonDetailsMany(selectedFormIds);
  const detailsById = new Map<number, PokemonDetails>();
  for (const result of detailsQueries) {
    if (result.data) detailsById.set(result.data.id, result.data);
  }
  const regionalSpeciesIds = useMemo(
    () => new Set(catalogQuery.data?.regionalNameAliases.map(({ speciesId }) => speciesId) ?? []),
    [catalogQuery.data],
  );
  const selectedPokemon =
    catalogQuery.data?.species.filter((pokemon) => selectedIds.includes(pokemon.id)) ?? [];
  const currentFiltersCount =
    activeFilters.generations.length + activeFilters.rarities.length + activeFilters.types.length;

  const updateFilters = (next: PokemonFilters) => {
    setFilters(next);
    setVisibleCount(BATCH_SIZE);
  };

  const toggleFilterValue = (key: FilterKey, value: string | number) => {
    if (key === 'generations' && typeof value === 'number') {
      const current = activeFilters.generations;
      updateFilters({
        ...activeFilters,
        generations: toggleValue(current, value),
      });
    } else if (key === 'rarities' && (value === 'legendary' || value === 'mythical')) {
      const current = activeFilters.rarities;
      updateFilters({
        ...activeFilters,
        rarities: toggleValue(current, value),
      });
    } else if (key === 'types' && typeof value === 'string') {
      const current = activeFilters.types;
      updateFilters({
        ...activeFilters,
        types: toggleValue(current, value),
      });
    }
  };

  const togglePokemon = (pokemon: PokemonSummary) => {
    setSelectedIds((current) => {
      if (current.includes(pokemon.id)) {
        return current.filter((id) => id !== pokemon.id);
      }
      return current.length < 2 ? [...current, pokemon.id] : current;
    });
  };

  const openPokemon = (pokemon: PokemonSummary) => {
    const selection = getPokemonSelection(pokemon.id);
    router.push({
      pathname: '/pokemon/[id]',
      params: {
        id: String(pokemon.id),
        formId: String(selection.formId),
        shiny: String(selection.shiny),
      },
    });
  };

  const sharePokemon = async (pokemon: PokemonSummary) => {
    try {
      await Share.share({ message: `${pokemon.name} (#${pokemon.id})` });
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to open the share sheet.');
    }
  };

  const addFavorite = (pokemon: PokemonSummary) => {
    const selection = getPokemonSelection(pokemon.id);
    favoriteMutation.mutate(
      { id: selection.formId, favorite: true },
      {
        onSuccess: () => setActionError(null),
        onError: (error) => setActionError(error.message),
      },
    );
  };

  const selectForm = (form: RegionalForm) => {
    if (formPokemonId === null) return;
    const previous = getPokemonSelection(formPokemonId);
    setPokemonSelection(formPokemonId, { ...previous, formId: form.id });
    setSelectionRevision((revision) => revision + 1);
    setFormPokemonId(null);
  };

  const compareSelected = () => {
    if (selectedIds.length !== 2) return;
    const firstSelection = getPokemonSelection(selectedIds[0]);
    const secondSelection = getPokemonSelection(selectedIds[1]);
    router.push({
      pathname: '/compare-results',
      params: {
        firstId: String(firstSelection.formId),
        secondId: String(secondSelection.formId),
        firstShiny: String(firstSelection.shiny),
        secondShiny: String(secondSelection.shiny),
      },
    });
  };

  if (fontError) {
    return (
      <SelectionState
        message={`The Rubik font could not be loaded: ${fontError.message}`}
        selectedCount={selectedIds.length}
        onCompare={compareSelected}
        theme={theme}
      />
    );
  }

  if (!fontsLoaded) {
    return (
      <SelectionState
        loading
        selectedCount={selectedIds.length}
        onCompare={compareSelected}
        theme={theme}
      />
    );
  }

  if (!catalogQuery.data) {
    return (
      <SelectionState
        loading={catalogQuery.isPending}
        selectedCount={selectedIds.length}
        onCompare={compareSelected}
        message={
          catalogQuery.error instanceof Error
            ? catalogQuery.error.message
            : 'Unable to load the Pokémon index.'
        }
        onRetry={() => void catalogQuery.refetch()}
        theme={theme}
      />
    );
  }

  if (activeFilters.rarities.length > 0 && rarityQuery.isError) {
    return (
      <SelectionState
        message={rarityQuery.error.message}
        selectedCount={selectedIds.length}
        onCompare={compareSelected}
        onRetry={() => void rarityQuery.refetch()}
        theme={theme}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={visiblePokemon}
        keyExtractor={(pokemon) => String(pokemon.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (visibleCount < filteredPokemon.length) {
            setVisibleCount((count) => Math.min(count + BATCH_SIZE, filteredPokemon.length));
          }
        }}
        onEndReachedThreshold={0.45}
        initialNumToRender={8}
        maxToRenderPerBatch={12}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.searchBox, { backgroundColor: theme.card }]}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search' }}
                tintColor={theme.text}
                size={20}
              />
              <TextInput
                accessibilityLabel="Search Pokémon"
                placeholder="Search Pokémon"
                placeholderTextColor={theme.textSecondary}
                value={activeFilters.search}
                onChangeText={(search) => updateFilters({ ...activeFilters, search })}
                style={[styles.searchInput, { color: theme.text }]}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {activeFilters.search.length > 0 ? (
                <Pressable
                  accessibilityLabel="Clear search"
                  onPress={() => updateFilters({ ...activeFilters, search: '' })}>
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'cancel' }}
                    tintColor={theme.textSecondary}
                    size={18}
                  />
                </Pressable>
              ) : null}
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Choose 2 Pokémon</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Select two Pokémon to compare their stats and type matchups.
            </Text>
            <View style={styles.controlRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change sort order"
                onPress={() => setSortOpen(true)}
                style={[styles.controlButton, { backgroundColor: theme.card }]}>
                <SymbolView
                  name={{ ios: 'arrow.up.arrow.down', android: 'sort' }}
                  tintColor={theme.text}
                  size={16}
                />
                <Text style={[styles.controlText, { color: theme.text }]}>
                  {sortField === 'id' ? 'Pokédex ID' : 'Name'} {sortOrder === 'asc' ? '↑' : '↓'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open filters"
                onPress={() => setFilterOpen(true)}
                style={[styles.controlButton, { backgroundColor: theme.card }]}>
                <SymbolView
                  name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list' }}
                  tintColor={theme.text}
                  size={16}
                />
                <Text style={[styles.controlText, { color: theme.text }]}>
                  Filters{currentFiltersCount > 0 ? ` (${currentFiltersCount})` : ''}
                </Text>
              </Pressable>
            </View>
            <View style={[styles.selectedPanel, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.selectedTitle, { color: theme.text }]}>
                Selected {selectedIds.length}/2
              </Text>
              {selectedPokemon.length > 0 ? (
                <View style={styles.selectedChips}>
                  {selectedPokemon.map((pokemon) => (
                    <Pressable
                      key={pokemon.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${pokemon.name} from comparison`}
                      onPress={() => togglePokemon(pokemon)}
                      style={[styles.selectedChip, { backgroundColor: theme.card }]}>
                      <Text style={[styles.selectedChipText, { color: theme.text }]}>
                        {pokemon.name}  ×
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={[styles.selectedHint, { color: theme.textSecondary }]}>
                  Choose any two Pokémon below.
                </Text>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          activeFilters.rarities.length > 0 && rarityQuery.isPending ? (
            <ActivityIndicator style={styles.footerLoader} color={theme.badge} />
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {activeFilters.search.trim().length >= 2
                ? 'No Pokémon match your search.'
                : 'No Pokémon found.'}
            </Text>
          )
        }
        renderItem={({ item, index }) => {
          const selection = getPokemonSelection(item.id);
          const details = detailsById.get(selection.formId);
          const detailsQuery = detailsQueries[index];
          const isSelected = selectedIds.includes(item.id);
          const isSelectionDisabled = selectedIds.length === 2 && !isSelected;
          return (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={[styles.spritePanel, { backgroundColor: theme.backgroundElement }]}>
                <Text
                  style={[
                    styles.numberBadge,
                    { backgroundColor: theme.badge, color: theme.badgeText },
                  ]}>
                  {String(item.id).padStart(3, '0')}
                </Text>
                {details?.spriteUrl ? (
                  <Image
                    accessibilityLabel={`${item.name} sprite`}
                    source={{
                      uri:
                        selection.shiny && details.shinySpriteUrl
                          ? details.shinySpriteUrl
                          : details.spriteUrl,
                    }}
                    style={styles.sprite}
                    resizeMode="contain"
                  />
                ) : detailsQuery?.isPending ? (
                  <ActivityIndicator color={theme.badge} />
                ) : detailsQuery?.isError ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void detailsQuery.refetch()}
                    style={styles.spriteRetry}>
                    <Text style={[styles.spriteFallback, { color: theme.textSecondary }]}>
                      Retry sprite
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.spriteFallback, { color: theme.textSecondary }]}>
                    Sprite unavailable
                  </Text>
                )}
                {details?.shinySpriteUrl ? (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel={`${selection.shiny ? 'Disable' : 'Enable'} shiny sprite for ${item.name}`}
                    accessibilityState={{ checked: selection.shiny }}
                    onPress={() => {
                      setPokemonSelection(item.id, { ...selection, shiny: !selection.shiny });
                      setSelectionRevision((revision) => revision + 1);
                    }}
                    style={[styles.shinyToggle, { backgroundColor: theme.card }]}>
                    <Text style={[styles.shinyText, { color: theme.text }]}>
                      {selection.shiny ? 'Shiny' : 'Regular'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}
                  onPress={() => openPokemon(item)}
                  style={styles.nameButton}>
                  <Text numberOfLines={1} style={[styles.cardName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`More actions for ${item.name}`}
                  onPress={() => setMenuPokemon({ pokemon: item })}
                  style={styles.menuButton}>
                  <Text style={[styles.menuIcon, { color: theme.text }]}>⋮</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${isSelected ? 'Remove' : 'Select'} ${item.name} ${isSelected ? 'from' : 'for'} comparison`}
                  accessibilityState={{ checked: isSelected, disabled: isSelectionDisabled }}
                  disabled={isSelectionDisabled}
                  onPress={() => togglePokemon(item)}
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected ? theme.badge : 'transparent',
                      borderColor: isSelected ? theme.badge : theme.textSecondary,
                      opacity: isSelectionDisabled ? 0.45 : 1,
                    },
                  ]}>
                  {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                </Pressable>
              </View>
              {regionalSpeciesIds.has(item.id) ? (
                <View style={styles.formRow}>
                  {formsQuery.isFetching && formPokemonId === item.id ? (
                    <ActivityIndicator color={theme.badge} />
                  ) : formsQuery.isError && formPokemonId === item.id ? (
                    <Pressable onPress={() => void formsQuery.refetch()}>
                      <Text style={[styles.formButtonText, { color: theme.textSecondary }]}>
                        Retry regional forms
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setFormPokemonId(item.id)}
                      style={styles.formButton}>
                      <Text numberOfLines={1} style={[styles.formButtonText, { color: theme.textSecondary }]}>
                        {selection.formId === item.id ? 'Choose regional form' : details?.name ?? 'Regional form'}⌄
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          );
        }}
        ListFooterComponent={
          visibleCount < filteredPokemon.length ? (
            <ActivityIndicator style={styles.footerLoader} color={theme.badge} />
          ) : undefined
        }
      />

      <CompareActionBar selectedCount={selectedIds.length} onPress={compareSelected} actionError={actionError} theme={theme} />

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <ModalBackdrop onClose={() => setSortOpen(false)} />
        <View style={[styles.dialog, { backgroundColor: theme.card }]}>
          <Text style={[styles.dialogTitle, { color: theme.text }]}>Sort Pokémon</Text>
          {(['id', 'name'] as const).map((field) => (
            <Pressable
              key={field}
              onPress={() => {
                setSortField(field);
                setSortOpen(false);
              }}
              style={[styles.dialogOption, { borderColor: theme.backgroundElement }]}>
              <Text style={[styles.dialogOptionText, { color: theme.text }]}>
                {field === 'id' ? 'Pokédex ID' : 'Name'}
              </Text>
              <Text style={{ color: theme.badge }}>{sortField === field ? 'Selected' : ''}</Text>
            </Pressable>
          ))}
          <View style={styles.controlRow}>
            {(['asc', 'desc'] as const).map((order) => (
              <ChoiceChip
                key={order}
                label={order === 'asc' ? 'Ascending' : 'Descending'}
                selected={sortOrder === order}
                onPress={() => setSortOrder(order)}
                theme={theme}
              />
            ))}
          </View>
          <DialogClose onPress={() => setSortOpen(false)} theme={theme} />
        </View>
      </Modal>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <ModalBackdrop onClose={() => setFilterOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.dialogTitle, { color: theme.text }]}>Filters</Text>
          <ScrollView style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Generation</Text>
            <View style={styles.chipWrap}>
              {catalogQuery.data.generations.map((generation) => (
                <ChoiceChip
                  key={generation}
                  label={`Gen ${generation}`}
                  selected={activeFilters.generations.includes(generation)}
                  onPress={() => toggleFilterValue('generations', generation)}
                  theme={theme}
                />
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Rarity</Text>
            <View style={styles.chipWrap}>
              {(['legendary', 'mythical'] as const).map((rarity) => (
                <ChoiceChip
                  key={rarity}
                  label={rarity === 'legendary' ? 'Legendary' : 'Mythical'}
                  selected={activeFilters.rarities.includes(rarity)}
                  onPress={() => toggleFilterValue('rarities', rarity)}
                  theme={theme}
                />
              ))}
            </View>
            {rarityQuery.isFetching ? <ActivityIndicator color={theme.badge} /> : null}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Type</Text>
            <View style={styles.chipWrap}>
              {catalogQuery.data.types.map((type) => (
                <ChoiceChip
                  key={type}
                  label={titleCase(type)}
                  selected={activeFilters.types.includes(type)}
                  onPress={() => toggleFilterValue('types', type)}
                  theme={theme}
                />
              ))}
            </View>
          </ScrollView>
          <View style={styles.controlRow}>
            <DialogClose onPress={() => setFilterOpen(false)} theme={theme} />
            <Pressable
              onPress={() => updateFilters({ ...INITIAL_FILTERS, search: activeFilters.search })}
              style={[styles.clearFiltersButton, { borderColor: theme.backgroundElement }]}>
              <Text style={{ color: theme.text }}>Clear filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={formPokemonId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFormPokemonId(null)}>
        <ModalBackdrop onClose={() => setFormPokemonId(null)} />
        <View style={[styles.dialog, { backgroundColor: theme.card }]}>
          <Text style={[styles.dialogTitle, { color: theme.text }]}>Choose form</Text>
          {formsQuery.isPending ? <ActivityIndicator color={theme.badge} /> : null}
          {formsQuery.isError ? (
            <Text style={[styles.errorText, { color: theme.text }]}>{formsQuery.error.message}</Text>
          ) : (
            formsQuery.data?.map((form) => (
              <Pressable
                key={form.id}
                onPress={() => selectForm(form)}
                style={[styles.dialogOption, { borderColor: theme.backgroundElement }]}>
                <Text style={[styles.dialogOptionText, { color: theme.text }]}>{form.label}</Text>
                {form.id === getPokemonSelection(formPokemonId ?? 0).formId ? (
                  <Text style={{ color: theme.badge }}>Selected</Text>
                ) : null}
              </Pressable>
            ))
          )}
          {formsQuery.isError ? (
            <ActionButton label="Retry" onPress={() => void formsQuery.refetch()} theme={theme} />
          ) : null}
          <DialogClose onPress={() => setFormPokemonId(null)} theme={theme} />
        </View>
      </Modal>

      <Modal
        visible={menuPokemon !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuPokemon(null)}>
        <ModalBackdrop onClose={() => setMenuPokemon(null)} />
        <View
          style={[
            styles.optionsSheet,
            Platform.OS === 'ios' ? styles.iosOptionsPosition : styles.androidOptionsPosition,
            { backgroundColor: theme.card },
          ]}>
          {menuPokemon ? (
            <>
              <Text style={[styles.dialogTitle, { color: theme.text }]}>{menuPokemon.pokemon.name}</Text>
              <MenuOption
                label="Open Pokémon"
                onPress={() => {
                  setMenuPokemon(null);
                  openPokemon(menuPokemon.pokemon);
                }}
                theme={theme}
              />
              <MenuOption
                label="Add to favorites"
                onPress={() => {
                  addFavorite(menuPokemon.pokemon);
                  setMenuPokemon(null);
                }}
                theme={theme}
              />
              <MenuOption
                label="Share"
                onPress={() => {
                  void sharePokemon(menuPokemon.pokemon);
                  setMenuPokemon(null);
                }}
                theme={theme}
                last
              />
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function SelectionState({
  loading = false,
  message,
  onRetry,
  selectedCount,
  onCompare,
  theme,
}: {
  loading?: boolean;
  message?: string;
  onRetry?: () => void;
  selectedCount: number;
  onCompare: () => void;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.stateContent}>
        {loading ? (
          <ActivityIndicator color={theme.badge} />
        ) : (
          <View style={styles.errorContent}>
            {message ? (
              <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.text }]}>
                {message}
              </Text>
            ) : null}
            {onRetry ? <ActionButton label="Retry" onPress={onRetry} theme={theme} /> : null}
          </View>
        )}
      </View>
      <CompareActionBar selectedCount={selectedCount} onPress={onCompare} theme={theme} />
    </SafeAreaView>
  );
}

function CompareActionBar({
  selectedCount,
  onPress,
  actionError,
  theme,
}: {
  selectedCount: number;
  onPress: () => void;
  actionError?: string | null;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  const isReady = selectedCount === 2;
  return (
    <View style={[styles.bottomAction, { backgroundColor: theme.background }]}>
      {actionError ? (
        <Text accessibilityRole="alert" style={[styles.actionError, { color: theme.text }]}>
          {actionError}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isReady }}
        disabled={!isReady}
        onPress={onPress}
        style={[
          styles.compareButton,
          {
            backgroundColor: isReady ? theme.badge : theme.backgroundSelected,
          },
        ]}>
        <Text
          style={[
            styles.compareButtonText,
            { color: isReady ? theme.badgeText : theme.textSecondary },
          ]}>
          {isReady ? 'Compare Pokémon' : 'Select 2 Pokémon to compare'}
        </Text>
      </Pressable>
    </View>
  );
}

function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <Pressable accessibilityLabel="Close dialog" onPress={onClose} style={styles.backdrop} />
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.badge : theme.backgroundElement,
          borderColor: selected ? theme.badge : theme.backgroundElement,
        },
      ]}>
      <Text style={[styles.chipText, { color: selected ? theme.badgeText : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DialogClose({
  onPress,
  theme,
}: {
  onPress: () => void;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <Pressable onPress={onPress} style={[styles.closeButton, { backgroundColor: theme.badge }]}>
      <Text style={{ color: theme.badgeText, fontFamily: 'RubikMedium' }}>Done</Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  theme,
}: {
  label: string;
  onPress: () => void;
  theme: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <Pressable onPress={onPress} style={[styles.closeButton, { backgroundColor: theme.badge }]}>
      <Text style={{ color: theme.badgeText, fontFamily: 'RubikMedium' }}>{label}</Text>
    </Pressable>
  );
}

function MenuOption({
  label,
  onPress,
  theme,
  last = false,
}: {
  label: string;
  onPress: () => void;
  theme: (typeof Colors)[keyof typeof Colors];
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.optionRow,
        { borderBottomColor: theme.backgroundElement },
        last ? styles.lastOptionRow : null,
      ]}>
      <Text style={[styles.optionText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  stateContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  errorContent: { alignItems: 'center', gap: Spacing.three },
  errorText: { fontFamily: 'Rubik', fontSize: 14, textAlign: 'center' },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  header: { gap: Spacing.two, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  searchBox: {
    minHeight: 50,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    elevation: 3,
    shadowColor: '#192345',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Rubik', fontSize: 16, paddingVertical: Spacing.two },
  title: { fontFamily: 'RubikBold', fontSize: 23, paddingHorizontal: Spacing.one },
  subtitle: { fontFamily: 'Rubik', fontSize: 13, paddingHorizontal: Spacing.one },
  controlRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  controlButton: {
    minHeight: 38,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  controlText: { fontFamily: 'RubikMedium', fontSize: 13 },
  selectedPanel: { padding: Spacing.two, borderRadius: Radius.m, gap: Spacing.one },
  selectedTitle: { fontFamily: 'RubikMedium', fontSize: 13 },
  selectedHint: { fontFamily: 'Rubik', fontSize: 12 },
  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  selectedChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Radius.s },
  selectedChipText: { fontFamily: 'RubikMedium', fontSize: 12 },
  gridRow: { gap: Spacing.two, marginBottom: Spacing.two },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radius.m,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#192345',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  spritePanel: {
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  numberBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'RubikBold',
    overflow: 'hidden',
    zIndex: 1,
  },
  sprite: { width: '78%', height: '78%' },
  spriteFallback: { paddingHorizontal: Spacing.two, fontSize: 11, textAlign: 'center' },
  spriteRetry: { padding: Spacing.two },
  shinyToggle: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.s,
  },
  shinyText: { fontSize: 10, fontFamily: 'RubikMedium' },
  cardActions: {
    minHeight: 42,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  cardName: { fontFamily: 'RubikMedium', fontSize: 14 },
  nameButton: { flex: 1, minWidth: 0, justifyContent: 'center' },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFFFFF', fontFamily: 'RubikBold', fontSize: 16, lineHeight: 18 },
  menuButton: { padding: Spacing.one },
  menuIcon: { fontFamily: 'RubikBold', fontSize: 22, lineHeight: 24 },
  formRow: { paddingHorizontal: Spacing.two, minHeight: 30, justifyContent: 'center' },
  formButton: { flex: 1, paddingVertical: Spacing.one },
  formButtonText: { fontFamily: 'Rubik', fontSize: 10 },
  footerLoader: { paddingVertical: Spacing.three },
  emptyText: { paddingVertical: Spacing.four, fontFamily: 'Rubik', textAlign: 'center' },
  bottomAction: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
  },
  actionError: { fontFamily: 'Rubik', fontSize: 12 },
  compareButton: { minHeight: 50, borderRadius: Radius.m, alignItems: 'center', justifyContent: 'center' },
  compareButtonText: { fontFamily: 'RubikBold', fontSize: 15 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  dialog: {
    alignSelf: 'center',
    width: '86%',
    maxWidth: 420,
    marginTop: 'auto',
    marginBottom: 'auto',
    padding: Spacing.three,
    borderRadius: Radius.l,
    gap: Spacing.two,
  },
  dialogTitle: { fontFamily: 'RubikBold', fontSize: 18, marginBottom: Spacing.one },
  dialogOption: {
    minHeight: 46,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogOptionText: { fontFamily: 'Rubik', fontSize: 15 },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    padding: Spacing.three,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 20 },
  chipText: { fontFamily: 'RubikMedium', fontSize: 12 },
  filterScroll: { maxHeight: '75%' },
  filterContent: { gap: Spacing.two, paddingBottom: Spacing.two },
  sectionLabel: { fontFamily: 'RubikMedium', fontSize: 13 },
  closeButton: { minHeight: 40, minWidth: 86, paddingHorizontal: Spacing.three, borderRadius: Radius.s, alignItems: 'center', justifyContent: 'center' },
  clearFiltersButton: {
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.s,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsSheet: { position: 'absolute', left: 0, right: 0, padding: Spacing.three, borderTopLeftRadius: Radius.l, borderTopRightRadius: Radius.l },
  iosOptionsPosition: { bottom: 0 },
  androidOptionsPosition: { bottom: 0 },
  optionRow: {
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lastOptionRow: { borderBottomWidth: 0 },
  optionText: { fontFamily: 'Rubik', fontSize: 15 },
});
