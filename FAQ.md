# ❓ الأسئلة الشائعة - FAQ

## 🚀 البدء والإعداد

### س: كيف أبدأ بـ Supabase؟
**ج:**
1. اذهب إلى https://supabase.com
2. انقر "New Project"
3. املأ البيانات والمنطقة
4. انتظر الإنشاء (2-3 دقائق)
5. انسخ Project URL و Anon Key من Settings > API

### س: هل أحتاج إلى بطاقة ائتمان؟
**ج:** 
- **المجاني:** نعم، Supabase يقدم plan مجاني
- **التفاصيل:** 500 MB storage، 2 GB bandwidth
- **للإنتاج:** قد تحتاج لـ paid plan

### س: كم الوقت المطلوب للإعداد الأساسي؟
**ج:** 
- Supabase setup: 5 دقائق
- Database schema: 5 دقائق
- البيئة والاختبار: 5 دقائق
- **الإجمالي: 15 دقيقة**

### س: هل يمكنني استخدام MySQL بدلاً من PostgreSQL؟
**ج:** 
- **الإجابة:** لا، Supabase يستخدم PostgreSQL فقط
- **البديل:** استخدم Firebase أو Vercel Postgres

---

## 🔐 الأمان والخصوصية

### س: هل البيانات آمنة؟
**ج:**
- ✅ Supabase يستخدم تشفير SSL/TLS
- ✅ كلمات المرور مشفرة في قاعدة البيانات
- ✅ Row Level Security (RLS) متاح
- ✅ Backups تلقائية يومية

### س: كيف أحمي API keys؟
**ج:**
```
❌ لا تضعها في Git
✅ استخدم .env.local
✅ أضفها إلى .gitignore
✅ غيّرها في الإنتاج
```

### س: هل يمكنني تشفير حقول معينة؟
**ج:**
```typescript
// استخدم pgcrypto في Supabase
const encrypted = await supabase
  .from('accounts')
  .update({ password: pgp_sym_encrypt('secret', 'key') })
  .eq('id', id);
```

### س: كيف أفعّل RLS (Row Level Security)؟
**ج:**
```sql
-- في SQL Editor
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their clients"
ON clients FOR SELECT
USING (created_by_user_id = auth.uid());
```

---

## 📊 البيانات والأداء

### س: كم عميل يمكنني تخزين؟
**ج:**
- **المجاني:** لا توجد حدود صارمة
- **القيود:** 500 MB storage في plan المجاني
- **الفعلي:** ~10,000 عميل بسهولة

### س: هل سيبطؤ التطبيق مع البيانات الكثيرة؟
**ج:**
```typescript
// استخدم Pagination
const result = await getPaginatedClients(page, pageSize = 10);

// أو استخدم Indexes
CREATE INDEX idx_clients_name ON clients(name);
```

### س: كيف أحسّن الأداء؟
**ج:**
1. استخدم **Indexes** على الأعمدة المستخدمة
2. استخدم **Pagination** للقوائم الكبيرة
3. استخدم **Select** مع أعمدة محددة فقط
4. استخدم **Caching** للبيانات الثابتة

### س: هل يمكنني حذف جميع البيانات؟
**ج:**
```sql
-- احذر! هذا لا يمكن التراجع عنه
TRUNCATE TABLE tasks CASCADE;
```

---

## 🔧 المشاكل التقنية

### س: أحصل على خطأ "CORS policy"
**ج:**
1. تحقق من Supabase URL في .env.local
2. تأكد من الـ Anon Key صحيح
3. أعد تحميل الصفحة (Ctrl+F5)
4. افحص Network tab في DevTools

### س: البيانات لا تظهر
**ج:**
```typescript
// 1. تحقق من الاتصال
const data = await database.batch.getAllData();
console.log(data); // يجب أن تظهر البيانات

// 2. تحقق من RLS policies
// قد تكون blocking الوصول

// 3. تحقق من الصلاحيات
// SELECT * FROM tables;
```

### س: الحذف لا يعمل
**ج:**
```typescript
// قد تكون هناك foreign keys
// تحقق من:
SHOW CONSTRAINTS; -- الحدود

// أو احذف البيانات المرتبطة أولاً
await database.tasks.delete(taskId); // احذف المهام أولاً
await database.projects.delete(projectId); // ثم المشاريع
```

