# Pokédex

## Context

- The Pokédex list lives in the Pokémon tab at `src/app/(tabs)/index.tsx`; opening a Pokémon uses the detail route at `src/app/pokemon/[id].tsx`.
- Pokémon data comes from the PokeAPI (`/pokemon` and `/pokemon-species/{id}`).
- Use the existing theme in `src/constants/theme.ts`, the Rubik font files in `assets/fonts` loaded with Expo Font, and no new dependencies.

## Goals

Browse Pokémon in an ordered, two-column list and open a selected Pokémon’s detail page.

## Requirements

### List

- Show the list with the heading “All Pokémon”.
- Display one card per Pokémon species, two cards per row. Each card shows its Pokédex number, sprite, name, and a three-dot menu.
- Tapping a card opens that Pokémon’s detail page.
- Load an initial batch, then load more entries automatically as the user scrolls.
- Show a loading state while the list loads. If loading fails, show an error state and let the user retry.
- The list opens ordered by numeric Pokédex ID, smallest first.

### Sorting and filters

- Let the user sort by Pokédex ID or name, in ascending or descending order.
- Let the user filter by generation, rarity, type, and name. Sorting is limited to ID or name; the filters do not change sort order.
- Allow more than one value to be selected within a filter. A Pokémon must match at least one selected value within each active filter, and must match every active filter.
- The rarity filter includes only Pokémon marked legendary or mythical by their species data.
- Name filtering follows the case-insensitive, two-letter minimum behavior in `specs/features/pokedex-search.md`.

### Card actions and sprites

- The three-dot menu contains “Open Pokémon”, “Add to favorites”, and “Share”.
- “Open Pokémon” opens the Pokémon’s detail page.
- “Share” opens the phone’s share sheet with the Pokémon’s name and Pokédex number as text.
- Show a Pokémon’s standard form by default. For Pokémon with regional forms, provide a small, directly selectable choice of the available forms, including Alolan, Galarian, Hisuian, and Paldean forms. Do not include Mega, Gigantamax, or other non-regional forms. Regional forms are selected within the species card, not shown as separate cards.
- Provide an on/off toggle for regular or shiny sprites; regular is the default.
- Keep form selection independent from the shiny toggle, so the user can select a form and its shiny sprite together when that shiny sprite is available. Hide the shiny toggle when the selected form has no shiny sprite.
- Opening the detail page keeps the selected form and shiny setting, as specified in `specs/features/pokedex-detail.md`.

### Related detail behavior

- Pokémon detail and evolution-chain loading and error states are specified in `specs/features/pokedex-detail.md`.

## Out of scope

- Filtering by color.
