# Search Pokémon by name

## Context

- The Pokémon index is on the Pokémon tab at `src/app/(tabs)/index.tsx`.
- The index, sorting, filters, cards, and regional forms are specified in `specs/features/pokedex-list.md`.
- The Pokémon detail screen is at `src/app/pokémon/[id].tsx`.
- Use the existing theme in `src/constants/theme.ts`, the Rubik font files in `assets/fonts` loaded with Expo Font, and no new dependencies.

## Goals

Find a Pokémon in the index by typing its name, while keeping the existing list controls and navigation.

## Requirements

### Search

- Show a search field above the Pokémon index with the placeholder “Search Pokémon”.
- Match text anywhere in a name without distinguishing uppercase and lowercase letters.
- Ignore spaces at the beginning and end of the search text.
- Start filtering when the user has typed at least two characters. With fewer than two characters, keep showing the current list without applying the name search.
- Search the complete Pokémon index, including entries not yet loaded on screen.
- Match both the regular species name and available regional form names. A regional form match shows that Pokémon’s existing species card, not a separate card.
- Apply search together with the existing sorting and filters specified in `specs/features/pokedex-list.md`. Keep the selected sorting and filters in effect while searching.
- If no Pokémon match a search of at least two characters, show an empty list.
- The user clears the search by deleting its text with the keyboard. When fewer than two characters remain, show the current list without applying the name search.
- Keep the search text and filtered results when the user opens a Pokémon’s detail page and returns to the index.

### Existing behavior

- Keep the list loading and error/retry behavior specified in `specs/features/pokedex-list.md`.
- Keep the detail and evolution-chain loading and error behavior specified in `specs/features/pokedex-detail.md`.

## Out of scope

- Searching by Pokédex ID.
- Suggestions, autocomplete, or search history.
- Adding dependencies.
