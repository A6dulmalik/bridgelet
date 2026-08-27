module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/send',
        'http://localhost:3000/claim/abc123',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // ── Category scores ──────────────────────────────────────────────────
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.80 }],

        // ── Issue #459 — Performance budgets ────────────────────────────────
        // Core Web Vitals thresholds (mobile)
        'first-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 300 * 1024 }],   // 300 KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100 * 1024 }], // 100 KB
        'resource-summary:total:size': ['error', { maxNumericValue: 1024 * 1024 }],    // 1 MB

        // Network requests
        'resource-summary:total:count': ['warn', { maxNumericValue: 50 }],

        // Image optimization
        'uses-optimized-images': 'warn',
        'uses-responsive-images': 'warn',
        'modern-image-formats': 'warn',

        // Code efficiency
        'unused-javascript': ['warn', { maxNumericValue: 50 * 1024 }],  // 50 KB unused JS
        'unused-css-rules': ['warn', { maxNumericValue: 20 * 1024 }],   // 20 KB unused CSS

        // Caching and delivery
        'uses-long-cache-ttl': 'warn',
        'dom-size': ['error', { maxNumericValue: 1500 }],

        // Third-party impact
        'third-party-summary': ['warn', { maxNumericValue: 100 * 1024 }], // 100 KB from 3P
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
