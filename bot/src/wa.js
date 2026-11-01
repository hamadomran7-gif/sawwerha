// عميل WhatsApp Cloud API (Meta Graph API)

const GRAPH = (env) => `https://graph.facebook.com/${env.WA_API_VERSION || "v21.0"}`;

async function graph(env, path, init = {}) {
  const res = await fetch(`${GRAPH(env)}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, ...(init.headers || {}) },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${text.slice(0, 300)}`);
  return data;
}

async function send(env, to, payload) {
  return graph(env, `${env.WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...payload }),
  });
}

export const sendText = (env, to, body) => send(env, to, { type: "text", text: { body, preview_url: true } });

export const sendButtons = (env, to, body, buttons) =>
  send(env, to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
    },
  });

export const sendList = (env, to, { body, button, sections }) =>
  send(env, to, {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: button.slice(0, 20),
        sections: sections.map((s) => ({
          title: s.title.slice(0, 24),
          rows: s.rows.slice(0, 10).map((r) => ({ id: r.id, title: r.title.slice(0, 24), description: (r.description || "").slice(0, 72) })),
        })),
      },
    },
  });

/** يرفع ملفاً من R2 إلى واتساب ثم يرسله كصورة. */
export async function sendImageFromR2(env, to, key, caption = "") {
  const obj = await env.MEDIA.get(key);
  if (!obj) throw new Error(`media not found: ${key}`);
  const mime = obj.httpMetadata?.contentType || "image/jpeg";
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mime);
  form.append("file", new Blob([await obj.arrayBuffer()], { type: mime }), key.split("/").pop());
  const up = await graph(env, `${env.WA_PHONE_ID}/media`, { method: "POST", body: form });
  return send(env, to, { type: "image", image: { id: up.id, ...(caption ? { caption } : {}) } });
}

/** ينزّل وسائط واردة (صورة) ويعيد البايتات ونوعها. */
export async function downloadMedia(env, mediaId) {
  const meta = await graph(env, mediaId);
  const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${env.WA_TOKEN}` } });
  if (!res.ok) throw new Error(`media download ${res.status}`);
  return { bytes: await res.arrayBuffer(), mime: meta.mime_type || "image/jpeg" };
}

export const markRead = (env, messageId) =>
  graph(env, `${env.WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  }).catch(() => {});

/** التحقق من توقيع Meta (X-Hub-Signature-256) على جسم الطلب الخام. */
export async function verifySignature(rawBody, header, appSecret) {
  if (!appSecret) return true; // سماح أثناء التطوير فقط
  if (!header || !header.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7);
  if (hex.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

/** يحوّل حمولة webhook إلى رسائل موحّدة. */
export function parseWebhook(payload) {
  const out = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      const names = {};
      for (const c of v.contacts || []) names[c.wa_id] = c.profile?.name;
      for (const m of v.messages || []) {
        const base = { waId: m.id, from: m.from, name: names[m.from] || null, timestamp: Number(m.timestamp) * 1000 };
        if (m.type === "text") out.push({ ...base, type: "text", text: m.text?.body || "" });
        else if (m.type === "image") out.push({ ...base, type: "image", mediaId: m.image?.id, mime: m.image?.mime_type, text: m.image?.caption || "" });
        else if (m.type === "interactive") {
          const r = m.interactive?.button_reply || m.interactive?.list_reply;
          out.push({ ...base, type: m.interactive?.button_reply ? "button" : "list", buttonId: r?.id, text: r?.title || "" });
        } else if (m.type === "button") out.push({ ...base, type: "button", buttonId: m.button?.payload, text: m.button?.text || "" });
        else out.push({ ...base, type: "other", text: m.type });
      }
    }
  }
  return out;
}
