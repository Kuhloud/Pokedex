import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function StackLayout() {
  return (
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
  );
}
