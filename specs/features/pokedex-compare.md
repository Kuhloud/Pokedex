# Compare Pokémon Stats

## Goal

<What can the user do when this is done, and why? One or two sentences.>

Select two Pokémon and compare their stats with eachother. The user can use this to discover which pokémon fare better against another.

## Constraints

<The walls the agent cannot see: which screen, which data, what to reuse,
what not to add.>

- Lives on the selection screen and the comparison screen, `src/app/compare.tsx`.
- Uses the PokeAPI (`https://pokeapi.co/api/v2/pokemon`) and (`https://pokeapi.co/api/v2/pokemon/{id}`).
- Colors and spacing from `src/constants/theme.ts`.
- No new dependencies.

## Acceptance Criteria

<Three to six things someone else can tick off without asking you anything.
What is on screen, what happens on press, what a failure looks like.>

- [ ] A selection screen based on the index page, but with a checkbox. You should be able to select a minimum and maximum of 2 pokémon.
- [ ] Selection screen has a "Compare Pokémon" that goes to the comparison screen.
- [ ] A comparison screen with the two pokémon sprites on each side, with each stats underneath.
- [ ] A decider which one would win, and recommendation of whether they are fit for fighting
- [ ] Loading and error state on list, detail and evolution chain.
- [ ] The font from the design with Expo Font (`assets/fonts`)

## Out of Scope

<What this feature does not do. The agent will not invent it.>

- Search by postcode or coordinates.
- Search history or suggestions.
- My location (GPS).
