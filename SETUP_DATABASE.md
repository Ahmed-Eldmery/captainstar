# 🚀 دليل إعداد قاعدة البيانات - Captain Star Dashboard

## الخطوة 1: إعداد Supabase

### 1.1 إنشاء مشروع Supabase
1. اذهب إلى [Supabase](https://supabase.com)
2. انقر على "New Project"
3. اختر اسم المشروع واختر منطقة
4. انتظر إنشاء المشروع

### 1.2 الحصول على المفاتيح
1. انتقل إلى **Settings > API**
2. انسخ:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon key** → `VITE_SUPABASE_ANON_KEY`

### 1.3 إنشاء الجداول
1. انتقل إلى **SQL Editor**
2. انسخ محتوى `lib/schema.sql`
3. الصق وشغّل الـ SQL

```sql
-- ستجد جميع الجداول والـ indexes والـ views هنا
```

---

## الخطوة 2: إعداد ملف البيئة

```bash
# انسخ ملف النموذج
cp .env.example .env.local

# أضف قيم Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

---

## الخطوة 3: إعداد Storage Buckets

1. انتقل إلى **Storage > Buckets**
2. أنشئ حاويتي بيانات:
   - **assets** - للصور والملفات
   - **files** - للملفات الإضافية

---

## الخطوة 4: تحديث App.tsx

```typescript
import database from './lib/database';

export default function App() {
  const [appState, setAppState] = useState({
    users: [],
    clients: [],
    projects: [],
    tasks: [],
    accounts: [],
    posts: [],
    approvals: [],
    performance: [],
    activity: [],
    files: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await database.batch.getAllData();
        setAppState(data);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  return (
    // ... باقي الـ components
  );
}
```

---

## الخطوة 5: تحديث الـ Components

### في Clients.tsx:
```typescript
import database from '../lib/database';

const handleAddClient = async (newClient) => {
  const created = await database.clients.create({
    id: `client_${Date.now()}`,
    ...newClient
  });
  setClients([...clients, created]);
};

const handleDeleteClient = async (clientId) => {
  await database.clients.delete(clientId);
  setClients(clients.filter(c => c.id !== clientId));
};
```

### في Projects.tsx:
```typescript
const handleCreateProject = async (projectData) => {
  const created = await database.projects.create({
    id: `project_${Date.now()}`,
    ...projectData,
    created_by_user_id: currentUser.id
  });
  setProjects([...projects, created]);
};
```

### في Tasks.tsx:
```typescript
const handleMoveTask = async (taskId, newStatus) => {
  const updated = await database.tasks.updateStatus(taskId, newStatus);
  setTasks(tasks.map(t => t.id === taskId ? updated : t));
};
```

---

## الخطوة 6: Row Level Security (RLS)

لحماية البيانات، أضف policies في Supabase:

```sql
-- السماح للمستخدمين برؤية مشاريعهم فقط
CREATE POLICY "Users can view their projects"
ON projects FOR SELECT
USING (created_by_user_id = auth.uid());

-- السماح بإنشاء المشاريع
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (created_by_user_id = auth.uid());
```

---

## الخطوة 7: اختبار الاتصال

```typescript
// في App.tsx أو أي مكان
import database from './lib/database';

async function testConnection() {
  try {
    const users = await database.users.getAll();
    console.log('✅ Database connected!', users);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

// استدعاء الدالة
testConnection();
```

---

## قائمة العمليات المتاحة

### Users (المستخدمون)
```typescript
database.users.getAll()
database.users.getById(id)
database.users.getByEmail(email)
database.users.create(user)
database.users.update(id, updates)
database.users.delete(id)
database.users.getByRole(role)
database.users.getActive()
```

### Clients (العملاء)
```typescript
database.clients.getAll()
database.clients.getById(id)
database.clients.create(client)
database.clients.update(id, updates)
database.clients.delete(id)
database.clients.getByCountry(country)
database.clients.uploadCoverImage(clientId, file)
database.clients.search(query)
```

### Projects (المشاريع)
```typescript
database.projects.getAll()
database.projects.getById(id)
database.projects.getByClientId(clientId)
database.projects.create(project)
database.projects.update(id, updates)
database.projects.delete(id)
database.projects.getByStatus(status)
database.projects.getByCreatedBy(userId)
database.projects.updateStatus(id, status)
```

### Tasks (المهام)
```typescript
database.tasks.getAll()
database.tasks.getById(id)
database.tasks.getByClientId(clientId)
database.tasks.getByProjectId(projectId)
database.tasks.getByAssignee(userId)
database.tasks.create(task)
database.tasks.update(id, updates)
database.tasks.delete(id)
database.tasks.updateStatus(id, status)
database.tasks.getByStatus(status)
database.tasks.getPending()
database.tasks.bulkUpdate(taskIds, updates)
```

### Approvals (الاعتمادات)
```typescript
database.approvals.getAll()
database.approvals.getById(id)
database.approvals.getByTaskId(taskId)
database.approvals.create(approval)
database.approvals.update(id, updates)
database.approvals.delete(id)
database.approvals.getPending()
database.approvals.getByClientId(clientId)
```

### Community Posts (منشورات المجتمع)
```typescript
database.posts.getAll()
database.posts.getById(id)
database.posts.getByDepartment(department)
database.posts.getByUserId(userId)
database.posts.create(post)
database.posts.update(id, updates)
database.posts.delete(id)
database.posts.addLike(id)
```

### Performance (الأداء)
```typescript
database.performance.getAll()
database.performance.getByClientId(clientId)
database.performance.getByPlatform(platform)
database.performance.create(snapshot)
database.performance.update(id, updates)
database.performance.delete(id)
```

### Activity Logs (سجلات النشاط)
```typescript
database.activity.getAll()
database.activity.getByUserId(userId)
database.activity.create(log)
database.activity.logAction(userId, action, entityType?, entityId?)
```

### Files (الملفات)
```typescript
database.files.getAll()
database.files.getByClientId(clientId)
database.files.create(file)
database.files.update(id, updates)
database.files.delete(id)
database.files.uploadFile(file, clientId)
```

### Batch Operations
```typescript
database.batch.getAllData() // جلب جميع البيانات
database.batch.syncData(changes) // مزامنة التغييرات
```

---

## معالجة الأخطاء

```typescript
try {
  const client = await database.clients.create(newClient);
  console.log('Success:', client);
} catch (error) {
  if (error.code === '23505') {
    console.error('Unique constraint violation');
  } else if (error.code === '23503') {
    console.error('Foreign key constraint violation');
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Real-time Subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .from('tasks')
    .on('*', (payload) => {
      console.log('Task changed:', payload);
      // تحديث الحالة
    })
    .subscribe();

  return () => {
    supabase.removeSubscription(subscription);
  };
}, []);
```

---

## نصائح للأداء الأفضل

1. ✅ استخدم indexes على الأعمدة المستخدمة بكثرة
2. ✅ استخدم `bulkUpdate` للتحديثات المتعددة
3. ✅ استخدم caching للبيانات الثابتة
4. ✅ حد من عدد الأعمدة المسترجعة باستخدام `.select()`
5. ✅ استخدم pagination للقوائم الكبيرة

---

## استكشاف الأخطاء

### الخطأ: "CORS policy"
```
الحل: تأكد من أن Supabase URL و Key صحيحة
```

### الخطأ: "Row level security"
```
الحل: تحقق من RLS policies في Supabase Dashboard
```

### الخطأ: "Connection timeout"
```
الحل: تحقق من اتصال الإنترنت والـ firewall
```

---

## الخطوات التالية

- [ ] إعداد authentication مع Google
- [ ] إنشاء real-time updates للمهام
- [ ] إضافة عمليات البحث المتقدمة
- [ ] تحسين الأداء مع pagination
- [ ] إضافة backups تلقائي
