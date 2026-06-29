import Constants from "expo-constants";

const IS_DEV = Constants.appOwnership === "expo" || __DEV__;

export type AnalyticsEvent =
  | { name: "screen_view"; params: { screen: string } }
  | { name: "auth_login" | "auth_logout" | "auth_signup"; params?: Record<string, string> }
  | { name: "button_press"; params: { button: string; screen?: string } }
  | { name: "claim_started" | "claim_completed" | "claim_failed"; params?: Record<string, string> }
  | { name: "send_started" | "send_completed" | "send_failed"; params?: Record<string, string> };

export function track(event: AnalyticsEvent): void {
  if (IS_DEV) {
    console.log("[Analytics]", event.name, "params" in event ? event.params : "");
    return;
  }
  // Plug in your analytics provider here (e.g. Segment, Amplitude, PostHog)
}
