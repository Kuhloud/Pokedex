# Pokémon Detail Page

## Goal

See the details of a pokémon: id, type, (shiny) sprites, general info, stats, and evolution. The user can discover more about a pokémon.

## Constraints

<The walls the agent cannot see: which screen, which data, what to reuse,
what not to add.>

- Lives on the detail screen, `src/app/pokémon/[id].tsx`.
- Uses the shiny filter defined in specs/features/pokémon_index.md.
- Uses the PokeAPI (`https://pokeapi.co/api/v2/pokemon/{id}`) and (`https://pokeapi.co/api/v2/pokemon_species/{id}`).
- Colors and spacing from `src/constants/theme.ts`.
- No new dependencies.

## Acceptance Criteria

<Three to six things someone else can tick off without asking you anything.
What is on screen, what happens on press, what a failure looks like.>

- [ ] Displays the selected Pokémon's name, ID, types (in type color) and (shiny) sprite (check the shiny toggle in the index, specified by pokémon_index.md) and a back button.
- [ ] A favorite button lets the user add or remove a Pokémon from Favorites
- [ ] A "Catch" button, goes to src/app/pokémon
- [ ] A "About" tab showing name, id, base_experience as "Base" {base_experience}XP, weight in kg, height in meters, type, and abilities.
- [ ] A "Stats" tab showing HP, Attack, Defense, Special Attack, Special Defense, and Speed. A label, a bar and a number for every stat.
- [ ] A "Evolution" tab, showing cards of every evolution (including mega evolutions). with a sprite, name, and id of each evolution, alongside a female or male symbol if a pokémon has gender differences.
- [ ] Loading and error state on list, detail and evolution chain.
- [ ] The font from the design with Expo Font (`assets/fonts`)

## Out of Scope

<What this feature does not do. The agent will not invent it.>

- Search by postcode or coordinates.
- Search history or suggestions.
- My location (GPS).
