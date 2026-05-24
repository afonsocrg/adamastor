begin;

-- Rename the "product" category's human label from "Product" to
-- "Product Management" — slug stays the same so URLs (/events/product)
-- and existing event_category_assignments are unaffected. This propagates
-- to page titles, breadcrumbs, JSON-LD, and the filter chip label via the
-- TS source-of-truth in lib/events/categories.ts (this migration just
-- keeps the DB row in sync).
update public.event_categories
set name = 'Product Management'
where slug = 'product';

commit;
