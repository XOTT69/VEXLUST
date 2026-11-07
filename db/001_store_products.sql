-- Database-backed, searchable product listing. Run before npm run import:sexopt
CREATE TABLE IF NOT EXISTS store_products(
 id text PRIMARY KEY,
 name text NOT NULL,
 category text NOT NULL,
 sku text NOT NULL DEFAULT '',
 price numeric(12,2) NOT NULL CHECK(price>=0),
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS store_products_category_idx ON store_products(category);
CREATE INDEX IF NOT EXISTS store_products_name_idx ON store_products(name);
CREATE INDEX IF NOT EXISTS store_products_price_idx ON store_products(price);
CREATE INDEX IF NOT EXISTS store_products_updated_idx ON store_products(updated_at DESC);
CREATE INDEX IF NOT EXISTS store_products_search_idx ON store_products USING gin(to_tsvector('simple',name || ' ' || sku));