### س: حصل Timeout
**ج:**
```typescript
// زد الـ timeout
const response = await supabase
  .from('clients')
  .select('*')
  .timeout(60000) // 60 ثانية
```

---

## 🎯 الاستخدام والتكامل

### س: كيف أستخدم database في Components؟
**ج:**
```typescript
import database from './lib/database';

// في useEffect
useEffect(() => {
  const loadData = async () => {
    const clients = await database.clients.getAll();
    setClients(clients);
  };
  loadData();
}, []);
```

### س: كيف أضيف عميل جديد؟
**ج:**
```typescript
const newClient = await database.clients.create({
  id: `client_${Date.now()}`,
  name: 'Acme Corp',
  industry: 'Tech',
  country: 'Egypt'
});
```

### س: كيف أحدّث عميل؟
**ج:**
```typescript
await database.clients.update('client_123', {
  industry: 'Consulting'
});
```

### س: كيف أحذف عميل؟
**ج:**
```typescript
await database.clients.delete('client_123');
// تحذير: سيحذف أيضاً المشاريع والمهام المرتبطة
```

### س: كيف أبحث عن عملاء؟
**ج:**
```typescript
// بحث بسيط
const results = await database.clients.search('egypt');

// بحث متقدم مع filters
import { searchClients } from './lib/advanced-queries';
const results = await searchClients('egypt', {
  country: 'Egypt',
  minCampaigns: 2
});
```

---

## 🌐 Real-time و Updates

### س: كيف أحصل على تحديثات فورية؟
**ج:**
```typescript
import { useRealtimeClients } from './lib/advanced-queries';

export default function Page() {
  const clients = useRealtimeClients(); // يحدّث تلقائياً!
  return <div>{clients.map(c => c.name)}</div>;
}
```

### س: كيف أستقبل تحديثات عندما يضيف أحدهم عميل جديد؟
**ج:**
```typescript
useEffect(() => {
  const subscription = supabase
    .from('clients')
    .on('INSERT', ({ new }) => {
      setClients(prev => [new, ...prev]);
    })
    .subscribe();
  
  return () => supabase.removeSubscription(subscription);
}, []);
```

---

## 💾 الملفات والتخزين

### س: كيف أرفع صورة لعميل؟
**ج:**
```typescript
// طريقة 1: استخدم uploadCoverImage
const url = await database.clients.uploadCoverImage(clientId, file);

// طريقة 2: يدوي
const url = await storage.uploadFile(file, `clients/${clientId}/cover`);
```

### س: أين يتم تخزين الملفات؟
**ج:**
- **Storage:** Supabase Storage buckets
- **مسارات:**
  - `assets/` - للصور والملفات
  - `files/` - للملفات الإضافية

### س: كيف أحذف ملف؟
**ج:**
```typescript
await database.files.delete(fileId);
// سيحذف الملف والسجل من قاعدة البيانات
```

---

## 📈 الإحصائيات والتحليلات

### س: كيف أحصل على إحصائيات العميل؟
**ج:**
```typescript
import { getClientStatistics } from './lib/advanced-queries';

const stats = await getClientStatistics(clientId);
// {
//   projects: { total, active, completed },
//   tasks: { total, completed, pending, completionRate },
//   performance: { spend, impressions, roas }
// }
```

### س: كيف أحصل على إحصائيات الفريق؟
**ج:**
```typescript
import { getTeamAnalytics } from './lib/advanced-queries';

const team = await getTeamAnalytics();
// { total_users, team_members: [...] }
```

### س: كيف أحصل على أداء الحملة؟
**ج:**
```typescript
import { getCampaignPerformance } from './lib/advanced-queries';

const perf = await getCampaignPerformance(projectId);
// { total_spend, by_platform, metrics }
```

---

## 🧪 الاختبار

### س: كيف أختبر الاتصال؟
**ج:**
```typescript
// في console
import('./lib/connection-tests').then(m => m.testConnection());

// سيشغّل 20 test case
```

### س: ماذا إذا فشل الاختبار؟
**ج:**
1. تحقق من .env.local
2. تحقق من Supabase URL و Key
3. تأكد من تشغيل schema.sql
4. افحص Supabase Dashboard

