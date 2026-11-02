// آلة حالات المحادثة — دوال نقية بلا I/O حتى تُختبر بسهولة.
// المدخل: حالة العميل والطلب النشط والرسالة الواردة. المخرج: قائمة أفعال ينفذها index.js.

export const PACKAGES = {
  SINGLE: { code: "SINGLE", nameAr: "حزمة منتج واحد", nameEn: "Single product pack", outputsPerProduct: 6, maxInputs: 1, subscription: false },
  LAUNCH: { code: "LAUNCH", nameAr: "حزمة إطلاق (5 منتجات)", nameEn: "Launch pack (5 products)", outputsPerProduct: 5, maxInputs: 5, subscription: false },
  SUB_LITE: { code: "SUB_LITE", nameAr: "اشتراك خفيف (15 صورة شهرياً)", nameEn: "Lite subscription (15 images/mo)", outputsPerProduct: 5, maxInputs: 3, subscription: true },
  SUB_CONTENT: { code: "SUB_CONTENT", nameAr: "اشتراك محتوى (30 صورة شهرياً)", nameEn: "Content subscription (30 images/mo)", outputsPerProduct: 5, maxInputs: 6, subscription: true },
};

export const CATEGORIES = [
  { id: "perfume", ar: "عطور وبخور", en: "Perfume & bakhoor" },
  { id: "fashion", ar: "عبايات وأزياء", en: "Abayas & fashion" },
  { id: "jewelry", ar: "مجوهرات وإكسسوارات", en: "Jewelry & accessories" },
  { id: "home", ar: "شموع وديكور", en: "Candles & home decor" },
  { id: "food", ar: "حلويات وأغذية", en: "Sweets & food" },
  { id: "beauty", ar: "عناية بالبشرة وتجميل", en: "Skincare & beauty" },
  { id: "kids", ar: "منتجات أطفال", en: "Kids products" },
  { id: "other", ar: "أخرى", en: "Other" },
];

export function prices(env) {
  return {
    SINGLE: Number(env.PRICE_SINGLE || 149),
    LAUNCH: Number(env.PRICE_LAUNCH || 499),
    SUB_LITE: Number(env.PRICE_SUB_LITE || 499),
    SUB_CONTENT: Number(env.PRICE_SUB_CONTENT || 899),
  };
}

