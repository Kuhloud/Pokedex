export type SimulatorStatus =
  | 'none'
  | 'sleep'
  | 'freeze'
  | 'paralysis'
  | 'burn'
  | 'poison';

export type SimulatorTime = 'Day' | 'Night';

export type SimulatorConditions = {
  remainingHp: number;
  status: SimulatorStatus;
  timeOfDay: SimulatorTime;
  inWater: boolean;
  fishing: boolean;
};

export type CatchRuleset = {
  id: string;
  generation: number;
  title: string;
  games: string[];
  newestRelease: number;
  timeChoices: SimulatorTime[];
  description: string;
};

export type BallAvailability = {
  available: boolean;
  reason: string | null;
};

type VersionInfo = {
  title: string;
  release: number;
  rulesetId: 'generation-iii' | 'generation-iv';
};

const VERSION_INFO: Record<string, VersionInfo> = {
  ruby: { title: 'Pokémon Ruby', release: 30, rulesetId: 'generation-iii' },
  sapphire: { title: 'Pokémon Sapphire', release: 31, rulesetId: 'generation-iii' },
  emerald: { title: 'Pokémon Emerald', release: 32, rulesetId: 'generation-iii' },
  firered: { title: 'Pokémon FireRed', release: 33, rulesetId: 'generation-iii' },
  leafgreen: { title: 'Pokémon LeafGreen', release: 34, rulesetId: 'generation-iii' },
  diamond: { title: 'Pokémon Diamond', release: 40, rulesetId: 'generation-iv' },
  pearl: { title: 'Pokémon Pearl', release: 41, rulesetId: 'generation-iv' },
  platinum: { title: 'Pokémon Platinum', release: 42, rulesetId: 'generation-iv' },
  heartgold: { title: 'Pokémon HeartGold', release: 43, rulesetId: 'generation-iv' },
  soulsilver: { title: 'Pokémon SoulSilver', release: 44, rulesetId: 'generation-iv' },
};

const RULESET_COPY: Record<
  VersionInfo['rulesetId'],
  { generation: number; title: string; timeChoices: SimulatorTime[]; effects: string }
> = {
  'generation-iii': {
    generation: 3,
    title: 'Generation III',
    timeChoices: [],
    effects:
      'Catch chance responds to HP and status. Great and Ultra Balls are stronger, and Net Balls improve against Water- and Bug-type Pokémon. Dive Balls are disabled because their underwater condition is not represented.',
  },
  'generation-iv': {
    generation: 4,
    title: 'Generation IV',
    timeChoices: ['Day', 'Night'],
    effects:
      'Catch chance responds to HP and status. Great and Ultra Balls are stronger, Net Balls improve against Water- and Bug-type Pokémon, and Dive Balls improve in water or while fishing. Dusk Balls are disabled because cave location is not represented.',
  },
};

export function getApplicableRulesets(gameVersions: string[]): CatchRuleset[] {
  const grouped = new Map<
    VersionInfo['rulesetId'],
    { games: { title: string; release: number }[] }
  >();

  for (const version of gameVersions) {
    const info = VERSION_INFO[version];
    if (!info) continue;

    const group = grouped.get(info.rulesetId) ?? { games: [] };
    if (!group.games.some(({ title }) => title === info.title)) {
      group.games.push({ title: info.title, release: info.release });
    }
    grouped.set(info.rulesetId, group);
  }

  return [...grouped.entries()]
    .map(([id, group]) => {
      const copy = RULESET_COPY[id];
      const games = group.games.sort((left, right) => left.release - right.release);
      return {
        id,
        generation: copy.generation,
        title: copy.title,
        games: games.map(({ title }) => title),
        newestRelease: Math.max(...games.map(({ release }) => release)),
        timeChoices: copy.timeChoices,
        description: `${games.map(({ title }) => title).join(', ')} share these rules. ${copy.effects}`,
      };
    })
    .sort((left, right) => right.newestRelease - left.newestRelease);
}

