# VEXLUST: production integration steps
1. Prepare PostgreSQL; add DATABASE_URL to Vercel environment (Production and Preview). **Do not commit connection strings.**
2. On an environment with Node 20+ and network access to PostgreSQL run npm ci; npm run db:migrate; npm run import:sexopt.
3. Schedule importer externally (e.g. a secured GitHub Actions runner with DATABASE_URL in repository secrets; import is NOT a web endpoint). Cron timing and permissions must be configured deliberately. Complete import runs through all ~76MB XML.
4. GET /api/catalog supports page, limit, q, category and sort. Without DATABASE_URL it shows only a 240-item supplier preview.
5. For Nova Poshta: generate a free key in the Nova Poshta business account per official instructions; store in Vercel NOVAPOSHTA_API_KEY, not Git. /delivery and /api/shipping then search cities and warehouses.
6. Validate all supplier rights, data quality and inventory; checkout and electronic waybills are **disabled** until seller registration and fulfillment setup.
7. Ensure branch main deploys successfully, inspect logs and test endpoints after each integration.
