# 🌟 Captain Star Dashboard - دليل قاعدة البيانات

## 📋 نظرة عامة

تم إنشاء نظام قاعدة بيانات شامل لـ Captain Star Dashboard يربط جميع الـ components برقم البيانات في Supabase.

### الملفات المضافة:

1. **`lib/schema.sql`** - الهيكل الكامل لقاعدة البيانات
2. **`lib/database.ts`** - جميع عمليات قاعدة البيانات (CRUD)
3. **`lib/advanced-queries.ts`** - عمليات متقدمة مثل التحليلات والبحث
4. **`SETUP_DATABASE.md`** - دليل الإعداد خطوة بخطوة
5. **`DATABASE_INTEGRATION.md`** - أمثلة التكامل في كل صفحة

---

## 🚀 البدء السريع

### 1️⃣ إعداد Supabase

```bash
# انتقل إلى https://supabase.com
# أنشئ مشروع جديد
# انسخ URL و Anon Key
```

### 2️⃣ إنشاء قاعدة البيانات

```sql
-- انسخ محتوى lib/schema.sql
-- الصقه في SQL Editor في Supabase Dashboard
-- اضغط Execute
```

### 3️⃣ تحديث ملف البيئة

```bash
# قم بإنشاء ملف .env.local
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 4️⃣ البدء في استخدام قاعدة البيانات

```typescript
import database from './lib/database';

// جلب جميع العملاء
const clients = await database.clients.getAll();

// إنشاء عميل جديد
const newClient = await database.clients.create({
  id: 'client_123',
  name: 'Acme Corp',
  industry: 'Tech'
});

// تحديث عميل
await database.clients.update('client_123', { 
  country: 'Egypt' 
});

