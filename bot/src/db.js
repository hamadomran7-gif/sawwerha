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

/* ------------------------------------------------------------------ */
/* الإحالات                                                             */
/* ------------------------------------------------------------------ */

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بلا 0/O و1/I لتجنب الالتباس

/** كود إحالة ثابت من رقم الهاتف (FNV-1a)، 6 خانات. salt يغيّر الكود عند التصادم. */
export function refCodeFor(phone, salt = 0) {
  let h = 0x811c9dc5 ^ salt;
  for (const ch of String(phone)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h >>>= 0;
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += REF_ALPHABET[h & 31]; // 32 حرفاً × 6 خانات = 30 بت من البصمة
    h >>>= 5;
  }
  return out;
}

/** يعيد كود العميل وينشئه إن لم يوجد. */
export async function ensureRefCode(db, phone) {
  const c = await getCustomer(db, phone);
  if (c && c.ref_code) return c.ref_code;
  for (let salt = 0; salt < 5; salt++) {
    const code = refCodeFor(phone, salt);
    const taken = await db.prepare("SELECT phone FROM customers WHERE ref_code = ?").bind(code).first();
    if (!taken || taken.phone === phone) {
      await db.prepare("UPDATE customers SET ref_code = ? WHERE phone = ?").bind(code, phone).run();
      return code;
    }
  }
  return null;
}

/** يربط العميل الجديد بمن أحاله (مرة واحدة، ولا إحالة ذاتية). يعيد رقم المُحيل أو null. */
export async function setReferrer(db, phone, code) {
  const c = String(code || "").toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(c)) return null;
  const ref = await db.prepare("SELECT phone FROM customers WHERE ref_code = ?").bind(c).first();
  if (!ref || ref.phone === phone) return null;
  const me = await getCustomer(db, phone);
  if (!me || me.referred_by) return null;
  await db.prepare("UPDATE customers SET referred_by = ? WHERE phone = ?").bind(ref.phone, phone).run();
  return ref.phone;
}

/**
 * عند أول شراء مدفوع لعميل مُحال: يمنح المُحيل عيّنة مجانية إضافية.
 * يعيد رقم المُحيل إن مُنح، وإلا null.
 */
export async function creditReferral(db, order) {
  if (!order || order.kind !== "package") return null;
  const buyer = await getCustomer(db, order.phone);
  if (!buyer || !buyer.referred_by) return null;
  const prior = await db
    .prepare("SELECT COUNT(*) n FROM orders WHERE phone = ? AND kind = 'package' AND id != ? AND status NOT IN ('awaiting_payment','cancelled','failed')")
    .bind(order.phone, order.id)
    .first();
  if (prior.n > 0) return null;
  const key = `ref_credit_${order.phone}`;
  if (await getMeta(db, key)) return null;
  await setMeta(db, key, String(order.id));
  await db.prepare("UPDATE customers SET bonus_samples = COALESCE(bonus_samples,0) + 1 WHERE phone = ?").bind(buyer.referred_by).run();
  return buyer.referred_by;
}

export async function referralStats(db) {
  const rows = await db
    .prepare("SELECT referred_by phone, COUNT(*) n FROM customers WHERE referred_by IS NOT NULL GROUP BY referred_by ORDER BY n DESC LIMIT 10")
    .all();
  const credited = await db.prepare("SELECT COUNT(*) n FROM meta WHERE key LIKE 'ref_credit_%'").first();
  return { top: rows.results || [], paidReferrals: credited.n };
}
