import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F172A" },
        }}
      >
        <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen
          name="claim/index"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="security/index"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
