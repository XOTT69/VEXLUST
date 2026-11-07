# SexOpt integration — preview mode

Source: https://sexopt.com.ua/ua/vygruzki/ . Supplier publishes Ukrainian XML for product listings. Current implementation fetches server-side from fixed URL https://smtm.com.ua/_prices/import-retail-ua-2.xml , parses candidate YML/XML records and returns up to 300 items in GET /api/catalog. 2-hour source revalidation and hourly CDN cache. Product fields may vary; verify mappings with actual feed response and add tests before launch.

Failure is explicit 503; never show mock stock as if real. Price and stock are supplier-provided and not a binding offer. Frontend checkout remains disabled pending registration, provider approval and full legal compliance. Confirm drop-shipping partnership and image rights before commercial use.

Next steps: inspect real XML, strict schema mapping, full daily snapshot and incremental stock updates, category mapping, real product pages, database, permissioned dashboard, checkout, fiscalization and fulfillment.
