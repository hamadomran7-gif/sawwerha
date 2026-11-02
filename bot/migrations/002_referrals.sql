-- 2026-11-02: برنامج الإحالة
ALTER TABLE customers ADD COLUMN ref_code TEXT;
ALTER TABLE customers ADD COLUMN referred_by TEXT;
ALTER TABLE customers ADD COLUMN bonus_samples INTEGER DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_ref ON customers(ref_code) WHERE ref_code IS NOT NULL;
