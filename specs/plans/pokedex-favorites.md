# Implementation Plan: Pokémon Favorites

Issue: [Kuhloud/Pokedex#4](https://github.com/Kuhloud/Pokedex/issues/4)

## Scope and design baseline

Follow `specs/features/pokedex-favorites.md` and its referenced behavior in `specs/features/pokedex-list.md`, `specs/features/pokedex-search.md`, `specs/features/pokedex-detail.md`, and `specs/product.md`. Per the user's clarification, make the Favorites tab look like the main Pokémon tab, changing the heading to “My Favorites” while keeping the main tab's visual treatment and control layout. Use the supplied Favorites screenshot as an additional reference for the two-column cards, number badges, centered sprites, name footers, three-dot menus, and bottom tabs. Per the user's confirmation and the product spec, show a separate Favorites card for every saved Pokémon resource ID, including regional, Mega, and Gigantamax variants. The written specs take precedence for required behavior. Reuse the existing theme and Rubik font; add no dependencies.

The Favorites feature spec names `src/app/(tabs)/favorites.tsx` as its screen and references `src/app/pokemon/[id].tsx` for Pokémon detail behavior. The product spec defines the SQLite `personal_list` table. Before inspecting or changing source files not named in the applicable specs, ask the user for permission for each exact file and explain why it is needed. Likely supporting files requiring separate permission are `src/app/(tabs)/_layout.tsx` for tab registration and `src/services/pokemon-favorites-db.ts` for SQLite operations; any additional files needed for existing filtering, query, or navigation behavior will be identified and permission requested before inspection or modification. Do not start implementation until the user approves this plan.

## Implementation plan

1. After approval, inspect the Favorites screen and the explicitly specified feature/product documents. Confirm the current screen structure and the required behavior without broadening the source-file scope.
2. Before inspecting or editing any non-specified source file, ask permission for the exact path and reason. In particular, request permission to inspect/update the tab layout and SQLite service if the required tab and persistence behavior cannot be implemented within the paths already specified.
3. Implement a two-column list of saved Pokémon resource IDs only, including separately saved regional, Mega, and Gigantamax variants. Each card shows its Pokédex number, sprite, name, and three-dot menu; tapping the card opens its base species detail page with that variant selected. Use the specified regional-form selection and regular/shiny behavior, passing the selected form and shiny setting to details.
4. Add sorting by Pokédex ID or name in both directions, initially Pokédex ID descending. Add generation, rarity, type, and name filters with the shared list rules: OR within a filter, AND across active filters, and case-insensitive name matching with a two-letter minimum. Keep controls available when saved Pokémon have no matches.
5. Persist each favorite once in the `personal_list` SQLite table, using the selected Pokémon resource ID so a base species and its variants can be favorited independently. Keep sorting and filters when opening details and returning; keep search text according to the search feature spec. Keep the list current when a favorite is added or removed from the detail screen.
6. Add the card menu actions “Open Pokémon”, “Remove from favorites”, and “Share”. Removing takes effect immediately and offers a temporary Undo action; Share opens the native share sheet with the Pokémon name and Pokédex number.
7. Provide “No favorites yet” without a button only when the user has no saved Pokémon. Show no cards, message, or button when saved Pokémon are excluded by active filters/search. Add loading and retryable error states for loading Favorites.
8. Match the main Pokémon tab's visual treatment and control layout, changing the heading to “My Favorites”; use the existing theme and Rubik font, and add no dependencies.
9. Validate persistence across restart, uniqueness, filtering/sorting, card/menu/detail actions, state restoration, empty/loading/error states, and run the project's lint and TypeScript checks.

## Suggestions to confirm during implementation

- Keep the controls in the same positions and visual style as the Pokémon tab, applying them only to the user's saved Pokémon. This follows the user's requested visual consistency while retaining the Favorites-specific filtering rules.
- The screenshot shows four sample Pokémon but the spec requires only saved Pokémon. Use actual persisted favorites rather than fixed sample content.

## Status

Implementation is complete. `npx expo lint`, `npx tsc --noEmit`, and `git diff --check` pass. A live visual/runtime smoke test was unavailable because the provided local Expo pages were disconnected.

## Task checklist

- [x] Inspect the Favorites route and the applicable feature/product specs after plan approval.
- [x] Ask permission before inspecting or changing any supporting source files not named in the applicable specs.
- [x] Implement the two-column Favorites list and card layout using only saved Pokémon.
- [x] Show each saved Pokémon resource ID, including separately saved regional, Mega, and Gigantamax variants, as its own card.
- [x] Add sort order, generation/rarity/type/name filters, and the specified regional-form and shiny controls.
- [x] Persist unique favorites in SQLite and keep the list synchronized with detail-page favorite changes.
- [x] Implement card navigation and the Open, Remove/Undo, and native Share actions.
- [x] Preserve filters, sorting, and search state when navigating to and returning from details.
- [x] Implement the distinct empty-list and no-filtered-results behavior, plus loading and retryable error states.
- [x] Match the main Pokémon tab's appearance and control layout, with the “My Favorites” heading, using the existing theme and Rubik font without adding dependencies.
- [x] Run lint and TypeScript checks; runtime verification remains unavailable while the local Expo pages are disconnected.
