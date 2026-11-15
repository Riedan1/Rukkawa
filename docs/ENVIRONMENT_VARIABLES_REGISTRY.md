# YUME Network — Centralized Environment Variables Registry

**Policy Status:** Active (Phase 3.1 Development Deferral Policy)  
**Authoritative Target Architecture:** PostgreSQL 16 (`yume_core_db`) + Sovereign Regional PII Vault (`yume_pii_vault_<zone>`) + Patroni/`etcd` + OOB STONITH  
**Current Development Runtime Mode:** `DB_AUTHORITY="local_hardened"` (`server/localDb.ts` JSON fallback — **explicitly non-production**)

---

## 1. Environment Variables Deferral Policy Rules

1. **No Production Secrets During Feature Development:** Real production credentials, database URLs, WireGuard/server IDs, region endpoints, BMC/IPMI/smart-PDU addresses, and external service secrets are deferred until staging/production infrastructure provisioning.
2. **No Invented Values or Silent Fake Telemetry:** Placeholder defaults (`node-alg-01`, `https://cdn.yume.dz`, `100` Mbps) must never be treated as verified production identities, live cloud endpoints, or empirically measured network throughput.
3. **Preserve PostgreSQL 16 as Authoritative Production Target:** `local-db.json` (`DB_AUTHORITY="local_hardened"`) is strictly a single-node development/sandbox adapter and is never a substitute for PostgreSQL 16 in staging or production.
4. **Preserve Fail-Closed Security Invariants:**
   - Never bypass server-side admin RBAC (`authorizeAdminRequest`) or Step-Up MFA.
   - Never disable `YUME_REQUIRE_POSITIVE_STONITH` (`"true"` mandatory).
   - Never authorize automated production failover without verified OOB STONITH `Power=OFF` attestation.
   - Never enable `YUME_ALLOW_CROSS_BORDER_PII_REPLICATION` without formal Algeria Law No. 18-07 (ANPDP) legal approval.
   - Never allow missing production environment variables to silently fall back to insecure defaults once `NODE_ENV=production` / `DB_AUTHORITY=postgres16` enforcement is wired.

---

## 2. Classification Tiers

| Tier | Meaning | When Required |
| :--- | :--- | :--- |
| **`DEVELOPMENT_REQUIRED`** | Governs local/container development mode, build tooling, and fail-closed safety flags. Must work safely out of the box with zero external secrets. | Local development & AI Studio preview |
| **`STAGING_REQUIRED`** | Needed once external PostgreSQL 16, R2/CDN, KMS secrets, and multi-node staging harnesses are provisioned (`AT-P0-*`, `AT-IDEM-*`, `AT-P1-*`). | Staging environment bring-up |
| **`PRODUCTION_REQUIRED`** | Dedicated production credentials, sovereign hardware/OOB STONITH, and empirically measured ISP capacity (`AT-FAIL-*`, evening `iperf3`). | Production launch readiness |
| **`OPTIONAL_INTEGRATION`** | External AI, courier, and image-processing APIs that degrade gracefully to local/sandbox fallbacks when omitted. | Only when testing live 3P APIs |

---

## 3. Master Registry (All Codebase & Architecture Variables)

### 3.1 `DEVELOPMENT_REQUIRED`

