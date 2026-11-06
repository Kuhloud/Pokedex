# Favorites List

## Goal

Browse and manage a personal list of favorite Pokémon, then open a favorite’s detail page or share it.

## Context

- The home screen has a Pokémon tab and a Favorites tab. Favorites is a tab, not a separate detail route.
- The Favorites tab screen is `src/app/(tabs)/favorites.tsx`.
- Pokémon details use `src/app/pokémon/[id].tsx`.
- The Pokémon index, card behavior, regional forms, and sprite toggle are specified in `specs/features/pokedex-list.md`.
- The Pokémon detail and evolution-chain loading and error behavior are specified in `specs/features/pokedex-detail.md`.
- Favorites are user-specific data stored on the phone in SQLite, separately from Pokémon API data. Use the `personal_list` table defined in `specs/product.md`.
- Pokémon data comes from the PokeAPI (`https://pokeapi.co/api/v2/pokemon`).
- Use the existing theme in `src/constants/theme.ts`, the Rubik font files in `assets/fonts` loaded with Expo Font, and no new dependencies.

## Constraints

- Show only Pokémon the user has added to Favorites.
- The Favorites list is the screen for this tab; do not add a separate detail screen for the Favorites feature.

## Requirements

### Favorites list

- Display two Pokémon cards per row.
- Each card shows the Pokédex number, sprite, name, and a three-dot menu.
- Tapping a card opens that Pokémon’s detail page.
- Show an empty state with the text “No favorites yet” when the user has not saved any Pokémon. Do not show a button in this state.
- If saved Pokémon exist but none match the active filters or name search, show no cards, message, or button. Keep the controls available so the user can change or clear them.
- Show a loading state while the Favorites list loads. If loading fails, show an error state and let the user retry.
- Keep each favorite after the app closes and restarts. A Pokémon can appear in Favorites only once.
- Keep the selected sorting and filters when the user opens a Pokémon’s detail page and returns. Keep search text as specified in `specs/features/pokedex-search.md`.

### Sorting and filters

- Sort by Pokédex ID or name, in ascending or descending order. Initially sort by Pokédex ID, descending.
- Provide filters for generation, rarity, type, and name. Apply filters only to saved Pokémon.
- Use the same filter behavior as `specs/features/pokedex-list.md`: multiple values may be selected within a filter, a Pokémon must match at least one selected value within every active filter, and must match every active filter. Filters do not change sort order.
- Rarity includes Pokémon marked legendary or mythical by their species data.
- Name filtering follows the case-insensitive, two-letter minimum behavior in `specs/features/pokedex-search.md`.

### Card actions and navigation

- The three-dot menu contains “Open Pokémon”, “Remove from favorites”, and “Share”.
- “Open Pokémon” opens the Pokémon’s detail page.
- Tapping “Remove from favorites” removes that Pokémon immediately and briefly provides an “Undo” action. Undo restores the favorite. The user can also add it again from the Pokémon tab or its detail page.
- “Share” opens the phone’s share sheet with the Pokémon’s name and Pokédex number as text.
- Use the regional form selection and regular/shiny toggle behavior specified in `specs/features/pokedex-list.md`. Pass the selected form and shiny setting to the detail page, as required by that spec.
- Use the detail page’s favorite control to add or remove the current Pokémon, and keep the Favorites list up to date when returning to it.

### Related detail behavior

- Pokémon detail and evolution-chain loading and error states are specified in `specs/features/pokedex-detail.md`.

## Acceptance Criteria

- [ ] Favorites appears as a home tab alongside the Pokémon tab.
- [ ] The list contains only saved Pokémon, displays two cards per row, and starts in descending Pokédex ID order.
- [ ] Users can sort by Pokédex ID or name, ascending or descending, and filter by generation, rarity, type, and name using the Pokémon index rules.
- [ ] Each card opens its Pokémon detail page when tapped and provides the specified three-dot actions.
- [ ] Adding and removing a favorite updates the list, and saved favorites survive an app restart.
- [ ] An empty Favorites list shows “No favorites yet” without a button.
- [ ] If saved Pokémon do not match the current filters or search, the list shows no cards, message, or button, and the controls remain available.
- [ ] Opening a Pokémon and returning preserves the selected sorting and filters.
- [ ] Removing a favorite takes effect immediately and offers a temporary Undo action.
- [ ] Loading and retryable error states are provided for the list; detail and evolution-chain states follow the detail feature spec.
- [ ] The design font is loaded with Expo Font from `assets/fonts`.

## Out of Scope

- Filtering by color.
