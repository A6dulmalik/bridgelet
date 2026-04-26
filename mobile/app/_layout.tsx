import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./src/providers/ThemeProvider";
import { useDeepLinking } from "./src/linking/useDeepLinking";

function AppNavigator() {
  const { colors, isDark } = useTheme();
  useDeepLinking();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
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
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
