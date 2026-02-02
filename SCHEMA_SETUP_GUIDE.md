# 📊 عايز تحط الـ Schema ده فيـن؟

## ✅ الملفات اللي عملتها لك

### 1️⃣ **schema.prisma**
```
c:\Users\admin\Downloads\captain-star-dashboard\schema.prisma
```
- دا الـ Prisma schema اللي يعرّف كل الـ database
- يستخدم PostgreSQL (Supabase)
- فيه كل الـ relations و indexes

### 2️⃣ **database.sql**
```
c:\Users\admin\Downloads\captain-star-dashboard\database.sql
```
- دا SQL script خام
- تحطه مباشرة في Supabase SQL Editor
- فيه كل الـ CREATE TABLE و الـ indexes

---

## 🚀 خطوات التطبيق

### الطريقة الأولى: استخدام Supabase مباشرة (⭐ الأفضل)

#### Step 1: اتجه لـ Supabase Console
```
https://app.supabase.com
```

#### Step 2: Open SQL Editor
```
في الـ sidebar، اضغط على "SQL Editor"
```

#### Step 3: انسخ محتوى database.sql
```
1. افتح database.sql
2. Copy كل الكود
3. اعجل الـ SQL Editor في Supabase
4. Paste الكود
5. اضغط "Run"
```

✅ **خلاص! الجداول بتاعتك موجودة دلوقتي في Supabase**

---

### الطريقة الثانية: استخدام Prisma CLI

#### Step 1: Setup Prisma
```bash
npm install @prisma/client
npm install -D prisma
```

#### Step 2: Set Environment Variable
في ملف `.env`:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

#### Step 3: Apply Schema
```bash
npx prisma migrate dev --name init
```

#### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

---

## 📋 محتوى القاعدة

### الجداول اللي موجودة:

| الجدول | عدد الأعمدة | الغرض |
|--------|-----------|-------|
| **users** | 9 | المستخدمين و الـ accounts |
| **clients** | 15 | العملاء و معلوماتهم |
| **client_accounts** | 9 | حسابات العملاء (فيس بوك، انستجرام، إلخ) |
| **projects** | 24 | المشاريع/الحملات |
| **tasks** | 12 | المهام |
| **approvals** | 6 | الاعتمادات على المهام |
| **performance_snapshots** | 12 | إحصائيات الأداء |
| **community_posts** | 7 | منشورات المجتمع الداخلي |
| **activity_logs** | 5 | سجل النشاطات |
| **file_assets** | 8 | الملفات والموارد |

### مثال من البيانات:

```json
{
  "id": "user_123",
  "name": "أحمد محمد",
  "email": "ahmed@agency.com",
  "role": "ADMIN",
  "teamRole": "مدير المشاريع",
  "isActive": true,
  "createdAt": "2024-01-26T10:00:00Z"
}
```

---

## 🔗 الـ Relations (العلاقات)

```
Users ←→ Projects (1 user creates many projects)
Users ←→ Tasks (1 user assigned to many tasks)
Users ←→ CommunityPosts (1 user posts many posts)

Clients ←→ Projects (1 client has many projects)
Clients ←→ Tasks (1 client has many tasks)
Clients ←→ ClientAccounts (1 client has many accounts)
Clients ←→ PerformanceSnapshots (1 client has many snapshots)
Clients ←→ Approvals (1 client has many approvals)

Projects ←→ Tasks (1 project has many tasks)

Tasks ←→ Approvals (1 task has many approvals)
```

---

## 🎯 العمليات الشائعة

### 1. إضافة عميل جديد:
```sql
INSERT INTO public.clients (name, country, industry)
VALUES ('عميل جديد', 'مصر', 'تكنولوجيا');
```

### 2. إضافة مستخدم:
```sql
INSERT INTO public.users (name, email, password_hash, role, team_role)
VALUES ('أحمد', 'ahmed@agency.com', 'hash...', 'ADMIN', 'مدير حسابات');
```

### 3. إضافة مشروع:
```sql
INSERT INTO public.projects (client_id, name, status, created_by_user_id)
VALUES ('client_id', 'مشروع جديد', 'قيد التنفيذ', 'user_id');
```

### 4. إضافة مهمة:
```sql
INSERT INTO public.tasks (client_id, title, status, priority, type, created_by_user_id)
VALUES ('client_id', 'عمل محتوى', 'للتنفيذ', 'عالية', 'محتوى', 'user_id');
```

---

## 🔐 الـ Indexes (للسرعة)

كل الجداول فيها indexes على:
- `id` (Primary Key)
- `*_id` (Foreign Keys)
- `status`, `created_at`, `email` (Common filters)

هدا يخليها سريعة جداً في البحث!

---

## ✨ الـ Features

✅ Realtime subscriptions enabled
✅ Cascade deletes (حذف تلقائي للبيانات المرتبطة)
✅ Timestamps on all tables
✅ Proper indexes for performance
✅ Full Arabic support
✅ JSONB fields for flexible data

---

## 🎁 Bonus: Views جاهزة

### View 1: client_statistics
```sql
SELECT * FROM public.client_statistics;
```
يعطيك عدد المشاريع والمهام والحسابات وإجمالي الإنفاق لكل عميل

### View 2: team_statistics
```sql
SELECT * FROM public.team_statistics;
```
يعطيك إحصائيات الفريق (المهام المعينة، المكتملة، إلخ)

---

## ❓ أسئلة شائعة

**س: في الـ schema.prisma وفي database.sql، أيهما أستخدم؟**
> ج: لو عايز تستخدم Prisma ORM في الـ backend، استخدم schema.prisma. لو عايز تحط الـ schema مباشرة في Supabase، استخدم database.sql.

**س: إزاي أربط الـ backend بالـ database؟**
> ج: في ملف `.env` ضيف:
```env
DATABASE_URL="your_supabase_connection_string"
```

**س: إزاي أخليها مباشرة من السيكويل؟**
> ج: اتبع الخطوات في الطريقة الأولى (copy-paste في Supabase).

---

## 📞 اتصل بـ Support

لو في أي مشكلة في الـ schema، ركّز على:
1. ✅ Database URL صح
2. ✅ Permissions في Supabase
3. ✅ Foreign keys صحيحة
4. ✅ Indexes موجودة

Good Luck! 🚀
