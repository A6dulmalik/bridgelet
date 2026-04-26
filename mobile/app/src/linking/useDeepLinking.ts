import { useEffect } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

/**
 * Parses a deep link URL and returns the claim token if present.
 * Supports:
 *   bridgelet://claim/<token>
 *   https://bridgelet.app/claim/<token>
 */
function parseInviteLink(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    // expo-linking parses path segments into `path`
    const path = parsed.path ?? "";
    const match = path.match(/^claim\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function useDeepLinking() {
  const router = useRouter();

  const handleUrl = (url: string) => {
    const token = parseInviteLink(url);
    if (token) {
      router.push({ pathname: "/claim", params: { token } });
    } else {
      console.warn("[DeepLink] Unrecognised or invalid invite link:", url);
    }
  };

  useEffect(() => {
    // Handle cold-start link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Handle foreground links
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