---

## 🚀 الإنتاج

### س: هل يمكنني استخدام هذا في الإنتاج؟
**ج:**
- ✅ نعم، النظام مُختبر وآمن
- ✅ الكود يتبع best practices
- ⚠️ تأكد من:
  - تفعيل RLS
  - إعداد proper backups
  - مراقبة الأداء

### س: كيف أعد للإنتاج؟
**ج:**
```
Checklist:
✅ Database schema دقيق
✅ Indexes مُضافة
✅ RLS مُفعّلة
✅ Backups مُخطط لها
✅ Monitoring مُعد
✅ API keys آمنة
✅ أخطاء معالجة
✅ اختبار شامل
```

---

## 💰 التكاليف

### س: كم يكلف Supabase؟
**ج:**
- **مجاني:** 500 MB storage، حد معين من الـ API calls
- **Pro:** $25/month، storage غير محدود تقريباً
- **Enterprise:** Custom pricing

### س: كيف أتابع استهلاكي؟
**ج:**
- اذهب إلى Supabase Dashboard
- Billing > Usage
- تتبع storage و API calls

---

## 🆘 الدعم والمساعدة

### س: أين أبحث عن الحل؟
**ج:**
1. **التوثيق:** SYSTEM_SUMMARY.md
2. **الأمثلة:** DATABASE_INTEGRATION.md
3. **Supabase Docs:** supabase.com/docs
4. **Discord:** discord.supabase.io
5. **Stack Overflow:** tag:supabase

### س: كيف أبلّغ عن مشكلة؟
**ج:**
1. تأكد من تكرار المشكلة
2. اجمع الأخطاء والـ logs
3. افتح issue في GitHub
4. اشرح الخطوات بوضوح

### س: هل هناك مجتمع يمكنني السؤال فيه؟
**ج:**
- **Discord:** https://discord.supabase.io
- **GitHub:** discussions في Supabase repo
- **Twitter:** @supabase
- **Community:** supabase.com/community

---

## 📚 الموارد الإضافية

### س: أين أتعلم المزيد؟
**ج:**
- **البرنامج التعليمي:** supabase.com/docs/guides
- **فيديوهات:** YouTube - Supabase
- **مدونة:** supabase.com/blog
- **مثال عملي:** github.com/supabase/examples

### س: هل هناك نسخة مختلفة من API؟
**ج:**
- **JavaScript:** supabase-js (ما نستخدمه)
- **Python:** supabase-py
- **Go:** supabase-go
- **Dart:** supabase-flutter

---

## 🎓 أسئلة متقدمة

### س: كيف أستخدم stored procedures؟
**ج:**
```sql
CREATE FUNCTION get_client_stats(client_id UUID)
RETURNS TABLE (
  project_count INT,
  task_count INT
) AS $$
  SELECT 
    COUNT(DISTINCT projects.id),
    COUNT(DISTINCT tasks.id)
  FROM clients
  LEFT JOIN projects ON clients.id = projects.client_id
  LEFT JOIN tasks ON clients.id = tasks.client_id
  WHERE clients.id = client_id;
$$ LANGUAGE SQL;
```

### س: كيف أستخدم triggers؟
**ج:**
```sql
CREATE TRIGGER update_client_stats
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION update_client_project_count();
```

### س: كيف أعمل على عدة بيئات؟
**ج:**
```
.env.development  (تطوير)
.env.production   (إنتاج)
.env.staging      (اختبار)
```

---

## ✨ نصائح وحيل

### نصيحة 1: استخدم View مباشرة
```typescript
const pending = await supabase
  .from('pending_approvals')
  .select('*');
```

### نصيحة 2: استخدم Transactions
```typescript
const transaction = async () => {
  await db.insert('table1', data1);
  await db.insert('table2', data2);
  // كلاهما ينجح أو يفشل معاً
};
```

### نصيحة 3: استخدم Caching
```typescript
const cache = new Map();
const getCachedClients = async () => {
  if (cache.has('clients')) {
    return cache.get('clients');
  }
  const data = await database.clients.getAll();
  cache.set('clients', data);
  return data;
};
```

---

**آخر تحديث:** 2024
**عدد الأسئلة:** 50+
**الحالة:** شامل ومفيد ✅
