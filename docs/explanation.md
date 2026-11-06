# Explanation - Pokedex+

**Route:** <Pokédex>. **Tools:** <Copilot, ChatGPT>

## 1. Your technical choices

<Every choice under "Technical choices" in your `product.md`, one short
paragraph each. Where is it in the code (file and line)? Did it change while
you built? Say what and why.>

- **Stored in SQLite:** I chose SQLite over AsyncStorage because favorites are structured records and should remain saved after restarting the app. SQLite lets me store and query them in a table, and I am more familiar with SQL. In the implementation, SQLite stores favorite Pokémon IDs in `personal_list` (`src/services/pokemon-favorites-db.ts:3-27`); the Pokémon catalog and details are fetched from PokeAPI rather than stored in a local `pokemon` table as originally planned in `product.md`.
- **Native feature:** I chose the React Native `Share` API rather than adding a separate sharing package. From Favorites, a user can open the system share sheet to share a Pokémon's name and ID (`src/app/(tabs)/favorites.tsx:13,152-156,622`). This choice did not change while I built the feature.

## 2. Search by name

Your turn: explain how the data gets to the screen, where it is stored or cached, and what happens while loading or on error. Name the files.

## 3. Name a suggestion from the agent that you rejected or changed.

For showcasing gender differences in pokemon evolution, the agent just had the evolution in order, alongside two tiny artworks in one card with the gender symbol below. I saw it while testing the detail page of a pokemon and asked to change it: Each evolution is now sorted by "Unevolved", "First Evolution", and "Second Evolution". With gender-locked evolution having a gender symbol/text.
