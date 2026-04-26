import { useEffect } from "react";
import { track } from "../analytics/analytics";

export function useScreenTracking(screen: string) {
  useEffect(() => {
    track({ name: "screen_view", params: { screen } });
  }, [screen]);
}
