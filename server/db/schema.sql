-- ============================================================================
-- YUME NETWORK — PHASE 3.1 AUTHORITATIVE POSTGRESQL 16 CORE SCHEMA
-- Decoupled yume_core_db (Managed by Patroni Physical Replication + etcd)
-- Regional buyer/merchant PII lives strictly inside separate yume_pii_vault_<zone>
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 0. RESIDENCY ZONES, IDEMPOTENCY KEYS, STORES & AUDIT LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS residency_zones (
  zone_code VARCHAR(16) PRIMARY KEY,
  country_name TEXT NOT NULL,
  legal_framework TEXT NOT NULL,
  allow_cross_border_pii_replication BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO residency_zones (zone_code, country_name, legal_framework, allow_cross_border_pii_replication)
VALUES
  ('DZ', 'Algeria', 'Algeria Law No. 18-07 (ANPDP)', FALSE),
  ('AE', 'United Arab Emirates', 'UAE Federal Decree-Law No. 45/2021', FALSE),
  ('MY', 'Malaysia', 'Malaysia PDPA 2010 / 2024 Amendments', FALSE),
  ('EU', 'European Union', 'GDPR', FALSE)
ON CONFLICT (zone_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key VARCHAR(128) PRIMARY KEY,
  endpoint_scope VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours')
);

CREATE TABLE IF NOT EXISTS api_idempotency_records (
  idempotency_key VARCHAR(128) NOT NULL,
  endpoint_scope VARCHAR(64) NOT NULL,
  actor_scope VARCHAR(64) NOT NULL,
  payload_sha256 CHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  resource_id VARCHAR(64) NULL,
  response_status SMALLINT NULL,
  response_body JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
  PRIMARY KEY (idempotency_key, endpoint_scope)
);
CREATE INDEX IF NOT EXISTS idx_api_idem_expires ON api_idempotency_records(expires_at);

CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) UNIQUE,
  store_name TEXT NOT NULL,
  owner_user_id VARCHAR(64) NOT NULL,
  merchant_pii_token UUID NULL,
  public_wilaya_id INT NULL,
  public_wilaya_name VARCHAR(128) NULL,
  residency_zone VARCHAR(16) NOT NULL DEFAULT 'DZ' REFERENCES residency_zones(zone_code),
  enforcement_state VARCHAR(32) NOT NULL DEFAULT 'active'
    CHECK (enforcement_state IN ('active', 'warning', 'restricted', 'suspended', 'terminated')),
  shop_approved BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ NULL,
  archived_by VARCHAR(64) NULL,
  archive_reason TEXT NULL,
  legacy_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stores_enforcement ON stores(enforcement_state, residency_zone);
CREATE INDEX IF NOT EXISTS idx_stores_archived ON stores(archived, enforcement_state);

