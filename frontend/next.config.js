/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Issue #472: Image and static asset optimization.
   *
   * - Enables WebP/AVIF format negotiation automatically (next/image default).
   * - Sets device sizes matching common mobile breakpoints used in remittance
   *   target markets (low-end Android devices dominate).
   * - Keeps a minimal cache TTL for frequently-updated assets while maximising
   *   CDN reuse for stable ones (1 year).
   */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 year for versioned assets
    // Allow images from the Bridgelet CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.bridgelet.org',
      },
    ],
  },

  /**
   * Issue #473: Bundle size budget enforcement.
   *
   * Webpack performance hints are set to 'error' in production so that
   * the Next.js build fails (non-zero exit) when a chunk exceeds budget.
   * This is the CI gate — the budget-check.ts script provides the per-route
   * report and PR comment.
   *
   * Budgets (gzip-compressed targets — these raw values are ~2.5× larger):
   *   /send, /claim/[token] — 200 kB max first-load JS (critical user paths)
   *   all other routes      — 300 kB max
   *   single assets         — 100 kB max
   */
  webpack(config, { isServer }) {
    if (!isServer) {
      config.performance = {
        hints: process.env.NODE_ENV === 'production' ? 'error' : 'warning',
        maxEntrypointSize: 300 * 1024,  // 300 kB
        maxAssetSize: 100 * 1024,       // 100 kB per asset
      };
    }
    return config;
  },
};

module.exports = nextConfig;
