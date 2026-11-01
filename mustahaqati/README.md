# مستحقاتي — حاسبات حقوق الموظف في الخليج

موقع ثابت (HTML/CSS/JS) بلا أي اعتماديات خارجية. يُبنى بأمر واحد ويُنشر على أي استضافة ثابتة (Cloudflare Pages موصى بها).

## الهيكل

```
site.json              اسم الموقع والنطاق وبريد التواصل
src/rules.json         كل الأرقام القانونية (النسب، الحدود، السقوف) مع مصادرها — المرجع الوحيد
src/layout.html        القالب العام (الرأس، التذييل، الوسوم)
src/pages/*.html       الصفحات: كتلة JSON في الأعلى (العنوان، الوصف، الأسئلة، المصادر) ثم المحتوى
src/assets/calc.js     دوال الحساب النقية (تُستورد في المتصفح وفي الاختبارات)
src/assets/app.js      أدوات النموذج والتنسيق والحفظ المحلي
src/assets/pages/*.js  سكربت كل حاسبة (ربط النموذج بالدالة وعرض النتيجة)
tests/calc.test.js     اختبارات المعادلات بأمثلة محسوبة يدوياً
build.js               المولّد: ينتج dist/ (و dist-preview/ مع --preview)
```

## الأوامر

```bash
node build.js --check        # يبني dist/ ويتحقق من الروابط الداخلية
node --test tests/*.test.js  # يشغّل الاختبارات (يجب أن تنجح كلها قبل النشر)
python3 -m http.server 8080 --directory dist   # معاينة محلية
```

## إضافة حاسبة جديدة (خط الإنتاج)

1. أضف الأرقام القانونية إلى `src/rules.json` مع المصدر، وحدّث `lastReview`.
2. أضف دالة نقية في `src/assets/calc.js` واكتب لها اختباراً في `tests/calc.test.js` بمثال محسوب يدوياً من النص القانوني.
3. أنشئ `src/pages/<slug>.html` بكتلة JSON (title, h1, description, short, lead, country, category, tool: true, script, related, faq, sources) ثم النموذج والشرح.
4. أنشئ `src/assets/pages/<slug>.js` يربط النموذج بالدالة.
5. `node build.js --check` ثم `node --test tests/*.test.js` ثم ادفع إلى GitHub؛ Cloudflare Pages ينشر تلقائياً.

قواعد المحتوى (لتفادي عقوبات Google على المحتوى الآلي): أداة حقيقية في كل صفحة، معادلة من النص القانوني، لا أرقام من الذاكرة، 2–4 صفحات أسبوعياً كحد أقصى، تحديث ربع سنوي، صفحة «من نحن» حقيقية، ولا مؤلفين وهميين.

## النشر على Cloudflare Pages

- Build command: `node build.js`
- Build output directory: `dist`
- Node version: 20 أو أحدث (متغير البيئة `NODE_VERSION=22`)
- اربط النطاق من Custom domains، وفعّل HTTPS تلقائياً.
- بعد قبول AdSense: ضع وسم السكربت في `src/layout.html` مكان التعليق، وأضف ملف `ads.txt` داخل `src/assets/` ثم انسخه إلى الجذر في `build.js`.

## تحديث رقم قانوني

عدّل الرقم في `src/rules.json` فقط، وحدّث `updated` في الصفحات المتأثرة، وأعد البناء. لا تكتب أي رقم قانوني داخل الصفحات أو السكربتات.