export function getBallAvailability(
  ballName: string,
  ruleset: CatchRuleset | undefined,
): BallAvailability {
  if (!ruleset) {
    return {
      available: false,
      reason: 'No accurately modeled game ruleset applies to this Pokémon.',
    };
  }

  const name = ballName.toLowerCase();
  const generation = ruleset.generation;

  if (
    name.startsWith('la') ||
    name === 'strange-ball'
  ) {
    return {
      available: false,
      reason: 'Legends: Arceus uses a different catching system that this simulator does not model.',
    };
  }

  if (name === 'master-ball' || name === 'ultra-ball' || name === 'great-ball' || name === 'poke-ball') {
    return { available: true, reason: null };
  }

  if (name === 'safari-ball') {
    return {
      available: false,
      reason: 'Safari Ball results depend on Safari Zone encounter mechanics not represented here.',
    };
  }
  if (name === 'park-ball') {
    return {
      available: false,
      reason: 'Park Balls are used for transfer encounters, not standard wild encounters.',
    };
  }
  if (name === 'sport-ball') {
    return {
      available: false,
      reason: 'Sport Balls are limited to Bug-Catching Contest encounters.',
    };
  }
  if (name === 'nest-ball') {
    return {
      available: false,
      reason: 'Nest Ball effectiveness depends on the wild Pokémon’s level, which is not set here.',
    };
  }
  if (name === 'repeat-ball') {
    return {
      available: false,
      reason: 'Repeat Ball effectiveness depends on whether this species is registered as caught.',
    };
  }
  if (name === 'timer-ball') {
    return {
      available: false,
      reason: 'Timer Ball effectiveness depends on elapsed battle turns, which are not set here.',
    };
  }
  if (name === 'quick-ball') {
    return {
      available: false,
      reason: 'Quick Ball effectiveness depends on whether it is the first battle turn.',
    };
  }
  if (name === 'dusk-ball') {
    return {
      available: false,
      reason: 'Dusk Ball effectiveness also depends on whether the encounter is in a cave.',
    };
  }
  if (name === 'dive-ball' && generation < 4) {
    return {
      available: false,
      reason: 'In this ruleset, Dive Ball effectiveness depends on underwater encounters, which this control does not distinguish.',
    };
  }
  if (name === 'cherish-ball') {
    return {
      available: false,
      reason: 'Cherish Balls are event-distributed and cannot be used in ordinary wild encounters.',
    };
  }
  if (name === 'dream-ball') {
    return {
      available: false,
      reason: 'Dream Balls are not available in this ruleset.',
    };
  }
  if (name === 'beast-ball') {
    return {
      available: false,
      reason: 'Beast Balls are not available in this ruleset.',
    };
  }

  const generationThreeBalls = new Set([
    'net-ball',
    'luxury-ball',
    'premier-ball',
  ]);
  if (generationThreeBalls.has(name) && generation >= 3) {
    return { available: true, reason: null };
  }
  if (name === 'dive-ball' && generation >= 4) {
    return { available: true, reason: null };
  }
  if (name === 'heal-ball' && generation >= 4) {
    return { available: true, reason: null };
  }

  return {
    available: false,
    reason: 'This ball is not available in the selected ruleset.',
  };
}

export function calculateCatchChance(
  captureRate: number,
  ballName: string,
  pokemonTypes: string[],
  conditions: SimulatorConditions,
  ruleset: CatchRuleset,
): number {
  if (!Number.isInteger(captureRate) || captureRate < 1 || captureRate > 255) {
    throw new Error('Capture rate must be an integer from 1 to 255.');
  }
  if (!Number.isFinite(conditions.remainingHp) || conditions.remainingHp < 0 || conditions.remainingHp > 100) {
    throw new Error('Remaining HP must be between 0 and 100 percent.');
  }
  if (!getBallAvailability(ballName, ruleset).available) {
    throw new Error(`${ballName} is unavailable in ${ruleset.title}.`);
  }

  const normalizedName = ballName.toLowerCase();
  if (normalizedName === 'master-ball') return 1;

  let ballMultiplier = 1;
  if (normalizedName === 'great-ball') ballMultiplier = 1.5;
  if (normalizedName === 'ultra-ball') ballMultiplier = 2;
  if (
    normalizedName === 'net-ball' &&
    pokemonTypes.some((type) => type === 'water' || type === 'bug')
  ) {
    ballMultiplier = 3;
  }
  if (
    normalizedName === 'dive-ball' &&
    (conditions.inWater ||
      (ruleset.generation >= 4 && conditions.fishing))
  ) {
    ballMultiplier = 3.5;
  }

  const statusMultiplier =
    conditions.status === 'sleep' || conditions.status === 'freeze'
      ? 2
      : conditions.status === 'none'
        ? 1
        : 1.5;
  const hpMultiplier = (3 - (2 * conditions.remainingHp) / 100) / 3;
  const modifiedRate = Math.max(
    1,
    Math.floor(hpMultiplier * captureRate * ballMultiplier * statusMultiplier),
  );
  if (modifiedRate >= 255) return 1;

  const shakeThreshold = Math.floor(
    65_536 * Math.pow(modifiedRate / 255, 0.25),
  );
  return Math.pow(shakeThreshold / 65_536, 4);
}
