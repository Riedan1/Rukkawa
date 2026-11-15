-- ============================================================================
-- MIG-INV-01: Historical Records Migration & Separation of Courier Physical Loss
-- vs. Courier Damaged Settled Unreturned vs. Warehouse QC Damaged Stock
-- Repeatable transactional migration with pre/post non-mutating invariants
-- ============================================================================

BEGIN;

-- 1. Non-Destructive Additive Columns (if upgrading from prior schema version)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS courier_lost_stock INT NOT NULL DEFAULT 0 CHECK (courier_lost_stock >= 0),
  ADD COLUMN IF NOT EXISTS courier_damaged_unreturned_stock INT NOT NULL DEFAULT 0 CHECK (courier_damaged_unreturned_stock >= 0);

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS courier_lost_stock INT NOT NULL DEFAULT 0 CHECK (courier_lost_stock >= 0),
  ADD COLUMN IF NOT EXISTS courier_damaged_unreturned_stock INT NOT NULL DEFAULT 0 CHECK (courier_damaged_unreturned_stock >= 0);

ALTER TABLE inventory_ledger_movements
  ADD COLUMN IF NOT EXISTS delta_courier_damaged_unreturned_stock INT NOT NULL DEFAULT 0;

-- 2. Capture Pre-Migration Checksums for Stock, Reserved, and Damaged Stock
CREATE TEMP TABLE _mig_inv_01_baseline AS
SELECT
  COALESCE(SUM(stock), 0) AS sum_stock,
  COALESCE(SUM(reserved_stock), 0) AS sum_reserved_stock,
  COALESCE(SUM(damaged_stock), 0) AS sum_damaged_stock
FROM products;

-- 3. Reclassify any historical COURIER_DAMAGE_CLAIM_SETTLED_UNRETURNED rows
--    from delta_courier_lost_stock -> delta_courier_damaged_unreturned_stock
UPDATE inventory_ledger_movements
SET delta_courier_damaged_unreturned_stock = delta_courier_damaged_unreturned_stock + delta_courier_lost_stock,
    delta_courier_lost_stock = 0
WHERE movement_type = 'COURIER_DAMAGE_CLAIM_SETTLED_UNRETURNED'
  AND delta_courier_lost_stock > 0;

-- 4. Recompute Product Variants strictly from Authoritative Ledger Sums
UPDATE product_variants pv
SET courier_lost_stock = COALESCE((
      SELECT SUM(m.delta_courier_lost_stock)
      FROM inventory_ledger_movements m
      WHERE m.variant_id = pv.variant_id
    ), 0),
    courier_damaged_unreturned_stock = COALESCE((
      SELECT SUM(m.delta_courier_damaged_unreturned_stock)
      FROM inventory_ledger_movements m
      WHERE m.variant_id = pv.variant_id
    ), 0),
    updated_at = NOW();

-- 5. Recompute Non-Variant Products strictly from Authoritative Ledger Sums
UPDATE products p
SET courier_lost_stock = COALESCE((
      SELECT SUM(m.delta_courier_lost_stock)
      FROM inventory_ledger_movements m
      WHERE m.product_id = p.id
    ), 0),
    courier_damaged_unreturned_stock = COALESCE((
      SELECT SUM(m.delta_courier_damaged_unreturned_stock)
      FROM inventory_ledger_movements m
      WHERE m.product_id = p.id
    ), 0),
    updated_at = NOW()
WHERE p.has_variants = FALSE;

-- 6. Verify 0 Variance Across stock, reserved_stock, and damaged_stock
DO $$
DECLARE
  v_before RECORD;
  v_after RECORD;
BEGIN
  SELECT * INTO v_before FROM _mig_inv_01_baseline;
  SELECT
    COALESCE(SUM(stock), 0) AS sum_stock,
    COALESCE(SUM(reserved_stock), 0) AS sum_reserved_stock,
    COALESCE(SUM(damaged_stock), 0) AS sum_damaged_stock
  INTO v_after FROM products;

  IF v_before.sum_stock <> v_after.sum_stock
     OR v_before.sum_reserved_stock <> v_after.sum_reserved_stock
     OR v_before.sum_damaged_stock <> v_after.sum_damaged_stock THEN
    RAISE EXCEPTION 'MIG_INV_01_INVARIANT_VIOLATION: Sellable/Reserved/Damaged sums altered during reclassification!';
  END IF;
END $$;

COMMIT;
