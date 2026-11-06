/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#10113D",
    background: "#EDF6FF",
    backgroundElement: "#F5F5FF",
    backgroundSelected: "#E8E8FF",
    textSecondary: "#656782",
    card: "#FFFFFF",
    badge: "#5B35F5",
    badgeText: "#FFFFFF",
  },
  dark: {
    text: "#F2F4F5",
    background: "#171A1D",
    backgroundElement: "#282E33",
    backgroundSelected: "#3A4248",
    textSecondary: "#B4BDC4",
    card: "#202529",
    badge: "#347A59",
    badgeText: "#FFFFFF",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Radius = { s: 8, m: 12, l: 16 } as const;

// Colours the template used as loose hex codes.
export const Brand = { link: "#3c87f7", splash: Colors.light.background } as const;
