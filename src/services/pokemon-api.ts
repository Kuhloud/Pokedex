const API_BASE = 'https://pokeapi.co/api/v2';
const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

type NamedResource = { name: string; url: string };

type ListResponse = {
  results: NamedResource[];
};

type GenerationResponse = {
  pokemon_species: NamedResource[];
};

type TypeResponse = {
  pokemon: { pokemon: NamedResource }[];
};

type SpeciesResponse = {
  id: number;
  name: string;
  is_legendary: boolean;
  is_mythical: boolean;
  generation: NamedResource;
  varieties: { is_default: boolean; pokemon: NamedResource }[];
};

type PokemonResponse = {
  id: number;
  name: string;
  types: { type: NamedResource }[];
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
  };
  species: NamedResource;
};

export type PokemonSummary = {
  id: number;
  name: string;
  generation: number;
  types: string[];
};

export type RegionalForm = {
  id: number;
  name: string;
  label: string;
  spriteUrl: string | null;
  shinySpriteUrl: string | null;
};

export type PokemonDetails = {
  id: number;
  name: string;
  speciesId: number;
  types: string[];
  spriteUrl: string | null;
  shinySpriteUrl: string | null;
};

export type PokemonCatalog = {
  species: PokemonSummary[];
  generations: number[];
  types: string[];
  regionalNameAliases: { speciesId: number; name: string }[];
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`PokéAPI request failed (${response.status}): ${path}`);
  }
  return (await response.json()) as T;
}

function resourceId(resource: NamedResource): number {
  const id = Number(resource.url.split('/').filter(Boolean).at(-1));
  if (!Number.isInteger(id) || id < 1) {
    throw new Error(`PokéAPI returned an invalid resource URL: ${resource.url}`);
  }
  return id;
}

function titleName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const output = new Array<R>(values.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex++;
        output[index] = await mapper(values[index]);
      }
    }),
  );
  return output;
}

function getRegionalLabel(name: string): string | null {
  const match = name.match(/-(alola|galar|hisui|paldea)(?:-|$)/);
  if (!match) return null;
  const labels: Record<string, string> = {
    alola: 'Alolan',
    galar: 'Galarian',
    hisui: 'Hisuian',
    paldea: 'Paldean',
  };
  return labels[match[1]] ?? null;
}

function getRegionalBaseName(name: string): string {
  return name.replace(/-(alola|galar|hisui|paldea)(?:-.+)?$/, '');
}

export async function fetchPokemonCatalog(): Promise<PokemonCatalog> {
  const [speciesIndex, pokemonIndex, generationIndex, typeIndex] = await Promise.all([
    fetchJson<ListResponse>('/pokemon-species?limit=2000'),
    fetchJson<ListResponse>('/pokemon?limit=2000'),
    fetchJson<ListResponse>('/generation?limit=100'),
    fetchJson<ListResponse>('/type?limit=100'),
  ]);

  const [generationGroups, typeGroups] = await Promise.all([
    mapWithConcurrency(generationIndex.results, 6, async (resource) => ({
      id: resourceId(resource),
      data: await fetchJson<GenerationResponse>(`/generation/${resourceId(resource)}`),
    })),
    mapWithConcurrency(typeIndex.results, 8, async (resource) => ({
      name: resource.name,
      data: await fetchJson<TypeResponse>(`/type/${resource.name}`),
    })),
  ]);

  const generationByName = new Map<string, number>();
  for (const group of generationGroups) {
    for (const species of group.data.pokemon_species) {
      generationByName.set(species.name, group.id);
    }
  }

  const typesByName = new Map<string, string[]>();
  for (const group of typeGroups) {
    if (group.name === 'unknown' || group.name === 'shadow') continue;
    for (const entry of group.data.pokemon) {
      const current = typesByName.get(entry.pokemon.name) ?? [];
      current.push(group.name);
      typesByName.set(entry.pokemon.name, current);
    }
  }

  const species = speciesIndex.results.map((resource) => ({
    id: resourceId(resource),
    name: titleName(resource.name),
    generation: generationByName.get(resource.name) ?? 0,
    types: typesByName.get(resource.name) ?? [],
  }));
  const idByName = new Map(speciesIndex.results.map((resource) => [resource.name, resourceId(resource)]));
  const regionalNameAliases: PokemonCatalog['regionalNameAliases'] = [];

  for (const resource of pokemonIndex.results) {
    const label = getRegionalLabel(resource.name);
    if (!label) continue;
    const speciesId = idByName.get(getRegionalBaseName(resource.name));
    if (speciesId !== undefined) {
      const baseName = species.find((entry) => entry.id === speciesId)?.name;
      if (baseName) regionalNameAliases.push({ speciesId, name: `${label} ${baseName}` });
    }
  }

  return {
    species,
    generations: generationGroups.map((group) => group.id).sort((a, b) => a - b),
    types: typeGroups
      .map((group) => group.name)
      .filter((name) => name !== 'unknown' && name !== 'shadow')
      .sort(),
    regionalNameAliases,
  };
}

export async function fetchPokemonDetails(id: number): Promise<PokemonDetails> {
  const pokemon = await fetchJson<PokemonResponse>(`/pokemon/${id}`);
  return {
    id: pokemon.id,
    name: titleName(pokemon.name),
    speciesId: resourceId(pokemon.species),
    types: pokemon.types.map(({ type }) => type.name),
    spriteUrl: pokemon.sprites.front_default,
    shinySpriteUrl: pokemon.sprites.front_shiny,
  };
}

export async function fetchPokemonSpecies(id: number): Promise<SpeciesResponse> {
  return fetchJson<SpeciesResponse>(`/pokemon-species/${id}`);
}

export async function fetchRegionalForms(id: number): Promise<RegionalForm[]> {
  const species = await fetchPokemonSpecies(id);
  const relevantVarieties = species.varieties.filter(
    ({ is_default, pokemon }) =>
      is_default || getRegionalLabel(pokemon.name) !== null,
  );
  const forms = await mapWithConcurrency(relevantVarieties, 6, async ({ is_default, pokemon }) => {
    const details = await fetchJson<PokemonResponse>(`/pokemon/${pokemon.name}`);
    const label = is_default ? 'Standard' : getRegionalLabel(pokemon.name);
    if (!label) return null;
    return {
      id: details.id,
      name: titleName(pokemon.name),
      label,
      spriteUrl: details.sprites.front_default,
      shinySpriteUrl: details.sprites.front_shiny,
    };
  });
  return forms.filter((form): form is RegionalForm => form !== null);
}

export async function fetchRarityIds(
  species: PokemonSummary[],
): Promise<{ legendary: Set<number>; mythical: Set<number> }> {
  const records = await mapWithConcurrency(species, 12, async ({ id }) => {
    const data = await fetchPokemonSpecies(id);
    return {
      id,
      legendary: data.is_legendary,
      mythical: data.is_mythical,
    };
  });
  return {
    legendary: new Set(records.filter(({ legendary }) => legendary).map(({ id }) => id)),
    mythical: new Set(records.filter(({ mythical }) => mythical).map(({ id }) => id)),
  };
}

export function fallbackSpriteUrl(id: number, shiny = false): string {
  return shiny ? `${SPRITE_BASE}/shiny/${id}.png` : `${SPRITE_BASE}/${id}.png`;
}
