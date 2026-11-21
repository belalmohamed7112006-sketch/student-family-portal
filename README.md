# بوابة أسرة طلاب من أجل مصر

## محتويات الحزمة
- `index.html`: واجهة الموقع وتسجيل الدخول والتسجيل ولوحة العضو والمدير.
- `config.js`: إعدادات الاتصال بمشروع Supabase.
- `README.md`: تعليمات الإعداد والرفع.

## قبل الرفع
1. افتح `config.js`.
2. استبدل `PASTE_YOUR_SUPABASE_PROJECT_URL` برابط مشروع Supabase.
3. استبدل `PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY` بالمفتاح العام `anon` أو `publishable`.
4. لا تستخدم مفتاح `service_role` في المتصفح مطلقًا.

## الرفع على GitHub
فك ضغط الملف، ثم ارفع الملفات الثلاثة مباشرة إلى جذر مستودع `student-family-portal` مع استبدال النسخ القديمة. لا ترفع ملف ZIP نفسه بدل الملفات.

## النشر
إذا كان Vercel مرتبطًا بالمستودع، فسيبدأ النشر تلقائيًا بعد رفع التعديلات. افتح رابط الموقع بعد اكتمال النشر، ثم اختبر إنشاء حساب جديد وتأكيد البريد وتسجيل الدخول.

## متطلبات قاعدة البيانات
يعتمد الموقع على وجود جدول `profiles` وجدول `activity_submissions` في Supabase، وعلى إعدادات RLS وسياسات الصلاحيات المناسبة، وعلى Database Trigger ينشئ صفًا في `profiles` عند إنشاء مستخدم جديد في Auth.
الأعمدة التي يستخدمها الموقع:
- `profiles`: `id`, `username`, `full_name`, `birth_date`, `national_id`, `college`, `academic_year`, `role`, `approval_status`.
- `activity_submissions`: `id`, `user_id`, `category`, `activity_name`, `activity_date`, `approval_status`, `created_at`.

القيم المتوقعة:
- `profiles.role`: `member` أو `admin`.
- `approval_status`: `pending`, `approved`, `rejected`.
- `activity_submissions.category`: `event`, `military_visit`, `field_visit`, `workshop`.

مهم: ملفات الواجهة وحدها لا تنشئ الجداول أو سياسات الأمان أو Trigger. إذا كانت هذه الأشياء غير موجودة أو غير مضبوطة في مشروع Supabase، فلن يكتمل التسجيل أو تحميل الملف الشخصي حتى يتم إعدادها. لا تجعل بيانات الرقم القومي متاحة للعامة، وطبّق صلاحيات قراءة وتعديل تمنع العضو من تعديل دوره أو حالة موافقته بنفسه.
