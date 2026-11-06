# Implementation Plan: Pokémon Search

Issue: [Kuhloud/Pokedex#2](https://github.com/Kuhloud/Pokedex/issues/2)

## Status

Implemented and verified.

## Scope and design baseline

Follow `specs/features/pokedex-search.md` and the existing list behavior in `specs/features/pokedex-list.md`. Use the user-provided Search screenshot as the visual baseline: a prominent rounded search field above the two-column Pokémon cards, with the mobile keyboard shown while typing. The written specs take precedence for placeholder text and behavior. Reuse the existing theme and Rubik font; add no dependencies.

The initially approved implementation scope is limited to source files explicitly identified by the feature specs. If implementation requires inspecting or changing any additional source files, stop and ask the user for permission, naming the exact files and why they are needed.

## Implementation plan

1. Inspect the specified Pokémon index screen and the existing list data/filter flow to identify the narrowest implementation point.
2. Add the search field above the index, styled with existing theme/font conventions and aligned with the supplied mobile design.
3. Filter the complete species index by trimmed, case-insensitive substring matches after two or more characters. Match regular species and available regional form names while keeping one existing species card per match.
4. Combine search with the existing sorting and filters without changing their selected state or semantics. For fewer than two characters, show the current list without applying name search; show no cards when a qualifying search has no matches.
5. Preserve the search query and results when navigating to a detail screen and returning. Keep existing list loading and error/retry behavior.
6. Validate the specified behavior and run the relevant lint and TypeScript checks. Report any needed out-of-spec file access before touching it.

## Task checklist

- [x] Inspect the specified index screen and existing list filtering/data flow.
- [x] Add and style the search field using the existing theme and Rubik font.
- [x] Implement trimmed, case-insensitive substring search with a two-character minimum across the complete index and regional form names.
- [x] Keep sorting and filters active with search; preserve the one-card-per-species behavior and show an empty result when there are no matches.
- [x] Keep the search text/results when returning from a Pokémon detail screen; preserve list loading and retry behavior.
- [x] Validate search behavior and run lint and TypeScript checks.
- [x] Ask permission before inspecting or changing any additional source files not named in the specs.
