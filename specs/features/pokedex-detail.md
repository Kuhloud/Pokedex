# Pokémon Detail Page

## Context

- The detail screen is `src/app/pokemon/[id].tsx`; it opens from a Pokémon card.
- Pokémon data comes from PokeAPI `/pokemon/{id}` and `/pokemon-species/{id}`. The species response supplies the evolution-chain URL.
- The list screen, including its regional-form picker and shiny toggle, is specified in `specs/features/pokedex-list.md`.
- Favorites are stored in SQLite in the `personal_list` table defined in `specs/product.md`.
- Use Expo Router, the existing theme in `src/constants/theme.ts`, the Rubik font files in `assets/fonts`, and no new dependencies.

## Goals

- Let the user inspect a Pokémon's identifying information, general information, stats, and evolution family.
- Let the user manage that Pokémon in Favorites and open its catching simulator.

## Requirements

### Detail screen

- Show the selected Pokémon's name, Pokédex ID, type badges, and sprite.
- Open with the form and regular/shiny setting selected on the Pokémon list. The user can also change the form and regular/shiny setting on the detail screen.
- Keep form selection independent from the regular/shiny setting. Offer the regional forms specified in `specs/features/pokedex-list.md`; show the shiny control only when the selected form has a shiny sprite.
- When returning to the list, keep the form and regular/shiny setting most recently selected on the detail screen.
- Provide a back button that returns to the screen that opened the detail page.
- Provide a Favorite control that adds or removes this Pokémon from the user's SQLite Favorites. The control reflects whether it is currently saved.
- Provide a “Catch” button that opens `src/app/pokemon/simulator/[id].tsx` for the selected Pokémon. Catching behavior is specified separately in `specs/features/pokedex-simulator.md`.

### Tabs

- Provide “About”, “Stats”, and “Evolution” tabs. “About” is selected when the detail screen first opens.
- Clearly indicate which tab is selected.

#### About

- Show the Pokémon's name, Pokédex ID, base experience as `Base {base_experience}XP`, weight in kilograms, height in meters, types, and abilities.

#### Stats

- Show HP, Attack, Defense, Special Attack, Special Defense, and Speed.
- For each stat, show its label, a bar, and its numeric value.
- Use a fixed scale from 0 to 255 for every stat bar.

#### Evolution

- Show cards for the selected Pokémon's complete evolution family: earlier and later stages, all branches, and the selected Pokémon itself.
- Show Mega forms when they are present in the available PokeAPI data.
- Each card shows a sprite, name, and Pokédex ID. For Pokémon with gender-differentiated sprites, show the regular sprite and both male (♂) and female (♀) symbols.
- Visually highlight the card for the Pokémon whose detail page is open, using an accent border.
- Tapping another Pokémon's card opens that Pokémon's detail page.
- If the selected Pokémon has no other evolutionary forms, show only its own card without an error or additional message.

### Type colors and missing data

- Give each Pokémon type a distinct, fixed badge color and keep badge text legible against its background. Use the existing theme for other colors and spacing.
- If an optional text value is missing, show “Not available”. If a sprite is missing, show a neutral placeholder; do not treat either case as a request failure.

### Loading and errors

- Show a loading state while the Pokémon's detail data loads.
- Show an error state with a retry action when detail data cannot be loaded.
- Show loading and retryable error states for the evolution family independently of the rest of the detail screen.

### Visual design

- Use the app's Rubik font, loaded with Expo Font from `assets/fonts`.
- Use the app's theme colors and spacing from `src/constants/theme.ts`.

## Acceptance Criteria

- [ ] Opening a Pokémon shows its name, ID, type badges, selected form and regular/shiny sprite, with controls to change the form and sprite setting.
- [ ] The back button returns to the previous screen and preserves the latest form and regular/shiny choices; the Favorite control adds or removes the Pokémon from the persistent Favorites list.
- [ ] The “Catch” button opens the catching simulator for the same Pokémon; tapping another evolution-family card opens that Pokémon's detail page.
- [ ] The About tab shows all specified general information; the Stats tab shows all six specified stats with a label, a bar scaled from 0 to 255, and a value.
- [ ] The Evolution tab shows the complete family, available Mega forms, the required card details, gender symbols when applicable, and a visible highlight on the current Pokémon; a Pokémon with no other forms shows only its own card.
- [ ] Missing optional values and sprites use the specified fallbacks; detail data and evolution-family data each show loading and retryable error states.
- [ ] Type badges use distinct fixed colors, and the screen uses the Rubik font and existing theme.

## Out of Scope

- Searching, sorting, or filtering the Pokémon index.
- Implementing the catching simulation itself.
- Comparing Pokémon or adding new dependencies.
