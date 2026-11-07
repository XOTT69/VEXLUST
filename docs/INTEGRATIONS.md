# Integration roadmap (disabled until approved)

1. Supplier feed: obtain approved feed URL and terms. Restrict fetches to allowlisted hostnames, enforce size/time limits, normalize SKU, price in kopecks and stock, sync idempotently. Never trust HTML or external URLs in feeds.
2. Database: provision PostgreSQL; execute db/schema.sql; implement migrations, service-level access controls and backup policy.
3. Payments: obtain written approval for intimate products, use provider-hosted payment flow, verify signed webhooks and total/currency, guarantee idempotency. Never store raw card details.
4. Fiscal receipts: integrate compliant Ukrainian PRRO service before collecting real card payments.
5. Shipping: Nova Poshta API for branches, shipping labels and tracking. Confirm sender identity, neutral packaging and returns with each supplier.
6. Customer privacy: protect personal data, retention/deletion policies, authentication, email/SMS opt-in, production-ready age compliance.
7. Checkout and supplier fulfillment stay DISABLED in v0.1.
