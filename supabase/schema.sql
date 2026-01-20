-- Sajag Sports Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Racquets Database (Whitelist of approved high-end racquets)
CREATE TABLE IF NOT EXISTS racquets_db (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    image_url TEXT,
    approx_price DECIMAL(10, 2) NOT NULL CHECK (approx_price >= 2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand, model)
);

-- Pune Pincodes (Valid pincodes for stringing service)
CREATE TABLE IF NOT EXISTS pune_pincodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pincode VARCHAR(6) NOT NULL UNIQUE,
    area_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('stringing', 'repair')),
    status VARCHAR(50) NOT NULL DEFAULT 'analyzing' CHECK (status IN (
        'analyzing',
        'approved_for_pickup',
        'in_surgery',
        'ready_for_stringing',
        'completed',
        'rejected',
        'refunded'
    )),
    logistics_mode VARCHAR(30) CHECK (logistics_mode IN ('pune_local', 'shiprocket_pan_india')),
    
    -- Racquet Information
    racquet_id UUID REFERENCES racquets_db(id),
    racquet_brand VARCHAR(100),
    racquet_model VARCHAR(200),
    racquet_price DECIMAL(10, 2),
    
    -- Address & Contact
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    
    -- Service Specifics
    -- For Stringing
    tension_lbs DECIMAL(4, 1) CHECK (tension_lbs >= 20 AND tension_lbs <= 32),
    string_type VARCHAR(100),
    
    -- For Repair
    crack_location TEXT, -- JSON or text description
    repair_notes TEXT,
    
    -- Payment & Logistics
    logistics_deposit DECIMAL(10, 2) DEFAULT 199.00,
    final_quote DECIMAL(10, 2),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded')),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    
    -- Shiprocket Integration
    shiprocket_awb_code VARCHAR(100),
    shiprocket_order_id VARCHAR(255),
    shiprocket_status VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Media Evidence (Before/After images)
CREATE TABLE IF NOT EXISTS media_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('before', 'after', 'crack_angle_1', 'crack_angle_2', 'crack_angle_3')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- String Inventory
CREATE TABLE IF NOT EXISTS string_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    string_type VARCHAR(100) NOT NULL UNIQUE,
    remaining_meters DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_meters DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Waitlist (For coming soon store)
CREATE TABLE IF NOT EXISTS store_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to auto-reject stringing orders outside Pune
CREATE OR REPLACE FUNCTION check_pune_pincode()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.service_type = 'stringing' THEN
        IF NOT EXISTS (
            SELECT 1 FROM pune_pincodes WHERE pincode = NEW.pincode
        ) THEN
            NEW.status := 'rejected';
            RAISE NOTICE 'Order rejected: Stringing service only available in Pune. Pincode % is not in Pune pincodes list.', NEW.pincode;
        ELSE
            NEW.logistics_mode := 'pune_local';
        END IF;
    ELSIF NEW.service_type = 'repair' THEN
        NEW.logistics_mode := 'shiprocket_pan_india';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check pincode on order insert/update
CREATE TRIGGER validate_pune_pincode
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION check_pune_pincode();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_racquets_updated_at BEFORE UPDATE ON racquets_db
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_string_inventory_updated_at BEFORE UPDATE ON string_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_pincode ON orders(pincode);
CREATE INDEX IF NOT EXISTS idx_media_evidence_order_id ON media_evidence(order_id);
CREATE INDEX IF NOT EXISTS idx_pune_pincodes_pincode ON pune_pincodes(pincode);

-- Row Level Security (RLS) Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can insert into waitlist
CREATE POLICY "Public can insert into waitlist" ON store_waitlist
    FOR INSERT WITH CHECK (true);

-- Admin policies (adjust based on your admin role setup)
-- CREATE POLICY "Admins can view all orders" ON orders
--     FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Insert sample Pune pincodes
INSERT INTO pune_pincodes (pincode, area_name) VALUES
('411001', 'Pune City'),
('411002', 'Pune Camp'),
('411003', 'Shivajinagar'),
('411004', 'Deccan Gymkhana'),
('411005', 'Kothrud'),
('411006', 'Karve Nagar'),
('411007', 'Aundh'),
('411008', 'Baner'),
('411009', 'Hinjewadi'),
('411010', 'Wakad'),
('411011', 'Pimpri'),
('411012', 'Chinchwad'),
('411013', 'Bhosari'),
('411014', 'Nigdi'),
('411015', 'Akurdi'),
('411016', 'Ravet'),
('411017', 'Talegaon'),
('411018', 'Lonavala'),
('411019', 'Kharadi'),
('411020', 'Viman Nagar'),
('411021', 'Kalyani Nagar'),
('411022', 'Koregaon Park'),
('411023', 'Magarpatta'),
('411024', 'Hadapsar'),
('411025', 'Wanowrie'),
('411026', 'Kondhwa'),
('411027', 'Mohammedwadi'),
('411028', 'Katraj'),
('411029', 'Dhankawadi'),
('411030', 'Sinhagad Road'),
('411031', 'Warje'),
('411032', 'Bavdhan'),
('411033', 'Sus'),
('411034', 'Maan'),
('411035', 'Hinjewadi Phase 1'),
('411036', 'Hinjewadi Phase 2'),
('411037', 'Hinjewadi Phase 3'),
('411038', 'Balewadi'),
('411039', 'Baner-Balewadi'),
('411040', 'Sus Road'),
('411041', 'Pashan'),
('411042', 'Susgaon'),
('411043', 'Nanded City'),
('411044', 'Wagholi'),
('411045', 'Keshavnagar'),
('411046', 'Mundhwa'),
('411047', 'Kharadi IT Park'),
('411048', 'Vishrantwadi'),
('411049', 'Yerawada'),
('411050', 'Kalyani Nagar Extension')
ON CONFLICT (pincode) DO NOTHING;

-- Insert sample high-end racquets
INSERT INTO racquets_db (brand, model, approx_price, image_url) VALUES
('Yonex', 'Astrox 100 ZZ', 18990.00, NULL),
('Yonex', 'Astrox 99 Pro', 17990.00, NULL),
('Yonex', 'Astrox 88D Pro', 16990.00, NULL),
('Yonex', 'Astrox 88S Pro', 16990.00, NULL),
('Yonex', 'Nanoflare 1000Z', 18990.00, NULL),
('Yonex', 'Nanoflare 800', 14990.00, NULL),
('Yonex', 'Arcsaber 11 Pro', 17990.00, NULL),
('Yonex', 'Duora Z-Strike', 15990.00, NULL),
('Victor', 'Auraspeed 100X', 14990.00, NULL),
('Victor', 'Thruster F Claw', 16990.00, NULL),
('Li-Ning', 'N9 II', 15990.00, NULL),
('Li-Ning', 'N7 II', 14990.00, NULL),
('Babolat', 'Satelite Gravity 74', 12990.00, NULL),
('Babolat', 'Satelite Gravity 74 Light', 11990.00, NULL)
ON CONFLICT (brand, model) DO NOTHING;

-- Insert sample string inventory
INSERT INTO string_inventory (string_type, remaining_meters, total_meters) VALUES
('BG65', 200.00, 200.00),
('BG80', 150.00, 200.00),
('BG66 Ultimax', 180.00, 200.00),
('Exbolt 63', 120.00, 200.00),
('Aerosonic', 100.00, 200.00),
('Nanogy 95', 90.00, 200.00)
ON CONFLICT (string_type) DO NOTHING;
