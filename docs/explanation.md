# Explanation template

Copy this into your own repo as `docs/explanation.md`.

One line on top: your route and the agent tools you used. Then three questions,
short answers, your own words. Every file and line you name must exist in your
repo.

---

# Explanation - Pokedex+

**Route:** <Pokédex>. **Tools:** <Copilot,
Cursor, Claude Code, ...>

## 1. Your technical choices

<Every choice under "Technical choices" in your `product.md`, one short
paragraph each. Where is it in the code (file and line)? Did it change while
you built? Say what and why.>

_Example: "My places live in SQLite (`src/services/places-db.ts:12`), not
AsyncStorage, because I sort them by date added and check for duplicates. The
agent proposed AsyncStorage; I said no."_

## 2. Pick one feature and explain how it works, from API call to screen.

<Which feature. Where the data comes in, where it is stored or cached, how it
reaches the screen, what happens while loading or on error. Name the files.>

_Example: "Week forecast. `useForecast` (`src/hooks/use-forecast.ts`) calls
`getForecast` in `src/services/open-meteo.ts` with the latitude and longitude
of the city. TanStack caches it per city, so going back and forth does not
reload. `ForecastScreen` shows a spinner while it loads, and an error with a
Retry button if the call fails."_

## 3. Name a suggestion from the agent that you rejected or changed.

<What did the agent suggest? What did you do instead, and why? How did you
notice (reading the diff, testing, your spec)? Point at the chat in
`chat-history/` or the commit.>

_Example: "For the week forecast, the agent wanted one request per day. I saw
it in the plan on issue 2 and said no: the forecast endpoint gives all seven
days in one call (`src/services/open-meteo.ts:20`). One request instead of
seven. Chat: issue 2 in `chat-history/`."_
