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
  gender_rate: number;
  generation: NamedResource;
  evolution_chain: NamedResource;
  varieties: { is_default: boolean; pokemon: NamedResource }[];
};

type PokemonResponse = {
  id: number;
  name: string;
  forms: NamedResource[];
  types: { type: NamedResource }[];
  abilities: { ability: NamedResource }[];
  height: number;
  weight: number;
  base_experience: number | null;
  stats: { base_stat: number; stat: NamedResource }[];
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    front_female: string | null;
    front_shiny_female?: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
        front_shiny: string | null;
      };
      home?: {
        front_default: string | null;
        front_shiny: string | null;
        front_female: string | null;
        front_shiny_female?: string | null;
      };
    };
  };
  species: NamedResource;
};

type PokemonFormResponse = {
  id: number;
  name: string;
  form_name: string;
  is_default: boolean;
  is_battle_only: boolean;
  is_mega: boolean;
  pokemon: NamedResource;
  sprites: PokemonResponse['sprites'];
};

type EvolutionChainLink = {
  species: NamedResource;
  evolution_details: { gender: number | null }[];
  evolves_to: EvolutionChainLink[];
};

type EvolutionChainResponse = {
  chain: EvolutionChainLink;
};

export type PokemonSummary = {
  id: number;
  name: string;
  generation: number;
  types: string[];
  speciesId?: number;
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
  abilities: string[];
  height: number;
  weight: number;
  baseExperience: number | null;
  stats: { name: string; value: number }[];
  spriteUrl: string | null;
  shinySpriteUrl: string | null;
  genderSprites: PokemonGenderSprites | null;
};

export type PokemonGenderSprites = {
  male: string | null;
  female: string | null;
  maleShiny: string | null;
  femaleShiny: string | null;
};

export type PokemonAppearance = {
  key: string;
  label: string;
  pokemonId: number;
  isDefault: boolean;
  isMega: boolean;
  spriteUrl: string | null;
  shinySpriteUrl: string | null;
  genderSprites: PokemonGenderSprites | null;
};

type EvolutionSpecialForm = 'Mega Evolution' | 'Gigantamax';

export type PokemonEvolution = {
  speciesId: number;
  pokemonId: number;
  name: string;
  depth: number;
  genderOnly: 'male' | 'female' | null;
  spriteUrl: string | null;
  specialForm: EvolutionSpecialForm | null;
};

