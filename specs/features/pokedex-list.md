# Pokédex

## Goal

<What can the user do when this is done, and why? One or two sentences.>

Browse a list of pokémon. So that there is an ordered list of pokémon for the user to view and select.

## Constraints

- Lives in the "Pokémon" tab on the home screen, `src/app/index.tsx`. No new screen.
- Uses the PokeAPI (`https://pokeapi.co/api/v2/pokemon`).
- Colors and spacing from `src/constants/theme.ts`.
- No new dependencies.

## Acceptance Criteria

- [ ] A list with the label "All Pokémon", consisting of pokémon starting from id and descending. Two pokémon per row.
- [ ] Each pokémon should be in a a card, containing the id, the sprite, the name, and a 3 dot option button that has the options "Open Pokémon", "Add to favorites", and "Share"
- [ ] Tapping a pokémon opens a detail page for that pokémon.
- [ ] An option to sort by id and name with option descending and ascending.
- [ ] An option to filter by generation, rarity, type, and name with option descending and ascending.
- [ ] An on/off toggle to display either regular pokémon or shiny pokémon.
- [ ] Loading and error state on list, detail and evolution chain.
- [ ] The font from the design with Expo Font (`assets/fonts`)

## Out of Scope

- filter by colour.
