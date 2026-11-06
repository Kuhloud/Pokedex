# Pokedex+

The Pokedex+ is an upgraded version of the pokedex. It is an index containing all the pokemon from every generation, including shinies. Every pokémon has a detail page. For people who want to get the best out of their pokemon.

## Core action

Pick a pokémon and see it's information

## Features

<One line per feature, linking to its file in `specs/features/`. 3 to 6, not
more. Each one becomes a GitHub issue.>

1. [Normal list](./features/pokédex-index.md) Browse an index of normal pokémon
2. [Search by name](./features/pokédex-search.md) Search pokémon by name
3. [Pokémon detail](./features/pokédex-detail.md) See general info, stats, and evolution of a pokémon
4. [Favorites list](./features/pokédex-favorites.md) Browse an index of shiny pokémon
5. [Pokémon Comparison] (./features/pokédex-compare.md) Put two Pokémon side by side and sees who is stronger on which stat.
6. [Catching-simulator] (./features/pokédex-simulator.md) Simulate catching a pokémon (in multiple conditions) with a list of usable pokéballs.

## Data

- **API**: PokeApi, no login, no key
- **Endpoints**:
  /pokemon?limit=2000 — Fetch the complete Pokémon index.
  /pokemon/{id or name} — Fetch Pokémon information, including stats, types and sprites.
  /pokemon-species/{id} — Fetch species information and evolution-chain URL.
  /item-category/33/ — Fetch special balls
  /item-category/34/ — Fetch standard balls
- **Stored on the phone**:
  Table pokemon in SQLite: id (PokéAPI Pokémon resource ID), species_id (PokéAPI species ID), name, height, weight, base_experience, types_json, abilities_json, stats_json, sprites_json, forms_json, generation, capture_rate, updated_at. Each base Pokémon and each listed regional, Mega, or Gigantamax variant is a separate row with its own Pokémon resource ID. `forms_json` stores related form metadata, including Pokémon resource IDs and available regular/shiny sprite references.
  Table personal_list: personal_list_id, pokemon_id (PokéAPI Pokémon resource ID), created_at. Each variant can be favorited independently.

## Technical choices

<Fill in the two below: every app makes these choices. For each one: what
you picked, what else you could have done, and why. Write it before you
build. If you change your mind later, change it here too.>

- **Stored in SQLite**: It allows for local, persistent storage and structured queries, which is similar to SQL and I am more familiar with. I don't have enough knowledge about AsyncStorage.
- **Native feature**: Share on your favorites tab. Share your favorite pokémon with your friends.

## Technical core

<Tick these off as you build. They are required for a pass.>

- [x] Runs in Expo Go
- [x] Live data through TanStack Query
- [x] At least 2 screens with Expo Router
- [x] Something in SQLite that survives a restart
- [x] Loading and error state on every load
- [x] One native feature: Share favorites, in the favorites tab
- [x] TypeScript and ESLint without errors
- [x] UI, data and logic in separate files

## Optional

<Tick the ones you built, +0.5 each. Delete the rest or leave them unticked.>

- [ ] Three different Reanimated animations, each with a purpose
- [x] Dark mode: every screen looks right, all colours from the theme
- [x] Pagination: page by page while you scroll, not all at once
- [ ] Clean TypeScript: no `any`, no `as` casts, no `@ts-ignore`
- [ ] Design (not Pokédex): a consistent own style with your own font
- [ ] Localization: two languages
- [ ] No warnings: no `console.log`, none in the terminal or on screen
- [ ] Tests: one per feature on the logic, `npm test` passes
- [ ] CI: lint and tsc on every push
- [ ] Accessibility: button labels, largest text size
- [ ] Optimistic update

## Out of scope

accounts
web version
