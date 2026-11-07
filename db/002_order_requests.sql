-- Prepared order requests; no payment or fulfillment automation.
CREATE TABLE IF NOT EXISTS store_order_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id text NOT NULL,
 idempotency_key uuid NOT NULL,
 contact_name text NOT NULL,
 contact_email text NOT NULL,
 contact_phone text NOT NULL,
 city_ref uuid NOT NULL,
 warehouse_ref uuid NOT NULL,
 city_name text NOT NULL,
 warehouse_name text NOT NULL,
 items jsonb NOT NULL,
 total_kopecks bigint NOT NULL CHECK(total_kopecks>0),
 status text NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','confirmed','cancelled','fulfilled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS store_order_requests_user_idx ON store_order_requests(user_id,created_at DESC);
