-- Inventory snapshot state; remove items missing from a *completed* full feed sync.
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS last_sync_id uuid;
CREATE INDEX IF NOT EXISTS store_products_active_idx ON store_products(is_active);