| Variable | Purpose | Current Code Location | Default / Behavior When Unset | Deployment & Security Dependency |
| :--- | :--- | :--- | :--- | :--- |
| `DB_AUTHORITY` | Selects storage engine posture: `"local_hardened"` (dev/sandbox) vs `"postgres16"` (staging/prod). | `server/localDb.ts:664`, `server/db/transactionalRepository.ts:26`, `server.ts:1360` | Unset defaults runtime telemetry to `local_json_fsync_transactional`. `.env.example` sets `"local_hardened"`. | **Audit Finding:** `getPostgresPool()` is not yet wired to repository queries; before production go-live, missing `DB_AUTHORITY="postgres16"` in production must fail startup rather than silently using `local-db.json`. |
| `NODE_ENV` | Switches Express between Vite dev middleware (`!== "production"`) and static `dist/` bundle (`"production"`), plus client SW registration. | `server.ts:1680`, `src/main.tsx:7` | Unset runs Vite dev middleware on port `3000`. | Set to `"production"` only when running built `dist/server.cjs` bundle (`npm start`). |
| `DISABLE_HMR` | Disables Vite HMR and chokidar file watching when `"true"` (required inside AI Studio preview). | `vite.config.ts:22,24` | Unset leaves Vite HMR/watching enabled for standard local dev. | Injected automatically by AI Studio container runtime. |
| `YUME_DATA_DIR` | Overrides directory where `local-db.json` and backups/temp files are stored. | `server/localDb.ts:5-6`, `server/db/migrateLegacyJson.ts:63-64`, `scripts/verifyPhase31Local.ts:8` | Defaults to `<cwd>/data`. | Used in automated verification (`scripts/verifyPhase31Local.ts`) for isolated temporary data directories. |
| `YUME_REQUIRE_POSITIVE_STONITH` | Enforces fail-closed blocking of `unplanned_failover` unless positive OOB `Power=OFF` readback is confirmed. | `server/db/transactionalRepository.ts:380`, `.env.example:38` | Defaults fail-closed (`!== "false"` evaluates to `true`). | **CRITICAL SECURITY RULE:** Must **always** remain `"true"` in dev, staging, and production. Setting `"false"` weakens split-brain protection and is forbidden. |
| `YUME_ALLOW_CROSS_BORDER_PII_REPLICATION` | Controls whether sovereign regional PII (`yume_pii_vault_dz`) may leave domestic infrastructure. | `.env.example:39`, `schema.sql:16,22` | Placeholder `"false"` in `.env.example` and `FALSE` in SQL schema. | **CRITICAL COMPLIANCE RULE:** Must remain `"false"` unless formal Algeria Law No. 18-07 (ANPDP Articles 44–45) approval is obtained. |

---

### 3.2 `STAGING_REQUIRED` (Deferred During Platform Development)

