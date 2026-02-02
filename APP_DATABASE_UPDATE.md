/**
 * =====================
 * HOW TO UPDATE App.tsx FOR DATABASE
 * =====================
 * 
 * هذا الملف يوضح كيفية تحديث App.tsx للعمل مع قاعدة البيانات
 */

// ========================
// BEFORE (MockData)
// ========================

/*
import { 
  USERS as INITIAL_USERS, 
  CLIENTS as INITIAL_CLIENTS, 
  PROJECTS as INITIAL_PROJECTS, 
  // ... باقي MockData
} from './mockData.ts';

const App = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  // ... باقي الحالة
};
*/

// ========================
// AFTER (Database)
// ========================

import React, { useState, useEffect } from 'react';
import database from './lib/database';
import type { User, Client, Project, Task, ClientAccount, CommunityPost, Approval, PerformanceSnapshot, ActivityLog, FileAsset } from './types';

interface AppState {
  users: User[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  accounts: ClientAccount[];
  posts: CommunityPost[];
  approvals: Approval[];
  performance: PerformanceSnapshot[];
  activity: ActivityLog[];
  files: FileAsset[];
}

const initialAppState: AppState = {
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
};

export default function App() {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // 1. تحميل البيانات من قاعدة البيانات عند تحميل التطبيق
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📦 Loading data from database...');
        
        // جلب جميع البيانات من قاعدة البيانات
        const data = await database.batch.getAllData();
        
        setAppState({
          users: data.users || [],
          clients: data.clients || [],
          projects: data.projects || [],
          tasks: data.tasks || [],
          accounts: data.accounts || [],
          posts: data.posts || [],
          approvals: data.approvals || [],
          performance: data.performance || [],
          activity: data.activity || [],
          files: data.files || []
        });

        console.log('✅ Data loaded successfully');

        // استرجاع المستخدم الحالي من localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        console.error('❌ Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // 2. المزامنة التلقائية للبيانات كل 30 ثانية
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const syncInterval = setInterval(async () => {
      try {
        // تحديث البيانات من قاعدة البيانات
        const latestData = await database.batch.getAllData();
        setAppState(prev => ({
          ...prev,
          clients: latestData.clients || prev.clients,
          projects: latestData.projects || prev.projects,
          tasks: latestData.tasks || prev.tasks,
          approvals: latestData.approvals || prev.approvals,
          posts: latestData.posts || prev.posts
        }));
      } catch (err) {
        console.error('Auto sync failed:', err);
      }
    }, 30000); // كل 30 ثانية

    return () => clearInterval(syncInterval);
  }, [autoSyncEnabled]);

  // 3. حفظ التغييرات في قاعدة البيانات
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // تحديد التغييرات الجديدة والمعدلة
      const changes = {
        clients: appState.clients.filter(c => c.id.includes('new_') || c.id.includes('temp_')),
        projects: appState.projects.filter(p => p.id.includes('new_') || p.id.includes('temp_')),
        tasks: appState.tasks.filter(t => t.id.includes('new_') || t.id.includes('temp_'))
      };

      // مزامنة التغييرات
      const result = await database.batch.syncData(changes);
      
      console.log('✅ Changes saved to database:', result);
      // إعادة تحميل البيانات
      const latestData = await database.batch.getAllData();
      setAppState(prev => ({
        ...prev,
        clients: latestData.clients,
        projects: latestData.projects,
        tasks: latestData.tasks
      }));
    } catch (err) {
      console.error('❌ Failed to save changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  // 4. إضافة عميل جديد
  const handleAddClient = async (clientData: Omit<Client, 'created_at' | 'updated_at'>) => {
    try {
      const newClient = await database.clients.create({
        ...clientData,
        id: `client_${Date.now()}`
      });

      setAppState(prev => ({
        ...prev,
        clients: [...prev.clients, newClient]
      }));

      // تسجيل النشاط
      if (currentUser) {
        await database.activity.logAction(
          currentUser.id,
          'created_client',
          'Client',
          newClient.id
        );
      }

      return newClient;
    } catch (err) {
      console.error('Failed to add client:', err);
      throw err;
    }
  };

  // 5. تحديث عميل
  const handleUpdateClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      const updated = await database.clients.update(clientId, updates);

      setAppState(prev => ({
        ...prev,
        clients: prev.clients.map(c => c.id === clientId ? updated : c)
      }));

      return updated;
    } catch (err) {
      console.error('Failed to update client:', err);
      throw err;
    }
  };

  // 6. حذف عميل
  const handleDeleteClient = async (clientId: string) => {
    try {
      await database.clients.delete(clientId);

      setAppState(prev => ({
        ...prev,
        clients: prev.clients.filter(c => c.id !== clientId),
        projects: prev.projects.filter(p => p.client_id !== clientId),
        tasks: prev.tasks.filter(t => t.client_id !== clientId)
      }));
    } catch (err) {
      console.error('Failed to delete client:', err);
      throw err;
    }
  };

  // 7. إضافة مشروع جديد
  const handleAddProject = async (projectData: Omit<Project, 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await database.projects.create({
        ...projectData,
        id: `project_${Date.now()}`,
        created_by_user_id: currentUser?.id || 'system'
      });

      setAppState(prev => ({
        ...prev,
        projects: [...prev.projects, newProject]
      }));

      // تحديث إحصائيات العميل
      const client = appState.clients.find(c => c.id === projectData.client_id);
      if (client) {
        await handleUpdateClient(client.id, {
          num_campaigns: (client.num_campaigns || 0) + 1
        });
      }

      return newProject;
    } catch (err) {
      console.error('Failed to add project:', err);
      throw err;
    }
  };

  // 8. تحديث مشروع
  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const updated = await database.projects.update(projectId, updates);

      setAppState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? updated : p)
      }));

      return updated;
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  };

  // 9. حذف مشروع
  const handleDeleteProject = async (projectId: string) => {
    try {
      await database.projects.delete(projectId);

      setAppState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        tasks: prev.tasks.filter(t => t.project_id !== projectId)
      }));
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  };

  // 10. إضافة مهمة جديدة
  const handleAddTask = async (taskData: Omit<Task, 'created_at' | 'updated_at'>) => {
    try {
      const newTask = await database.tasks.create({
        ...taskData,
        id: `task_${Date.now()}`,
        created_by_user_id: currentUser?.id || 'system'
      });

      setAppState(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask]
      }));

      return newTask;
    } catch (err) {
      console.error('Failed to add task:', err);
      throw err;
    }
  };

  // 11. تحديث مهمة
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updated = await database.tasks.update(taskId, updates);

      setAppState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? updated : t)
      }));

      return updated;
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  // 12. تحديث حالة مهمة
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updated = await database.tasks.updateStatus(taskId, newStatus);

      setAppState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? updated : t)
      }));

      // إذا كانت بحاجة اعتماد، إنشاء سجل اعتماد
      if (newStatus === 'WAITING_APPROVAL') {
        const task = appState.tasks.find(t => t.id === taskId);
        if (task && !appState.approvals.find(a => a.task_id === taskId)) {
          const approval = await database.approvals.create({
            id: `approval_${Date.now()}`,
            task_id: taskId,
            client_id: task.client_id,
            requested_by_user_id: currentUser?.id || 'system',
            status: 'PENDING_INTERNAL'
          });

          setAppState(prev => ({
            ...prev,
            approvals: [...prev.approvals, approval]
          }));
        }
      }

      return updated;
    } catch (err) {
      console.error('Failed to update task status:', err);
      throw err;
    }
  };

  // 13. حذف مهمة
  const handleDeleteTask = async (taskId: string) => {
    try {
      await database.tasks.delete(taskId);

      setAppState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId),
        approvals: prev.approvals.filter(a => a.task_id !== taskId)
      }));
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  // 14. إضافة تعليق (منشور) في المجتمع
  const handleAddPost = async (postData: Omit<CommunityPost, 'created_at' | 'updated_at' | 'likes'>) => {
    try {
      const newPost = await database.posts.create({
        ...postData,
        id: `post_${Date.now()}`,
        user_id: currentUser?.id || 'system'
      });

      setAppState(prev => ({
        ...prev,
        posts: [newPost, ...prev.posts]
      }));

      return newPost;
    } catch (err) {
      console.error('Failed to add post:', err);
      throw err;
    }
  };

  // 15. إضافة إعجابة لمنشور
  const handleLikePost = async (postId: string) => {
    try {
      const updated = await database.posts.addLike(postId);

      setAppState(prev => ({
        ...prev,
        posts: prev.posts.map(p => p.id === postId ? updated : p)
      }));

      return updated;
    } catch (err) {
      console.error('Failed to like post:', err);
      throw err;
    }
  };

  // 16. حذف منشور
  const handleDeletePost = async (postId: string) => {
    try {
      await database.posts.delete(postId);

      setAppState(prev => ({
        ...prev,
        posts: prev.posts.filter(p => p.id !== postId)
      }));
    } catch (err) {
      console.error('Failed to delete post:', err);
      throw err;
    }
  };

  // 17. اعتماد مهمة
  const handleApproveTask = async (approvalId: string, taskId: string) => {
    try {
      // تحديث الاعتماد
      const updatedApproval = await database.approvals.update(approvalId, {
        status: 'APPROVED'
      });

      // تحديث المهمة
      const nextStatus = 'WAITING_CLIENT';
      await handleUpdateTaskStatus(taskId, nextStatus);

      setAppState(prev => ({
        ...prev,
        approvals: prev.approvals.map(a => a.id === approvalId ? updatedApproval : a)
      }));
    } catch (err) {
      console.error('Failed to approve task:', err);
      throw err;
    }
  };

  // 18. رفض مهمة
  const handleRejectTask = async (approvalId: string, taskId: string) => {
    try {
      // تحديث الاعتماد
      const updatedApproval = await database.approvals.update(approvalId, {
        status: 'CHANGES_REQUESTED'
      });

      // إرجاع المهمة
      await handleUpdateTaskStatus(taskId, 'IN_PROGRESS');

      setAppState(prev => ({
        ...prev,
        approvals: prev.approvals.map(a => a.id === approvalId ? updatedApproval : a)
      }));
    } catch (err) {
      console.error('Failed to reject task:', err);
      throw err;
    }
  };

  // 19. تحميل ملف
  const handleUploadFile = async (file: File, clientId: string) => {
    try {
      const fileAsset = await database.files.uploadFile(file, clientId);

      setAppState(prev => ({
        ...prev,
        files: [...prev.files, fileAsset]
      }));

      return fileAsset;
    } catch (err) {
      console.error('Failed to upload file:', err);
      throw err;
    }
  };

  // 20. حذف ملف
  const handleDeleteFile = async (fileId: string) => {
    try {
      await database.files.delete(fileId);

      setAppState(prev => ({
        ...prev,
        files: prev.files.filter(f => f.id !== fileId)
      }));
    } catch (err) {
      console.error('Failed to delete file:', err);
      throw err;
    }
  };

  // Props object لتمريره إلى جميع الـ pages
  const appProps = {
    // State
    ...appState,
    currentUser,
    loading,
    error,
    autoSyncEnabled,

    // Setters
    setUsers: (users: User[]) => setAppState(prev => ({ ...prev, users })),
    setClients: (clients: Client[]) => setAppState(prev => ({ ...prev, clients })),
    setProjects: (projects: Project[]) => setAppState(prev => ({ ...prev, projects })),
    setTasks: (tasks: Task[]) => setAppState(prev => ({ ...prev, tasks })),
    setAccounts: (accounts: ClientAccount[]) => setAppState(prev => ({ ...prev, accounts })),
    setPosts: (posts: CommunityPost[]) => setAppState(prev => ({ ...prev, posts })),
    setApprovals: (approvals: Approval[]) => setAppState(prev => ({ ...prev, approvals })),
    setPerformance: (performance: PerformanceSnapshot[]) => setAppState(prev => ({ ...prev, performance })),
    setActivity: (activity: ActivityLog[]) => setAppState(prev => ({ ...prev, activity })),
    setFiles: (files: FileAsset[]) => setAppState(prev => ({ ...prev, files })),
    setCurrentUser,
    setError,
    setAutoSyncEnabled,

    // Handlers
    handleAddClient,
    handleUpdateClient,
    handleDeleteClient,
    handleAddProject,
    handleUpdateProject,
    handleDeleteProject,
    handleAddTask,
    handleUpdateTask,
    handleUpdateTaskStatus,
    handleDeleteTask,
    handleAddPost,
    handleLikePost,
    handleDeletePost,
    handleApproveTask,
    handleRejectTask,
    handleUploadFile,
    handleDeleteFile,
    handleSaveChanges
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login {...appProps} />} />
        <Route 
          path="/*" 
          element={
            currentUser ? (
              <Layout user={currentUser} {...appProps}>
                <Routes>
                  <Route path="/" element={<Dashboard {...appProps} />} />
                  <Route path="/clients" element={<Clients {...appProps} />} />
                  <Route path="/clients/:id" element={<ClientDetails {...appProps} />} />
                  <Route path="/projects" element={<Projects {...appProps} />} />
                  <Route path="/projects/:id" element={<ProjectDetails {...appProps} />} />
                  <Route path="/tasks" element={<Tasks {...appProps} />} />
                  <Route path="/tasks/:id" element={<TaskDetails {...appProps} />} />
                  <Route path="/approvals" element={<Approvals {...appProps} />} />
                  <Route path="/files" element={<FilesPage {...appProps} />} />
                  <Route path="/reports" element={<Reports {...appProps} />} />
                  <Route path="/activity" element={<ActivityLog {...appProps} />} />
                  <Route path="/community" element={<Community {...appProps} />} />
                  <Route path="/ai-center" element={<AICenter {...appProps} />} />
                  <Route path="/users" element={<UserManagement {...appProps} />} />
                  <Route path="/profile" element={<Profile {...appProps} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}
