# Pokémon Catching Simulator

## Context

- The simulator screen is `src/app/pokemon/simulator/[id].tsx`; it opens from the selected Pokémon's detail page.
- Pokémon species data, including its base capture rate, comes from PokeAPI `/pokemon-species/{id}`. Game appearances come from `/pokemon/{id}`; item-category endpoints are listed in `specs/product.md`.
- The simulator uses Poké Balls from item categories 33 and 34.
- Use the existing theme in `src/constants/theme.ts`, the Rubik font files in `assets/fonts`, and no new dependencies.

## Goals

- Show how a selected Poké Ball and catch conditions affect a Pokémon's chance of being caught under an applicable game's rules.
- Let the user try repeated simulated throws without saving caught Pokémon.

## Requirements

### Pokémon and game rules

- Open the simulator for the Pokémon selected on the detail page.
- Show the Pokémon's name, Pokédex ID, and the same form and regular or shiny sprite selected on the detail page.
- Use the selected Pokémon's PokeAPI `/pokemon/{id}` `game_indices` to determine its appearances. Consider main-series games and remakes only; exclude side games.
- Group games only when their catch behavior is identical, including all Poké Ball effects and condition effects. Offer only rulesets that apply to the selected Pokémon, and list the applicable game titles in the ruleset's concise, plain-language explanation.
- Do not offer a ruleset unless its catch behavior can be calculated accurately. Do not show mathematical formulas or use an estimate instead.
- Select the ruleset containing the newest applicable game by release order. Let the user choose another available ruleset; changing it recalculates the catch chance.
- If no accurate ruleset applies to the selected Pokémon, explain that no game-accurate ruleset is available and disable “Throw Ball”.

### Poké Balls and catch conditions

- Load all Poké Balls in item categories 33 and 34. For each ball, show its name, PokeAPI ID, and description. Keep balls unavailable in the selected ruleset visible but disabled with an explanation. Start with a standard Poké Ball selected when it is available.
- Let the user change the Pokémon's remaining HP using a 0–100% slider that starts at 100%.
- Let the user choose “No status”, Sleep, Freeze, Paralysis, Burn, or Poison. Start with “No status” selected.
- Provide controls for time of day and separate on/off settings for whether the encounter is in water and whether the Pokémon is being fished. Offer time choices used by the selected ruleset. Start with Day selected when available, otherwise the first time choice; start with water and fishing both off.
- Apply only conditions relevant to the selected ball and ruleset.
- Calculate and show the actual per-throw catch chance as a percentage using the species' base capture rate and the selected ruleset's game behavior for the current Pokémon, ball, and conditions. Do not display mathematical formulas.

### Throw results

- The “Throw Ball” action simulates one throw using the displayed catch chance.
- Show an animation and a clear caught or escaped result.
- After either result, let the user throw again or change the settings. Keep the current settings until the user changes them.
- Do not save or otherwise add caught Pokémon to the user's data.

### Loading, errors, and visual design

- Show loading and retryable error states for Pokémon data and Poké Ball data independently.
- Use the app's Rubik font, loaded with Expo Font from `assets/fonts`.
- Use the app's theme colors and spacing from `src/constants/theme.ts`.

## Acceptance Criteria

- [ ] Opening the simulator shows the selected Pokémon's name, ID, form, and selected regular or shiny sprite.
- [ ] Only applicable main-series games and remakes in the selected Pokémon's PokeAPI `game_indices` contribute rulesets. Games share a named ruleset only when their full catch behavior, including every ball and condition effect, is identical. The ruleset explanation names its applicable games and describes the effect in plain language without a formula.
- [ ] The ruleset containing the newest applicable game is selected by default; the user can choose another applicable ruleset and the catch chance updates to that game's behavior. If no accurate ruleset applies, the screen explains this and disables “Throw Ball”.
- [ ] The simulator lists the Poké Balls from both specified item categories with each ball's name, ID, and description. Balls unavailable in the selected ruleset remain visible but disabled with an explanation. A standard Poké Ball is selected by default when available.
- [ ] The user can set remaining HP with a 0–100% slider, select any specified status condition, and set time of day and separate water and fishing controls. Initial values are 100% HP, “No status”, both water and fishing off, and Day or the first available time choice. Time choices match the selected ruleset.
- [ ] The displayed percentage is the actual chance of catching the selected Pokémon with one throw under the selected ruleset, ball, and relevant conditions; no formula or estimate is shown.
- [ ] Each throw shows an animated caught or escaped result; the user can retry or change settings, and caught Pokémon are not saved.
- [ ] Pokémon and Poké Ball data each show loading, retryable error, and successful states; the screen uses the Rubik font and theme.

## Out of Scope

- Saving caught Pokémon.
- Simulating Pokémon battles.
- Side games and estimated catch results.
