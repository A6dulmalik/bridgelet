# ADR-001: Mobile App Technical Scaffold

**Date:** 2026-08-26
**Status:** Accepted
**Issue:** #475

---

## Context

The `mobile/` directory exists in the repository but no formal decision record
existed for the chosen technology stack. Several mobile issues (#476–#487) were
being scoped against an unconfirmed scaffold, creating ambiguity.

Three approaches were evaluated:

| Approach | Pros | Cons |
|----------|------|------|
| **React Native + Expo** | TypeScript/React shared with `frontend/`; large Stellar ecosystem support; fastest iteration with Expo Go | JS bridge overhead on complex animations |
| Flutter | Excellent native performance; strong cross-platform UI | Dart — no code-sharing with `frontend/`; limited Stellar wallet deep-link ecosystem |
| Native (Swift/Kotlin) | Maximum platform performance | Two separate codebases; doubles maintenance burden |

## Decision

**React Native with Expo (SDK 52+)** using the **Expo Router** file-based
navigation (App Router model, same mental model as `frontend/`).

## Rationale

1. **Code-sharing with `frontend/`**: TypeScript, React hooks, Zod schemas, and
   utility functions in `frontend/lib/` can be shared directly or with minimal
   adaptation. The team already knows React.

2. **Stellar wallet ecosystem**: LOBSTR (the dominant mobile Stellar wallet)
   provides SEP-7 deep link support that works cleanly with `Linking` in React
   Native. Freighter's mobile support is also React Native-first.

3. **Expo managed workflow** removes native build toolchain complexity from
   developer machines. EAS Build handles iOS/Android CI artefacts without
   requiring macOS for Android builds.

4. **Expo Router** mirrors the Next.js App Router file convention used in
   `frontend/app/`, reducing context-switch cost for contributors working
   across both surfaces.

## Consequences

- All mobile code lives in `mobile/` and uses TypeScript + React Native.
- Shared logic (validation, API types) should be extracted to a future
  `packages/shared/` workspace package rather than copied.
- Native modules requiring bare workflow (e.g. custom camera processing)
  can be added via Expo Config Plugins without ejecting.
- Flutter or native rewrites would require a new ADR and significant
  migration effort.
