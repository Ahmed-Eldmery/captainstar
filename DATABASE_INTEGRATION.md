/**
 * =====================
 * DATABASE INTEGRATION GUIDE
 * =====================
 * 
 * هذا الملف يشرح كيفية استخدام قاعدة البيانات في components
 */

// ========================
// 1. في App.tsx
// ========================

import database from './lib/database';

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const { users, clients: allClients, projects: allProjects, tasks: allTasks, accounts, posts, approvals } = 
          await database.batch.getAllData();
        
        setClients(allClients);
        setProjects(allProjects);
        // ... إضافة باقي البيانات
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  return (
    // components تستخدم البيانات والدوال
    <Clients clients={clients} setClients={setClients} />
    <Projects projects={projects} setProjects={setProjects} />
    // ...
  );
}

// ========================
// 2. في Clients.tsx
// ========================

import database from '../lib/database';

export default function Clients({ clients, setClients }: ClientsPageProps) {
  const handleAddClient = async (newClient: Omit<Client, 'created_at' | 'updated_at'>) => {
    try {
      const created = await database.clients.create({
        id: `client_${Date.now()}`,
        name: newClient.name,
        industry: newClient.industry,
        // ... باقي الحقول
      });
      
      setClients([...clients, created]);
      // إضافة سجل نشاط
      if (currentUser) {
        await database.activity.logAction(
          currentUser.id,
          'created_client',
          'Client',
          created.id
        );
      }
    } catch (error) {
      console.error('Failed to add client:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await database.clients.delete(clientId);
      setClients(clients.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const handleUpdateClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      const updated = await database.clients.update(clientId, updates);
      setClients(clients.map(c => c.id === clientId ? updated : c));
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  const handleUploadCover = async (clientId: string, file: File) => {
    try {
      const url = await database.clients.uploadCoverImage(clientId, file);
      const updated = clients.find(c => c.id === clientId);
      if (updated) {
        updated.cover_image = url;
        setClients([...clients]);
      }
    } catch (error) {
      console.error('Failed to upload cover:', error);
    }
  };

  return (
    // عرض العملاء مع أزرار الحذف والتحديث
    {clients.map(client => (
      <div key={client.id}>
        <h3>{client.name}</h3>
        <button onClick={() => handleDeleteClient(client.id)}>Delete</button>
        <input onChange={(e) => handleUpdateClient(client.id, { name: e.target.value })} />
      </div>
    ))}
  );
}

// ========================
// 3. في Projects.tsx
// ========================

import database from '../lib/database';

export default function Projects({ projects, setProjects, clients }: ProjectsPageProps) {
  const handleCreateProject = async (projectData: Omit<Project, 'created_at' | 'updated_at'>) => {
    try {
      // 1. إنشاء المشروع
      const created = await database.projects.create({
        id: `project_${Date.now()}`,
        ...projectData,
        created_by_user_id: currentUser.id,
      });

      // 2. إضافة المهام المرتبطة
      if (projectData.campaign_details) {
        const task = await database.tasks.create({
          id: `task_${Date.now()}`,
          client_id: projectData.client_id,
          project_id: created.id,
          title: `Campaign: ${created.name}`,
          status: 'TODO',
          priority: 'HIGH',
          type: 'campaign',
          created_by_user_id: currentUser.id,
        });
      }

      // 3. تحديث عدد المشاريع للعميل
      const client = clients.find(c => c.id === projectData.client_id);
      if (client) {
        await database.clients.update(client.id, {
          num_campaigns: (client.num_campaigns || 0) + 1
        });
      }

      setProjects([...projects, created]);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const updated = await database.projects.update(projectId, updates);
      setProjects(projects.map(p => p.id === projectId ? updated : p));
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  return (
    // عرض المشاريع مع نموذج الإنشاء
    {projects.map(project => (
      <div key={project.id}>
        <h3>{project.name}</h3>
        <p>{project.brief}</p>
        <button onClick={() => handleUpdateProject(project.id, { status: 'COMPLETED' })}>
          Mark as Complete
        </button>
      </div>
    ))}
  );
}

// ========================
// 4. في Tasks.tsx
// ========================

import database from '../lib/database';

export default function Tasks({ tasks, setTasks }: TasksPageProps) {
  const handleMoveTask = async (taskId: string, newStatus: string) => {
    try {
      // 1. تحديث حالة المهمة
      const updated = await database.tasks.updateStatus(taskId, newStatus);
      setTasks(tasks.map(t => t.id === taskId ? updated : t));

      // 2. إذا كانت تحتاج اعتماد، إنشاء سجل اعتماد
      if (newStatus === 'WAITING_APPROVAL') {
        const task = tasks.find(t => t.id === taskId);
        if (task && !await database.approvals.getByTaskId(taskId)) {
          await database.approvals.create({
            id: `approval_${Date.now()}`,
            task_id: taskId,
            client_id: task.client_id,
            requested_by_user_id: currentUser.id,
            status: 'PENDING_INTERNAL',
          });
        }
      }

      // 3. تسجيل النشاط
      await database.activity.logAction(
        currentUser.id,
        `task_status_changed_to_${newStatus}`,
        'Task',
        taskId
      );
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  return (
    // عمود Kanban لكل حالة
    <div className="grid grid-cols-5 gap-4">
      {['TODO', 'IN_PROGRESS', 'WAITING_APPROVAL', 'WAITING_CLIENT', 'DONE'].map(status => (
        <div key={status} className="bg-gray-100 p-4 rounded">
          {tasks
            .filter(t => t.status === status)
            .map(task => (
              <div 
                key={task.id} 
                draggable
                onDragEnd={() => handleMoveTask(task.id, 'NEXT_STATUS')}
              >
                {task.title}
              </div>
            ))
          }
        </div>
      ))}
    </div>
  );
}

// ========================
// 5. في Approvals.tsx
// ========================

import database from '../lib/database';

export default function Approvals({ approvals, setApprovals, tasks }: ApprovalsPageProps) {
  const handleApprove = async (approvalId: string, taskId: string) => {
    try {
      // 1. تحديث حالة الاعتماد
      const updated = await database.approvals.update(approvalId, {
        status: 'APPROVED'
      });

      // 2. تحديث حالة المهمة
      const nextStatus = updated.status === 'PENDING_INTERNAL' ? 'WAITING_CLIENT' : 'DONE';
      await database.tasks.updateStatus(taskId, nextStatus);

      setApprovals(approvals.map(a => a.id === approvalId ? updated : a));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (approvalId: string, taskId: string) => {
    try {
      // 1. تحديث حالة الاعتماد
      await database.approvals.update(approvalId, {
        status: 'CHANGES_REQUESTED'
      });

      // 2. إرجاع المهمة للحالة السابقة
      await database.tasks.updateStatus(taskId, 'IN_PROGRESS');

      setApprovals(approvals.map(a => a.id === approvalId ? { ...a, status: 'CHANGES_REQUESTED' } : a));
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  return (
    <div>
      {approvals
        .filter(a => a.status.includes('PENDING'))
        .map(approval => (
          <div key={approval.id}>
            <h4>{tasks.find(t => t.id === approval.task_id)?.title}</h4>
            <button onClick={() => handleApprove(approval.id, approval.task_id)}>
              ✓ Approve
            </button>
            <button onClick={() => handleReject(approval.id, approval.task_id)}>
              ✗ Reject
            </button>
          </div>
        ))
      }
    </div>
  );
}

// ========================
// 6. في Community.tsx
// ========================

import database from '../lib/database';

export default function Community({ posts, setPosts, currentUser }: CommunityPageProps) {
  const handleCreatePost = async (content: string, postType: 'announcement' | 'discussion' | 'help') => {
    try {
      const created = await database.posts.create({
        id: `post_${Date.now()}`,
        user_id: currentUser.id,
        department: currentUser.team_role || 'general',
        content,
        type: postType,
      });

      setPosts([created, ...posts]);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const updated = await database.posts.addLike(postId);
      setPosts(posts.map(p => p.id === postId ? updated : p));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await database.posts.delete(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  return (
    <div>
      <textarea 
        onChange={(e) => {
          // تحديث محتوى النموذج
        }}
        placeholder="What's on your mind?"
      />
      <button onClick={() => handleCreatePost(content, 'discussion')}>
        Post
      </button>

      {posts.map(post => (
        <div key={post.id}>
          <p>{post.content}</p>
          <button onClick={() => handleLikePost(post.id)}>
            👍 {post.likes}
          </button>
        </div>
      ))}
    </div>
  );
}

// ========================
// 7. في ClientDetails.tsx
// ========================

import database from '../lib/database';

export default function ClientDetails({ client, setClient }: ClientDetailsPageProps) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);

  useEffect(() => {
    const loadAccounts = async () => {
      const clientAccounts = await database.accounts.getByClientId(client.id);
      setAccounts(clientAccounts);
    };
    loadAccounts();
  }, [client.id]);

  const handleAddAccount = async (account: Omit<ClientAccount, 'created_at' | 'updated_at'>) => {
    try {
      const created = await database.accounts.create({
        id: `account_${Date.now()}`,
        ...account,
        client_id: client.id,
      });

      setAccounts([...accounts, created]);
      
      // تحديث عدد المنصات للعميل
      await database.clients.update(client.id, {
        num_platforms: accounts.length + 1
      });
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await database.accounts.delete(accountId);
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <div>
      <h2>{client.name}</h2>
      <p>Industry: {client.industry}</p>
      
      <div>
        <h3>Platform Accounts</h3>
        {accounts.map(account => (
          <div key={account.id}>
            <h4>{account.platform}</h4>
            <p>{account.username}</p>
            <button onClick={() => handleDeleteAccount(account.id)}>Remove</button>
          </div>
        ))}
        <button onClick={() => handleAddAccount({
          platform: 'instagram',
          account_name: 'new_account',
          client_id: client.id
        })}>
          Add Account
        </button>
      </div>
    </div>
  );
}

// ========================
// 8. مثال: إنشاء Performance Report
// ========================

export async function generatePerformanceReport(clientId: string) {
  try {
    const client = await database.clients.getById(clientId);
    const projects = await database.projects.getByClientId(clientId);
    const performance = await database.performance.getByClientId(clientId);

    // حساب الإحصائيات
    const totalSpend = performance.reduce((sum, p) => sum + (p.spend || 0), 0);
    const totalImpressions = performance.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalClicks = performance.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const totalConversions = performance.reduce((sum, p) => sum + (p.conversions || 0), 0);

    return {
      client: client?.name,
      period: `${new Date().toLocaleDateString()}`,
      metrics: {
        spend: totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        ctr: ((totalClicks / totalImpressions) * 100).toFixed(2) + '%',
        roas: (totalConversions / totalSpend).toFixed(2)
      },
      projects: projects.length,
      data: performance
    };
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw error;
  }
}

// ========================
// 9. مثال: Real-time Sync
// ========================

export async function syncChangesToDatabase(appState: AppState) {
  try {
    const changes = {
      users: appState.users.filter(u => u.id.startsWith('new_')),
      clients: appState.clients.filter(c => c.id.startsWith('new_')),
      projects: appState.projects.filter(p => p.id.startsWith('new_')),
      tasks: appState.tasks.filter(t => t.id.startsWith('new_'))
    };

    const result = await database.batch.syncData(changes);
    return result;
  } catch (error) {
    console.error('Failed to sync data:', error);
    throw error;
  }
}

// ========================
// 10. مثال: Batch Updates
// ========================

export async function updateMultipleTaskStatuses(
  taskIds: string[],
  newStatus: string,
  userId: string
) {
  try {
    // تحديث جميع المهام
    await database.tasks.bulkUpdate(taskIds, { status: newStatus });

    // تسجيل النشاط لكل مهمة
    for (const taskId of taskIds) {
      await database.activity.logAction(
        userId,
        `bulk_updated_task_status_to_${newStatus}`,
        'Task',
        taskId
      );
    }

    return { success: true, updated: taskIds.length };
  } catch (error) {
    console.error('Failed to update tasks:', error);
    throw error;
  }
}

export default {
  generatePerformanceReport,
  syncChangesToDatabase,
  updateMultipleTaskStatuses
};
