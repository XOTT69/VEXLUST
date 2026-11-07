# SexOpt — streaming XML catalog
Source feed: https://smtm.com.ua/_prices/import-retail-ua-2.xml (published at https://sexopt.com.ua/ua/vygruzki/).

The complete feed is about 76MB (observed in Vercel runtime logs, Nov 7 2026). Never buffer it entirely. SAX streaming reader parses up to 240 in-stock products from the beginning and cancels the HTTP stream early (maximum 25 MB). No full-file Next.js fetch caching. A production full-index import must run separately in a background job into PostgreSQL, followed by incremental price/stock sync. Photo copyrights and supplier agreement need verification before commercial use.

Checkout, payments and fulfillment remain disabled. Product names, prices and images are raw supplier data, not guaranteed up-to-date.