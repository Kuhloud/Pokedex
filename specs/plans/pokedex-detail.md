# Implementation Plan: Pokémon Detail Page

Issue: [Kuhloud/Pokedex#3](https://github.com/Kuhloud/Pokedex/issues/3)

## Scope and design baseline

Follow `specs/features/pokedex-detail.md` and the referenced list, Favorites, product, and simulator specifications. Use the user-provided detail screenshots as the visual baseline: a pale blue Pokémon header, overlapping sprite, favorite control, and About/Stats/Evolution tabs. The written specs take precedence where they require controls or information not shown in the screenshots. Use the existing theme, Rubik font, and no new dependencies.

The only detail screen source path named by the feature spec is `src/app/pokemon/[id].tsx`. The spec also names the simulator destination `src/app/pokemon/simulator/[id].tsx`; its behavior is separately specified and is not part of this implementation. Before opening or changing any other source file not named in the relevant specs, identify the exact file and reason and ask the user for permission. Do not modify list, database, shared API, navigation, or other implementation files without that permission.

The user approved inspecting `package.json` and `src/hooks/use-pokemon-list.ts`, then inspecting and modifying `src/services/pokemon-api.ts` to provide the required detail and evolution data. The existing simulator route had no default export; the user approved adding only a minimal placeholder at the spec-named destination so Catch navigation works. Simulator behavior remains out of scope.

## Status

Implemented and verified. The requested detail flow is complete; the simulator destination is intentionally only a placeholder.

## Implementation plan

1. After plan approval, inspect the specified detail screen and only the other source files explicitly identified by the applicable specs. Confirm how existing API, theme, font, favorites, and list-selection behavior can be reused without expanding file scope.
2. If the required behavior depends on an unspecified source file, pause and ask permission to inspect and, if necessary, modify that exact file before proceeding.
3. Implement the detail header with the selected Pokémon's name, Pokédex ID, type badges, selected-form regular/shiny sprite, back navigation, Favorite control, and Catch navigation. Keep form selection independent from shiny selection; offer only the regional forms specified by the list feature and show the shiny control only when that form has a shiny sprite.
4. Add About, Stats, and Evolution tabs, with About selected initially and a clear selected-tab indicator. Show all About fields and missing-value fallbacks; show the six stats with bars scaled against the fixed 0–255 range.
5. Load the complete evolution family independently from primary detail data. Render all branches, available Mega forms, card sprites/names/IDs, gender-differentiated sprite details where applicable, and an accent highlight for the selected Pokémon. Make other family cards navigable and render a single self-card for a Pokémon without other evolutionary forms.
6. Preserve the latest form and regular/shiny selections when navigating back to the list. Provide independent loading/error/retry states for detail data and evolution-family data, and a neutral sprite placeholder when needed.

## Suggestions and decisions to confirm during implementation

- The screenshots show a compact top header that scrolls away while the tab content remains visible. Preserve that feel on smaller screens while ensuring the tabs and content remain usable; avoid making the Pokémon artwork obscure controls.
- The screenshots show only a subset of the required controls. Keep the spec-required form/shiny selection, Favorite, and Catch actions discoverable without sacrificing the visual hierarchy.
- PokeAPI evolution-chain data may not represent every Mega form as a normal evolution species. Include Mega forms only when they are present in available API data, as the spec requests; if the API shape or an existing data helper cannot support this without out-of-spec files, pause and ask before expanding scope.

## Task checklist

- [x] Inspect the explicitly specified detail route and the applicable feature specs after plan approval.
- [x] Ask permission before inspecting or changing any source files not named in the specs.
- [x] Build the detail header and selected-form regular/shiny controls, preserving selections when returning to the list.
- [x] Implement Favorite persistence and Catch navigation using the specified existing behavior and destinations.
- [x] Add About, Stats, and Evolution tabs with all specified fields, visuals, navigation, and empty/fallback states.
- [x] Load and render the complete available evolution family independently, including branches and available Mega forms.
- [x] Add detail and evolution loading, retryable error, missing-value, and missing-sprite states.
- [x] Match the attached mobile design using the existing theme and Rubik font without adding dependencies.
- [x] Validate the required behavior and run lint and TypeScript checks.
