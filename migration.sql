ALTER TABLE "public"."order_items" ADD COLUMN "color" TEXT;

CREATE TABLE "public"."product_color_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "color_name" TEXT NOT NULL,
    "stock_count" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_color_variants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."product_color_variants" ADD CONSTRAINT "product_color_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