| Variable | Purpose | Current Code Location | Default / Behavior When Unset | Staging / Security Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL 16 connection URI for authoritative core DB (`yume_core_db` via PgBouncer/WireGuard). | `server/db/transactionalRepository.ts:26,29`, `.env.example:26` | Unset (`""`). `getPostgresPool()` returns `null`. | Required when `DB_AUTHORITY="postgres16"`. Missing URI in `postgres16` mode must fail startup closed. |
| `PII_VAULT_DATABASE_URL` | Connection URI for physically isolated sovereign regional PII database (`yume_pii_vault_<zone>`, port `5433`). | `.env.example:29` | Unset (`""`). Dev checkout uses local `piiSpool` stub in `local-db.json`. | Required in staging/prod so core Patroni physical WAL never replicates Algerian PII cross-border. |
| `YUME_BACKUP_KMS_KEY` | Master key (`>= 32` chars) for AES-256-GCM DR exports and signed media keys. | `server/securityGovernance.ts:40` | Dev generates/reads local `data/.security/.yume-kms-master.key` (`0600`). | **Unsafe Production Default Warning:** Local file key on container disk is dev-only; staging/prod must inject external KMS/secret manager key and share identical fingerprint across nodes. |
| `YUME_ADMIN_SESSION_SECRET` | HMAC-SHA256 secret (`>= 32` chars) for admin session cookies and SHA-256 audit ledger checkpoints. | `server/securityGovernance.ts:47` | Dev generates/reads local `data/.security/.yume-session-hmac.key` (`0600`). | **Unsafe Production Default Warning:** Multi-node staging/prod requires shared secret from vault/env; otherwise sessions and audit checkpoints fail validation across nodes. |
| `YUME_PII_NAMESPACE_DZ` | UUIDv5 namespace UUID used for deterministic `recipient_pii_token` derivation (`yume_pii_vault_dz`). | `implementation_plan.md:192` | Architecture spec only (dev uses SHA-256 UUID derivation in `transactionalRepository.ts:613`). | Required when deploying `PiiVaultService` in staging/prod. |
| `YUME_R2_BUCKET_URL` | Cloudflare R2 S3-compatible bucket endpoint for presigned direct-to-edge uploads. | `server.ts:865`, `.env.example:43` | Unset (`""`) in `.env.example`; `server.ts:865` falls back to placeholder `"https://r2-upload.yume.dz"`. | Staging/prod must reject placeholder fallback and require configured R2 bucket URL + live presign credentials. |
| `YUME_CDN_BASE_URL` | Cloudflare CDN edge transform origin base URL for thumbnails and HLS/DASH manifests. | `server.ts:867-870,930-935`, `.env.example:45` | Unset (`""`) in `.env.example`; `server.ts` falls back to placeholder `"https://cdn.yume.dz"`. | Staging/prod must point to configured edge domain. |
| `YUME_R2_DR_VAULT_URL` | Off-site WORM S3 Object Lock bucket endpoint (`pgBackRest` WAL/base backups & chunked DB snapshots). | `.env.example:44` | Unset (`""`). | Required for `pgBackRest` and `AT-P1-4` WORM archival tests. |
| `YUME_NODE_ID` | Unique node identifier inside Patroni/`etcd` quorum (`node-alg-01`, `node-dxb-01`, etc.). | `server/localDb.ts:406`, `.env.example:32` | Falls back in dev to placeholder label `"node-alg-01 (Ryzen 9 / 128GB ECC / NVMe RAID-10)"`. | **Placeholder Note:** Default string is a planning label only, not a verified server identity. Must be set per physical/cloud host in staging/prod. |
| `YUME_REGION_CODE` | Active cluster primary region identifier (`dz-algiers-1`, `ae-dubai-1`, `my-kl-1`, `eu-fra-01`). | `server/localDb.ts:407`, `.env.example:33` | Defaults to `"dz-algiers-1"`. | Must match host WireGuard/residency placement in staging/prod. |
| `YUME_STANDBY_NODE_ID` | Target warm/cold standby node identifier. | `server/localDb.ts:408`, `.env.example:34` | Defaults to placeholder `"node-fra-01 (Frankfurt Warm Standby)"`. | Must match real standby host in staging/prod. |
| `YUME_STANDBY_REGION_CODE` | Standby region identifier (`eu-fra-01`, `dz-west-1`, `sg-sin-1`). | `server/localDb.ts:409`, `.env.example:35` | Defaults to `"eu-fra-01"`. | Must match real standby region in staging/prod. |

---

### 3.3 `PRODUCTION_REQUIRED` (Hardware, Empirical Network & Production-Only Gateways)

*All `STAGING_REQUIRED` variables must be provisioned with isolated production credentials/infrastructure, plus the following production-specific requirements:*

