import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useFonts } from 'expo-font';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { Radius, Spacing } from '@/constants/theme';
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
import { useTheme } from '@/hooks/use-theme';
import type { PokemonDetails, PokemonSummary, RegionalForm } from '@/services/pokemon-api';

type SortField = 'id' | 'name';
type SortOrder = 'asc' | 'desc';
type MenuPokemon = { pokemon: PokemonSummary } | null;

const INITIAL_FILTERS: PokemonFilters = { search: '', generations: [], rarities: [], types: [] };
const BATCH_SIZE = 30;

export default function PokemonListScreen() {
  const theme = useTheme();
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
  const regionalSpeciesIds = useMemo(
    () => new Set(catalogQuery.data?.regionalNameAliases.map(({ speciesId }) => speciesId) ?? []),
    [catalogQuery.data],
  );

  useFocusEffect(
    useCallback(() => {
      setSelectionRevision((revision) => revision + 1);
    }, []),
  );

  const filteredPokemon = useMemo(() => {
    if (!catalogQuery.data) return [];
    return filterPokemonCatalog(catalogQuery.data, activeFilters, rarityQuery.data).sort(
      (a, b) => {
        const comparison =
          sortField === 'id' ? a.id - b.id : a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      },
    );
  }, [activeFilters, catalogQuery.data, rarityQuery.data, sortField, sortOrder]);
  const visiblePokemon = filteredPokemon.slice(0, visibleCount);
  const rarityTagsQuery = usePokemonRarity(
    visiblePokemon,
    activeFilters.rarities.length === 0,
  );
  const rarityTags =
    activeFilters.rarities.length > 0 ? rarityQuery.data : rarityTagsQuery.data;
  const selectedFormIds = visiblePokemon.map((pokemon) => getPokemonSelection(pokemon.id).formId);
  const detailsQueries = usePokemonDetailsMany(selectedFormIds);
  const detailsById = new Map<number, PokemonDetails>();
  for (const result of detailsQueries) {
    if (result.data) detailsById.set(result.data.id, result.data);
  }
  if (rarityTagsQuery.isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <ErrorView
          message={rarityTagsQuery.error.message}
          onRetry={() => void rarityTagsQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const updateFilters = (next: PokemonFilters) => {
    setFilters(next);
    setVisibleCount(BATCH_SIZE);
  };

  const toggleSelection = <T extends string | number>(
    key: 'generations' | 'rarities' | 'types',
    value: T,
  ) => {
    const current = activeFilters[key] as T[];
    const nextValues = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    updateFilters({ ...activeFilters, [key]: nextValues });
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
    favoriteMutation.mutate(
      { id: pokemon.id, favorite: true },
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

  if (!catalogQuery.data) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        {catalogQuery.isPending ? (
          <ActivityIndicator style={styles.centered} color={theme.badge} />
        ) : (
          <ErrorView
            message={
              catalogQuery.error instanceof Error
                ? catalogQuery.error.message
                : 'Unable to load the Pokémon index.'
            }
            onRetry={() => void catalogQuery.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  if (rarityQuery.isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <ErrorView
          message={rarityQuery.error.message}
          onRetry={() => void rarityQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const currentFiltersCount =
    activeFilters.generations.length + activeFilters.rarities.length + activeFilters.types.length;

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
            <Text style={[styles.title, { color: theme.text }]}>All Pokémon</Text>
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
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {activeFilters.search.trim().length >= 2
              ? 'No Pokémon match your search.'
              : 'No Pokémon found.'}
          </Text>
        }
        renderItem={({ item, index }) => {
          const selection = getPokemonSelection(item.id);
          const details = detailsById.get(selection.formId);
          const rarity = rarityTags?.legendary.has(item.id)
            ? 'Legendary'
            : rarityTags?.mythical.has(item.id)
              ? 'Mythical'
              : null;
          return (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.name}`}
                onPress={() => openPokemon(item)}
                style={styles.cardMain}>
                <View style={[styles.spritePanel, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.numberBadge, { backgroundColor: theme.badge, color: theme.badgeText }]}>
                    {String(item.id).padStart(3, '0')}
                  </Text>
                  {details?.spriteUrl ? (
                    <Image
                      source={{ uri: selection.shiny && details.shinySpriteUrl ? details.shinySpriteUrl : details.spriteUrl }}
                      style={styles.sprite}
                      resizeMode="contain"
                    />
                  ) : detailsQueries[index]?.isPending ? (
                    <ActivityIndicator color={theme.badge} />
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
                      onPress={(event) => {
                        event.stopPropagation();
                        setPokemonSelection(item.id, { ...selection, shiny: !selection.shiny });
                        setSelectionRevision((revision) => revision + 1);
                      }}
                      style={[
                        styles.shinyToggle,
                        {
                          backgroundColor:
                            rarity === 'Legendary'
                              ? '#F5C542'
                              : rarity === 'Mythical'
                                ? '#C62828'
                                : '#FFFFFF',
                        },
                      ]}>
                      {rarity ? (
                        <Text
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                          style={[
                            styles.rarityIcon,
                            { color: rarity === 'Legendary' ? '#392900' : '#FFFFFF' },
                          ]}>
                          {rarity === 'Legendary' ? '★' : '✦'}
                        </Text>
                      ) : null}
                      <Text
                        style={[
                          styles.shinyText,
                          {
                            color:
                              rarity === 'Legendary'
                                ? '#392900'
                                : rarity === 'Mythical'
                                  ? '#FFFFFF'
                                  : '#10113D',
                          },
                        ]}>
                        {rarity
                          ? selection.shiny
                            ? `${rarity} · Shiny`
                            : rarity
                          : selection.shiny
                            ? 'Shiny'
                            : 'Regular'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
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
                  accessibilityLabel={`Actions for ${item.name}`}
                  onPress={() => setMenuPokemon({ pokemon: item })}
                  hitSlop={8}
                  style={styles.menuButton}>
                  <Text style={[styles.menuIcon, { color: theme.text }]}>⋮</Text>
                </Pressable>
              </View>
              {regionalSpeciesIds.has(item.id) ? (
                <View style={styles.formRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Choose form for ${item.name}`}
                    onPress={() => setFormPokemonId(item.id)}
                    style={styles.formButton}>
                    <Text numberOfLines={1} style={[styles.formButtonText, { color: theme.textSecondary }]}>
                      {selection.formId === item.id ? 'Standard' : details?.name ?? 'Regional form'}⌄
                    </Text>
                  </Pressable>
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
              <Text style={{ color: theme.badge }}>
                {sortField === field ? 'Selected' : ''}
              </Text>
            </Pressable>
          ))}
          <View style={styles.controlRow}>
            {(['asc', 'desc'] as const).map((order) => (
              <ChoiceChip
                key={order}
                label={order === 'asc' ? 'Ascending' : 'Descending'}
                selected={sortOrder === order}
                onPress={() => setSortOrder(order)}
              />
            ))}
          </View>
          <DialogClose onPress={() => setSortOpen(false)} />
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
                  onPress={() => toggleSelection('generations', generation)}
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
                  onPress={() => toggleSelection('rarities', rarity)}
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
                  onPress={() => toggleSelection('types', type)}
                />
              ))}
            </View>
          </ScrollView>
          <View style={styles.controlRow}>
            <DialogClose onPress={() => setFilterOpen(false)} />
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
            <ErrorView
              message={formsQuery.error.message}
              onRetry={() => void formsQuery.refetch()}
            />
          ) : null}
          <View style={styles.chipWrap}>
            {(formsQuery.data ?? []).map((form) => (
              <ChoiceChip
                key={form.id}
                label={form.label}
                selected={getPokemonSelection(formPokemonId ?? 0).formId === form.id}
                onPress={() => selectForm(form)}
              />
            ))}
          </View>
          <DialogClose onPress={() => setFormPokemonId(null)} />
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
          ]}>
          <View
            style={[
              styles.optionsGroup,
              { backgroundColor: Platform.OS === 'ios' ? theme.backgroundElement : theme.card },
              Platform.OS === 'ios' ? styles.iosOptionsGroup : styles.androidOptionsGroup,
            ]}>
            <MenuOption
              icon={{ ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' }}
              label="Open Pokémon"
              onPress={() => {
                if (menuPokemon) openPokemon(menuPokemon.pokemon);
                setMenuPokemon(null);
              }}
            />
            <MenuOption
              icon={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
              label="Add to favorites"
              onPress={() => {
                if (menuPokemon) addFavorite(menuPokemon.pokemon);
                setMenuPokemon(null);
              }}
            />
            <MenuOption
              icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              label="Share"
              onPress={() => {
                if (menuPokemon) void sharePokemon(menuPokemon.pokemon);
                setMenuPokemon(null);
              }}
              last
            />
          </View>
          {Platform.OS === 'ios' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setMenuPokemon(null)}
              style={[styles.cancelOption, { backgroundColor: theme.card }]}>
              <Text style={[styles.cancelText, { color: theme.badge }]}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </Modal>

      {actionError ? (
        <Text accessibilityRole="alert" style={[styles.errorBanner, { backgroundColor: theme.card, color: theme.text }]}>
          {actionError}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
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
      <Text
        style={{
          color: selected ? theme.badgeText : theme.text,
          fontFamily: 'Rubik',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Close dialog"
      onPress={onClose}
      style={styles.backdrop}
    />
  );
}

function MenuOption({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.optionRow,
        { borderBottomColor: theme.backgroundElement },
        last ? styles.lastOptionRow : null,
      ]}>
      <SymbolView
        name={icon}
        tintColor={Platform.OS === 'ios' ? '#007AFF' : theme.text}
        size={21}
      />
      <Text style={[styles.optionText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

function DialogClose({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.closeButton, { backgroundColor: theme.badge }]}>
      <Text style={{ color: theme.badgeText, fontFamily: 'RubikMedium' }}>Done</Text>
    </Pressable>
  );
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
  header: { gap: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.three },
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
  cardMain: { flex: 1 },
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
  shinyToggle: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  shinyText: { fontSize: 10, fontFamily: 'RubikMedium' },
  rarityIcon: { fontSize: 12, fontWeight: '700', lineHeight: 14 },
  cardName: { fontFamily: 'RubikMedium', fontSize: 15 },
  cardActions: {
    minHeight: 38,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameButton: { flex: 1, minWidth: 0, justifyContent: 'center' },
  formRow: { paddingHorizontal: Spacing.two, minHeight: 28 },
  formButton: { flex: 1, paddingVertical: Spacing.one },
  formButtonText: { fontFamily: 'Rubik', fontSize: 10 },
  menuButton: { padding: Spacing.one },
  menuIcon: { fontFamily: 'RubikBold', fontSize: 22, lineHeight: 24 },
  footerLoader: { paddingVertical: Spacing.three },
  emptyText: { textAlign: 'center', fontFamily: 'Rubik', marginTop: Spacing.five },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(55, 66, 78, 0.38)' },
  optionsSheet: { position: 'absolute', left: 0, right: 0, gap: Spacing.three },
  iosOptionsPosition: { bottom: 34, paddingHorizontal: Spacing.three },
  androidOptionsPosition: { bottom: 0 },
  optionsGroup: { overflow: 'hidden' },
  iosOptionsGroup: { borderRadius: Radius.l },
  androidOptionsGroup: { borderTopLeftRadius: Radius.s, borderTopRightRadius: Radius.s },
  optionRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastOptionRow: { borderBottomWidth: 0 },
  optionText: { fontFamily: 'Rubik', fontSize: 17 },
  cancelOption: {
    height: 58,
    borderRadius: Radius.l,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: { fontFamily: 'RubikBold', fontSize: 17 },
  dialog: {
    position: 'absolute',
    top: '50%',
    left: Spacing.four,
    right: Spacing.four,
    transform: [{ translateY: -120 }],
    borderRadius: Radius.l,
    padding: Spacing.three,
    gap: Spacing.two,
    maxHeight: '80%',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    maxHeight: '80%',
    gap: Spacing.two,
  },
  dialogTitle: { fontFamily: 'RubikBold', fontSize: 20, marginBottom: Spacing.one },
  sectionLabel: { fontFamily: 'RubikMedium', marginTop: Spacing.two },
  filterScroll: { flexShrink: 1 },
  filterContent: { gap: Spacing.two, paddingBottom: Spacing.two },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.s,
    borderWidth: 1,
  },
  dialogOption: {
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dialogOptionText: { fontFamily: 'Rubik', fontSize: 15 },
  closeButton: { alignSelf: 'flex-start', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.s },
  clearFiltersButton: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.s,
  },
  errorBanner: { padding: Spacing.two, textAlign: 'center' },
});
