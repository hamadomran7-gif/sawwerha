# تعليمات Claude لمستودع صوّرها ومستحقاتي

المالك: حمد. يدير Claude المشروعين بتفويض كامل منه. هذا الملف يُقرأ في بداية كل جلسة، فأبقِه قصيراً ودقيقاً.

## خريطة المستودع
- `mustahaqati/`: موقع «مستحقاتي» (mustahaqati.org)، موقع ثابت بلا اعتماديات. القواعد في `src/rules.json`، والمصادر في `research/batch*.md`.
- `web/` و`sitegen/`: موقع «صوّرها» (sawwerha.app) وصفحات البحث.
- `bot/`: بوت واتساب على Cloudflare Worker مع D1.
- `agent/`: وكيل الإنتاج على جهاز حمد (C:\Sawwerha، RTX 4090، ComfyUI). يتحدّث ذاتياً من `agent/manifest.json`.
- `ads/`: نصوص الإعلانات وخطة المحتوى المجاني.
- `docs/03-الحالة-والروابط.md`: المرجع الوحيد للحالة والروابط وطريقة النشر. حدّثه بعد كل تغيير مهم.

## طريقة العمل
1. أي تغيير يمس أكثر من ملف: اكتب الخطة أولاً (Plan Mode)، ثم نفّذ.
2. لا شحن قبل التحقق. استخدم `/go`، وهو يشغّل الفحوص ويبسّط ثم يعمل commit.
3. أرسل البحث والقراءة الطويلة إلى وكيل فرعي، وأبقِ السياق الرئيسي للقرار.
4. لا تقرأ الملفات الضخمة كاملة (`mustahaqati/src/rules.json`، `mustahaqati/src/assets/rules.js`، `dist/`). ابحث فيها بـ grep.
5. نظّف السياق بين المهام المختلفة (`/clear`)، واستخدم `/compact` حين تطول الجلسة.
6. أي فكرة مشروع جديدة أو تحوّل جوهري يمر أولاً بمهارة `shark-tank-council`.

## الفحوص (يجب أن تنجح كلها قبل أي commit)
- مستحقاتي: `cd mustahaqati && node build.js --check && npm test`
- البوت: `cd bot && npm test`
- الوكيل: `for f in agent/tests/test_*.py; do python3 "$f" agent || exit 1; done`
- صفحات صوّرها: `python3 sitegen/build.py`

## النشر
من لوحة Cloudflare في متصفح Claude على جهاز حمد، بالأدوات في `tools/dash-helpers.js` وبقيمة commit محددة (التفاصيل في docs/03). لا نشر قبل نجاح الفحوص ورفع الـ commit.

## الأمان والحدود
- المستودع عام: لا أسرار ولا مفاتيح فيه أبداً. الأسرار في `C:\Sawwerha\secrets` وفي أسرار Cloudflare.
- لا دفع ولا اشتراك مدفوع ولا توقيع ولا التزام باسم حمد.

## مكتبة Claude
دروس صنّاع المحتوى في `Documents\Claude-Library` على جهاز حمد. بعد تطبيق أي درس سجّل معرّفه بسطر `APPLIED.push("id");` في `applied.js`، أو استخدم `/apply-lesson`.
