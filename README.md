<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b368f12a-aa73-4131-903c-e61a9ea58118

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` if overriding defaults locally (zero external secrets are required for feature development; `GEMINI_API_KEY` is optional and falls back cleanly when unset).
3. Run the app in development mode (`DB_AUTHORITY="local_hardened"`):
   `npm run dev`

## Environment Variables & Deferred Infrastructure Policy

YUME Network separates local platform development from external staging/production infrastructure. Production database URLs, WireGuard/cluster identities, hardware OOB STONITH endpoints, and measured ISP metrics are **intentionally deferred** during feature development.

- **Environment Template:** [`.env.example`](.env.example)
- **Centralized Registry:** [`docs/ENVIRONMENT_VARIABLES_REGISTRY.md`](docs/ENVIRONMENT_VARIABLES_REGISTRY.md) (classifies every variable as `DEVELOPMENT_REQUIRED`, `STAGING_REQUIRED`, `PRODUCTION_REQUIRED`, or `OPTIONAL_INTEGRATION` and documents fail-closed security invariants)

