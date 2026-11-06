# Implementation Plan: Pokémon Catching Simulator

Issue: [Kuhloud/Pokedex#6](https://github.com/Kuhloud/Pokedex/issues/6)

## Scope and design baseline

Follow `specs/features/pokedex-simulator.md` and the PokeAPI endpoints in `specs/product.md`. Use the user-provided Pokémon detail screenshot as the visual baseline for the app's pale blue header, dark navy typography, Rubik font, spacing, and mobile layout. Keep the catching experience a little more distinct by giving the catch controls and throw result a clearly bounded, higher-contrast simulator area while reusing the existing theme colors. No new dependencies.

The feature spec names `src/app/pokemon/simulator/[id].tsx`, `src/constants/theme.ts`, and `assets/fonts/`. It also requires separation of UI, data, and logic at the product level, but does not name paths for simulator data/rules helpers or tests. Before inspecting or changing any source or test file outside the named paths, identify the exact path and reason and ask the user for permission. In particular, do not inspect or change the detail route, shared API/query code, app font setup, or other simulator helpers without permission. Do not edit the attached screenshot.

## Implementation plan

1. After plan approval, inspect the specified simulator screen and the applicable specs. Confirm route parameters and whether the selected form and regular/shiny sprite can be represented from the inputs already supplied.
2. Before inspecting any unspecified file, identify the exact file and why it is needed and request permission. If no accurate implementation is possible within the permitted files, pause rather than guessing or silently adding paths.
3. Load Pokémon species capture data and game appearances, and load Poké Ball entries from item categories 33 and 34. Keep Pokémon and ball loading, retryable errors, and success states independent. Preserve the selected form and shiny appearance.
4. Implement accurate supported main-series/remake rulesets. Group games only when all ball and condition behaviors match; list included game names in plain-language descriptions. Choose the ruleset with the newest applicable game by release order, offer only rulesets applicable to this Pokémon, and provide no estimated fallback for unsupported behavior.
5. Add the simulator controls: ball selection with unavailable balls visible and disabled, 0–100% remaining HP, all specified status choices, ruleset-specific time choices, and independent water/fishing toggles. Initialize each control as specified and recalculate the displayed chance when relevant settings change.
6. Show the actual per-throw catch chance without formulas. Disable throwing when no accurate ruleset or usable ball is available.
7. Simulate one throw from the displayed chance, show an animated caught/escaped result, and allow another throw or settings changes without resetting settings or saving caught Pokémon.
8. Match the app's theme, Rubik font, and screenshot baseline; visually distinguish the simulator controls/result area using existing theme colors and spacing. Add focused tests for ruleset grouping/default selection and catch-chance behavior only after obtaining permission for any test/helper paths not named in the spec.
9. Validate loading, error/retry, empty/unsupported, and successful states, then run the relevant tests, lint, and TypeScript checks for the approved scope.

## Confirmed decisions

- Use a contained, high-contrast “throw” area with a clear result animation to make the simulator feel distinct while preserving the screenshot's typography and overall palette. The user approved this direction; it changes presentation only, not the app-wide theme.
- Keep the requested controls unchanged. Balls that need unspecified encounter/player inputs stay visible but disabled with an explanation. Legends: Arceus and other unsupported game behaviors are omitted rather than approximated.
- Offer only the accurately modeled Generation III and IV rulesets; unsupported generations are not shown as if they were accurate.

## Task checklist

- [x] Confirm plan and visual direction before implementation.
- [x] Inspect the named simulator screen and specs; request permission before inspecting any unspecified file.
- [x] Confirm selected Pokémon/form/shiny inputs and use them for the simulator header and sprite.
- [x] Load species/game data and Poké Ball categories with independent loading, retryable error, and success states.
- [x] Implement applicable, accurately modeled rulesets, strict behavior-based grouping, newest-game default, and plain-language game descriptions.
- [x] Add ball, HP, status, time, water, and fishing controls with the specified initial values and availability behavior.
- [x] Calculate and display actual catch chance for the current Pokémon, ruleset, ball, and relevant conditions without showing formulas.
- [x] Implement animated caught/escaped results, retry behavior, and no persistence of caught Pokémon.
- [x] Apply the app theme, Rubik font, and detail screenshot baseline while visually distinguishing simulator controls/results.
- [x] Validate edge/error states and run approved tests, lint, and TypeScript checks.
