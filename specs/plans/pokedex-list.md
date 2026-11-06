# Implementation Plan: Pokédex List

Issue: [Kuhloud/Pokedex#1](https://github.com/Kuhloud/Pokedex/issues/1)

## Approved scope

The implementation follows `specs/features/pokedex-list.md`, related name-search behavior in `specs/features/pokedex-search.md`, and the form/shiny handoff in `specs/features/pokedex-detail.md`. The user-provided mobile screenshot is the visual baseline; written specs take precedence where copy or behavior differs.

The user approved adding Pokémon API/query/Favorites SQLite support files, replacing the obsolete Bag tab with the Favorites feature specified in `specs/features/pokedex-favorites.md`, and removing the unreferenced Bag and generic item-app files. The user also approved correcting the existing theme hook for React Native 0.88 compatibility.

The user requested plain-ASCII route paths. Detail and simulator routes therefore use `src/app/pokemon/` while displaying the correctly accented “Pokémon” name in the UI.

## Task checklist

- [x] Inspect existing screen behavior and request permission before touching source files outside the initial spec scope.
- [x] Implement the responsive two-column Pokémon list with numeric Pokédex ID ascending by default, incremental card loading, loading feedback, and retryable errors.
- [x] Add full-index, case-insensitive name search with two-character minimum, trimming, regional-form aliases, and preserved state when returning from details.
- [x] Add ID/name sorting in both directions and multi-select generation, rarity, and type filters with OR-within/AND-across behavior.
- [x] Match the supplied design baseline with the existing theme and Rubik font; show species number, sprite, name, three-dot actions, and regional-form controls without separate cards for forms.
- [x] Add open, add-to-Favorites, and native share actions; persist Favorites in SQLite.
- [x] Add independent regional-form and shiny selection and preserve both choices between list and detail.
- [x] Replace the old Bag inventory tab with the Favorites tab and implement its specified list, filters, empty/loading/error states, remove/undo, share, and persistent storage.
- [x] Remove obsolete Bag and unused item-app modules and update route references to plain-ASCII paths.
- [x] Verify search, regional-form matching and selection, detail navigation/state handoff, Favorites add/list behavior, route bundling, lint, and TypeScript.
