-- صوّرها — مخطط قاعدة البيانات (Cloudflare D1 / SQLite)
-- التطبيق: npx wrangler d1 execute sawwerha --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS customers (
  phone TEXT PRIMARY KEY,
  name TEXT,
  lang TEXT DEFAULT 'ar',
  state TEXT DEFAULT 'new',
  category TEXT,
  active_order INTEGER,
  samples_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  kind TEXT NOT NULL,              -- sample | package
  package_code TEXT,               -- SINGLE | LAUNCH | SUB_LITE | SUB_CONTENT
  category TEXT,
  status TEXT NOT NULL,            -- awaiting_photos | queued | processing | done | delivered | awaiting_payment | paid | failed | cancelled
  max_inputs INTEGER DEFAULT 1,
  inputs TEXT DEFAULT '[]',        -- JSON: مفاتيح R2 للصور المدخلة
  outputs TEXT DEFAULT '[]',       -- JSON: مفاتيح R2 للصور الناتجة
  price INTEGER DEFAULT 0,         -- بالدرهم
  payment_id TEXT,
  payment_link TEXT,
  revision_note TEXT,
  revisions_used INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone, created_at);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL,         -- in | out
  type TEXT,
  body TEXT,
  wa_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_wa ON messages(wa_id) WHERE wa_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
