import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import * as favoritesDb from '@/services/pokemon-favorites-db';
import {
  fetchPokemonCatalog,
  fetchPokemonDetails,
  fetchPokemonSpecies,
  fetchRarityIds,
  fetchRegionalForms,
  type PokemonCatalog,
  type PokemonSummary,
  type RegionalForm,
} from '@/services/pokemon-api';

const POKEMON_STALE_TIME = 1000 * 60 * 60 * 24;

export type PokemonSelection = { formId: number; shiny: boolean };
export type PokemonFilters = {
  search: string;
  generations: number[];
  rarities: ('legendary' | 'mythical')[];
  types: string[];
};

const selections = new Map<number, PokemonSelection>();

export function getPokemonSelection(id: number): PokemonSelection {
  return selections.get(id) ?? { formId: id, shiny: false };
}

export function setPokemonSelection(id: number, selection: PokemonSelection): void {
  selections.set(id, selection);
}

export function filterPokemonCatalog(
  catalog: PokemonCatalog,
  filters: PokemonFilters,
  rarity: { legendary: Set<number>; mythical: Set<number> } | undefined,
): PokemonCatalog['species'] {
  const search = filters.search.trim().toLowerCase();
  const searchActive = search.length >= 2;
  const aliasesBySpecies = new Map<number, string[]>();
  for (const alias of catalog.regionalNameAliases) {
    const aliases = aliasesBySpecies.get(alias.speciesId) ?? [];
    aliases.push(alias.name.toLowerCase());
    aliasesBySpecies.set(alias.speciesId, aliases);
  }

  return catalog.species.filter((pokemon) => {
    if (
      searchActive &&
      !pokemon.name.toLowerCase().includes(search) &&
      !(aliasesBySpecies.get(pokemon.id) ?? []).some((name) => name.includes(search))
    ) {
      return false;
    }

    if (filters.generations.length > 0 && !filters.generations.includes(pokemon.generation)) {
      return false;
    }

    if (filters.types.length > 0 && !filters.types.some((type) => pokemon.types.includes(type))) {
      return false;
    }

    if (
      filters.rarities.length > 0 &&
      !filters.rarities.some((rarityType) => rarity?.[rarityType].has(pokemon.id))
    ) {
      return false;
    }

    return true;
  });
}

export function usePokemonCatalog() {
  return useQuery({
    queryKey: ['pokemon', 'catalog'],
    queryFn: fetchPokemonCatalog,
    staleTime: POKEMON_STALE_TIME,
  });
}

export function usePokemonRarity(species: PokemonSummary[], enabled: boolean) {
  const speciesIds = species.map(({ id }) => id).sort((a, b) => a - b);
  return useQuery({
    queryKey: ['pokemon', 'rarity', speciesIds],
    queryFn: () => fetchRarityIds(species),
    enabled,
    staleTime: POKEMON_STALE_TIME,
  });
}

export function usePokemonDetails(id: number, enabled = true) {
  return useQuery({
    queryKey: ['pokemon', 'details', id],
    queryFn: () => fetchPokemonDetails(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    staleTime: POKEMON_STALE_TIME,
  });
}

export function usePokemonDetailsMany(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['pokemon', 'details', id],
      queryFn: () => fetchPokemonDetails(id),
      staleTime: POKEMON_STALE_TIME,
    })),
  });
}

export function usePokemonSpecies(id: number, enabled = true) {
  return useQuery({
    queryKey: ['pokemon', 'species', id],
    queryFn: () => fetchPokemonSpecies(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    staleTime: POKEMON_STALE_TIME,
  });
}

export function usePokemonForms(id: number, enabled = true) {
  return useQuery<RegionalForm[]>({
    queryKey: ['pokemon', 'forms', id],
    queryFn: () => fetchRegionalForms(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    staleTime: POKEMON_STALE_TIME,
  });
}

export function useFavoriteIds() {
  return useQuery({ queryKey: ['favorites'], queryFn: favoritesDb.getFavoriteIds });
}

export function useFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, favorite }: { id: number; favorite: boolean }) =>
      favorite ? favoritesDb.addFavorite(id) : favoritesDb.removeFavorite(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
