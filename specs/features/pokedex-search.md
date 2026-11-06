# Search pokémon by name

## Goal

Find a pokémon by typing its name, so I can look up a specific pokémon.

## Constraints

- Lives on the home screen, `src/app/index.tsx`. No new screen.
- Uses the index, and filters defined in specs/features/pokémon_index.md.
- Typing 2 letters filters the index.
- Colors and spacing from `src/constants/theme.ts`.
- No new dependencies.

## Acceptance Criteria

- [ ] A searchbar at the top, placeholder "Search pokémon".
- [ ] Results show the index filtered by name.
- [ ] Search should be case-insensitive
- [ ] If no Pokémon match the search, show an empty list.
- [ ] Searching should work with existing sorting and filers, defined in specs/features/normal_index.md.
- [ ] Loading and error state on list, detail and evolution chain.
- [ ] The font from the design with Expo Font (`assets/fonts`)

## Out of Scope

- Search by Id
- Suggestions/Autocomplete