export type PokemonCatalog = {
  species: PokemonSummary[];
  regionalVariants: PokemonSummary[];
  specialVariants: PokemonSummary[];
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

function getGenderSprites(
  sprites: PokemonResponse['sprites'],
  artwork: { front_default: string | null; front_shiny: string | null } | undefined,
): PokemonGenderSprites | null {
  const home = sprites.other?.home;
  const female = home?.front_female ?? sprites.front_female;
  const male = home?.front_default ?? artwork?.front_default ?? sprites.front_default;

  if (!female || female === male) return null;

  return {
    male,
    female,
    maleShiny: home?.front_shiny ?? artwork?.front_shiny ?? sprites.front_shiny,
    femaleShiny: home?.front_shiny_female ?? sprites.front_shiny_female ?? null,
  };
}

function getFormLabel(name: string, speciesName: string, formName: string): string {
  if (/(?:^|-)mega(?:-|$)/.test(name)) return formatMegaName(name);
  if (/(?:^|-)gmax$/.test(name)) return 'Gigantamax';
  if (formName) return titleName(formName);
  if (name.startsWith(`${speciesName}-`)) {
    return titleName(name.slice(speciesName.length + 1));
  }
  return titleName(name);
}

function getGenderRestriction(
  details: EvolutionChainLink['evolution_details'],
): 'male' | 'female' | null {
  const genders = new Set(
    details
      .map(({ gender }) => gender)
      .filter((gender): gender is 1 | 2 => gender === 1 || gender === 2),
  );
  if (genders.size !== 1) return null;
  return genders.has(1) ? 'female' : 'male';
}

function getSpeciesGenderRestriction(genderRate: number): 'male' | 'female' | null {
  if (genderRate === 0) return 'male';
  if (genderRate === 8) return 'female';
  return null;
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
  if (match[1] === 'alola' && name.split('-').includes('cap')) return null;
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
  const speciesNames = speciesIndex.results.map(({ name }) => name);
  const regionalNameAliases: PokemonCatalog['regionalNameAliases'] = [];
  const regionalVariants: PokemonCatalog['regionalVariants'] = [];
  const specialVariants: PokemonCatalog['specialVariants'] = [];

  for (const resource of pokemonIndex.results) {
    const label = getRegionalLabel(resource.name);
    if (label) {
      const baseSpeciesName = getRegionalBaseName(resource.name);
      const speciesId = idByName.get(baseSpeciesName);
      const baseName = species.find((entry) => entry.id === speciesId)?.name;
      if (speciesId !== undefined && baseName) {
        const name = `${label} ${baseName}`;
        regionalNameAliases.push({ speciesId, name });
        regionalVariants.push({
          id: resourceId(resource),
          name,
          generation: generationByName.get(baseSpeciesName) ?? 0,
          types: typesByName.get(resource.name) ?? [],
          speciesId,
        });
      }
    }

    const specialForm = getEvolutionSpecialForm(resource.name);
    if (specialForm) {
      const baseSpeciesName = speciesNames
        .filter((name) => resource.name.startsWith(`${name}-`))
        .sort((a, b) => b.length - a.length)[0];
      const speciesId = baseSpeciesName ? idByName.get(baseSpeciesName) : undefined;
      const baseName = species.find((entry) => entry.id === speciesId)?.name;
      if (speciesId !== undefined && baseName && baseSpeciesName) {
        specialVariants.push({
          id: resourceId(resource),
          name:
            specialForm === 'Mega Evolution'
              ? formatMegaName(resource.name)
              : `Gigantamax ${baseName}`,
          generation: generationByName.get(baseSpeciesName) ?? 0,
          types: typesByName.get(resource.name) ?? [],
          speciesId,
        });
      }
    }
  }

  return {
    species,
    regionalVariants,
    specialVariants,
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
  const artwork = pokemon.sprites.other?.['official-artwork'];
  const specialForm = getEvolutionSpecialForm(pokemon.name);
  return {
    id: pokemon.id,
    name:
      specialForm === 'Mega Evolution'
        ? formatMegaName(pokemon.name)
        : specialForm === 'Gigantamax'
          ? `Gigantamax ${titleName(pokemon.species.name)}`
          : titleName(pokemon.name),
    speciesId: resourceId(pokemon.species),
    types: pokemon.types.map(({ type }) => type.name),
    abilities: pokemon.abilities.map(({ ability }) => titleName(ability.name)),
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience: pokemon.base_experience,
    stats: pokemon.stats.map(({ base_stat, stat }) => ({
      name: stat.name,
      value: base_stat,
    })),
    spriteUrl: artwork?.front_default ?? pokemon.sprites.front_default,
    shinySpriteUrl: artwork?.front_shiny ?? pokemon.sprites.front_shiny,
    genderSprites: getGenderSprites(pokemon.sprites, artwork),
  };
}

export async function fetchPokemonSpecies(id: number): Promise<SpeciesResponse> {
  return fetchJson<SpeciesResponse>(`/pokemon-species/${id}`);
}

export async function fetchPokemonAppearances(id: number): Promise<PokemonAppearance[]> {
  const [basePokemon, species] = await Promise.all([
    fetchJson<PokemonResponse>(`/pokemon/${id}`),
    fetchPokemonSpecies(id),
  ]);
  const appearances = new Map<string, PokemonAppearance>();
  const nonRegionalForms = basePokemon.forms.filter(
    ({ name }) => getRegionalLabel(name) === null,
  );
  const formRecords = await mapWithConcurrency(nonRegionalForms, 6, async (resource) => {
    const form = await fetchJson<PokemonFormResponse>(
      `/pokemon-form/${resourceId(resource)}`,
    );
    const artwork = form.sprites.other?.['official-artwork'];
    const home = form.sprites.other?.home;
    const pokemonId = resourceId(form.pokemon);
    const fallbackPokemon =
      pokemonId === basePokemon.id
        ? basePokemon
        : await fetchJson<PokemonResponse>(`/pokemon/${pokemonId}`);
    const fallbackArtwork = fallbackPokemon.sprites.other?.['official-artwork'];
    const genderSprites = getGenderSprites(form.sprites, artwork) ??
      getGenderSprites(fallbackPokemon.sprites, fallbackArtwork);

    return {
      key: `form:${form.id}`,
      label: getFormLabel(form.name, species.name, form.form_name),
      pokemonId,
      isDefault: form.is_default,
      isMega: form.is_mega,
      spriteUrl:
        artwork?.front_default ??
        home?.front_default ??
        form.sprites.front_default ??
        fallbackArtwork?.front_default ??
        fallbackPokemon.sprites.front_default,
      shinySpriteUrl:
        artwork?.front_shiny ??
        home?.front_shiny ??
        form.sprites.front_shiny ??
        fallbackArtwork?.front_shiny ??
        fallbackPokemon.sprites.front_shiny,
      genderSprites,
    };
  });

  const defaultForm = formRecords.find((form) => form?.isDefault);
  const baseArtwork = basePokemon.sprites.other?.['official-artwork'];
  const baseAppearance: PokemonAppearance = defaultForm ?? {
    key: `pokemon:${basePokemon.id}`,
    label: titleName(species.name),
    pokemonId: basePokemon.id,
    isDefault: true,
    isMega: false,
    spriteUrl: baseArtwork?.front_default ?? basePokemon.sprites.front_default,
    shinySpriteUrl: baseArtwork?.front_shiny ?? basePokemon.sprites.front_shiny,
    genderSprites: getGenderSprites(basePokemon.sprites, baseArtwork),
  };
  appearances.set(baseAppearance.key, { ...baseAppearance, isDefault: true });

  for (const form of formRecords) {
    if (form && !form.isDefault && !appearances.has(form.key)) {
      appearances.set(form.key, form);
    }
  }

  const alternateVarieties = species.varieties.filter(
    ({ is_default, pokemon }) =>
      !is_default && getRegionalLabel(pokemon.name) === null,
  );
  const varietyRecords = await mapWithConcurrency(alternateVarieties, 6, async ({ pokemon }) => {
    const details = await fetchJson<PokemonResponse>(
      `/pokemon/${resourceId(pokemon)}`,
    );
    const artwork = details.sprites.other?.['official-artwork'];

    return {
      key: `pokemon:${details.id}`,
      label: getFormLabel(details.name, species.name, ''),
      pokemonId: details.id,
      isDefault: false,
      isMega: /(?:^|-)mega(?:-|$)/.test(details.name),
      spriteUrl: artwork?.front_default ?? details.sprites.front_default,
      shinySpriteUrl: artwork?.front_shiny ?? details.sprites.front_shiny,
      genderSprites: getGenderSprites(details.sprites, artwork),
    };
  });

  for (const variety of varietyRecords) {
    if (!appearances.has(variety.key)) appearances.set(variety.key, variety);
  }

  return [...appearances.values()];
}

export async function fetchPokemonEvolutionFamily(id: number): Promise<PokemonEvolution[]> {
  const species = await fetchPokemonSpecies(id);
  const chainId = resourceId(species.evolution_chain);
  const chain = await fetchJson<EvolutionChainResponse>(`/evolution-chain/${chainId}`);
  const speciesLinks: {
    species: NamedResource;
    depth: number;
    genderOnly: 'male' | 'female' | null;
  }[] = [];

  const collectSpecies = (
    link: EvolutionChainLink,
    depth: number,
    inheritedGender: 'male' | 'female' | null,
  ) => {
    const genderOnly = getGenderRestriction(link.evolution_details) ?? inheritedGender;
    speciesLinks.push({ species: link.species, depth, genderOnly });
    link.evolves_to.forEach((evolution) =>
      collectSpecies(evolution, depth + 1, genderOnly),
    );
  };
  collectSpecies(chain.chain, 0, null);

  const familySpecies = await mapWithConcurrency(speciesLinks, 6, async (entry) => {
    const familyMember = await fetchPokemonSpecies(resourceId(entry.species));
    const defaultVariety = familyMember.varieties.find(({ is_default }) => is_default);
    const specialVarieties = familyMember.varieties
      .map(({ pokemon }) => ({
        pokemon,
        specialForm: getEvolutionSpecialForm(pokemon.name),
      }))
      .filter(
        (
          variety,
        ): variety is { pokemon: NamedResource; specialForm: EvolutionSpecialForm } =>
          variety.specialForm !== null,
      );
    const varieties = new Map<
      string,
      { pokemon: NamedResource; specialForm: EvolutionSpecialForm | null }
    >();

    varieties.set((defaultVariety?.pokemon ?? entry.species).name, {
      pokemon: defaultVariety?.pokemon ?? entry.species,
      specialForm: null,
    });
    for (const variety of specialVarieties) {
      varieties.set(variety.pokemon.name, variety);
    }

    return [...varieties.values()].map(({ pokemon, specialForm }) => ({
      speciesId: familyMember.id,
      speciesName: familyMember.name,
      pokemon,
      specialForm,
      depth: entry.depth,
      genderOnly:
        entry.genderOnly ?? getSpeciesGenderRestriction(familyMember.gender_rate),
    }));
  });

  const forms = familySpecies.flat();
  const pokemonForms = await mapWithConcurrency(forms, 8, async (form) => {
    const pokemon = await fetchJson<PokemonResponse>(`/pokemon/${form.pokemon.name}`);
    const name = form.specialForm === 'Mega Evolution'
      ? formatMegaName(form.pokemon.name)
      : titleName(form.speciesName);

    return {
      speciesId: form.speciesId,
      pokemonId: pokemon.id,
      name,
      depth: form.depth,
      genderOnly: form.genderOnly,
      spriteUrl:
        pokemon.sprites.other?.['official-artwork']?.front_default ??
        pokemon.sprites.front_default,
      specialForm: form.specialForm,
    };
  });

  return pokemonForms;
}

function getEvolutionSpecialForm(
  name: string,
): EvolutionSpecialForm | null {
  if (/(?:^|-)mega(?:-|$)/.test(name)) return 'Mega Evolution';
  if (/(?:^|-)gmax(?:-|$)/.test(name)) return 'Gigantamax';
  return null;
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

function formatMegaName(name: string): string {
  const [baseName, megaSuffix] = name.split('-mega-');
  const base = titleName(baseName.replace(/-mega$/, ''));
  return megaSuffix ? `Mega ${base} ${titleName(megaSuffix)}` : `Mega ${base}`;
}

export async function fetchRarityIds(
  pokemon: PokemonSummary[],
): Promise<{ legendary: Set<number>; mythical: Set<number> }> {
  const speciesIds = [...new Set(pokemon.map(({ id, speciesId }) => speciesId ?? id))];
  const records = await mapWithConcurrency(speciesIds, 12, async (id) => {
    const data = await fetchPokemonSpecies(id);
    return {
      id,
      legendary: data.is_legendary,
      mythical: data.is_mythical,
    };
  });
  const rarityBySpeciesId = new Map(records.map((record) => [record.id, record]));
  return {
    legendary: new Set(
      pokemon
        .filter(({ id, speciesId }) => rarityBySpeciesId.get(speciesId ?? id)?.legendary)
        .map(({ id }) => id),
    ),
    mythical: new Set(
      pokemon
        .filter(({ id, speciesId }) => rarityBySpeciesId.get(speciesId ?? id)?.mythical)
        .map(({ id }) => id),
    ),
  };
}

export function fallbackSpriteUrl(id: number, shiny = false): string {
  return shiny ? `${SPRITE_BASE}/shiny/${id}.png` : `${SPRITE_BASE}/${id}.png`;
}
