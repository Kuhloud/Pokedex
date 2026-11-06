import { useQuery } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchPokemonAppearances,
  fetchPokemonBalls,
  fetchPokemonSimulatorDetails,
  type PokemonBall,
} from '@/services/pokemon-api';
import {
  calculateCatchChance,
  getApplicableRulesets,
  getBallAvailability,
  type SimulatorConditions,
  type SimulatorStatus,
  type SimulatorTime,
} from '@/services/pokemon-catching-rules';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function formatPokedexId(id: number): string {
  return String(id).padStart(3, '0');
}

const STATUS_OPTIONS: { label: string; value: SimulatorStatus }[] = [
  { label: 'No status', value: 'none' },
  { label: 'Sleep', value: 'sleep' },
  { label: 'Freeze', value: 'freeze' },
  { label: 'Paralysis', value: 'paralysis' },
  { label: 'Burn', value: 'burn' },
  { label: 'Poison', value: 'poison' },
];

function displayBallName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatChance(chance: number): string {
  return `${(chance * 100).toFixed(2)}%`;
}

function OptionButton({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? theme.badge : theme.backgroundElement,
          opacity: disabled ? 0.45 : 1,
        },
      ]}>
      <Text style={[styles.optionText, { color: selected ? theme.badgeText : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function RetryMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.errorBox, { backgroundColor: theme.backgroundElement }]}>
      <Text style={[styles.bodyText, { color: theme.text }]}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={[styles.retryText, { color: theme.badge }]}>Retry</Text>
      </Pressable>
    </View>
  );
}

