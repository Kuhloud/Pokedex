This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

# Pokedex+

The Pokedex+ is an upgraded version of the pokedex. It is an index containing all the pokemon from every generation, including shinies. Every pokémon has a detail page. For people who want to get the best out of their pokemon.

It runs on the PokeAPI (`https://pokeapi.co/api/v2/`)

## Commands

Use `npx`

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
- For every line of code, add a comment specifying what it does in a adhd/asd-friendly way, and also add that it was by copilot.

## Existing Project

- Inspect the existing project before making changes.
- Reuse existing components, hooks, utilities and architecture when needed.
- Do not recreate working functionality when it's not needed.
- Do not replace the existing application with a new project.
- Explain significant architectural changes before implementing them.

## API

- Use PokéAPI as the source of Pokémon data.
- Follow the official PokéAPI documentation.
- Understand the difference between `/pokemon/` and `/pokemon-species/`.
- Fetch additional Pokémon data only when needed.
- Handle API failures, missing data and unavailable sprites.
- Do not assume optional API fields are always populated.
- Avoid unnecessary API requests and duplicate data fetching.

## Database

- Use SQLite for persistent local data.
- Follow the database structure defined in the project specifications.
- Keep Pokémon API data separate from user-specific data such as Favorites.
- Use database migrations when changing an existing database structure.
- Do not store information locally if it can be derived reliably from existing data.

## Code Quality

- Reuse the code language from existing project.
- Prefer reusable components and hooks.
- Keep components focused on a single responsibility.
- Use meaningful, adhd/asd-friendly variable and function names, but don't make it too long.
- Add adhd/asd-friendly comments when they explain non-obvious logic or important decisions.
- Do not add comments that simply repeat what the code already says.
- Avoid unnecessary dependencies.
- When implementing a feature, explain the important parts of the implementation in plain language. Explain what the code does, how the components work together, and why important technical decisions were made. Do not explain every line unless asked.