-- ============================================================================
-- A & B. PRODUCTS, VARIANTS, INVENTORY & OPTIONAL PURCHASE COST
-- NOTE: 'hidden_over_quota' is FORBIDDEN under Phase 2/3.1 Non-Destructive Policy.
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  category VARCHAR(128),
  subcategory VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'draft', 'suspended', 'archived')),
  has_variants BOOLEAN NOT NULL DEFAULT FALSE,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  compare_at_price_minor BIGINT NULL CHECK (compare_at_price_minor IS NULL OR compare_at_price_minor >= 0),
  purchase_price_minor BIGINT NULL CHECK (purchase_price_minor IS NULL OR purchase_price_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'DZD',
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  damaged_stock INT NOT NULL DEFAULT 0 CHECK (damaged_stock >= 0),
  courier_lost_stock INT NOT NULL DEFAULT 0 CHECK (courier_lost_stock >= 0),
  courier_damaged_unreturned_stock INT NOT NULL DEFAULT 0 CHECK (courier_damaged_unreturned_stock >= 0),
  version_number INT NOT NULL DEFAULT 1,
  legacy_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_store_status ON products(store_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS product_variants (
  variant_id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(128),
  color_label VARCHAR(64),
  size_label VARCHAR(64),
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  purchase_price_minor BIGINT NULL CHECK (purchase_price_minor IS NULL OR purchase_price_minor >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  damaged_stock INT NOT NULL DEFAULT 0 CHECK (damaged_stock >= 0),
  courier_lost_stock INT NOT NULL DEFAULT 0 CHECK (courier_lost_stock >= 0),
  courier_damaged_unreturned_stock INT NOT NULL DEFAULT 0 CHECK (courier_damaged_unreturned_stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version_number INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, color_label, size_label),
  UNIQUE (variant_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- Deterministic Parent-Product Sync Trigger (Deadlock-Free Ascending ID Lock)
CREATE OR REPLACE FUNCTION sync_parent_product_inventory() RETURNS TRIGGER AS $$
DECLARE
  affected_product_ids VARCHAR(64)[];
  pid VARCHAR(64);
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_product_ids := ARRAY[OLD.product_id];
  ELSIF TG_OP = 'INSERT' THEN
    affected_product_ids := ARRAY[NEW.product_id];
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.product_id IS DISTINCT FROM NEW.product_id THEN
      SELECT ARRAY_AGG(x ORDER BY x ASC) INTO affected_product_ids
      FROM (SELECT UNNEST(ARRAY[OLD.product_id, NEW.product_id]) AS x) s;
    ELSE
      affected_product_ids := ARRAY[NEW.product_id];
    END IF;
  END IF;

  PERFORM 1 FROM products WHERE id = ANY(affected_product_ids) ORDER BY id ASC FOR UPDATE;

  FOREACH pid IN ARRAY affected_product_ids LOOP
    UPDATE products p
    SET stock = COALESCE((SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = pid AND v.is_active = TRUE), 0),
        reserved_stock = COALESCE((SELECT SUM(v.reserved_stock) FROM product_variants v WHERE v.product_id = pid AND v.is_active = TRUE), 0),
        damaged_stock = COALESCE((SELECT SUM(v.damaged_stock) FROM product_variants v WHERE v.product_id = pid), 0),
        courier_lost_stock = COALESCE((SELECT SUM(v.courier_lost_stock) FROM product_variants v WHERE v.product_id = pid), 0),
        courier_damaged_unreturned_stock = COALESCE((SELECT SUM(v.courier_damaged_unreturned_stock) FROM product_variants v WHERE v.product_id = pid), 0),
        version_number = p.version_number + 1,
        updated_at = NOW()
    WHERE p.id = pid AND p.has_variants = TRUE;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_variant_inventory ON product_variants;
CREATE TRIGGER trg_sync_variant_inventory
AFTER INSERT OR UPDATE OF product_id, stock, reserved_stock, damaged_stock, courier_lost_stock, courier_damaged_unreturned_stock, is_active OR DELETE ON product_variants
FOR EACH ROW EXECUTE FUNCTION sync_parent_product_inventory();

-- ============================================================================
-- C. ORDERS, COST/PROFIT LINE-ITEM SNAPSHOTS & 12-BUCKET QUANTITY CONSERVATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  buyer_user_id VARCHAR(64),
  recipient_pii_token UUID NOT NULL,
  pii_resolution_status VARCHAR(32) NOT NULL DEFAULT 'VAULT_VERIFIED'
    CHECK (pii_resolution_status IN ('VAULT_VERIFIED', 'SPOOL_PENDING_VAULT_SYNC')),
  idempotency_key VARCHAR(128) NOT NULL UNIQUE REFERENCES idempotency_keys(idempotency_key),
  status VARCHAR(32) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'confirmed', 'processing', 'partially_shipped',
      'shipped', 'out_for_delivery', 'delivered', 'partially_delivered',
      'failed_delivery', 'cancelled', 'partially_returned', 'returned'
    )),
  CONSTRAINT chk_fulfillment_requires_verified_pii
    CHECK (status IN ('pending', 'cancelled') OR pii_resolution_status = 'VAULT_VERIFIED'),
  destination_country_code CHAR(2) NOT NULL DEFAULT 'DZ',
  destination_wilaya_id INT NULL,
  destination_commune VARCHAR(128) NULL,
  is_stop_desk_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  coupon_code_snapshot VARCHAR(64) NULL,
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  discount_snapshot_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_snapshot_minor >= 0),
  shipping_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (shipping_fee_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0)
    CHECK (total_minor = GREATEST(0, subtotal_minor - discount_snapshot_minor) + shipping_fee_minor),
  total_cost_snapshot_minor BIGINT NULL CHECK (total_cost_snapshot_minor IS NULL OR total_cost_snapshot_minor >= 0),
  estimated_gross_profit_minor BIGINT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'DZD',
  residency_zone VARCHAR(16) NOT NULL DEFAULT 'DZ' REFERENCES residency_zones(zone_code),
  fencing_epoch BIGINT NOT NULL,
  fulfillable_after_suspension_or_expiry BOOLEAN NOT NULL DEFAULT TRUE,
  cancellation_reason TEXT NULL,
  stock_released_at TIMESTAMPTZ NULL,
  legacy_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, store_id)
);
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_line_items (
  line_item_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id VARCHAR(64) NULL,
  product_name_snapshot TEXT NOT NULL,
  variant_attributes_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
  quantity_cancelled INT NOT NULL DEFAULT 0 CHECK (quantity_cancelled >= 0),
  quantity_allocated INT NOT NULL DEFAULT 0 CHECK (quantity_allocated >= 0),
  quantity_shipped INT NOT NULL DEFAULT 0 CHECK (quantity_shipped >= 0),
  quantity_unshipped INT GENERATED ALWAYS AS (quantity_ordered - quantity_cancelled - quantity_allocated - quantity_shipped) STORED,
  quantity_lost_by_courier INT NOT NULL DEFAULT 0 CHECK (quantity_lost_by_courier >= 0),
  quantity_courier_damaged_reported INT NOT NULL DEFAULT 0 CHECK (quantity_courier_damaged_reported >= 0),
  quantity_courier_damaged_received INT NOT NULL DEFAULT 0 CHECK (quantity_courier_damaged_received >= 0),
  quantity_courier_damaged_settled_unreturned INT NOT NULL DEFAULT 0 CHECK (quantity_courier_damaged_settled_unreturned >= 0),
  quantity_courier_damaged_in_transit INT GENERATED ALWAYS AS (quantity_courier_damaged_reported - quantity_courier_damaged_received - quantity_courier_damaged_settled_unreturned) STORED,
  quantity_delivered INT NOT NULL DEFAULT 0 CHECK (quantity_delivered >= 0),
  quantity_in_transit INT GENERATED ALWAYS AS (quantity_shipped - quantity_delivered - quantity_lost_by_courier - quantity_courier_damaged_reported) STORED,
  quantity_returned_by_customer INT NOT NULL DEFAULT 0 CHECK (quantity_returned_by_customer >= 0),
  quantity_delivered_retained INT GENERATED ALWAYS AS (quantity_delivered - quantity_returned_by_customer) STORED,
  quantity_customer_return_received INT NOT NULL DEFAULT 0 CHECK (quantity_customer_return_received >= 0),
  quantity_return_in_transit INT GENERATED ALWAYS AS (quantity_returned_by_customer - quantity_customer_return_received) STORED,
  quantity_received_back_by_merchant INT GENERATED ALWAYS AS (quantity_customer_return_received + quantity_courier_damaged_received) STORED,
  quantity_returned_resellable INT NOT NULL DEFAULT 0 CHECK (quantity_returned_resellable >= 0),
  quantity_returned_damaged INT NOT NULL DEFAULT 0 CHECK (quantity_returned_damaged >= 0),
  quantity_return_pending_inspection INT GENERATED ALWAYS AS (quantity_customer_return_received + quantity_courier_damaged_received - quantity_returned_resellable - quantity_returned_damaged) STORED,
  quantity_courier_lost_claims INT GENERATED ALWAYS AS (quantity_lost_by_courier) STORED,
  quantity_courier_damaged_unreturned INT GENERATED ALWAYS AS (quantity_courier_damaged_settled_unreturned) STORED,
  quantity_returned_to_stock INT GENERATED ALWAYS AS (quantity_returned_resellable) STORED,
  CONSTRAINT chk_order_line_pre_dispatch_conservation
    CHECK (quantity_cancelled + quantity_allocated + quantity_shipped <= quantity_ordered),
  CONSTRAINT chk_order_line_outbound_conservation
    CHECK (quantity_delivered + quantity_lost_by_courier + quantity_courier_damaged_reported <= quantity_shipped),
  CONSTRAINT chk_order_line_courier_damaged_bounds
    CHECK (quantity_courier_damaged_received + quantity_courier_damaged_settled_unreturned <= quantity_courier_damaged_reported),
  CONSTRAINT chk_order_line_customer_return_bounds
    CHECK (quantity_returned_by_customer <= quantity_delivered),
  CONSTRAINT chk_order_line_customer_receipt_bounds
    CHECK (quantity_customer_return_received <= quantity_returned_by_customer),
  CONSTRAINT chk_order_line_qc_inspection_bounds
    CHECK (quantity_returned_resellable + quantity_returned_damaged <= quantity_customer_return_received + quantity_courier_damaged_received),
  currency_code CHAR(3) NOT NULL DEFAULT 'DZD',
  product_price_snapshot_minor BIGINT NOT NULL CHECK (product_price_snapshot_minor >= 0),
  unit_cost_snapshot_minor BIGINT NULL CHECK (unit_cost_snapshot_minor IS NULL OR unit_cost_snapshot_minor >= 0),
  discount_snapshot_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_snapshot_minor >= 0),
  line_total_minor BIGINT NOT NULL CHECK (line_total_minor >= 0),
  line_profit_snapshot_minor BIGINT NULL,
  reservation_state VARCHAR(32) NOT NULL DEFAULT 'reserved'
    CHECK (reservation_state IN ('reserved', 'partially_fulfilled', 'fulfilled', 'released_on_cancel', 'partially_returned', 'returned')),
  UNIQUE (line_item_id, order_id),
  FOREIGN KEY (variant_id, product_id) REFERENCES product_variants(variant_id, product_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_line_items(product_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  history_id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(32) NULL,
  new_status VARCHAR(32) NOT NULL,
  changed_by_actor_type VARCHAR(24) NOT NULL CHECK (changed_by_actor_type IN ('buyer', 'merchant', 'admin', 'carrier_webhook', 'system')),
  changed_by_actor_id VARCHAR(64) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_status_hist ON order_status_history(order_id, created_at DESC);

-- ============================================================================
-- D. SHIPMENTS, COMPOSITE STORE FK, PARTIAL DISPATCH & RETURN PIPELINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipments (
  shipment_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  is_split_shipment BOOLEAN NOT NULL DEFAULT FALSE,
  split_sequence_number SMALLINT NOT NULL DEFAULT 1 CHECK (split_sequence_number >= 1),
  carrier_id VARCHAR(64) NOT NULL,
  tracking_number VARCHAR(128) UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'pending_dispatch'
    CHECK (status IN (
      'pending_dispatch', 'label_created', 'partially_dispatched', 'picked_up', 'in_transit',
      'at_stop_desk', 'out_for_delivery', 'delivered', 'partially_delivered',
      'delivery_failed_attempt', 'returning_to_sender', 'returned_to_merchant', 'lost_damaged', 'cancelled'
    )),
  origin_country_code CHAR(2) NOT NULL DEFAULT 'DZ',
  origin_wilaya_id INT NULL,
  destination_country_code CHAR(2) NOT NULL DEFAULT 'DZ',
  destination_wilaya_id INT NULL,
  destination_commune VARCHAR(128) NULL,
  is_stop_desk BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_minor >= 0),
  cod_to_collect_minor BIGINT NOT NULL DEFAULT 0 CHECK (cod_to_collect_minor >= 0),
  cod_collected_minor BIGINT NOT NULL DEFAULT 0 CHECK (cod_collected_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'DZD',
  dispatched_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,
  returned_at TIMESTAMPTZ NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (order_id, store_id) REFERENCES orders(id, store_id) ON DELETE RESTRICT,
  UNIQUE (shipment_id, order_id),
  UNIQUE (shipment_id, order_id, store_id),
  UNIQUE (order_id, split_sequence_number)
);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id, split_sequence_number);
CREATE INDEX IF NOT EXISTS idx_shipments_store_status ON shipments(store_id, status);

CREATE TABLE IF NOT EXISTS shipment_line_items (
  shipment_item_id VARCHAR(64) PRIMARY KEY,
  shipment_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  line_item_id VARCHAR(64) NOT NULL,
  quantity_allocated INT NOT NULL DEFAULT 0 CHECK (quantity_allocated >= 0),
  quantity_deallocated INT NOT NULL DEFAULT 0 CHECK (quantity_deallocated >= 0),
  quantity_shipped INT NOT NULL DEFAULT 0 CHECK (quantity_shipped >= 0),
  quantity_lost_by_courier INT NOT NULL DEFAULT 0 CHECK (quantity_lost_by_courier >= 0),
  quantity_courier_damaged_reported INT NOT NULL DEFAULT 0 CHECK (quantity_courier_damaged_reported >= 0),
  quantity_courier_damaged_received INT NOT NULL DEFAULT 0 CHECK (quantity_courier_damaged_received >= 0),
  quantity_courier_damaged_settled_unreturned INT NOT NULL DEFAULT 0 CHECK (quantity_courier_damaged_settled_unreturned >= 0),
  quantity_courier_damaged_in_transit INT GENERATED ALWAYS AS (quantity_courier_damaged_reported - quantity_courier_damaged_received - quantity_courier_damaged_settled_unreturned) STORED,
  quantity_delivered INT NOT NULL DEFAULT 0 CHECK (quantity_delivered >= 0),
  quantity_in_transit INT GENERATED ALWAYS AS (quantity_shipped - quantity_delivered - quantity_lost_by_courier - quantity_courier_damaged_reported) STORED,
  quantity_returned_by_customer INT NOT NULL DEFAULT 0 CHECK (quantity_returned_by_customer >= 0),
  quantity_delivered_retained INT GENERATED ALWAYS AS (quantity_delivered - quantity_returned_by_customer) STORED,
  quantity_customer_return_received INT NOT NULL DEFAULT 0 CHECK (quantity_customer_return_received >= 0),
  quantity_return_in_transit INT GENERATED ALWAYS AS (quantity_returned_by_customer - quantity_customer_return_received) STORED,
  quantity_received_back_by_merchant INT GENERATED ALWAYS AS (quantity_customer_return_received + quantity_courier_damaged_received) STORED,
  quantity_returned_resellable INT NOT NULL DEFAULT 0 CHECK (quantity_returned_resellable >= 0),
  quantity_returned_damaged INT NOT NULL DEFAULT 0 CHECK (quantity_returned_damaged >= 0),
  quantity_return_pending_inspection INT GENERATED ALWAYS AS (quantity_customer_return_received + quantity_courier_damaged_received - quantity_returned_resellable - quantity_returned_damaged) STORED,
  quantity_courier_lost_claims INT GENERATED ALWAYS AS (quantity_lost_by_courier) STORED,
  quantity_courier_damaged_unreturned INT GENERATED ALWAYS AS (quantity_courier_damaged_settled_unreturned) STORED,
  quantity_returned_to_stock INT GENERATED ALWAYS AS (quantity_returned_resellable) STORED,
  CONSTRAINT chk_shipment_item_non_empty_history
    CHECK (quantity_allocated + quantity_shipped + quantity_deallocated > 0),
  CONSTRAINT chk_shipment_item_outbound_conservation
    CHECK (quantity_delivered + quantity_lost_by_courier + quantity_courier_damaged_reported <= quantity_shipped),
  CONSTRAINT chk_shipment_item_courier_damaged_bounds
    CHECK (quantity_courier_damaged_received + quantity_courier_damaged_settled_unreturned <= quantity_courier_damaged_reported),
  CONSTRAINT chk_shipment_item_customer_return_bounds
    CHECK (quantity_returned_by_customer <= quantity_delivered),
  CONSTRAINT chk_shipment_item_customer_receipt_bounds
    CHECK (quantity_customer_return_received <= quantity_returned_by_customer),
  CONSTRAINT chk_shipment_item_qc_inspection_bounds
    CHECK (quantity_returned_resellable + quantity_returned_damaged <= quantity_customer_return_received + quantity_courier_damaged_received),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shipment_id, line_item_id),
  UNIQUE (shipment_item_id, shipment_id, order_id, line_item_id),
  FOREIGN KEY (shipment_id, order_id) REFERENCES shipments(shipment_id, order_id) ON DELETE CASCADE,
  FOREIGN KEY (line_item_id, order_id) REFERENCES order_line_items(line_item_id, order_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_shipment_items_line ON shipment_line_items(line_item_id);

CREATE TABLE IF NOT EXISTS shipment_dispatch_batches (
  dispatch_batch_id VARCHAR(64) PRIMARY KEY,
  shipment_item_id VARCHAR(64) NOT NULL,
  shipment_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  line_item_id VARCHAR(64) NOT NULL,
  batch_sequence_number SMALLINT NOT NULL CHECK (batch_sequence_number >= 1),
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  quantity_dispatched INT NOT NULL CHECK (quantity_dispatched > 0),
  carrier_manifest_ref VARCHAR(128) NULL,
  dispatched_by_actor_id VARCHAR(64) NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shipment_item_id, batch_sequence_number),
  FOREIGN KEY (shipment_id, order_id, store_id) REFERENCES shipments(shipment_id, order_id, store_id) ON DELETE RESTRICT,
  FOREIGN KEY (shipment_item_id, shipment_id, order_id, line_item_id)
    REFERENCES shipment_line_items(shipment_item_id, shipment_id, order_id, line_item_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_dispatch_batches_item ON shipment_dispatch_batches(shipment_item_id, batch_sequence_number);

CREATE TABLE IF NOT EXISTS shipment_return_events (
  return_event_id VARCHAR(64) PRIMARY KEY,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  payload_sha256 CHAR(64) NOT NULL,
  shipment_item_id VARCHAR(64) NOT NULL,
  shipment_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  line_item_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(48) NOT NULL CHECK (event_type IN (
    'COURIER_DELIVERED',
    'COURIER_LOST_PRE_DELIVERY',
    'COURIER_DAMAGED_PRE_DELIVERY',
    'MERCHANT_WAREHOUSE_RECEIVED_COURIER_DAMAGED',
    'COURIER_DAMAGED_SETTLED_UNRETURNED',
    'CUSTOMER_RETURN_INITIATED',
    'MERCHANT_WAREHOUSE_RECEIVED_CUSTOMER_RETURN',
    'QC_APPROVED_RESELLABLE',
    'QC_REJECTED_DAMAGED'
  )),
  quantity_delta INT NOT NULL CHECK (quantity_delta > 0),
  actor_id VARCHAR(64) NOT NULL,
  reason_code VARCHAR(64) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (order_id, store_id) REFERENCES orders(id, store_id) ON DELETE RESTRICT,
  FOREIGN KEY (shipment_id, order_id, store_id) REFERENCES shipments(shipment_id, order_id, store_id) ON DELETE RESTRICT,
  FOREIGN KEY (line_item_id, order_id) REFERENCES order_line_items(line_item_id, order_id) ON DELETE RESTRICT,
  FOREIGN KEY (shipment_item_id, shipment_id, order_id, line_item_id)
    REFERENCES shipment_line_items(shipment_item_id, shipment_id, order_id, line_item_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS shipment_status_history (
  history_id BIGSERIAL PRIMARY KEY,
  shipment_id VARCHAR(64) NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
  previous_status VARCHAR(32) NULL,
  new_status VARCHAR(32) NOT NULL,
  carrier_raw_event_code VARCHAR(64) NULL,
  location_label VARCHAR(128) NULL,
  note TEXT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_hist_ship ON shipment_status_history(shipment_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS inventory_ledger_movements (
  movement_id VARCHAR(64) PRIMARY KEY,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id VARCHAR(64) NULL REFERENCES product_variants(variant_id) ON DELETE RESTRICT,
  order_id VARCHAR(64) NULL REFERENCES orders(id) ON DELETE RESTRICT,
  line_item_id VARCHAR(64) NULL REFERENCES order_line_items(line_item_id) ON DELETE RESTRICT,
  shipment_item_id VARCHAR(64) NULL REFERENCES shipment_line_items(shipment_item_id) ON DELETE RESTRICT,
  return_event_id VARCHAR(64) NULL UNIQUE REFERENCES shipment_return_events(return_event_id) ON DELETE RESTRICT,
  movement_type VARCHAR(40) NOT NULL
    CHECK (movement_type IN (
      'ORDER_RESERVE',
      'SHIPMENT_DISPATCH_COMMIT',
      'UNSHIPPED_CANCEL_RELEASE',
      'COURIER_LOSS_CLAIM_WRITEOFF',
      'COURIER_DAMAGE_REPORTED_IN_TRANSIT',
      'COURIER_DAMAGE_CLAIM_SETTLED_UNRETURNED',
      'RETURN_RESTOCK_INTACT',
      'RETURN_DAMAGED_WRITEOFF',
      'MANUAL_ADJUSTMENT'
    )),
  delta_sellable_stock INT NOT NULL,
  delta_reserved_stock INT NOT NULL,
  delta_damaged_stock INT NOT NULL DEFAULT 0,
  delta_courier_lost_stock INT NOT NULL DEFAULT 0,
  delta_courier_damaged_unreturned_stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dispatch Batch Trigger
CREATE OR REPLACE FUNCTION apply_shipment_dispatch_batch() RETURNS TRIGGER AS $$
DECLARE
  v_alloc INT;
  v_ship_status VARCHAR(32);
  v_prod_id VARCHAR(64);
  v_var_id VARCHAR(64);
BEGIN
  SELECT status INTO v_ship_status FROM shipments WHERE shipment_id = NEW.shipment_id FOR UPDATE;
  IF v_ship_status = 'cancelled' THEN
    RAISE EXCEPTION 'CANNOT_DISPATCH_CANCELLED_SHIPMENT: shipment_id=%', NEW.shipment_id USING ERRCODE = '23514';
  END IF;

  SELECT quantity_allocated INTO v_alloc
  FROM shipment_line_items
  WHERE shipment_item_id = NEW.shipment_item_id
  FOR UPDATE;

  IF v_alloc < NEW.quantity_dispatched THEN
    RAISE EXCEPTION 'DISPATCH_EXEDS_ALLOCATED_WAREHOUSE_BALANCE: allocated=%, requested=%',
      v_alloc, NEW.quantity_dispatched USING ERRCODE = '23514';
  END IF;

  SELECT product_id, variant_id INTO v_prod_id, v_var_id
  FROM order_line_items WHERE line_item_id = NEW.line_item_id FOR UPDATE;

  PERFORM 1 FROM products WHERE id = v_prod_id FOR UPDATE;
  IF v_var_id IS NOT NULL THEN
    PERFORM 1 FROM product_variants WHERE variant_id = v_var_id FOR UPDATE;
  END IF;

  UPDATE shipment_line_items
  SET quantity_allocated = quantity_allocated - NEW.quantity_dispatched,
      quantity_shipped = quantity_shipped + NEW.quantity_dispatched,
      updated_at = NOW()
  WHERE shipment_item_id = NEW.shipment_item_id;

  INSERT INTO inventory_ledger_movements (
    movement_id, idempotency_key, product_id, variant_id, order_id, line_item_id, shipment_item_id,
    movement_type, delta_sellable_stock, delta_reserved_stock, delta_damaged_stock, delta_courier_lost_stock, delta_courier_damaged_unreturned_stock
  ) VALUES (
    'mov_' || NEW.dispatch_batch_id, 'dispatch_batch:' || NEW.idempotency_key,
    v_prod_id, v_var_id, NEW.order_id, NEW.line_item_id, NEW.shipment_item_id,
    'SHIPMENT_DISPATCH_COMMIT', 0, -NEW.quantity_dispatched, 0, 0, 0
  );

  IF v_var_id IS NOT NULL THEN
    UPDATE product_variants SET reserved_stock = reserved_stock - NEW.quantity_dispatched, updated_at = NOW()
    WHERE variant_id = v_var_id;
  ELSE
    UPDATE products SET reserved_stock = reserved_stock - NEW.quantity_dispatched, updated_at = NOW()
    WHERE id = v_prod_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_shipment_dispatch_batch ON shipment_dispatch_batches;
CREATE TRIGGER trg_apply_shipment_dispatch_batch
AFTER INSERT ON shipment_dispatch_batches
FOR EACH ROW EXECUTE FUNCTION apply_shipment_dispatch_batch();

-- Dispatched Immutability Guard Trigger
CREATE OR REPLACE FUNCTION guard_dispatched_shipment_line_immutability() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.quantity_shipped > 0 AND (
    OLD.line_item_id IS DISTINCT FROM NEW.line_item_id OR
    OLD.shipment_id IS DISTINCT FROM NEW.shipment_id OR
    OLD.order_id IS DISTINCT FROM NEW.order_id
  ) THEN
    RAISE EXCEPTION 'CANNOT_REASSIGN_DISPATCHED_SHIPMENT_LINE_ITEM: shipment_item_id=%', OLD.shipment_item_id
      USING ERRCODE = '23514';
  END IF;
  IF NEW.quantity_shipped < OLD.quantity_shipped THEN
    RAISE EXCEPTION 'DISPATCHED_QUANTITY_IS_IRREVERSIBLE: shipment_item_id=%', OLD.shipment_item_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_dispatched_shipment_line ON shipment_line_items;
CREATE TRIGGER trg_guard_dispatched_shipment_line
BEFORE UPDATE ON shipment_line_items
FOR EACH ROW EXECUTE FUNCTION guard_dispatched_shipment_line_immutability();

-- Shipment Cancellation Guard Trigger
CREATE OR REPLACE FUNCTION guard_shipment_cancellation_invariants() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    IF EXISTS (
      SELECT 1 FROM shipment_line_items
      WHERE shipment_id = NEW.shipment_id AND (quantity_shipped > 0 OR quantity_allocated > 0)
    ) THEN
      RAISE EXCEPTION 'CANNOT_CANCEL_SHIPMENT_WITH_DISPATCHED_OR_ALLOCATED_UNITS: Void/deallocate undispatched units first (shipment_id=%)', NEW.shipment_id
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_shipment_cancellation ON shipments;
CREATE TRIGGER trg_guard_shipment_cancellation
BEFORE UPDATE OF status ON shipments
FOR EACH ROW EXECUTE FUNCTION guard_shipment_cancellation_invariants();

-- Return & Loss Event Trigger (Strictly Separates Courier Loss vs. Courier Unreturned Damage vs. Warehouse QC)
CREATE OR REPLACE FUNCTION apply_shipment_return_event() RETURNS TRIGGER AS $$
DECLARE
  v_sli shipment_line_items%ROWTYPE;
  v_prod_id VARCHAR(64);
  v_var_id VARCHAR(64);
  v_avail INT;
BEGIN
  PERFORM 1 FROM shipments WHERE shipment_id = NEW.shipment_id FOR UPDATE;

  SELECT * INTO v_sli
  FROM shipment_line_items
  WHERE shipment_item_id = NEW.shipment_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHIPMENT_LINE_ITEM_NOT_FOUND: %', NEW.shipment_item_id USING ERRCODE = '23503';
  END IF;

  SELECT product_id, variant_id INTO v_prod_id, v_var_id
  FROM order_line_items
  WHERE line_item_id = NEW.line_item_id
  FOR UPDATE;

  PERFORM 1 FROM products WHERE id = v_prod_id FOR UPDATE;
  IF v_var_id IS NOT NULL THEN
    PERFORM 1 FROM product_variants WHERE variant_id = v_var_id FOR UPDATE;
  END IF;

  CASE NEW.event_type
    WHEN 'COURIER_DELIVERED' THEN
      v_avail := v_sli.quantity_shipped - v_sli.quantity_delivered - v_sli.quantity_lost_by_courier - v_sli.quantity_courier_damaged_reported;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'DELIVERY_EXCEEDS_IN_TRANSIT: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_delivered = quantity_delivered + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;

    WHEN 'COURIER_LOST_PRE_DELIVERY' THEN
      v_avail := v_sli.quantity_shipped - v_sli.quantity_delivered - v_sli.quantity_lost_by_courier - v_sli.quantity_courier_damaged_reported;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'COURIER_LOSS_EXCEEDS_IN_TRANSIT: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_lost_by_courier = quantity_lost_by_courier + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;
      INSERT INTO inventory_ledger_movements (
        movement_id, idempotency_key, product_id, variant_id, order_id, line_item_id, shipment_item_id, return_event_id,
        movement_type, delta_sellable_stock, delta_reserved_stock, delta_damaged_stock, delta_courier_lost_stock, delta_courier_damaged_unreturned_stock
      ) VALUES (
        'mov_' || NEW.return_event_id, 'return_evt:' || NEW.idempotency_key,
        v_prod_id, v_var_id, NEW.order_id, NEW.line_item_id, NEW.shipment_item_id, NEW.return_event_id,
        'COURIER_LOSS_CLAIM_WRITEOFF', 0, 0, 0, NEW.quantity_delta, 0
      );
      IF v_var_id IS NOT NULL THEN
        UPDATE product_variants SET courier_lost_stock = courier_lost_stock + NEW.quantity_delta, updated_at = NOW() WHERE variant_id = v_var_id;
      ELSE
        UPDATE products SET courier_lost_stock = courier_lost_stock + NEW.quantity_delta, updated_at = NOW() WHERE id = v_prod_id;
      END IF;

    WHEN 'COURIER_DAMAGED_PRE_DELIVERY' THEN
      v_avail := v_sli.quantity_shipped - v_sli.quantity_delivered - v_sli.quantity_lost_by_courier - v_sli.quantity_courier_damaged_reported;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'COURIER_DAMAGE_EXCEEDS_IN_TRANSIT: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_courier_damaged_reported = quantity_courier_damaged_reported + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;
      INSERT INTO inventory_ledger_movements (
        movement_id, idempotency_key, product_id, variant_id, order_id, line_item_id, shipment_item_id, return_event_id,
        movement_type, delta_sellable_stock, delta_reserved_stock, delta_damaged_stock, delta_courier_lost_stock, delta_courier_damaged_unreturned_stock
      ) VALUES (
        'mov_' || NEW.return_event_id, 'return_evt:' || NEW.idempotency_key,
        v_prod_id, v_var_id, NEW.order_id, NEW.line_item_id, NEW.shipment_item_id, NEW.return_event_id,
        'COURIER_DAMAGE_REPORTED_IN_TRANSIT', 0, 0, 0, 0, 0
      );

    WHEN 'MERCHANT_WAREHOUSE_RECEIVED_COURIER_DAMAGED' THEN
      v_avail := v_sli.quantity_courier_damaged_reported - v_sli.quantity_courier_damaged_received - v_sli.quantity_courier_damaged_settled_unreturned;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'COURIER_DAMAGED_RECEIPT_EXCEEDS_REPORTED: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_courier_damaged_received = quantity_courier_damaged_received + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;

    WHEN 'COURIER_DAMAGED_SETTLED_UNRETURNED' THEN
      v_avail := v_sli.quantity_courier_damaged_reported - v_sli.quantity_courier_damaged_received - v_sli.quantity_courier_damaged_settled_unreturned;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'COURIER_DAMAGED_SETTLE_EXCEEDS_IN_TRANSIT: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_courier_damaged_settled_unreturned = quantity_courier_damaged_settled_unreturned + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;
      INSERT INTO inventory_ledger_movements (
        movement_id, idempotency_key, product_id, variant_id, order_id, line_item_id, shipment_item_id, return_event_id,
        movement_type, delta_sellable_stock, delta_reserved_stock, delta_damaged_stock, delta_courier_lost_stock, delta_courier_damaged_unreturned_stock
      ) VALUES (
        'mov_' || NEW.return_event_id, 'return_evt:' || NEW.idempotency_key,
        v_prod_id, v_var_id, NEW.order_id, NEW.line_item_id, NEW.shipment_item_id, NEW.return_event_id,
        'COURIER_DAMAGE_CLAIM_SETTLED_UNRETURNED', 0, 0, 0, 0, NEW.quantity_delta
      );
      IF v_var_id IS NOT NULL THEN
        UPDATE product_variants SET courier_damaged_unreturned_stock = courier_damaged_unreturned_stock + NEW.quantity_delta, updated_at = NOW() WHERE variant_id = v_var_id;
      ELSE
        UPDATE products SET courier_damaged_unreturned_stock = courier_damaged_unreturned_stock + NEW.quantity_delta, updated_at = NOW() WHERE id = v_prod_id;
      END IF;

    WHEN 'CUSTOMER_RETURN_INITIATED' THEN
      v_avail := v_sli.quantity_delivered - v_sli.quantity_returned_by_customer;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'CUSTOMER_RETURN_EXCEEDS_RETAINED: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_returned_by_customer = quantity_returned_by_customer + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;

    WHEN 'MERCHANT_WAREHOUSE_RECEIVED_CUSTOMER_RETURN' THEN
      v_avail := v_sli.quantity_returned_by_customer - v_sli.quantity_customer_return_received;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'WAREHOUSE_RECEIPT_EXCEEDS_RETURN_IN_TRANSIT: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_customer_return_received = quantity_customer_return_received + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;

    WHEN 'QC_APPROVED_RESELLABLE' THEN
      v_avail := (v_sli.quantity_customer_return_received + v_sli.quantity_courier_damaged_received)
                 - v_sli.quantity_returned_resellable - v_sli.quantity_returned_damaged;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'QC_APPROVAL_EXCEEDS_PENDING_INSPECTION: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_returned_resellable = quantity_returned_resellable + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;
      INSERT INTO inventory_ledger_movements (
        movement_id, idempotency_key, product_id, variant_id, order_id, line_item_id, shipment_item_id, return_event_id,
        movement_type, delta_sellable_stock, delta_reserved_stock, delta_damaged_stock, delta_courier_lost_stock, delta_courier_damaged_unreturned_stock
      ) VALUES (
        'mov_' || NEW.return_event_id, 'return_evt:' || NEW.idempotency_key,
        v_prod_id, v_var_id, NEW.order_id, NEW.line_item_id, NEW.shipment_item_id, NEW.return_event_id,
        'RETURN_RESTOCK_INTACT', NEW.quantity_delta, 0, 0, 0, 0
      );
      IF v_var_id IS NOT NULL THEN
        UPDATE product_variants SET stock = stock + NEW.quantity_delta, updated_at = NOW() WHERE variant_id = v_var_id;
      ELSE
        UPDATE products SET stock = stock + NEW.quantity_delta, updated_at = NOW() WHERE id = v_prod_id;
      END IF;

    WHEN 'QC_REJECTED_DAMAGED' THEN
      v_avail := (v_sli.quantity_customer_return_received + v_sli.quantity_courier_damaged_received)
                 - v_sli.quantity_returned_resellable - v_sli.quantity_returned_damaged;
      IF NEW.quantity_delta > v_avail THEN
        RAISE EXCEPTION 'QC_REJECTION_EXCEEDS_PENDING_INSPECTION: avail=%, delta=%', v_avail, NEW.quantity_delta USING ERRCODE = '23514';
      END IF;
      UPDATE shipment_line_items SET quantity_returned_damaged = quantity_returned_damaged + NEW.quantity_delta, updated_at = NOW()
      WHERE shipment_item_id = NEW.shipment_item_id;
      INSERT INTO inventory_ledger_movements (
        movement_id, idempotency_key, product_id, variant_id, order_id, line_item_id, shipment_item_id, return_event_id,
        movement_type, delta_sellable_stock, delta_reserved_stock, delta_damaged_stock, delta_courier_lost_stock, delta_courier_damaged_unreturned_stock
      ) VALUES (
        'mov_' || NEW.return_event_id, 'return_evt:' || NEW.idempotency_key,
        v_prod_id, v_var_id, NEW.order_id, NEW.line_item_id, NEW.shipment_item_id, NEW.return_event_id,
        'RETURN_DAMAGED_WRITEOFF', 0, 0, NEW.quantity_delta, 0, 0
      );
      IF v_var_id IS NOT NULL THEN
        UPDATE product_variants SET damaged_stock = damaged_stock + NEW.quantity_delta, updated_at = NOW() WHERE variant_id = v_var_id;
      ELSE
        UPDATE products SET damaged_stock = damaged_stock + NEW.quantity_delta, updated_at = NOW() WHERE id = v_prod_id;
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_shipment_return_event ON shipment_return_events;
CREATE TRIGGER trg_apply_shipment_return_event
AFTER INSERT ON shipment_return_events
FOR EACH ROW EXECUTE FUNCTION apply_shipment_return_event();

CREATE OR REPLACE FUNCTION reconcile_order_line_shipment_quantities() RETURNS TRIGGER AS $$
DECLARE
  affected_line_ids VARCHAR(64)[];
  lid VARCHAR(64);
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_line_ids := ARRAY[OLD.line_item_id];
  ELSIF TG_OP = 'INSERT' THEN
    affected_line_ids := ARRAY[NEW.line_item_id];
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.line_item_id IS DISTINCT FROM NEW.line_item_id THEN
      SELECT ARRAY_AGG(x ORDER BY x ASC) INTO affected_line_ids
      FROM (SELECT UNNEST(ARRAY[OLD.line_item_id, NEW.line_item_id]) AS x) s;
    ELSE
      affected_line_ids := ARRAY[NEW.line_item_id];
    END IF;
  END IF;

  PERFORM 1 FROM order_line_items WHERE line_item_id = ANY(affected_line_ids) ORDER BY line_item_id ASC FOR UPDATE;

  FOREACH lid IN ARRAY affected_line_ids LOOP
    UPDATE order_line_items oli
    SET quantity_allocated = COALESCE((SELECT SUM(sli.quantity_allocated) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_shipped = COALESCE((SELECT SUM(sli.quantity_shipped) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_lost_by_courier = COALESCE((SELECT SUM(sli.quantity_lost_by_courier) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_courier_damaged_reported = COALESCE((SELECT SUM(sli.quantity_courier_damaged_reported) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_courier_damaged_received = COALESCE((SELECT SUM(sli.quantity_courier_damaged_received) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_courier_damaged_settled_unreturned = COALESCE((SELECT SUM(sli.quantity_courier_damaged_settled_unreturned) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_delivered = COALESCE((SELECT SUM(sli.quantity_delivered) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_returned_by_customer = COALESCE((SELECT SUM(sli.quantity_returned_by_customer) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_customer_return_received = COALESCE((SELECT SUM(sli.quantity_customer_return_received) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_returned_resellable = COALESCE((SELECT SUM(sli.quantity_returned_resellable) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        quantity_returned_damaged = COALESCE((SELECT SUM(sli.quantity_returned_damaged) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0),
        reservation_state = CASE
          WHEN oli.quantity_cancelled = oli.quantity_ordered THEN 'released_on_cancel'
          WHEN COALESCE((SELECT SUM(sli.quantity_returned_by_customer + sli.quantity_lost_by_courier + sli.quantity_courier_damaged_reported) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0) = oli.quantity_ordered - oli.quantity_cancelled
               AND oli.quantity_ordered > oli.quantity_cancelled THEN 'returned'
          WHEN COALESCE((SELECT SUM(sli.quantity_returned_by_customer + sli.quantity_lost_by_courier + sli.quantity_courier_damaged_reported) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0) > 0 THEN 'partially_returned'
          WHEN COALESCE((SELECT SUM(sli.quantity_shipped) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0) = oli.quantity_ordered - oli.quantity_cancelled
               AND oli.quantity_ordered > oli.quantity_cancelled THEN 'fulfilled'
          WHEN COALESCE((SELECT SUM(sli.quantity_shipped) FROM shipment_line_items sli WHERE sli.line_item_id = lid), 0) > 0 THEN 'partially_fulfilled'
          ELSE 'reserved'
        END
    WHERE oli.line_item_id = lid;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reconcile_shipment_line_quantities ON shipment_line_items;
CREATE TRIGGER trg_reconcile_shipment_line_quantities
AFTER INSERT OR UPDATE OF
  line_item_id, quantity_allocated, quantity_deallocated, quantity_shipped,
  quantity_lost_by_courier, quantity_courier_damaged_reported, quantity_courier_damaged_received,
  quantity_courier_damaged_settled_unreturned, quantity_delivered, quantity_returned_by_customer,
  quantity_customer_return_received, quantity_returned_resellable, quantity_returned_damaged
OR DELETE ON shipment_line_items
FOR EACH ROW EXECUTE FUNCTION reconcile_order_line_shipment_quantities();

-- ============================================================================
-- E. DYNAMIC SUBSCRIPTION PLANS, PRICING GOVERNANCE & NON-DESTRUCTIVE QUOTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_pricing_governance (
  governance_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (governance_id = 1),
  launch_mode VARCHAR(32) NOT NULL DEFAULT 'FREE_ONLY'
    CHECK (launch_mode IN ('FREE_ONLY', 'SELECTIVE_PAID', 'FULL_COMMERCIAL', 'CUSTOM')),
  paid_upgrades_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_launch_expiration TIMESTAMPTZ NULL DEFAULT NULL,
  default_signup_plan_code VARCHAR(32) NOT NULL DEFAULT 'Free',
  updated_by VARCHAR(64) NOT NULL DEFAULT 'adm_super_owner',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_pricing_governance (governance_id, launch_mode, paid_upgrades_enabled, auto_launch_expiration, default_signup_plan_code)
VALUES (1, 'FREE_ONLY', FALSE, NULL, 'Free')
ON CONFLICT (governance_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_code VARCHAR(32) PRIMARY KEY,
  display_name VARCHAR(64) NOT NULL,
  tier_classification VARCHAR(32) NOT NULL CHECK (tier_classification IN ('launch_free', 'commercial_paid')),
  lifecycle_state VARCHAR(24) NOT NULL DEFAULT 'active'
    CHECK (lifecycle_state IN ('active', 'hidden', 'disabled', 'retired')),
  is_publicly_visible BOOLEAN NOT NULL DEFAULT FALSE,
  allow_new_subscriptions BOOLEAN NOT NULL DEFAULT FALSE,
  allow_upgrades_to BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_dzd BIGINT NOT NULL DEFAULT 0 CHECK (monthly_dzd >= 0),
  annual_dzd BIGINT NOT NULL DEFAULT 0 CHECK (annual_dzd >= 0),
  monthly_usd NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (monthly_usd >= 0),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_entitlements (
  plan_code VARCHAR(32) PRIMARY KEY REFERENCES subscription_plans(plan_code) ON DELETE CASCADE,
  max_active_products INT NULL, -- NULL = unlimited
  max_photos_per_product INT NOT NULL DEFAULT 3,
  max_file_size_mb INT NOT NULL DEFAULT 5,
  allow_video_stream BOOLEAN NOT NULL DEFAULT FALSE,
  max_custom_domains INT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_migration_policies (
  policy_id VARCHAR(64) PRIMARY KEY,
  retired_plan_code VARCHAR(32) NOT NULL REFERENCES subscription_plans(plan_code),
  target_plan_code VARCHAR(32) NOT NULL REFERENCES subscription_plans(plan_code),
  grace_period_days INT NOT NULL DEFAULT 30 CHECK (grace_period_days >= 0),
  preserve_existing_resources BOOLEAN NOT NULL DEFAULT TRUE CHECK (preserve_existing_resources = TRUE),
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchant_subscriptions (
  subscription_id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL UNIQUE REFERENCES stores(id) ON DELETE RESTRICT,
  plan_code VARCHAR(32) NOT NULL REFERENCES subscription_plans(plan_code),
  status VARCHAR(24) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'grace_period', 'expired')),
  over_quota_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Launch Posture: FREE_ONLY
INSERT INTO subscription_plans (plan_code, display_name, tier_classification, lifecycle_state, is_publicly_visible, allow_new_subscriptions, allow_upgrades_to, monthly_dzd, annual_dzd, monthly_usd, sort_order)
VALUES
  ('Free', 'Free Launch Tier', 'launch_free', 'active', TRUE, TRUE, FALSE, 0, 0, 0.00, 0),
  ('Basic', 'Basic', 'commercial_paid', 'hidden', FALSE, FALSE, FALSE, 1900, 19000, 9.00, 1),
  ('Pro', 'Pro', 'commercial_paid', 'hidden', FALSE, FALSE, FALSE, 4900, 49000, 24.00, 2),
  ('Pro Plus', 'Pro Plus', 'commercial_paid', 'hidden', FALSE, FALSE, FALSE, 8900, 89000, 44.00, 3),
  ('Premium', 'Premium', 'commercial_paid', 'hidden', FALSE, FALSE, FALSE, 14900, 149000, 74.00, 4),
  ('Premium Plus', 'Premium Plus', 'commercial_paid', 'hidden', FALSE, FALSE, FALSE, 24900, 249000, 129.00, 5)
ON CONFLICT (plan_code) DO NOTHING;

INSERT INTO plan_entitlements (plan_code, max_active_products, max_photos_per_product, max_file_size_mb, allow_video_stream, max_custom_domains)
VALUES
  ('Free', 25, 3, 5, FALSE, 0),
  ('Basic', 50, 5, 8, FALSE, 0),
  ('Pro', 250, 8, 15, TRUE, 1),
  ('Pro Plus', 1000, 12, 25, TRUE, 3),
  ('Premium', 5000, 15, 50, TRUE, 10),
  ('Premium Plus', NULL, 20, 100, TRUE, NULL)
ON CONFLICT (plan_code) DO NOTHING;

-- ============================================================================
-- F. POSITIVE EUCLIDEAN MODULO MEDIA INVENTORY & DURABILITY TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_assets (
  asset_id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) NULL REFERENCES products(id) ON DELETE SET NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type VARCHAR(64) NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0),
  sha256 CHAR(64) NOT NULL,
  durability_state VARCHAR(32) NOT NULL DEFAULT 'QUEUED'
    CHECK (durability_state IN (
      'QUEUED', 'IN_PROGRESS', 'REPLICATED',
      'CHECKSUM_VERIFIED', 'BACKUP_VERIFIED', 'RESTORE_TESTED', 'FAILED'
    )),
  audit_shard_id SMALLINT GENERATED ALWAYS AS (MOD(MOD(hashtext(asset_id), 7) + 7, 7)) STORED
    CHECK (audit_shard_id BETWEEN 0 AND 6),
  last_audited_cycle_id BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_shard_cursor ON media_assets(audit_shard_id, asset_id) WHERE last_audited_cycle_id IS NULL;

CREATE TABLE IF NOT EXISTS media_shard_audit_runs (
  cycle_id BIGINT NOT NULL,
  shard_id SMALLINT NOT NULL CHECK (shard_id BETWEEN 0 AND 6),
  last_scanned_asset_id VARCHAR(64) NOT NULL DEFAULT '',
  status VARCHAR(24) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
  assets_verified_count BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  PRIMARY KEY (cycle_id, shard_id)
);

-- ============================================================================
-- G. 4 MB CHUNKED LEGACY MIGRATION ARCHIVE, QUARANTINE & RECONCILIATION LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS migration_source_file_snapshots (
  snapshot_id VARCHAR(64) PRIMARY KEY,
  source_path TEXT NOT NULL,
  original_file_byte_length BIGINT NOT NULL CHECK (original_file_byte_length >= 0),
  original_file_sha256 CHAR(64) NOT NULL,
  chunk_size_bytes INT NOT NULL DEFAULT 4194304,
  total_chunks INT NOT NULL CHECK (total_chunks >= 0),
  local_archive_path TEXT NOT NULL,
  worm_object_uri TEXT NULL,
  reassembly_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS migration_source_file_chunks (
  snapshot_id VARCHAR(64) NOT NULL REFERENCES migration_source_file_snapshots(snapshot_id) ON DELETE RESTRICT,
  chunk_index INT NOT NULL CHECK (chunk_index >= 0),
  byte_length INT NOT NULL CHECK (byte_length > 0 AND byte_length <= 4194304),
  chunk_sha256 CHAR(64) NOT NULL,
  chunk_bytes BYTEA NOT NULL,
  CHECK (byte_length = octet_length(chunk_bytes)),
  CHECK (chunk_sha256 = encode(sha256(chunk_bytes), 'hex')),
  PRIMARY KEY (snapshot_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS migration_raw_source_archive (
  archive_row_id BIGSERIAL PRIMARY KEY,
  snapshot_id VARCHAR(64) NOT NULL REFERENCES migration_source_file_snapshots(snapshot_id) ON DELETE RESTRICT,
  original_file_sha256 CHAR(64) NOT NULL,
  collection_name VARCHAR(64) NOT NULL,
  source_index INT NOT NULL,
  source_record_id VARCHAR(128) NULL,
  legacy_row_sha256 CHAR(64) NOT NULL,
  raw_element_utf8_text TEXT NOT NULL,
  parsed_jsonb JSONB NOT NULL,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS migration_quarantine_records (
  quarantine_id VARCHAR(64) PRIMARY KEY,
  snapshot_id VARCHAR(64) NOT NULL REFERENCES migration_source_file_snapshots(snapshot_id),
  collection_name VARCHAR(64) NOT NULL,
  source_record_id VARCHAR(128) NULL,
  reason TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  resolution_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (resolution_status IN ('PENDING', 'RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS migration_reconciliation_ledger (
  run_id VARCHAR(64) PRIMARY KEY,
  snapshot_id VARCHAR(64) NOT NULL REFERENCES migration_source_file_snapshots(snapshot_id),
  all_ten_criteria_passed BOOLEAN NOT NULL,
  checks_json JSONB NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- H. IMMUTABLE SHA-256 HASH-CHAINED AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  chain_index BIGINT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_uid VARCHAR(64) NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  module VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_entity_type VARCHAR(64) NOT NULL,
  target_entity_id VARCHAR(64) NOT NULL,
  market_scope VARCHAR(32) NOT NULL DEFAULT 'ALL_MARKETS',
  inventory_category VARCHAR(64) NULL
    CHECK (inventory_category IS NULL OR inventory_category IN (
      'COURIER_PHYSICAL_LOSS',
      'COURIER_DAMAGED_SETTLED_UNRETURNED',
      'COURIER_DAMAGED_RETURNED_QC',
      'CUSTOMER_RETURN_QC'
    )),
  reason TEXT NOT NULL,
  previous_value JSONB NULL,
  new_value JSONB NULL,
  fencing_epoch BIGINT NOT NULL DEFAULT 1,
  previous_hash VARCHAR(128) NOT NULL,
  integrity_hash CHAR(64) NOT NULL
);

-- ============================================================================
-- I. PRIVACY-PRESERVING STOREFRONT ANALYTICS EVENTS (V2.1)
-- ============================================================================
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