| Variable / Config Group | Purpose | Current Code / Plan Location | Default / Behavior When Unset | Production Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `YUME_MEASURED_FTTH_UPLOAD_MBPS` | Selects non-oversubscribed `tc` HTB QoS budget tier (`50`, `100`, or `200` Mbps) from **empirically measured** ISP upload. | `server.ts:1345`, `portableClusterConfig.ts:130`, `.env.example:40` | `server.ts:1345` falls back to `100` (theoretical planning baseline). | **Do Not Treat As Measured:** Production value MUST only be set after running evening peak (`19:00–23:00 CET`) `iperf3`/`flent` measurements (`AT-P1-7`). |
| `APP_URL` | Canonical public HTTPS origin for Cloud Run / reverse-proxy deployment, OAuth redirects, and canonical links. | `.env.example:9` | Placeholder `"MY_APP_URL"`; injected at Cloud Run runtime when deployed. | Required in production deployment for canonical domain routing. |
| **OOB STONITH Hardware Credentials** *(Planned — Not Yet Wired)* | Out-of-band Redfish/IPMI BMC and switched smart-PDU API endpoints reachable over independent 4G/LTE link. | `implementation_plan.md` §1.1–1.3 (`yume-stonith-gate`) | Not present in repository (`server.ts:1422` currently accepts drill request body flags). | **Mandatory Before Unattended Production Failover:** Until real OOB hardware STONITH + `yume-lease-enforcerd` + `etcd` + `/dev/watchdog` are deployed and verified (`AT-FAIL-1..9`), cluster MUST fail closed (`SAFE_NON_WRITABLE_FAIL_CLOSED`). |
| **`etcd` Peer Endpoints & mTLS Certs** *(Planned — Not Yet Wired)* | Control-plane quorum endpoints over `wg-control` (`10.99.0.x`, `udp/51820`). | `implementation_plan.md` §1–2, `portableClusterConfig.ts` | Not present in repository. | Required for 3-node Patroni/`etcd` quorum and startup epoch validation. |
| **`pgBackRest` S3 Credentials & Cipher Passphrase** *(Planned — Not Yet Wired)* | Encrypted WAL `archive-push` and `backup-standby = y` base backup credentials for Cloudflare R2. | `implementation_plan.md` §3.4 | Not present in repository. | Required for production PITR (`RPO <= 60s`) and DR vault isolation. |

---

### 3.4 `OPTIONAL_INTEGRATION`

| Variable | Purpose | Current Code Location | Default / Fallback Behavior When Unset |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side Google Gemini API key (`@google/genai`) for AI category suggestion & multilingual copy endpoints. | `server.ts:155`, `.env.example:4` | When unset or `"MY_GEMINI_API_KEY"`, `/api/suggest-category` and `/api/generate-copy` return deterministic local fallback JSON cleanly without failing. |
| `YALIDINE_API_ID` | Live Yalidine courier merchant API ID. | `server/delivery/yalidineAdapter.ts:28` | Defaults to `""`; adapter executes local sandbox rate calculation & mock tracking generation. |
| `YALIDINE_API_TOKEN` | Live Yalidine courier merchant API token. | `server/delivery/yalidineAdapter.ts:29` | Defaults to `""`; adapter runs cleanly in local sandbox mode. |
| `ZR_EXPRESS_TOKEN` | Live ZR Express courier API token. | `server/delivery/zrExpressAdapter.ts:19` | Defaults to `""`; adapter runs cleanly in local sandbox mode. |
| `REMOVE_BG_API_KEY` | Optional remove.bg API key for background isolation. | `.env.example:13` | Empty `""`; optional external integration (currently stubbed in `/api/remove-background`). |
| `CLOUDINARY_URL` | Optional Cloudinary media transformation connection URI. | `.env.example:17` | Empty `""`; optional external integration. |

---

## 4. Development Blocking Assessment

**Does any missing production/staging environment variable currently block YUME Network feature development?**

**No — zero missing environment variables block current platform development.**
- Express (`npm run dev`), Vite SPA compilation (`npm run build`), TypeScript checks (`npm run lint`), and the isolated invariant harness (`npx tsx scripts/verifyPhase31Local.ts`) all execute cleanly with `DB_AUTHORITY="local_hardened"` and all staging/production secrets unset.
- Courier adapters, Gemini AI endpoints, and `localDb.ts` all have explicit development-mode behaviors without requiring real production credentials.
- **Note on genuine code blockers (architecture/security, NOT missing user secrets):** As identified in the Phase 3.1 verification pass, wiring `getPostgresPool()` (`server/db/transactionalRepository.ts`), enforcing `if (!auth.allowed)` on `/api/admin/phase3/failover-simulate`, hardening `POST /api/media/presign` (`requireStrictToken`), and fixing storefront `reserveStock: true` / `PATCH` alignment are **code implementation tasks**—none of them require supplying real production secrets yet.