// حذف عميل
await database.clients.delete('client_123');
```

---

## 📊 جداول قاعدة البيانات

### Users (المستخدمون)
```typescript
{
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'OWNER' | 'ADMIN' | 'TEAM_MEMBER';
  team_role?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Clients (العملاء)
```typescript
{
  id: string;
  name: string;
  industry?: string;
  country?: string;
  phone_number?: string;
  posts_quota?: number;
  videos_quota?: number;
  has_website?: boolean;
  file_upload?: boolean;
  num_campaigns?: number;
  num_platforms?: number;
  cover_image?: string;
  has_campaign?: boolean;
  onboarding_notes?: string;
  assigned_team_ids?: string[];
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Projects (المشاريع/الحملات)
```typescript
{
  id: string;
  client_id: string;
  name: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  type?: string;
  description?: string;
  niche?: string;
  received_date?: date;
  brief?: string;
  total_budget?: decimal;
  platforms?: string[];
  campaign_types?: string[];
  accounts?: JSONB;
  drive_link?: string;
  product_sheet_link?: string;
  copy_and_design?: string;
  motion?: string;
  campaign_details?: JSONB;
  monthly_report?: string;
  client_status?: string;
  created_by_user_id: string;
  start_date?: date;
  end_date?: date;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Tasks (المهام)
```typescript
{
  id: string;
  client_id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'WAITING_APPROVAL' | 'WAITING_CLIENT' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  assigned_to_user_id?: string;
  created_by_user_id: string;
  due_date?: date;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### ClientAccounts (حسابات العملاء على المنصات)
```typescript
{
  id: string;
  client_id: string;
  platform: string;
  account_name?: string;
  account_url?: string;
  username?: string;
  notes?: string; // كلمة المرور مشفرة
  is_active: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### CommunityPosts (منشورات المجتمع)
```typescript
{
  id: string;
  user_id: string;
  department: string;
  content: string;
  type: 'announcement' | 'discussion' | 'help';
  likes: number;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Approvals (الاعتمادات)
```typescript
{
  id: string;
  task_id: string;
  client_id: string;
  requested_by_user_id: string;
  status: 'PENDING_INTERNAL' | 'PENDING_CLIENT' | 'APPROVED' | 'CHANGES_REQUESTED';
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

## 💻 أمثلة استخدام شاملة

### مثال 1: إضافة عميل جديد

```typescript
import database from './lib/database';

const handleAddClient = async (clientData) => {
  try {
    const newClient = await database.clients.create({
      id: `client_${Date.now()}`,
      name: clientData.name,
      industry: clientData.industry,
      country: clientData.country,
      phone_number: clientData.phone,
      cover_image: clientData.coverImageUrl
    });

    console.log('✅ Client added:', newClient);
    setClients([...clients, newClient]);
  } catch (error) {
    console.error('❌ Failed to add client:', error);
  }
};
```

### مثال 2: إنشاء مشروع جديد

```typescript
const handleCreateProject = async (projectData) => {
  try {
    const newProject = await database.projects.create({
      id: `project_${Date.now()}`,
      client_id: projectData.clientId,
      name: projectData.name,
      niche: projectData.niche,
      brief: projectData.brief,
      total_budget: projectData.budget,
      platforms: projectData.platforms,
      campaign_types: projectData.campaignTypes,
      accounts: projectData.accounts,
      status: 'PLANNED',
      created_by_user_id: currentUser.id
    });

    // إنشاء مهمة رئيسية
    await database.tasks.create({
      id: `task_${Date.now()}`,
      client_id: projectData.clientId,
      project_id: newProject.id,
      title: `Campaign: ${newProject.name}`,
      status: 'TODO',
      priority: 'HIGH',
      type: 'campaign',
      created_by_user_id: currentUser.id
    });

    setProjects([...projects, newProject]);
  } catch (error) {
    console.error('Failed to create project:', error);
  }
};
```

### مثال 3: نقل مهمة في Kanban

```typescript
const handleMoveTask = async (taskId, newStatus) => {
  try {
    // تحديث المهمة
    const updated = await database.tasks.updateStatus(taskId, newStatus);

    // إذا كانت بحاجة اعتماد
    if (newStatus === 'WAITING_APPROVAL') {
      const task = await database.tasks.getById(taskId);
      
      const approval = await database.approvals.create({
        id: `approval_${Date.now()}`,
        task_id: taskId,
        client_id: task.client_id,
        requested_by_user_id: currentUser.id,
        status: 'PENDING_INTERNAL'
      });
    }

    // تسجيل النشاط
    await database.activity.logAction(
      currentUser.id,
      `task_moved_to_${newStatus}`,
      'Task',
      taskId
    );

    setTasks(tasks.map(t => t.id === taskId ? updated : t));
  } catch (error) {
    console.error('Failed to move task:', error);
  }
};
```

### مثال 4: الاعتماد على مهمة

```typescript
const handleApproveTask = async (approvalId, taskId) => {
  try {
    // تحديث الاعتماد
    await database.approvals.update(approvalId, {
      status: 'APPROVED'
    });

    // انتقال المهمة للمرحلة التالية
    const nextStatus = 'WAITING_CLIENT';
    await database.tasks.updateStatus(taskId, nextStatus);

    // إضافة منشور في المجتمع
    await database.posts.create({
      id: `post_${Date.now()}`,
      user_id: currentUser.id,
      department: currentUser.team_role,
      content: `✅ Task approved and moved to ${nextStatus}`,
      type: 'announcement'
    });

    setApprovals(approvals.map(a => 
      a.id === approvalId ? { ...a, status: 'APPROVED' } : a
    ));
  } catch (error) {
    console.error('Failed to approve:', error);
  }
};
```

### مثال 5: البحث المتقدم

```typescript
import { searchClients, getTasksWithFilters } from './lib/advanced-queries';

// البحث عن عملاء
const handleSearch = async (searchQuery) => {
  const results = await searchClients(searchQuery, {
    country: 'Egypt',
    minCampaigns: 2
  });
  setSearchResults(results);
};

// تصفية المهام
const handleFilterTasks = async () => {
  const filtered = await getTasksWithFilters({
    status: ['IN_PROGRESS', 'WAITING_APPROVAL'],
    priority: ['HIGH', 'CRITICAL'],
    dueAfter: new Date()
  });
  setFilteredTasks(filtered);
};
```

### مثال 6: الإحصائيات والتحليلات

```typescript
import { getClientStatistics, getTeamAnalytics } from './lib/advanced-queries';

// إحصائيات العميل
const loadClientStats = async (clientId) => {
  const stats = await getClientStatistics(clientId);
  console.log(stats);
  // {
  //   projects: { total: 5, active: 3, completed: 2 },
  //   tasks: { total: 20, completed: 12, pending: 8, completionRate: '60%' },
  //   performance: { spend: '5000', impressions: 50000, roas: '2.5' }
  // }
};

// إحصائيات الفريق
const loadTeamStats = async () => {
  const analytics = await getTeamAnalytics();
  console.log(analytics);
  // {
  //   total_users: 5,
  //   team_members: [
  //     { name: 'Ahmed', tasks: { assigned: 10, completed: 8 } }
  //   ]
  // }
};
```

### مثال 7: Real-time Updates

```typescript
import { useRealtimeClients } from './lib/advanced-queries';

export default function ClientsPage() {
  const clients = useRealtimeClients(); // يحدّث تلقائياً

  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  );
}
```

---

## 📈 العمليات المتقدمة

### جلب جميع البيانات مرة واحدة

```typescript
const allData = await database.batch.getAllData();
// {
//   users: [...],
//   clients: [...],
//   projects: [...],
//   tasks: [...],
//   accounts: [...],
//   posts: [...],
//   approvals: [...],
//   performance: [...],
//   activity: [...],
//   files: [...]
// }
```

### تحديث عدة مهام في مرة واحدة

```typescript
await database.tasks.bulkUpdate(
  ['task_1', 'task_2', 'task_3'],
  { status: 'DONE', assigned_to_user_id: 'user_123' }
);
```

### تصدير بيانات العميل

```typescript
import { exportClientData } from './lib/advanced-queries';

const json = await exportClientData(clientId, 'json');
const csv = await exportClientData(clientId, 'csv');

// تحميل الملف
const element = document.createElement('a');
element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(json);
element.download = `client_${clientId}.json`;
element.click();
```

---

## 🔒 الأمان

### Row Level Security (RLS)

يتم تطبيق سياسات الأمان على مستوى الصفوف:

```sql
-- المستخدمون يرون مشاريعهم فقط
CREATE POLICY "Users see their projects"
ON projects FOR SELECT
USING (created_by_user_id = auth.uid());

-- الفريق يرى مهامهم فقط
CREATE POLICY "Team sees their tasks"
ON tasks FOR SELECT
USING (assigned_to_user_id = auth.uid());
```

### تشفير كلمات المرور

```typescript
import { encrypt, decrypt } from './lib/encryption';

// عند الحفظ
const encryptedPassword = encrypt(password);
await database.accounts.create({
  ...account,
  notes: encryptedPassword
});

// عند الاسترجاع
const account = await database.accounts.getById(accountId);
const decryptedPassword = decrypt(account.notes);
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "Cannot GET /..."
```
✅ الحل: تأكد من تشغيل الخادم بـ npm run dev
```

### خطأ: "CORS policy..."
```
✅ الحل: تحقق من قيم SUPABASE_URL و SUPABASE_ANON_KEY
```

### خطأ: "Row level security violation"
```
✅ الحل: تحقق من RLS policies في Supabase Dashboard
```

### خطأ: "Table does not exist"
```
✅ الحل: تشغيل schema.sql في SQL Editor
```

---

## 📚 الموارد الإضافية

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ قائمة التحقق

- [ ] إعداد مشروع Supabase
- [ ] تشغيل schema.sql
- [ ] إضافة متغيرات البيئة
- [ ] اختبار الاتصال
- [ ] تحديث App.tsx
- [ ] تحديث جميع الـ components
- [ ] إضافة معالجة الأخطاء
- [ ] تفعيل RLS
- [ ] إعداد Backups
- [ ] اختبار الإنتاج

---

## 🎯 الخطوات التالية

1. **إعداد Authentication**
   - تكامل Google OAuth
   - JWT tokens

2. **Real-time Updates**
   - تفعيل Supabase Realtime
   - WebSocket connections

3. **Performance**
   - Caching strategies
   - Query optimization
   - Pagination

4. **Monitoring**
   - Error tracking
   - Performance metrics
   - User analytics

---

**تم الإعداد بواسطة:** GitHub Copilot
**الإصدار:** 1.0.0
**آخر تحديث:** 2024
