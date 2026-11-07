# VEXLUST — release readiness

## Deployed
- Full supplier catalog in Neon PostgreSQL, including product pages, photos, details and search.
- Broad and narrow product categories, price/brand filters, saved favorites.
- Same-family recommendations scored by brand, name, product specifications and proximity in price.
- Separate cart and checkout previews, Nova Poshta city/warehouse lookup.
- Neon Auth sign-in/sign-up and account area. Device-local wishlist and draft orders are explicitly labeled as such.
- Authenticated daily supplier synchronization at 03:15 UTC through Vercel Cron.
- Order intake server endpoint is feature-gated and **OFF**; no card payment, fiscal receipt, or supplier dispatch can be triggered.

## Before accepting actual orders
1. Formally register seller, verify consumer rights/returns policies, product documentation, tax obligations and privacy policy with counsel/accountant in Ukraine.
2. Verify the supplier permits use of their feed and images; obtain a fulfillment contract, API/order format and reliable inventory updates.
3. Integrate fiscalization (PRRO) and a permitted payment provider or compliant COD flow.
4. Add validated phone/address handling, account deletion/data retention, admin permissioning, order notification and operational monitoring.
5. Increase stock sync frequency so freshness checks never block regular sales; Hobby cron runs at most daily, while the server requires a snapshot no older than two hours.
6. Reconcile every order with supplier availability and verify Nova Poshta shipping reference before generating a TTN.
7. Move hosting to a commercial-appropriate Vercel plan when commercial activity begins.
8. Only after end-to-end tests and compliance approval configure:
   ENABLE_LIVE_CHECKOUT=true, SELLER_REGISTERED=true, PRRO_CONNECTED=true,
   SUPPLIER_FULFILLMENT_READY=true, SUPPLIER_STOCK_SYNC_READY=true.
   These flags are not proof of readiness; verification is still needed.

## Security
Never commit DATABASE_URL, NEON_AUTH_COOKIE_SECRET, NOVAPOSHTA_API_KEY or CRON_SECRET. The cron endpoint rejects requests without a matching bearer token. All order prices are re-read server-side. Live payment and shipment APIs remain unimplemented.
