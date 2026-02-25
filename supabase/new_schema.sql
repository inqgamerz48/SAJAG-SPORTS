-- New Schema for Sajag Sports Reverse Logistics
-- Run this in Supabase SQL Editor

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    pincode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Orders Table
CREATE TYPE order_status AS ENUM (
    'Pickup_Pending',
    'In_Workshop',
    'Repairing',
    'Ready_to_Return',
    'Completed'
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- 'Stringing' or 'Frame Repair'
    status order_status NOT NULL DEFAULT 'Pickup_Pending',
    
    -- Payment fields
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    payu_transaction_id TEXT,
    payu_payment_id TEXT,
    final_quote NUMERIC,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Racquet_Specs Table
CREATE TABLE IF NOT EXISTS racquet_specs (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    string_type TEXT,
    tension_lbs INTEGER CHECK (tension_lbs >= 17 AND tension_lbs <= 35),
    knot_type TEXT CHECK (knot_type IN ('2-knot', '4-knot')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Shipments Table (supports Delhivery)
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Delhivery fields
    delhivery_order_id TEXT,
    awb_code TEXT,
    
    -- Delhivery fields
    waybill TEXT,
    pickup_id TEXT,
    delhivery_order_id TEXT,
    
    -- Common fields
    shipment_status TEXT,
    is_reverse BOOLEAN DEFAULT FALSE,
    provider TEXT DEFAULT 'delhivery', -- 'shiprocket' or 'delhivery'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Logistics Config (for API token caching - supports multiple providers)
CREATE TABLE IF NOT EXISTS logistics_config (
    id TEXT PRIMARY KEY, -- e.g., 'delhivery_token', 'shiprocket_token'
    provider TEXT NOT NULL, -- 'delhivery' or 'shiprocket'
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 6. Error Logs Table (for Logistics API failures)
CREATE TABLE IF NOT EXISTS logistics_error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    api_endpoint TEXT,
    error_message TEXT,
    error_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE racquet_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can view own racquet specs" ON racquet_specs FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Users can insert own racquet specs" ON racquet_specs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
);

CREATE POLICY "Users can view own shipments" ON shipments FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
);
