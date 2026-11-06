# Compare Pokémon Stats

## Context

- Pokémon list and detail data comes from the PokeAPI (`/pokemon`, `/pokemon/{id}`); type damage relations come from `/type/{id}`.
- Add the Compare tab to the bottom navigation defined in `src/components/app-tabs.tsx`.
- Colors and spacing from `src/constants/theme.ts`.
- Use the Rubik font files in `assets/fonts`, loaded with Expo Font.
- No new dependencies.

## Goals

Select two Pokémon and compare their stats and type effectiveness against each other. The comparison does not declare a winner.

## Requirements

### Selection

- The Compare tab opens a Pokémon selection screen based on the Pokémon index at `src/app/(tabs)/compare.tsx`.
- Reuse the index presentation, ordering, and controls specified in `specs/features/pokedex-list.md`.
- Show a checkbox for each Pokémon and allow exactly two to be selected.
- Once two are selected, keep other Pokémon unselectable until one selected Pokémon is unchecked.
- Keep the “Compare Pokémon” action visible but disabled until two Pokémon are selected. While disabled, show “Select 2 Pokémon to compare”.
- The action opens a separate comparison screen at `src/app/compare-results.tsx`.
- Show loading, error, and retry states for the selection list.

### Comparison

- Show the two selected Pokémon's names, sprites, and HP, Attack, Defense, Special Attack, Special Defense, and Speed side by side.
- Show type damage effectiveness in both directions, for each attacking type against the opponent's type or types. Combine the effects against dual types and label the result “super effective”, “not very effective”, “no effect”, or “normal damage”.
- Give each Pokémon a separate “Type advantage” indication if at least one of its types can deal super-effective damage to the opponent. Both or neither Pokémon can have this indication.
- Do not declare an overall winner or a general “fit for fighting” result.
- Show loading, error, and retry states for the selected Pokémon's comparison data.
- Returning to the selection screen preserves the selected pair.

### Visual design

- Use the app's Rubik font, loaded with Expo Font from `assets/fonts`.
- Use the app's theme colors and spacing from `src/constants/theme.ts`.

## Acceptance Criteria

- [ ] A Compare bottom tab opens the Pokémon selection screen.
- [ ] The selection screen prevents selecting more than two Pokémon, disables “Compare Pokémon” until two are selected, and preserves the pair when returning from the comparison.
- [ ] The comparison screen shows both Pokémon's names, sprites, and six base stats.
- [ ] The comparison shows type damage effectiveness in both directions and independently indicates each Pokémon's type advantage according to the stated rule; it does not declare a winner.
- [ ] The selection list and comparison data each show loading, retryable error, and successful states.
- [ ] The screens use the Rubik font and theme colors and spacing, with no new dependencies.

## Out of scope

- Loading or displaying evolution chains.
- Adding dependencies.
