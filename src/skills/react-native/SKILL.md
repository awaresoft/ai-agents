---
name: react-native
description: "Use when writing or reviewing React Native or Expo code - navigation, native modules, lists and animation performance, offline behavior, OTA updates, or store release concerns."
---

# React Native

The `react` skill applies in full — this file is mobile deltas only.

## House Rules

- **Target the New Architecture** (Fabric, TurboModules, JSI). It is the default on current RN; "avoid bridge traffic" framing and old-architecture workarounds are obsolete advice — don't cargo-cult them into new code.
- **Long lists use FlashList, not FlatList**, with `estimatedItemSize` set. FlatList is acceptable only for short, static lists where recycling doesn't pay off.
- **Animations and gestures run on the UI thread:** Reanimated worklets + Gesture Handler. The classic `Animated` API is fine for a one-off fade; anything interactive or gesture-driven on the JS thread will jank.
- **Navigation in Expo apps is expo-router** (file-based). Don't hand-wire React Navigation stacks in an Expo project that already has a `app/` route tree.
- **EAS Update (OTA) ships JS only.** Adding or upgrading a native module, changing `app.json`/plugins, or touching native config requires a new binary build and store submission — an OTA push will not carry it, it will crash against the old native runtime.
- **Performance isn't done until it's smooth on a low-end Android device.** Simulator-on-M-series proves nothing; test release builds on real budget hardware.
- **Safe areas come from `react-native-safe-area-context`** (`SafeAreaView`/`useSafeAreaInsets`). Never hardcoded padding for notches and home indicators — device geometry varies too much.
- **iOS and Android differences are requirements, not edge cases:** back gesture/button, keyboard avoidance, permission flows, and shadow/elevation all diverge — verify both.
