-- ============================================================================
-- YUME NETWORK — REGIONAL SOVEREIGN PII VAULT SCHEMA (yume_pii_vault_dz)
-- Separate PostgreSQL instance/port (5433) pinned to Algerian sovereign hardware.
-- Physically excluded from international Patroni WAL replication of yume_core_db.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pii_vault_records (
  recipient_pii_token UUID PRIMARY KEY,
  residency_zone VARCHAR(16) NOT NULL DEFAULT 'DZ',
  idempotency_key VARCHAR(128) NOT NULL,
  identity_fingerprint CHAR(64) NOT NULL,
  link_status VARCHAR(24) NOT NULL DEFAULT 'PROVISIONAL'
    CHECK (link_status IN ('PROVISIONAL', 'LINKED_TO_ORDER', 'ARCHIVED')),
  order_id_hint VARCHAR(64) NULL,
  kms_key_id VARCHAR(64) NOT NULL,
  encrypted_envelope_ciphertext BYTEA NOT NULL,
  envelope_sha256 CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, identity_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_pii_vault_orphan_sweep
  ON pii_vault_records(link_status, created_at)
  WHERE link_status = 'PROVISIONAL';

-- Disk-backed Sealed-Box Encrypted Spool (populated only during PII Vault maintenance/outage)
CREATE TABLE IF NOT EXISTS pii_encrypted_spool_dz (
  spool_id BIGSERIAL PRIMARY KEY,
  recipient_pii_token UUID NOT NULL UNIQUE,
  idempotency_key VARCHAR(128) NOT NULL,
  identity_fingerprint CHAR(64) NOT NULL,
  order_id_hint VARCHAR(64) NULL,
  sealed_box_ciphertext BYTEA NOT NULL,
  envelope_sha256 CHAR(64) NOT NULL,
  reconciled_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
