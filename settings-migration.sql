-- settings-migration.sql
-- 1. Drop existing system_settings table if it exists
DROP TABLE IF EXISTS "public"."system_settings" CASCADE;

-- 2. Create system_settings table with key as primary key
CREATE TABLE "public"."system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- 3. Seed default values for pricing and threshold configuration
INSERT INTO "public"."system_settings" ("key", "value") VALUES 
('price_per_crack_below_threshold', '550'),
('price_per_crack_above_threshold', '850'),
('racquet_value_threshold', '4000')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";
