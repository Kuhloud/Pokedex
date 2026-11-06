# Implementation Plan: Pokémon Comparison

Issue: [Kuhloud/Pokedex#5](https://github.com/Kuhloud/Pokedex/issues/5)

## Scope and design baseline

Follow `specs/features/pokedex-compare.md` and the referenced list behavior in `specs/features/pokedex-list.md`. Keep the implementation focused on the Compare tab, its selection screen, and its comparison screen. Use the provided Home and Detail Figma screenshots as the visual baseline: Rubik typography, pale-blue surfaces, white rounded cards, purple accents, and consistent spacing. The screenshots do not show a comparison-specific screen, so the comparison layout will follow the written spec and reuse that visual language.

The feature spec names `src/components/app-tabs.tsx`, `src/app/(tabs)/compare.tsx`, `src/app/compare-results.tsx`, `src/constants/theme.ts`, and `assets/fonts`. The first three are the anticipated implementation files; use the existing theme and fonts without modifying them. Reuse the list ordering and controls specified by `specs/features/pokedex-list.md`. Do not add dependencies.

The user approved read-only inspection of `package.json`, the matching Expo SDK documentation, `src/hooks/use-pokemon-list.ts`, and `src/services/pokemon-api.ts`. The user also approved a focused addition to `src/services/pokemon-api.ts` to fetch type damage relations through its existing PokéAPI request helper. No other unlisted source paths are approved.

Before approval, do not implement the feature. After approval, inspect only the source files named by the applicable specs. If implementation requires inspecting or changing any other source file, adding a file, or extending the scope, pause and ask for permission first, identifying the exact path or change and why it is needed.

## Implementation plan

1. After approval, inspect the specified tab navigation and the existing list-screen behavior, theme, and font setup. Confirm how to reuse the existing Pokédex ordering, controls, and navigation conventions without expanding file scope.
2. Add the Compare tab and create a selection screen that follows the Pokédex index presentation. Display checkboxes, enforce a maximum of two selections, leave the Compare action visible but disabled until exactly two Pokémon are selected, and show the specified disabled-state label.
3. Keep the chosen pair when opening the comparison and returning to selection. Prefer retaining the selection screen in the navigation stack; if the existing navigation behavior cannot preserve it, pause and request permission before using an alternative that requires other files or broader changes.
4. Create the comparison screen with each Pokémon's name, sprite, and six base stats displayed side by side. Calculate type effectiveness for each attacking type against the opponent's one or two types, combine dual-type effects, and display the required effectiveness labels in both directions.
5. Show a separate Type advantage indication for each Pokémon only when at least one of its types deals super-effective damage to the opponent. Do not display a winner or an overall fighting recommendation.
6. Provide loading, retryable error, and successful states for both the selection list and comparison data. Match the app's Rubik typography, theme colors, spacing, and mobile layouts; do not add dependencies.
7. Check every acceptance criterion in `specs/features/pokedex-compare.md`, then run the project lint and TypeScript checks. Report any validation that cannot be completed without permission to inspect or change additional files.

## Design decision

The user confirmed there is no comparison-specific Figma frame. The comparison layout therefore follows the written feature spec and uses the provided Home and Detail screenshots as its visual baseline. The user approved the addition of a focused API helper in `src/services/pokemon-api.ts` for type damage relations.

## Task checklist

- [x] Receive approval of this plan before implementation.
- [x] Inspect only the source files explicitly named by the applicable specs and the specifically approved helper paths.
- [x] Add the Compare bottom tab and the Pokémon selection screen.
- [x] Enforce selection of exactly two Pokémon and preserve the pair when returning from comparison.
- [x] Implement the side-by-side comparison of names, sprites, and six base stats.
- [x] Implement bidirectional, dual-type-aware effectiveness labels and independent Type advantage indications without declaring a winner.
- [x] Implement loading, retryable error, and successful states for selection and comparison.
- [x] Match the Figma visual baseline using existing theme/fonts and no new dependencies.
- [x] Verify all acceptance criteria and run lint and TypeScript checks.