export default function PokemonSimulatorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    id: idParam,
    formId: formIdParam,
    appearance: appearanceParam,
    gender: genderParam,
    shiny: shinyParam,
  } = useLocalSearchParams<{
    id?: string;
    formId?: string;
    appearance?: string;
    gender?: string;
    shiny?: string;
  }>();
  const id = Number(idParam);
  const formId = Number(formIdParam) || id;
  const validId = Number.isInteger(id) && id > 0 && Number.isInteger(formId) && formId > 0;
  const appearanceKey = appearanceParam || null;
  const isShiny = shinyParam === 'true';
  const gender = genderParam === 'female' ? 'female' : 'male';
  const [fontsLoaded, fontError] = useFonts({
    Rubik: require('@/assets/fonts/Rubik-Regular.ttf'),
    RubikMedium: require('@/assets/fonts/Rubik-Medium.ttf'),
    RubikBold: require('@/assets/fonts/Rubik-Bold.ttf'),
  });
  const [selectedRulesetId, setSelectedRulesetId] = useState<string | null>(null);
  const [selectedBallName, setSelectedBallName] = useState('poke-ball');
  const [remainingHp, setRemainingHp] = useState(100);
  const [status, setStatus] = useState<SimulatorStatus>('none');
  const [timeOfDay, setTimeOfDay] = useState<SimulatorTime>('Day');
  const [inWater, setInWater] = useState(false);
  const [fishing, setFishing] = useState(false);
  const [isThrowing, setIsThrowing] = useState(false);
  const [throwResult, setThrowResult] = useState<{ caught: boolean; chance: number } | null>(null);
  const [sliderWidth, setSliderWidth] = useState(1);
  const [encounterWidth, setEncounterWidth] = useState(1);
  const [pendingCatch, setPendingCatch] = useState<boolean | null>(null);
  const [throwProgress] = useState(() => new Animated.Value(0));
  const [catchProgress] = useState(() => new Animated.Value(0));

  const appearancesQuery = useQuery({
    queryKey: ['pokemon', 'appearances', id],
    queryFn: () => fetchPokemonAppearances(id),
    enabled: validId,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const appearance =
    appearancesQuery.data?.find((entry) => entry.key === appearanceKey) ??
    appearancesQuery.data?.find((entry) => entry.pokemonId === formId);
  const appearanceNotFound = Boolean(
    appearanceKey && appearancesQuery.isSuccess && !appearance,
  );
  const selectedPokemonId = appearance?.pokemonId ?? formId;
  const pokemonQuery = useQuery({
    queryKey: ['pokemon', 'simulator-details', selectedPokemonId],
    queryFn: () => fetchPokemonSimulatorDetails(selectedPokemonId),
    enabled: validId && appearancesQuery.isSuccess && !appearanceNotFound,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const ballsQuery = useQuery({
    queryKey: ['pokemon', 'simulator-balls'],
    queryFn: fetchPokemonBalls,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const rulesets = pokemonQuery.data
    ? getApplicableRulesets(pokemonQuery.data.gameVersions)
    : [];
  const selectedRuleset =
    rulesets.find((ruleset) => ruleset.id === selectedRulesetId) ?? rulesets[0];
  const balls = ballsQuery.data ?? [];
  const selectedBall =
    balls.find(
      (ball) =>
        ball.name === selectedBallName &&
        getBallAvailability(ball.name, selectedRuleset).available,
    ) ??
    balls.find(
      (ball) =>
        ball.name === 'poke-ball' &&
        getBallAvailability(ball.name, selectedRuleset).available,
    ) ??
    balls.find((ball) => getBallAvailability(ball.name, selectedRuleset).available);
  const selectedTimeOfDay =
    selectedRuleset?.timeChoices.includes(timeOfDay)
      ? timeOfDay
      : selectedRuleset?.timeChoices[0] ?? 'Day';
  const ballAvailability = selectedBall
    ? getBallAvailability(selectedBall.name, selectedRuleset)
    : { available: false, reason: null };
  const conditions: SimulatorConditions = {
    remainingHp,
    status,
    timeOfDay: selectedTimeOfDay,
    inWater,
    fishing,
  };
  const catchChance =
    pokemonQuery.data && selectedRuleset && selectedBall && ballAvailability.available
      ? calculateCatchChance(
          pokemonQuery.data.captureRate,
          selectedBall.name,
          pokemonQuery.data.types,
          conditions,
          selectedRuleset,
        )
      : null;
  const pokemonErrorMessage = appearanceNotFound
    ? 'The selected Pokémon appearance is no longer available.'
    : appearancesQuery.error instanceof Error
      ? appearancesQuery.error.message
      : pokemonQuery.error instanceof Error
        ? pokemonQuery.error.message
        : null;
  const pokemonLoading =
    validId &&
    (appearancesQuery.isPending || (appearancesQuery.isSuccess && pokemonQuery.isPending));
  const retryPokemonData = () => {
    if (!appearancesQuery.isSuccess || appearanceNotFound) {
      void appearancesQuery.refetch();
    } else {
      void pokemonQuery.refetch();
    }
  };

  const updateHpFromEvent = (event: { nativeEvent: { locationX: number } }) => {
    const nextValue = Math.round((event.nativeEvent.locationX / sliderWidth) * 100);
    setRemainingHp(Math.max(0, Math.min(100, nextValue)));
    setThrowResult(null);
  };

  const changeHpByAccessibility = (actionName: string) => {
    if (actionName === 'increment') {
      setRemainingHp((value) => Math.min(100, value + 1));
    } else if (actionName === 'decrement') {
      setRemainingHp((value) => Math.max(0, value - 1));
    }
    setThrowResult(null);
  };

  const throwBall = () => {
    if (catchChance === null || isThrowing) return;
    setThrowResult(null);
    setPendingCatch(null);
    setIsThrowing(true);
    throwProgress.setValue(0);
    catchProgress.setValue(0);
    Animated.timing(throwProgress, {
      toValue: 1,
      duration: 720,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (!finished) {
        setPendingCatch(null);
        setIsThrowing(false);
        return;
      }
      const caught = Math.random() < catchChance;
      if (!caught) {
        setThrowResult({ caught, chance: catchChance });
        setIsThrowing(false);
        return;
      }
      setPendingCatch(true);
      Animated.timing(catchProgress, {
        toValue: 1,
        duration: 380,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished: captureFinished }) => {
        if (!captureFinished) {
          setPendingCatch(null);
          setIsThrowing(false);
          return;
        }
        setThrowResult({ caught: true, chance: catchChance });
        setPendingCatch(null);
        setIsThrowing(false);
      });
    });
  };

  const pokemon = pokemonQuery.data;
  const genderSprites = appearance?.genderSprites ?? pokemon?.genderSprites;
  const selectedRegularSprite =
    (gender === 'female' ? genderSprites?.female : genderSprites?.male) ??
    appearance?.spriteUrl ??
    pokemon?.spriteUrl;
  const selectedShinySprite =
    (gender === 'female' ? genderSprites?.femaleShiny : genderSprites?.maleShiny) ??
    appearance?.shinySpriteUrl ??
    pokemon?.shinySpriteUrl;
  const spriteUrl = isShiny ? selectedShinySprite ?? selectedRegularSprite : selectedRegularSprite;

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={theme.badge} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: theme.background }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.text }]}>‹  Vorige</Text>
          </Pressable>
          <View style={styles.heroRow}>
            <View style={styles.heroText}>
              <Text style={[styles.title, { color: theme.text }]}>
                {pokemon?.name ?? 'Catching simulator'}
              </Text>
              <Text style={[styles.detail, { color: theme.textSecondary }]}>
                {pokemon ? `#${formatPokedexId(pokemon.speciesId)}` : `Pokémon #${formatPokedexId(id)}`}
              </Text>
              {appearance?.label && appearance.label.toLowerCase() !== pokemon?.name.toLowerCase() ? (
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  {appearance.label}
                </Text>
              ) : null}
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                {isShiny ? 'Shiny' : 'Regular'} appearance
              </Text>
              {isShiny && !selectedShinySprite ? (
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Shiny sprite unavailable; showing the regular sprite.
                </Text>
              ) : null}
            </View>
          </View>
          {pokemonLoading ? (
            <ActivityIndicator color={theme.badge} style={styles.inlineLoader} />
          ) : null}
          {!validId ? (
            <RetryMessage message="The Pokémon ID is invalid." onRetry={() => router.back()} />
          ) : pokemonErrorMessage ? (
            <RetryMessage
              message={pokemonErrorMessage}
              onRetry={retryPokemonData}
            />
          ) : null}
        </View>

        <View style={styles.content}>
          {fontError ? (
            <Text style={[styles.errorText, { color: theme.text }]}>
              Rubik font could not be loaded: {fontError.message}
            </Text>
          ) : null}

          <View style={[styles.encounterPanel, { backgroundColor: theme.backgroundSelected }]}>
            <View style={styles.encounterHeading}>
              <View>
                <Text style={[styles.throwTitle, { color: theme.text }]}>Wild encounter</Text>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  {pokemon?.name ?? `Pokémon #${formatPokedexId(id)}`}
                </Text>
              </View>
              <Text style={[styles.chanceLabel, { color: theme.text }]}>
                {catchChance === null ? '—' : formatChance(catchChance)}
              </Text>
            </View>
            <View
              onLayout={(event) => setEncounterWidth(Math.max(1, event.nativeEvent.layout.width))}
              style={styles.encounterStage}>
              <View style={[styles.encounterShadow, { backgroundColor: theme.backgroundElement }]} />
              {spriteUrl ? (
                <Animated.Image
                  source={{ uri: spriteUrl }}
                  resizeMode="contain"
                  style={[
                    styles.encounterSprite,
                    {
                      opacity:
                        throwResult?.caught
                          ? 0.24
                          : pendingCatch
                            ? catchProgress.interpolate({
                                inputRange: [0, 0.78, 1],
                                outputRange: [1, 1, 0.24],
                              })
                            : 1,
                      transform: [
                        {
                          scale:
                            throwResult?.caught
                              ? 0.32
                              : pendingCatch
                                ? catchProgress.interpolate({
                                    inputRange: [0, 0.78, 1],
                                    outputRange: [1, 1, 0.32],
                                  })
                                : 1,
                        },
                      ],
                    },
                  ]}
                />
              ) : (
                <View style={[styles.encounterSpritePlaceholder, { backgroundColor: theme.card }]}>
                  <Text style={[styles.detail, { color: theme.textSecondary }]}>?</Text>
                </View>
              )}
              {isThrowing || throwResult?.caught ? (
                <Animated.View
                  style={[
                    styles.animatedBall,
                    {
                      transform: [
                        {
                          translateX: throwProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.max(0, encounterWidth / 2 - 42)],
                          }),
                        },
                        {
                          translateY: throwProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -125],
                          }),
                        },
                        {
                          scale: throwProgress.interpolate({
                            inputRange: [0, 0.72, 1],
                            outputRange: [0.75, 1, 0.82],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <View style={styles.ballTop} />
                  <View style={styles.ballBelt} />
                  <View style={styles.ballButton} />
                </Animated.View>
              ) : null}
            </View>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.encounterMessage, { color: theme.text }]}>
              {isThrowing
                ? pendingCatch
                  ? 'The ball is closing around the Pokémon…'
                  : 'The ball is flying toward the Pokémon…'
                : throwResult
                  ? throwResult.caught
                    ? `${pokemon?.name ?? 'Pokémon'} caught!`
                    : `${pokemon?.name ?? 'Pokémon'} broke free!`
                  : selectedBall
                    ? `${displayBallName(selectedBall.name)} · ${catchChance === null ? 'Chance unavailable' : `${formatChance(catchChance)} chance`}`
                    : 'Choose a Poké Ball to begin.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={catchChance === null || isThrowing || ballsQuery.isError || Boolean(pokemonErrorMessage)}
              onPress={throwBall}
              style={[
                styles.throwButton,
                {
                  backgroundColor: theme.badge,
                  opacity:
                    catchChance === null ||
                    isThrowing ||
                    ballsQuery.isError ||
                    Boolean(pokemonErrorMessage)
                      ? 0.5
                      : 1,
                },
              ]}>
              <Text style={[styles.throwButtonText, { color: theme.badgeText }]}>
                {isThrowing ? 'Throwing…' : throwResult?.caught ? 'Throw another ball' : 'Throw Ball'}
              </Text>
            </Pressable>
            {throwResult ? (
              <Text style={[styles.resultCaption, { color: theme.textSecondary }]}>
                {throwResult.caught ? 'Caught' : 'Broke free'} on this throw at{' '}
                {formatChance(throwResult.chance)}. This is a simulation; no Pokémon was saved.
              </Text>
            ) : null}
          </View>

          <View style={[styles.simulatorPanel, { backgroundColor: theme.card, borderColor: theme.badge }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose game rules</Text>
            {!pokemon ? (
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                Rulesets will appear after Pokémon data loads.
              </Text>
            ) : rulesets.length === 0 ? (
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                No game-accurate ruleset is available for this Pokémon. Throw Ball is disabled rather than showing an estimate.
              </Text>
            ) : (
              <>
                <View style={styles.optionRow}>
                  {rulesets.map((ruleset) => (
                    <OptionButton
                      key={ruleset.id}
                      label={`${ruleset.title} · ${ruleset.games.length}`}
                      selected={selectedRuleset?.id === ruleset.id}
                      onPress={() => {
                        setSelectedRulesetId(ruleset.id);
                        setThrowResult(null);
                      }}
                    />
                  ))}
                </View>
                {selectedRuleset ? (
                  <>
                    <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                      {selectedRuleset.description}
                    </Text>
                    <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                      Only fully modeled rulesets are offered; games with unsupported catch mechanics are omitted.
                    </Text>
                  </>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Poké Balls</Text>
            {ballsQuery.isPending ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.badge} />
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                  Loading Poké Balls…
                </Text>
              </View>
            ) : null}
            {ballsQuery.isError ? (
              <RetryMessage
                message={
                  ballsQuery.error instanceof Error
                    ? ballsQuery.error.message
                    : 'Unable to load Poké Ball data.'
                }
                onRetry={() => void ballsQuery.refetch()}
              />
            ) : null}
            {ballsQuery.data ? (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ballRow}>
                {ballsQuery.data.map((ball) => (
                  <BallOption
                    key={ball.id}
                    ball={ball}
                    availability={getBallAvailability(ball.name, selectedRuleset)}
                    selected={selectedBall?.name === ball.name}
                    onPress={() => {
                      setSelectedBallName(ball.name);
                      setThrowResult(null);
                    }}
                  />
                ))}
              </ScrollView>
            ) : null}
            {selectedBall ? (
              <View style={[styles.selectedBallDetails, { backgroundColor: theme.card }]}>
                <Text style={[styles.ballName, { color: theme.text }]}>
                  {displayBallName(selectedBall.name)}
                </Text>
                <Text style={[styles.ballDescription, { color: theme.textSecondary }]}>
                  {selectedBall.description}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.section, styles.controlsPanel, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Catch conditions</Text>
            <Text style={[styles.controlLabel, { color: theme.text }]}>
              Remaining HP · {remainingHp}%
            </Text>
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Remaining HP"
              accessibilityValue={{ min: 0, max: 100, now: remainingHp }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={({ nativeEvent }) =>
                changeHpByAccessibility(nativeEvent.actionName)
              }
              onLayout={(event) => setSliderWidth(Math.max(1, event.nativeEvent.layout.width))}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={updateHpFromEvent}
              onResponderMove={updateHpFromEvent}
              onStartShouldSetResponder={() => true}
              style={[styles.sliderTrack, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${remainingHp}%`, backgroundColor: theme.badge },
                ]}
              />
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${remainingHp}%`, backgroundColor: theme.badgeText, borderColor: theme.badge },
                ]}
              />
            </View>

            <Text style={[styles.controlLabel, { color: theme.text }]}>Status condition</Text>
            <View style={styles.optionRow}>
              {STATUS_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={status === option.value}
                  onPress={() => {
                    setStatus(option.value);
                    setThrowResult(null);
                  }}
                />
              ))}
            </View>

            {selectedRuleset?.timeChoices.length ? (
              <>
                <Text style={[styles.controlLabel, { color: theme.text }]}>Time of day</Text>
                <View style={styles.optionRow}>
                  {selectedRuleset.timeChoices.map((choice) => (
                    <OptionButton
                      key={choice}
                      label={choice}
                      selected={selectedTimeOfDay === choice}
                      onPress={() => {
                        setTimeOfDay(choice);
                        setThrowResult(null);
                      }}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Text style={[styles.controlLabel, { color: theme.text }]}>Encounter conditions</Text>
            <View style={styles.toggleRow}>
              <ToggleButton
                label="In water"
                value={inWater}
                onPress={() => {
                  setInWater((current) => !current);
                  setThrowResult(null);
                }}
              />
              <ToggleButton
                label="Fishing"
                value={fishing}
                onPress={() => {
                  setFishing((current) => !current);
                  setThrowResult(null);
                }}
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BallOption({
  ball,
  availability,
  selected,
  onPress,
}: {
  ball: PokemonBall;
  availability: { available: boolean; reason: string | null };
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !availability.available }}
          accessibilityLabel={[
            displayBallName(ball.name),
            availability.available ? 'Available' : availability.reason,
          ].filter(Boolean).join('. ')}
          disabled={!availability.available}
          onPress={onPress}
      style={[
        styles.ballOption,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.card,
          borderColor: selected ? theme.badge : theme.backgroundElement,
          opacity: availability.available ? 1 : 0.62,
        },
      ]}>
      <View style={styles.ballHeading}>
        <Text numberOfLines={2} style={[styles.ballName, styles.ballOptionName, { color: theme.text }]}>
          {displayBallName(ball.name)}
        </Text>
      </View>
      <Text style={[styles.ballId, { color: theme.textSecondary }]}>ID {ball.id}</Text>
      {!availability.available && availability.reason ? (
        <Text style={[styles.unavailableText, { color: theme.text }]}>{availability.reason}</Text>
      ) : null}
    </Pressable>
  );
}

function ToggleButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={onPress}
      style={[
        styles.toggleButton,
        { backgroundColor: value ? theme.badge : theme.backgroundElement },
      ]}>
      <Text style={[styles.optionText, { color: value ? theme.badgeText : theme.text }]}>
        {label}: {value ? 'On' : 'Off'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: Spacing.five },
  hero: { paddingBottom: Spacing.three },
  backButton: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  backText: { fontFamily: 'Rubik', fontSize: 16 },
  heroRow: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  heroText: { flex: 1, gap: Spacing.one },
  title: { fontFamily: 'RubikBold', fontSize: 26 },
  detail: { fontFamily: 'Rubik', fontSize: 16 },
  formLabel: { fontFamily: 'RubikMedium', fontSize: 13 },
  inlineLoader: { marginTop: Spacing.two },
  content: { gap: Spacing.three, padding: Spacing.three },
  simulatorPanel: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 2,
    borderRadius: Radius.l,
  },
  section: { gap: Spacing.two },
  sectionTitle: { fontFamily: 'RubikBold', fontSize: 19 },
  bodyText: { fontFamily: 'Rubik', fontSize: 14, lineHeight: 20 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  optionButton: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 20 },
  ballRow: { gap: Spacing.two, paddingVertical: Spacing.one },
  optionText: { fontFamily: 'RubikMedium', fontSize: 13 },
  ballOption: {
    width: 160,
    minHeight: 96,
    gap: Spacing.one,
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.m,
  },
  ballHeading: { minHeight: 36, justifyContent: 'center' },
  ballName: { fontFamily: 'RubikMedium', fontSize: 15 },
  ballOptionName: { lineHeight: 18 },
  ballId: { fontFamily: 'Rubik', fontSize: 12 },
  ballDescription: { fontFamily: 'Rubik', fontSize: 13, lineHeight: 18 },
  unavailableText: { fontFamily: 'RubikMedium', fontSize: 12, lineHeight: 17 },
  selectedBallDetails: { gap: Spacing.one, padding: Spacing.two, borderRadius: Radius.m },
  encounterPanel: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.l },
  encounterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  encounterStage: {
    position: 'relative',
    height: 240,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.l,
  },
  encounterSprite: { position: 'absolute', top: 8, width: 190, height: 190 },
  encounterSpritePlaceholder: {
    position: 'absolute',
    top: 30,
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.l,
  },
  encounterShadow: {
    position: 'absolute',
    bottom: 18,
    width: 136,
    height: 24,
    borderRadius: 68,
    opacity: 0.6,
  },
  animatedBall: {
    position: 'absolute',
    left: 24,
    bottom: 18,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#f8f8f2',
    borderColor: '#25252a',
    borderWidth: 3,
    borderRadius: 21,
  },
  ballTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#e4474c',
    borderBottomColor: '#25252a',
    borderBottomWidth: 2,
  },
  ballBelt: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: '#25252a',
  },
  ballButton: {
    width: 13,
    height: 13,
    backgroundColor: '#fff',
    borderColor: '#25252a',
    borderWidth: 2,
    borderRadius: 7,
  },
  encounterMessage: {
    minHeight: 22,
    fontFamily: 'RubikMedium',
    fontSize: 15,
    textAlign: 'center',
  },
  controlsPanel: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.l },
  controlLabel: { fontFamily: 'RubikMedium', fontSize: 15, marginTop: Spacing.two },
  sliderTrack: { height: 22, justifyContent: 'center', borderRadius: 12 },
  sliderFill: { height: 8, borderRadius: 5 },
  sliderThumb: {
    position: 'absolute',
    top: 1,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderWidth: 2,
    borderRadius: 10,
  },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  toggleButton: { minWidth: 120, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.m },
  throwTitle: { fontFamily: 'RubikBold', fontSize: 20 },
  chanceLabel: { fontFamily: 'RubikMedium', fontSize: 17 },
  throwButton: { width: '100%', alignItems: 'center', padding: Spacing.three, borderRadius: Radius.m },
  throwButtonText: { fontFamily: 'RubikBold', fontSize: 17 },
  resultCaption: { fontFamily: 'Rubik', fontSize: 12, textAlign: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  errorBox: { gap: Spacing.two, padding: Spacing.two, borderRadius: Radius.m },
  errorText: { fontFamily: 'Rubik', fontSize: 12 },
  retryButton: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  retryText: { fontFamily: 'RubikBold', fontSize: 14 },
});