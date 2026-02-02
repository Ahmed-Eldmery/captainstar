import { db, storage } from './supabase';
import { 
  User, Client, Project, Task, ClientAccount, 
  CommunityPost, PerformanceSnapshot, ActivityLogEntry, 
  FileAsset, Approval
} from '../types';

// ==================== USERS ====================
export const usersAPI = {
  async getAll(): Promise<User[]> {
    return await db.getAll('users');
  },
  
  async getById(id: string): Promise<User> {
    const users = await db.getAll('users');
    return users.find((u: User) => u.id === id);
  },

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return await db.insert('users', {
      ...user,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    return await db.update('users', id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('users', id);
  },

  async authenticate(email: string, passwordHash: string): Promise<User | null> {
    const users = await db.getAll('users');
    return users.find((u: User) => u.email === email && u.passwordHash === passwordHash) || null;
  }
};

// ==================== CLIENTS ====================
export const clientsAPI = {
  async getAll(): Promise<Client[]> {
    return await db.getAll('clients');
  },

  async getById(id: string): Promise<Client> {
    const clients = await db.getAll('clients');
    return clients.find((c: Client) => c.id === id);
  },

  async create(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    return await db.insert('clients', {
      ...client,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    return await db.update('clients', id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('clients', id);
  },

  async uploadCoverImage(clientId: string, file: File): Promise<string> {
    const path = `clients/${clientId}/cover-${Date.now()}`;
    const url = await storage.uploadFile(file, path);
    await db.update('clients', clientId, { coverImage: url });
    return url;
  }
};

// ==================== PROJECTS / CAMPAIGNS ====================
export const projectsAPI = {
  async getAll(): Promise<Project[]> {
    return await db.getAll('projects');
  },

  async getById(id: string): Promise<Project> {
    const projects = await db.getAll('projects');
    return projects.find((p: Project) => p.id === id);
  },

  async getByClientId(clientId: string): Promise<Project[]> {
    const projects = await db.getAll('projects');
    return projects.filter((p: Project) => p.clientId === clientId);
  },

  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    return await db.insert('projects', {
      ...project,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    return await db.update('projects', id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('projects', id);
  }
};

// ==================== TASKS ====================
export const tasksAPI = {
  async getAll(): Promise<Task[]> {
    return await db.getAll('tasks');
  },

  async getById(id: string): Promise<Task> {
    const tasks = await db.getAll('tasks');
    return tasks.find((t: Task) => t.id === id);
  },

  async getByProjectId(projectId: string): Promise<Task[]> {
    const tasks = await db.getAll('tasks');
    return tasks.filter((t: Task) => t.projectId === projectId);
  },

  async getByClientId(clientId: string): Promise<Task[]> {
    const tasks = await db.getAll('tasks');
    return tasks.filter((t: Task) => t.clientId === clientId);
  },

  async getByAssignee(userId: string): Promise<Task[]> {
    const tasks = await db.getAll('tasks');
    return tasks.filter((t: Task) => t.assignedToUserId === userId);
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    return await db.insert('tasks', {
      ...task,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    return await db.update('tasks', id, updates);
  },

  async updateStatus(id: string, status: string): Promise<Task> {
    return await db.update('tasks', id, { status });
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('tasks', id);
  },

  async bulkUpdate(taskIds: string[], updates: Partial<Task>): Promise<void> {
    await Promise.all(taskIds.map(id => db.update('tasks', id, updates)));
  }
};

// ==================== CLIENT ACCOUNTS ====================
export const accountsAPI = {
  async getAll(): Promise<ClientAccount[]> {
    return await db.getAll('client_accounts');
  },

  async getByClientId(clientId: string): Promise<ClientAccount[]> {
    const accounts = await db.getAll('client_accounts');
    return accounts.filter((a: ClientAccount) => a.clientId === clientId);
  },

  async create(account: Omit<ClientAccount, 'id'>): Promise<ClientAccount> {
    return await db.insert('client_accounts', {
      ...account,
      id: `acc-${Date.now()}`
    });
  },

  async update(id: string, updates: Partial<ClientAccount>): Promise<ClientAccount> {
    return await db.update('client_accounts', id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('client_accounts', id);
  }
};

// ==================== COMMUNITY POSTS ====================
export const postsAPI = {
  async getAll(): Promise<CommunityPost[]> {
    return await db.getAll('community_posts');
  },

  async getByDepartment(department: string): Promise<CommunityPost[]> {
    const posts = await db.getAll('community_posts');
    return posts.filter((p: CommunityPost) => p.department === department);
  },

  async getByUser(userId: string): Promise<CommunityPost[]> {
    const posts = await db.getAll('community_posts');
    return posts.filter((p: CommunityPost) => p.userId === userId);
  },

  async create(post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes'>): Promise<CommunityPost> {
    return await db.insert('community_posts', {
      ...post,
      id: `post-${Date.now()}`,
      likes: 0,
      createdAt: new Date().toISOString()
    });
  },

  async updateLikes(id: string, likes: number): Promise<CommunityPost> {
    return await db.update('community_posts', id, { likes });
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('community_posts', id);
  }
};

// ==================== APPROVALS ====================
export const approvalsAPI = {
  async getAll(): Promise<Approval[]> {
    return await db.getAll('approvals');
  },

  async getByTaskId(taskId: string): Promise<Approval | null> {
    const approvals = await db.getAll('approvals');
    return approvals.find((a: Approval) => a.taskId === taskId) || null;
  },

  async getPending(): Promise<Approval[]> {
    const approvals = await db.getAll('approvals');
    return approvals.filter((a: Approval) => 
      a.status === 'PENDING_INTERNAL' || a.status === 'PENDING_CLIENT'
    );
  },

  async create(approval: Omit<Approval, 'id' | 'createdAt'>): Promise<Approval> {
    return await db.insert('approvals', {
      ...approval,
      id: `apr-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
  },

  async updateStatus(id: string, status: string): Promise<Approval> {
    return await db.update('approvals', id, { status });
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('approvals', id);
  }
};

// ==================== PERFORMANCE ====================
export const performanceAPI = {
  async getAll(): Promise<PerformanceSnapshot[]> {
    return await db.getAll('performance_snapshots');
  },

  async getByClientId(clientId: string): Promise<PerformanceSnapshot[]> {
    const data = await db.getAll('performance_snapshots');
    return data.filter((p: PerformanceSnapshot) => p.clientId === clientId);
  },

  async getByPlatform(platform: string): Promise<PerformanceSnapshot[]> {
    const data = await db.getAll('performance_snapshots');
    return data.filter((p: PerformanceSnapshot) => p.platform === platform);
  },

  async create(snapshot: Omit<PerformanceSnapshot, 'id'>): Promise<PerformanceSnapshot> {
    return await db.insert('performance_snapshots', {
      ...snapshot,
      id: `perf-${Date.now()}`
    });
  },

  async update(id: string, updates: Partial<PerformanceSnapshot>): Promise<PerformanceSnapshot> {
    return await db.update('performance_snapshots', id, updates);
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('performance_snapshots', id);
  }
};

// ==================== ACTIVITY LOG ====================
export const activityAPI = {
  async getAll(): Promise<ActivityLogEntry[]> {
    return await db.getAll('activity_logs');
  },

  async getByUser(userId: string): Promise<ActivityLogEntry[]> {
    const logs = await db.getAll('activity_logs');
    return logs.filter((l: ActivityLogEntry) => l.userId === userId);
  },

  async log(entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>): Promise<ActivityLogEntry> {
    return await db.insert('activity_logs', {
      ...entry,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
  }
};

// ==================== FILES ====================
export const filesAPI = {
  async getAll(): Promise<FileAsset[]> {
    return await db.getAll('file_assets');
  },

  async getByClient(clientId: string): Promise<FileAsset[]> {
    const files = await db.getAll('file_assets');
    return files.filter((f: FileAsset) => f.client === clientId);
  },

  async upload(file: File, clientId: string): Promise<FileAsset> {
    const path = `files/${clientId}/${Date.now()}-${file.name}`;
    const url = await storage.uploadFile(file, path);
    
    return await db.insert('file_assets', {
      id: `file-${Date.now()}`,
      name: file.name,
      type: file.type.startsWith('image') ? 'image' : 
             file.type.startsWith('video') ? 'video' : 
             file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'other',
      client: clientId,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      url: url,
      date: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<boolean> {
    return await db.delete('file_assets', id);
  }
};

// ==================== BATCH OPERATIONS ====================
export const batchAPI = {
  async getAllData(): Promise<{
    users: User[];
    clients: Client[];
    projects: Project[];
    tasks: Task[];
    accounts: ClientAccount[];
    posts: CommunityPost[];
    approvals: Approval[];
    performance: PerformanceSnapshot[];
    logs: ActivityLogEntry[];
    files: FileAsset[];
  }> {
    return {
      users: await usersAPI.getAll(),
      clients: await clientsAPI.getAll(),
      projects: await projectsAPI.getAll(),
      tasks: await tasksAPI.getAll(),
      accounts: await accountsAPI.getAll(),
      posts: await postsAPI.getAll(),
      approvals: await approvalsAPI.getAll(),
      performance: await performanceAPI.getAll(),
      logs: await activityAPI.getAll(),
      files: await filesAPI.getAll(),
    };
  },

  async syncData(): Promise<void> {
    // مزامنة البيانات مع الخادم
    // يمكن إضافة منطق إعادة المحاولة والمعالجة
    const data = await this.getAllData();
    console.log('Data synced:', data);
  }
};

export default {
  users: usersAPI,
  clients: clientsAPI,
  projects: projectsAPI,
  tasks: tasksAPI,
  accounts: accountsAPI,
  posts: postsAPI,
  approvals: approvalsAPI,
  performance: performanceAPI,
  activity: activityAPI,
  files: filesAPI,
  batch: batchAPI
};
