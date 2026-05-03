-- =============================================================================
-- Admin panel: capture string choice, customer notes and uploaded photo URL
-- on every order item, so the admin can see exactly what each customer ordered.
--
-- Safe to run multiple times. Apply via the Supabase SQL editor (or psql) once.
-- =============================================================================

ALTER TABLE "public"."order_items"
    ADD COLUMN IF NOT EXISTS "string_name" TEXT;

ALTER TABLE "public"."order_items"
    ADD COLUMN IF NOT EXISTS "comments" TEXT;

ALTER TABLE "public"."order_items"
    ADD COLUMN IF NOT EXISTS "repair_image_url" TEXT;
