-- ============================================================================
-- YUME NETWORK — MIGRATION 002: V2.1 STORES LIFECYCLE & PRIVACY ANALYTICS
-- Additive, idempotent migration preserving all historical stores, orders & KYC
-- ============================================================================

BEGIN;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS shop_approved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS archived_by VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_stores_archived
  ON stores(archived, enforcement_state);

-- Historical stores preserve shop_approved = COALESCE(verified) safely while kyc_enabled stays FALSE
UPDATE stores
SET shop_approved = COALESCE((legacy_payload->>'shopApproved')::boolean, (legacy_payload->>'verified')::boolean, FALSE)
WHERE shop_approved = FALSE;

CREATE TABLE IF NOT EXISTS store_analytics_events (
  event_id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) NULL,
  event_type VARCHAR(24) NOT NULL CHECK (event_type IN ('visit', 'product_click')),
  visitor_hash CHAR(64) NOT NULL,
  session_bucket BIGINT NOT NULL,
  dedup_key CHAR(64) NOT NULL UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_store_time
  ON store_analytics_events(store_id, event_type, occurred_at DESC);

COMMIT;

-- Non-destructive Rollback (run manually only if reverting pre-launch):
-- DROP INDEX IF EXISTS idx_analytics_store_time;
-- DROP TABLE IF EXISTS store_analytics_events;
-- DROP INDEX IF EXISTS idx_stores_archived;
