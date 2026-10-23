import { AnimatedSplashOverlay } from "@/components/animated-icon.web";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="item/[id]"
            options={{
              title: "Item Details",
              headerBackButtonDisplayMode: "minimal",
            }}
          />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
