import type { SimulatorConditions } from './pokemon-catching-rules';

type RulesModule = typeof import('./pokemon-catching-rules');
const rules: RulesModule = await import(
  new URL('./pokemon-catching-rules.ts', import.meta.url).href
);

const conditions: SimulatorConditions = {
  remainingHp: 100,
  status: 'none',
  timeOfDay: 'Day',
  inWater: false,
  fishing: false,
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}.`);
  }
}

function assertArrayEqual(actual: string[], expected: string[], message: string): void {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`,
  );
}

function testRulesetGrouping(): void {
  const rulesets = rules.getApplicableRulesets([
    'ruby',
    'emerald',
    'diamond',
    'heartgold',
    'scarlet',
  ]);

  assertArrayEqual(
    rulesets.map(({ id }) => id),
    ['generation-iv', 'generation-iii'],
    'Rulesets should be newest first',
  );
  assertArrayEqual(
    rulesets[0].games,
    ['Pokémon Diamond', 'Pokémon HeartGold'],
    'Generation IV games should share a ruleset',
  );
  assert(
    rulesets[0].description.includes('Pokémon Diamond, Pokémon HeartGold'),
    'Ruleset copy should name applicable games',
  );
}

function testUnsupportedGames(): void {
  assertEqual(
    rules.getApplicableRulesets(['red', 'gold', 'scarlet']).length,
    0,
    'Unsupported games should not produce a ruleset',
  );
}

function testChanceChanges(): void {
  const ruleset = rules.getApplicableRulesets(['diamond'])[0];
  const fullHealth = rules.calculateCatchChance(45, 'poke-ball', ['normal'], conditions, ruleset);
  const lowHealth = rules.calculateCatchChance(
    45,
    'poke-ball',
    ['normal'],
    { ...conditions, remainingHp: 20 },
    ruleset,
  );
  const asleep = rules.calculateCatchChance(
    45,
    'poke-ball',
    ['normal'],
    { ...conditions, status: 'sleep' },
    ruleset,
  );

  assertEqual(
    rules.calculateCatchChance(1, 'master-ball', [], conditions, ruleset),
    1,
    'Master Ball should always succeed',
  );
  assertEqual(
    Number((fullHealth * 100).toFixed(2)),
    5.88,
    'Standard catch chance should be shown as an actual per-throw percentage',
  );
  assert(lowHealth > fullHealth, 'Lower HP should improve catch chance');
  assert(asleep > fullHealth, 'Sleep should improve catch chance');
}

function testConditionalBalls(): void {
  const ruleset = rules.getApplicableRulesets(['diamond'])[0];
  const normalCatch = rules.calculateCatchChance(45, 'poke-ball', ['normal'], conditions, ruleset);
  const netCatch = rules.calculateCatchChance(45, 'net-ball', ['water'], conditions, ruleset);
  const diveCatch = rules.calculateCatchChance(
    45,
    'dive-ball',
    ['normal'],
    { ...conditions, inWater: true },
    ruleset,
  );

  assert(netCatch > normalCatch, 'Net Ball should improve catch chance for Water types');
  assert(diveCatch > normalCatch, 'Dive Ball should improve catch chance in water');
}

function testUnsupportedBallConditions(): void {
  const ruleset = rules.getApplicableRulesets(['diamond'])[0];

  for (const ballName of ['nest-ball', 'repeat-ball', 'timer-ball', 'quick-ball', 'dusk-ball']) {
    const availability = rules.getBallAvailability(ballName, ruleset);
    assertEqual(availability.available, false, `${ballName} must be disabled`);
    assert(Boolean(availability.reason), `${ballName} must explain why it is disabled`);
  }
}

function testGenerationThreeDiveBall(): void {
  const ruleset = rules.getApplicableRulesets(['ruby'])[0];

  assertEqual(
    rules.getBallAvailability('dive-ball', ruleset).available,
    false,
    'Generation III Dive Ball requires an underwater-specific condition',
  );
}

testRulesetGrouping();
testUnsupportedGames();
testChanceChanges();
testConditionalBalls();
testUnsupportedBallConditions();
testGenerationThreeDiveBall();