export function detectLang(text, fallback = "ar") {
  if (!text) return fallback;
  const arabic = (text.match(/[؀-ۿ]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (arabic === 0 && latin > 2) return "en";
  return "ar";
}

const T = {
  welcome: {
    ar: (b) => `أهلاً بك في ${b} 👋\nأرسل صورة واحدة واضحة لمنتجك (بأي خلفية)، وخلال ساعات تستلم 3 صور احترافية مجاناً: صورة بخلفية بيضاء جاهزة لنون وأمازون، وصورتين بمشهد تسويقي لإنستغرام.\n\nالخدمة آلية بالكامل وتعمل على مدار الساعة.`,
    en: (b) => `Welcome to ${b} 👋\nSend one clear photo of your product (any background). Within hours you'll receive 3 free professional images: a white-background shot ready for noon/Amazon and two lifestyle scenes for Instagram.\n\nThis service is fully automated and runs 24/7.`,
  },
  askCategory: {
    ar: "استلمنا الصورة ✅ اختر نوع المنتج ليناسب المشهد:",
    en: "Photo received ✅ Choose the product type so the scene fits:",
  },
  queuedSample: {
    ar: (eta) => `بدأنا التصوير 🎬 ستصلك 3 صور خلال ${eta}. لا حاجة لإرسال شيء الآن.`,
    en: (eta) => `We've started 🎬 Your 3 images will arrive within ${eta}. Nothing else needed now.`,
  },
  sampleDelivered: {
    ar: "هذه صورك المجانية 🎁\nإذا أعجبتك، اختر الباقة المناسبة ويصلك رابط الدفع فوراً:",
    en: "Here are your free images 🎁\nIf you like them, pick a package and you'll get the payment link right away:",
  },
  packageChosen: {
    ar: (p, price, link) => `اخترت: ${p} — ${price} درهم.\nادفع عبر الرابط:\n${link}\n\nبعد الدفع يتفعّل طلبك تلقائياً وأطلب منك صور المنتجات.`,
    en: (p, price, link) => `You chose: ${p} — AED ${price}.\nPay here:\n${link}\n\nAfter payment your order activates automatically and I'll ask for your product photos.`,
  },
  packageChosenNoLink: {
    ar: (p, price) => `اخترت: ${p} — ${price} درهم.\nسيصلك رابط الدفع خلال دقائق.`,
    en: (p, price) => `You chose: ${p} — AED ${price}.\nYour payment link will arrive in a few minutes.`,
  },
  paid: {
    ar: (n) => `تم استلام الدفع ✅ شكراً لك.\nأرسل الآن صور المنتجات (حتى ${n} ${n === 1 ? "صورة" : "صور"})، صورة واحدة لكل منتج. عند الانتهاء اضغط «انتهيت».`,
    en: (n) => `Payment received ✅ Thank you.\nNow send your product photos (up to ${n}), one photo per product. Tap "Done" when finished.`,
  },
  inputAdded: {
    ar: (i, n) => `استلمنا الصورة ${i} من ${n}.`,
    en: (i, n) => `Received photo ${i} of ${n}.`,
  },
  queuedPackage: {
    ar: (eta) => `رائع، بدأنا العمل على طلبك 🎬 التسليم خلال ${eta}.`,
    en: (eta) => `Great, we've started your order 🎬 Delivery within ${eta}.`,
  },
  delivered: {
    ar: "تم تسليم طلبك كاملاً ✅\nتعديل واحد مجاني متاح: اضغط «تعديل» واكتب ما تريد تغييره.",
    en: "Your order is delivered ✅\nOne free revision is included: tap \"Revise\" and tell me what to change.",
  },
  askRevision: {
    ar: "اكتب ما تريد تعديله بوضوح (مثال: خلفية أفتح، المنتج أكبر، بدون ديكور).",
    en: "Describe the change clearly (e.g., lighter background, bigger product, no props).",
  },
  revisionQueued: {
    ar: "استلمنا طلب التعديل ✍️ سيصلك خلال ساعات.",
    en: "Revision received ✍️ It will arrive within hours.",
  },
  noMoreRevisions: {
    ar: "استُخدم التعديل المجاني. يمكنك طلب حزمة جديدة بسعر مخفض من قائمة الباقات.",
    en: "The free revision has been used. You can order a new pack from the packages list.",
  },
  sampleLimit: {
    ar: "العيّنة المجانية متاحة مرة واحدة لكل رقم. اختر باقة ويصلك رابط الدفع:",
    en: "The free sample is available once per number. Pick a package to get a payment link:",
  },
  inProgress: {
    ar: "طلبك قيد التنفيذ الآن ⏳ ستصلك الصور تلقائياً عند الانتهاء.",
    en: "Your order is in progress ⏳ Images will arrive automatically when ready.",
  },
  awaitingPayment: {
    ar: (link) => `طلبك بانتظار الدفع. الرابط:\n${link}\nبعد الدفع يتفعّل الطلب تلقائياً.`,
    en: (link) => `Your order is awaiting payment:\n${link}\nIt activates automatically after payment.`,
  },
  onlyImages: {
    ar: "أرسل الصورة كصورة عادية (ليس ملفاً أو فيديو) لنتمكن من معالجتها.",
    en: "Please send the photo as a regular image (not a file or video).",
  },
  faqPrice: {
    ar: (p) => `الأسعار بالدرهم:\n• حزمة منتج واحد (6 صور): ${p.SINGLE}\n• حزمة إطلاق 5 منتجات (25 صورة): ${p.LAUNCH}\n• اشتراك خفيف شهري (15 صورة): ${p.SUB_LITE}\n• اشتراك محتوى شهري (30 صورة + تعليقات): ${p.SUB_CONTENT}\nكل الباقات تشمل صورة بيضاء مطابقة لشروط نون وأمازون، وتعديلاً مجانياً، وتسليماً خلال 24 ساعة.`,
    en: (p) => `Prices in AED:\n• Single product pack (6 images): ${p.SINGLE}\n• Launch pack, 5 products (25 images): ${p.LAUNCH}\n• Lite monthly subscription (15 images): ${p.SUB_LITE}\n• Content monthly subscription (30 images + captions): ${p.SUB_CONTENT}\nAll packs include a marketplace-compliant white-background image, one free revision, and 24-hour delivery.`,
  },
  faqTime: { ar: "العيّنة المجانية خلال 2–6 ساعات، والباقات خلال 24 ساعة من استلام الصور.", en: "Free sample within 2–6 hours; packages within 24 hours of receiving your photos." },
  faqHow: {
    ar: "نقصّ منتجك الحقيقي من صورتك ونضعه في مشاهد احترافية بالذكاء الاصطناعي. لا نغيّر شكل المنتج أو لونه أو النص عليه. الصورة الأساسية تبقى صورة منتجك الحقيقية بخلفية بيضاء.",
    en: "We cut out your real product from your photo and place it in AI-generated professional scenes. We never change the product's shape, color, or text. The main image stays your real product on white.",
  },
  faqRefund: { ar: "إذا لم تُسلَّم الصور خلال 48 ساعة من الدفع يُسترد المبلغ كاملاً. وبعد التسليم يتوفر تعديل مجاني واحد.", en: "If images aren't delivered within 48 hours of payment, you get a full refund. One free revision after delivery." },
  faqHuman: {
    ar: (email) => `الخدمة آلية بالكامل لتبقى سريعة ورخيصة. للشكاوى أو الاسترداد راسل: ${email}`,
    en: (email) => `The service is fully automated to stay fast and affordable. For complaints or refunds email: ${email}`,
  },
  fallback: {
    ar: "لم أفهم الطلب. أرسل صورة منتجك لنبدأ، أو اختر من القائمة:",
    en: "I didn't get that. Send your product photo to start, or choose from the menu:",
  },
  paused: { ar: "الخدمة متوقفة مؤقتاً للصيانة وستعود قريباً. اعتذر عن الإزعاج.", en: "The service is paused for maintenance and will be back soon. Sorry for the inconvenience." },
  referralInvite: {
    ar: (link) => `🎁 شارك صوّرها واربح: أرسل هذا الرابط لصديق عنده متجر:\n${link}\nعندما يشتري أول باقة، تحصل على عيّنة مجانية إضافية (3 صور) لمنتج جديد.`,
    en: (link) => `🎁 Share Sawwerha: send this link to a friend who runs a shop:\n${link}\nWhen they buy their first pack, you get an extra free sample (3 images) for a new product.`,
  },
  referralCredited: {
    ar: "🎉 صديقك اشترى من صوّرها! حصلت على عيّنة مجانية إضافية: أرسل صورة منتج جديد متى شئت.",
    en: "🎉 Your friend just bought from Sawwerha! You've earned an extra free sample: send a new product photo any time.",
  },
};

/** متابعة واحدة لمن استلم العيّنة ولم يختر باقة (داخل نافذة 24 ساعة في واتساب). */
export function offerFollowupActions({ customer, env }) {
  const lang = customer.lang || "ar";
  const p = prices(env);
  const body =
    lang === "en"
      ? "Did you like your free images? 👀 The full-resolution versions come without the watermark, plus a white image tuned for noon and another for Amazon. Pick a pack and get them within 24 hours:"
      : "هل أعجبتك صورك المجانية؟ 👀 صور الباقات بدقة كاملة وبلا علامة مائية، ومعها نسخة بيضاء لنون وأخرى لأمازون. اختر باقتك وتصلك خلال 24 ساعة:";
  return { actions: [{ type: "text", body }, packageList(lang, p)] };
}

/** تذكير واحد بطلب ينتظر الدفع. */
export function paymentReminderText(lang, order) {
  const pkg = PACKAGES[order.package_code];
  const name = pkg ? (lang === "en" ? pkg.nameEn : pkg.nameAr) : "";
  return lang === "en"
    ? `Reminder: your order (${name}) is waiting for payment:\n${order.payment_link}\nIt activates automatically once paid.`
    : `تذكير: طلبك (${name}) بانتظار الدفع:\n${order.payment_link}\nيتفعّل الطلب تلقائياً بعد الدفع.`;
}

/** رسالة دعوة صديق مع رابط واتساب يحمل كود الإحالة. */
export function referralInviteText(lang, code, env = {}) {
  const number = env.WA_PUBLIC_NUMBER || "971507241548";
  const msg = lang === "en" ? `Hi, a friend sent me to Sawwerha (code: ${code}) and I want my 3 free product photos` : `مرحباً، أرسلني صديق إلى صوّرها (كود: ${code}) وأريد صور منتجي الثلاث المجانية`;
  return t("referralInvite", lang, `https://wa.me/${number}?text=${encodeURIComponent(msg)}`);
}
export function referralCreditedText(lang) {
  return t("referralCredited", lang);
}

/** يلتقط كود الإحالة من أول رسالة (مثل «كود: G2DJF8» أو «code: G2DJF8»). */
export function extractRefCode(text) {
  const m = String(text || "").match(/(?:كود|code)\s*(?:صديق|friend)?\s*[:：]?\s*([A-Za-z0-9]{6})(?![A-Za-z0-9])/i);
  return m ? m[1].toUpperCase() : null;
}

const t = (key, lang, ...args) => {
  const v = T[key][lang] || T[key].ar;
  return typeof v === "function" ? v(...args) : v;
};

export function packageList(lang, p) {
  return {
    type: "list",
    body: lang === "en" ? "Choose a package:" : "اختر الباقة:",
    button: lang === "en" ? "Packages" : "الباقات",
    sections: [
      {
        title: lang === "en" ? "One-time packs" : "حزم لمرة واحدة",
        rows: [
          { id: "pkg_SINGLE", title: lang === "en" ? `Single product — ${p.SINGLE}` : `منتج واحد — ${p.SINGLE} درهم`, description: lang === "en" ? "6 images: 2 white + 4 lifestyle" : "6 صور: 2 بيضاء + 4 مشاهد" },
          { id: "pkg_LAUNCH", title: lang === "en" ? `Launch, 5 products — ${p.LAUNCH}` : `إطلاق 5 منتجات — ${p.LAUNCH} درهم`, description: lang === "en" ? "25 images" : "25 صورة" },
        ],
      },
      {
        title: lang === "en" ? "Monthly subscriptions" : "اشتراكات شهرية",
        rows: [
          { id: "pkg_SUB_LITE", title: lang === "en" ? `Lite — ${p.SUB_LITE}/mo` : `خفيف — ${p.SUB_LITE} درهم/شهر`, description: lang === "en" ? "15 images per month" : "15 صورة شهرياً" },
          { id: "pkg_SUB_CONTENT", title: lang === "en" ? `Content — ${p.SUB_CONTENT}/mo` : `محتوى — ${p.SUB_CONTENT} درهم/شهر`, description: lang === "en" ? "30 images + captions" : "30 صورة + تعليقات" },
        ],
      },
      {
        title: lang === "en" ? "Questions" : "أسئلة",
        rows: [
          { id: "faq_how", title: lang === "en" ? "How does it work?" : "كيف تعمل الخدمة؟" },
          { id: "faq_time", title: lang === "en" ? "Delivery time" : "مدة التسليم" },
          { id: "faq_refund", title: lang === "en" ? "Refunds & revisions" : "الاسترداد والتعديل" },
        ],
      },
    ],
  };
}

export function categoryList(lang) {
  return {
    type: "list",
    body: t("askCategory", lang),
    button: lang === "en" ? "Product type" : "نوع المنتج",
    sections: [{ title: lang === "en" ? "Categories" : "الفئات", rows: CATEGORIES.map((c) => ({ id: `cat_${c.id}`, title: lang === "en" ? c.en : c.ar })) }],
  };
}

function menuButtons(lang) {
  return {
    type: "buttons",
    body: lang === "en" ? "What would you like?" : "ماذا تريد؟",
    buttons: [
      { id: "menu_packages", title: lang === "en" ? "Packages" : "الباقات" },
      { id: "faq_how", title: lang === "en" ? "How it works" : "كيف تعمل" },
      { id: "faq_time", title: lang === "en" ? "Delivery time" : "مدة التسليم" },
    ],
  };
}

function matchFaq(text) {
  const s = (text || "").toLowerCase();
  const words = s.split(/[\s؟?!،,.:;()\-]+/).filter(Boolean);
  const has = (...ws) => ws.some((w) => words.includes(w));
  const re = (r) => r.test(s);
  if (re(/سعر|اسعار|أسعار|باقه|باقة|باقات|price|cost|how much/) || has("كم", "بكم", "وكم")) return "faq_price";
  if (re(/متى|مدة|يستغرق|تأخر|when|how long|delay/) || has("وقت", "الوقت", "time")) return "faq_time";
  if (re(/طريقة|شلون/) || has("كيف", "how")) return "faq_how";
  if (re(/استرجاع|استرداد|الغاء|إلغاء|refund|cancel/)) return "faq_refund";
  if (re(/موظف|انسان|إنسان|بشر|human|agent|support/) || has("شخص", "person")) return "faq_human";
  return null;
}

/**
 * يعالج رسالة واردة ويعيد الأفعال.
 * @param {object} p
 * @param {object} p.customer  {phone, lang, state, samples_used, active_order}
 * @param {object|null} p.order  الطلب النشط إن وجد
 * @param {object} p.msg  {type:'text'|'image'|'button'|'list'|'other', text, mediaId, buttonId}
 * @param {object} p.env
 * @param {boolean} p.paused
 */
export function handleInbound({ customer, order, msg, env, paused = false }) {
  const brand = env.BRAND || "صوّرها";
  const email = env.SUPPORT_EMAIL || "support@sawwerha.app";
  const p = prices(env);
  const freeLimit = Number(env.FREE_SAMPLES_PER_PHONE || 1);
  const lang = msg.type === "text" ? detectLang(msg.text, customer.lang || "ar") : customer.lang || "ar";
  const actions = [{ type: "set_lang", lang }];
  const say = (body) => actions.push({ type: "text", body });
  const state = customer.state || "new";
  const id = msg.buttonId || "";

  if (paused && msg.type !== "owner") {
    say(t("paused", lang));
    return { actions, state };
  }

  // اختيارات القوائم والأزرار المشتركة
  if (id === "menu_packages") {
    actions.push(packageList(lang, p));
    return { actions, state };
  }
  if (id === "faq_how") { say(t("faqHow", lang)); return { actions, state }; }
  if (id === "faq_time") { say(t("faqTime", lang)); return { actions, state }; }
  if (id === "faq_refund") { say(t("faqRefund", lang)); return { actions, state }; }
  if (id.startsWith("pkg_")) {
    const code = id.slice(4);
    if (!PACKAGES[code]) { say(t("fallback", lang)); actions.push(menuButtons(lang)); return { actions, state }; }
    if (order && ["queued", "processing"].includes(order.status) && order.kind === "package") {
      say(t("inProgress", lang));
      return { actions, state };
    }
    actions.push({ type: "create_package_order", code, price: p[code], category: customer.category || "other" });
    return { actions, state: "awaiting_payment" };
  }
  if (id.startsWith("cat_")) {
    const cat = id.slice(4);
    actions.push({ type: "set_category", category: cat });
    if (order && order.status === "awaiting_category") {
      actions.push({ type: "queue_order", orderId: order.id, category: cat });
      say(t("queuedSample", lang, lang === "en" ? "2–6 hours" : "2–6 ساعات"));
      return { actions, state: "sample_queued" };
    }
    return { actions, state };
  }
  if (id === "done_inputs") {
    if (order && order.status === "awaiting_photos" && JSON.parse(order.inputs || "[]").length > 0) {
      actions.push({ type: "queue_order", orderId: order.id });
      say(t("queuedPackage", lang, lang === "en" ? "24 hours" : "24 ساعة"));
      return { actions, state: "package_queued" };
    }
    say(lang === "en" ? "Send at least one product photo first." : "أرسل صورة منتج واحدة على الأقل أولاً.");
    return { actions, state };
  }
  if (id === "revise") {
    if (order && order.status === "delivered" && (order.revisions_used || 0) < 1) {
      say(t("askRevision", lang));
      return { actions, state: "revision_collecting" };
    }
    say(t("noMoreRevisions", lang));
    actions.push(packageList(lang, p));
    return { actions, state };
  }
  if (id === "new_order") {
    actions.push(packageList(lang, p));
    return { actions, state };
  }

  // الصور
  if (msg.type === "image") {
    if (state === "paid_collecting" && order && order.status === "awaiting_photos") {
      const have = JSON.parse(order.inputs || "[]").length;
      if (have >= order.max_inputs) {
        say(lang === "en" ? `This package covers ${order.max_inputs} products; extra photos are ignored. Tap "Done".` : `هذه الباقة تشمل ${order.max_inputs} منتجات؛ الصور الإضافية لن تُحتسب. اضغط «انتهيت».`);
        actions.push({ type: "buttons", body: lang === "en" ? "Finished?" : "انتهيت؟", buttons: [{ id: "done_inputs", title: lang === "en" ? "Done" : "انتهيت" }] });
        return { actions, state };
      }
      actions.push({ type: "append_input", orderId: order.id, mediaId: msg.mediaId });
      const n = have + 1;
      if (n >= order.max_inputs) {
        actions.push({ type: "queue_order", orderId: order.id });
        say(t("inputAdded", lang, n, order.max_inputs));
        say(t("queuedPackage", lang, lang === "en" ? "24 hours" : "24 ساعة"));
        return { actions, state: "package_queued" };
      }
      say(t("inputAdded", lang, n, order.max_inputs));
      actions.push({ type: "buttons", body: lang === "en" ? "Send the next photo, or tap Done." : "أرسل الصورة التالية، أو اضغط «انتهيت».", buttons: [{ id: "done_inputs", title: lang === "en" ? "Done" : "انتهيت" }] });
      return { actions, state };
    }
    if (order && ["awaiting_category", "queued", "processing"].includes(order.status)) {
      say(t("inProgress", lang));
      return { actions, state };
    }
    if (state === "awaiting_payment" && order) {
      say(t("awaitingPayment", lang, order.payment_link || "…"));
      return { actions, state };
    }
    // عيّنة مجانية
    if ((customer.samples_used || 0) >= freeLimit + (customer.bonus_samples || 0)) {
      say(t("sampleLimit", lang));
      actions.push(packageList(lang, p));
      return { actions, state: "offer" };
    }
    actions.push({ type: "create_sample_order", mediaId: msg.mediaId });
    actions.push(categoryList(lang));
    return { actions, state: "awaiting_category" };
  }

  if (msg.type === "other") {
    say(t("onlyImages", lang));
    return { actions, state };
  }

  // نصوص
  if (msg.type === "text") {
    const text = msg.text || "";
    if (state === "revision_collecting" && order && order.status === "delivered") {
      actions.push({ type: "queue_revision", orderId: order.id, note: text });
      say(t("revisionQueued", lang));
      return { actions, state: "package_queued" };
    }
    if (state === "awaiting_category" && order && order.status === "awaiting_category") {
      // تجاهل الفئة واعتبرها "أخرى" حتى لا يتعطل الطلب
      actions.push({ type: "set_category", category: "other" });
      actions.push({ type: "queue_order", orderId: order.id, category: "other" });
      say(t("queuedSample", lang, lang === "en" ? "2–6 hours" : "2–6 ساعات"));
      return { actions, state: "sample_queued" };
    }
    if (/^(انتهيت|تم|خلاص|done|finish)/i.test(text.trim()) && state === "paid_collecting" && order) {
      if (JSON.parse(order.inputs || "[]").length > 0) {
        actions.push({ type: "queue_order", orderId: order.id });
        say(t("queuedPackage", lang, lang === "en" ? "24 hours" : "24 ساعة"));
        return { actions, state: "package_queued" };
      }
    }
    const faq = matchFaq(text);
    if (state === "new" || !customer.last_seen) {
      const ref = extractRefCode(text);
      if (ref) actions.push({ type: "set_referrer", code: ref });
      say(t("welcome", lang, brand));
      if (faq === "faq_price") actions.push(packageList(lang, p));
      return { actions, state: "awaiting_photo" };
    }
    if (faq === "faq_price") { say(t("faqPrice", lang, p)); actions.push(packageList(lang, p)); return { actions, state }; }
    if (faq === "faq_time") { say(t("faqTime", lang)); return { actions, state }; }
    if (faq === "faq_how") { say(t("faqHow", lang)); return { actions, state }; }
    if (faq === "faq_refund") { say(t("faqRefund", lang)); return { actions, state }; }
    if (faq === "faq_human") { say(t("faqHuman", lang, email)); return { actions, state }; }

    if (state === "awaiting_payment" && order) {
      say(t("awaitingPayment", lang, order.payment_link || "…"));
      return { actions, state };
    }
    if (order && ["queued", "processing", "awaiting_category"].includes(order.status)) {
      say(t("inProgress", lang));
      return { actions, state };
    }
    if (state === "paid_collecting") {
      say(lang === "en" ? "Send your product photos, one per product, then tap Done." : "أرسل صور منتجاتك، صورة لكل منتج، ثم اضغط «انتهيت».");
      return { actions, state };
    }
    // سؤال حر: نترك فرصة للرد بالذكاء الاصطناعي إن كان مفعلاً
    actions.push({ type: "ai_or_fallback", text, fallback: t("fallback", lang), menu: menuButtons(lang) });
    return { actions, state };
  }

  say(t("fallback", lang));
  actions.push(menuButtons(lang));
  return { actions, state };
}

/** أفعال التسليم عندما يكمل الوكيل طلباً (تُستدعى من مسار الوكيل). */
export function deliveryActions({ order, customer, env }) {
  const lang = customer.lang || "ar";
  const p = prices(env);
  const outputs = JSON.parse(order.outputs || "[]");
  const actions = outputs.map((key, i) => ({ type: "image", key, caption: i === 0 ? (lang === "en" ? "Your images:" : "صورك:") : "" }));
  if (order.kind === "sample") {
    actions.push({ type: "text", body: T.sampleDelivered[lang] || T.sampleDelivered.ar });
    actions.push(packageList(lang, p));
    return { actions, state: "offer" };
  }
  actions.push({ type: "text", body: T.delivered[lang] || T.delivered.ar });
  actions.push({
    type: "buttons",
    body: lang === "en" ? "Anything else?" : "هل تحتاج شيئاً آخر؟",
    buttons: [
      { id: "revise", title: lang === "en" ? "Revise" : "تعديل" },
      { id: "new_order", title: lang === "en" ? "New order" : "طلب جديد" },
      { id: "faq_refund", title: lang === "en" ? "Refund policy" : "سياسة الاسترداد" },
    ],
  });
  actions.push({ type: "referral_invite" });
  return { actions, state: "delivered" };
}

export function paidActions({ order, customer }) {
  const lang = customer.lang || "ar";
  return { actions: [{ type: "text", body: t("paid", lang, order.max_inputs) }], state: "paid_collecting" };
}

export function paymentLinkMessage({ order, customer, link }) {
  const lang = customer.lang || "ar";
  const pkg = PACKAGES[order.package_code];
  const name = lang === "en" ? pkg.nameEn : pkg.nameAr;
  return link ? t("packageChosen", lang, name, order.price, link) : t("packageChosenNoLink", lang, name, order.price);
}
