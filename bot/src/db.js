// طبقة الوصول إلى D1

export async function getCustomer(db, phone) {
  return db.prepare("SELECT * FROM customers WHERE phone = ?").bind(phone).first();
}

export async function ensureCustomer(db, phone, name) {
  let c = await getCustomer(db, phone);
  if (!c) {
    await db.prepare("INSERT INTO customers (phone, name, state) VALUES (?, ?, 'new')").bind(phone, name || null).run();
    c = await getCustomer(db, phone);
    c.isNew = true;
  } else {
    await db.prepare("UPDATE customers SET last_seen = datetime('now'), name = COALESCE(?, name) WHERE phone = ?").bind(name || null, phone).run();
  }
  return c;
}

export async function updateCustomer(db, phone, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  await db.prepare(`UPDATE customers SET ${sets} WHERE phone = ?`).bind(...keys.map((k) => fields[k]), phone).run();
}

export async function getOrder(db, id) {
  return id ? db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first() : null;
}

export async function activeOrder(db, customer) {
  if (!customer.active_order) return null;
  const o = await getOrder(db, customer.active_order);
  if (!o || ["cancelled", "failed"].includes(o.status)) return null;
  return o;
}

export async function insertOrder(db, o) {
  const r = await db
    .prepare(
      "INSERT INTO orders (phone, kind, package_code, category, status, max_inputs, inputs, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id"
    )
    .bind(o.phone, o.kind, o.package_code || null, o.category || null, o.status, o.max_inputs || 1, JSON.stringify(o.inputs || []), o.price || 0)
    .first();
  return r.id;
}

export async function updateOrder(db, id, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = ?`).join(", ") + ", updated_at = datetime('now')";
  await db.prepare(`UPDATE orders SET ${sets} WHERE id = ?`).bind(...keys.map((k) => fields[k]), id).run();
}

/** يسجّل رسالة ويعيد false إذا كانت مكررة (نفس معرّف واتساب). */
export async function logMessage(db, { phone, direction, type, body, waId }) {
  try {
    await db
      .prepare("INSERT INTO messages (phone, direction, type, body, wa_id) VALUES (?, ?, ?, ?, ?)")
      .bind(phone, direction, type || null, (body || "").slice(0, 2000), waId || null)
      .run();
    return true;
  } catch (e) {
    if (String(e.message || e).includes("UNIQUE")) return false;
    throw e;
  }
}

export async function getMeta(db, key) {
  const r = await db.prepare("SELECT value FROM meta WHERE key = ?").bind(key).first();
  return r ? r.value : null;
}
export async function setMeta(db, key, value) {
  await db.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(key, String(value)).run();
}

/** يلتقط أقدم طلب في الطابور ويعلّمه قيد المعالجة (ذرّياً قدر الإمكان). */
export async function claimNextJob(db) {
  const o = await db.prepare("SELECT * FROM orders WHERE status = 'queued' ORDER BY CASE kind WHEN 'package' THEN 0 ELSE 1 END, created_at LIMIT 1").first();
  if (!o) return null;
  const r = await db
    .prepare("UPDATE orders SET status = 'processing', attempts = attempts + 1, updated_at = datetime('now') WHERE id = ? AND status = 'queued'")
    .bind(o.id)
    .run();
  if (!r.meta || r.meta.changes === 0) return null;
  return getOrder(db, o.id);
}

export async function report(db, days = 7) {
  const since = `-${Number(days) || 7} days`;
  const q = (sql, ...b) => db.prepare(sql).bind(...b).first();
  const [newCustomers, samples, paidOrders, revenue, delivered, queue, failed, pendingPay] = await Promise.all([
    q("SELECT COUNT(*) n FROM customers WHERE created_at >= datetime('now', ?)", since),
    q("SELECT COUNT(*) n FROM orders WHERE kind='sample' AND created_at >= datetime('now', ?)", since),
    q("SELECT COUNT(*) n FROM orders WHERE kind='package' AND status IN ('paid','queued','processing','done','delivered') AND price>0 AND created_at >= datetime('now', ?)", since),
    q("SELECT COALESCE(SUM(price),0) s FROM orders WHERE kind='package' AND status IN ('paid','queued','processing','done','delivered') AND created_at >= datetime('now', ?)", since),
    q("SELECT COUNT(*) n FROM orders WHERE status='delivered' AND delivered_at >= datetime('now', ?)", since),
    q("SELECT COUNT(*) n FROM orders WHERE status IN ('queued','processing')"),
    q("SELECT COUNT(*) n FROM orders WHERE status='failed'"),
    q("SELECT COUNT(*) n FROM orders WHERE status='awaiting_payment'"),
  ]);
  return {
    days: Number(days) || 7,
    newCustomers: newCustomers.n,
    freeSamples: samples.n,
    paidOrders: paidOrders.n,
    revenueAed: revenue.s,
    delivered: delivered.n,
    queue: queue.n,
    failed: failed.n,
    awaitingPayment: pendingPay.n,
    agentLastSeen: await getMeta(db, "agent_last_seen"),
  };
}
