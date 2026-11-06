# Pokémon Catching Simulator

## Goal

Play a simulator to see the catch rate of a pokémon with a specific ball. The user can learn what balls to use, and what conditions has a higher catch rate.

## Constraints

- Lives on the simulator screen, `src/app/pokémon/simulator/[id].tsx`.
- Accessable via the detail page of a pokémon, defined in specs/features/pokémon_detail.md
- Uses the PokeApi (`https://pokeapi.co/api/v2/item-category/33/`) and (`https://pokeapi.co/api/v2/item-category/34/`).
- Colors and spacing from `src/constants/theme.ts`.
- No new dependencies.

## Acceptance Criteria

<Three to six things someone else can tick off without asking you anything.
What is on screen, what happens on press, what a failure looks like.>

- [ ] Displays the selected Pokémon's name, ID and (shiny) sprite.
- [ ] Displays a list of all Poké Balls, and their id and description.
- [ ] Multiple options to set catch conditions, including HP, status condition and relevant encounter conditions
- [ ] A "Throw Ball" button, that shows an animated success or failure result based on the calculated probability, then retry
- [ ] Loading and error state on list, detail and evolution chain.
- [ ] The font from the design with Expo Font (`assets/fonts`)

## Out of Scope

<What this feature does not do. The agent will not invent it.>

- Saving caught Pokémon.
- Simulating actual Pokémon battles
