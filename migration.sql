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

-- Razorpay + Shiprocket checkout flow alignment
ALTER TYPE "public"."OrderStatus" ADD VALUE IF NOT EXISTS 'Manual_Fulfillment_Required';

ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "service_type" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "customer_name" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "customer_email" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "customer_phone" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "address_line1" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "pincode" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "logistics_deposit" DECIMAL(10, 2);
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "razorpay_order_id" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "razorpay_signature" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "reverse_pickup_booked_at" TIMESTAMP(3);

ALTER TABLE "public"."orders" DROP COLUMN IF EXISTS "payu_transaction_id";
ALTER TABLE "public"."orders" DROP COLUMN IF EXISTS "payu_payment_id";

-- Capture full customer choice on each order item so admin can audit later
ALTER TABLE "public"."order_items" ADD COLUMN IF NOT EXISTS "string_name" TEXT;
ALTER TABLE "public"."order_items" ADD COLUMN IF NOT EXISTS "comments" TEXT;
ALTER TABLE "public"."order_items" ADD COLUMN IF NOT EXISTS "repair_image_url" TEXT;
