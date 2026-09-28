# app/\_layout.tsx

`app/_layout.tsx` | This is where the layout of the application is held. It allows for the changing of the theme, from light mode to dark mode, and vice versa.

What this file does
The file 02-ask-copilot.md is not app code; it is an exercise instruction file. It tells you:

what to ask Copilot about the generated app
which files to inspect
what to verify against the Expo docs
how to make a small manual change
what to commit at the end
In the context of an Expo app, the file app/\_layout.tsx is usually the app’s root layout. It sets up shared UI and routing behavior for the whole app.

What is a root layout?
A root layout is the top-level layout component for the app, usually in app/\_layout.tsx. In Expo Router, this file is special because:

it is rendered for the whole app
it can include shared structure like providers, navigation wrappers, or global styling
it defines the root of the router tree
child screens and tabs are mounted inside it
So, conceptually:

app/\_layout.tsx = “the app shell”
app/(tabs)/\_layout.tsx = “the tab section layout”
each screen file like index.tsx = “one page”
A good simple way to think of it:

The root layout is the outer container that all routes live inside, like the main frame of a house, while each screen is a room inside it.

# app/(tabs)/\_layout.tsx

`app/(tabs)/_layout.tsx`

# app/(tabs)/index.tsx

`app/(tabs)/index.tsx`

# components/

`components/`| Files in components/ are parts dependent on the files in app/ which use components to create the pages

Difference between app/ and components/
In this Expo Router app:

Files under app are route/screen files.
index.tsx is the home screen.
\_layout.tsx is a special layout file that wraps the app.
Files under components are reusable UI pieces.
Example: hint-row.tsx, themed-text.tsx, app-tabs.tsx
So in plain terms:

app/ = “pages/screens of the app”
components/ = “small building blocks used by those pages”
What this file does
The file \_layout.tsx is the root layout. It does a few app-wide setup tasks:

calls SplashScreen.preventAutoHideAsync() so the splash screen doesn’t disappear too early
reads the current system color scheme
wraps the app in ThemeProvider using the light/dark theme
renders the splash overlay and the tab UI
That means everything under the app gets the same theme and shared layout behavior.

A simplified interpretation is:

index.tsx defines what the home screen looks like
\_layout.tsx defines the shell around all screens
What is a root layout?
A root layout is the top-level layout that Expo Router uses for the whole app. It is usually a file named \_layout.tsx inside app.

Why it matters:

it runs once at the app level
it can provide global wrappers like theme, navigation, auth checks, splash screens, or shared UI
all child routes sit inside it
In this project, the root layout is the place for app-wide setup, while the individual route files handle screen content.

Think of it like the outer frame of a house: the layout sets the structure, and each screen is a room inside it.

# app.json

`app.json`This is to keep track of all the downloaded extensions and third-party plugins

What this file is for
app.json is the Expo project configuration file. It tells Expo and Expo Go how to identify and run your app, including things like:

the app name and slug
the app scheme for deep links
the default light/dark theme
splash screen setup
platform-specific metadata
Expo plugins used by the app
This file is not the app logic itself. The actual screens live in index.tsx and the shared app shell lives in \_layout.tsx.

Which settings matter when running in Expo Go
For Expo Go, the most important ones are:

Name and slug

used to identify the app in Expo Go
important for launch and project metadata
Scheme

this is the URL scheme used for deep linking, like opening the app from a link
important if the app is opened by custom URLs
UserInterfaceStyle

automatic, light, or dark
affects the default theme behavior
Plugins

this project includes expo-router and expo-splash-screen
those plugins change runtime behavior and app setup
for example, stylized splash screen and router support
Platform config

iOS and Android sections matter for app metadata and native behavior
but in Expo Go, you are not building a native binary locally, so some of these are less relevant than in a production build
Settings that matter less in Expo Go
These are still useful, but not the main things for a quick run:

Orientation

mostly affects app presentation
Web section

irrelevant for Expo Go on mobile
Experiments

mostly for tooling and compiler features
Icon and splash image paths

they are used by Expo when preparing the app, but they are not the main runtime controls
Important Expo Go rule
Expo Go only includes the native modules that Expo bundles by default. If your app adds a library with native code, Expo Go may not support it. In that case, you need a development build instead.

So in practice, for this project:

app.json mainly sets your app identity, theme, splash, and router setup
the main Expo Go-relevant settings are the app metadata, scheme, theme, and plugins
