import { supabase, db, storage } from './supabase';
import type { User, Client, Project, Task, ClientAccount, CommunityPost, Approval, PerformanceSnapshot, ActivityLogEntry, FileAsset } from '../types';

/**
 * =====================
 * USERS DATABASE OPERATIONS
 * =====================
 */
export const usersDB = {
  async getAll(): Promise<User[]> {
    return await db.getAll('users');
  },
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async create(user: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase.from('users').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },
  async getByRole(role: string): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').eq('role', role);
    if (error) throw error;
    return data || [];
  },
  async getActive(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').eq('is_active', true);
    if (error) throw error;
    return data || [];
  }
};

/**
 * =====================
 * CLIENTS DATABASE OPERATIONS
 * =====================
 */
export const clientsDB = {
  async getAll(): Promise<Client[]> {
    return await db.getAll('clients');
  },
  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async create(client: Omit<Client, 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert([client]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase.from('clients').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },
  async getByCountry(country: string): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').eq('country', country);
    if (error) throw error;
    return data || [];
  },
  async uploadCoverImage(clientId: string, file: File): Promise<string> {
    const filePath = `clients/${clientId}/cover-${Date.now()}`;
    const url = await storage.uploadFile(file, filePath);
    await this.update(clientId, { cover_image: url });
    return url;
  },
  async search(query: string): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').ilike('name', `%${query}%`);
    if (error) throw error;
    return data || [];
  }
};

/**
 * =====================
 * CLIENT ACCOUNTS DATABASE OPERATIONS
 * =====================
 */
export const clientAccountsDB = {
  async getAll(): Promise<ClientAccount[]> {
    return await db.getAll('client_accounts');
  },
  async getByClientId(clientId: string): Promise<ClientAccount[]> {
    const { data, error } = await supabase.from('client_accounts').select('*').eq('client_id', clientId);
    if (error) throw error;
    return data || [];
  },
  async getById(id: string): Promise<ClientAccount | null> {
    const { data, error } = await supabase.from('client_accounts').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async create(account: Omit<ClientAccount, 'created_at' | 'updated_at'>): Promise<ClientAccount> {
    const { data, error } = await supabase.from('client_accounts').insert([account]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<ClientAccount>): Promise<ClientAccount> {
    const { data, error } = await supabase.from('client_accounts').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('client_accounts').delete().eq('id', id);
    if (error) throw error;
  },
  async getByPlatform(platform: string): Promise<ClientAccount[]> {
    const { data, error } = await supabase.from('client_accounts').select('*').eq('platform', platform);
    if (error) throw error;
    return data || [];
  }
};

/**
 * =====================
 * PROJECTS DATABASE OPERATIONS
 * =====================
 */
export const projectsDB = {
  async getAll(): Promise<Project[]> {
    return await db.getAll('projects');
  },
  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async getByClientId(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').eq('client_id', clientId);
    if (error) throw error;
    return data || [];
  },
  async create(project: Omit<Project, 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase.from('projects').insert([project]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase.from('projects').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },
  async getByStatus(status: string): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').eq('status', status);
    if (error) throw error;
    return data || [];
  },
  async getByCreatedBy(userId: string): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').eq('created_by_user_id', userId);
    if (error) throw error;
    return data || [];
  },
  async updateStatus(id: string, status: string): Promise<Project> {
    return await this.update(id, { status } as any);
  }
};

/**
 * =====================
 * TASKS DATABASE OPERATIONS
 * =====================
 */
export const tasksDB = {
  async getAll(): Promise<Task[]> {
    return await db.getAll('tasks');
  },
  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async getByClientId(clientId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('client_id', clientId);
    if (error) throw error;
    return data || [];
  },
  async getByProjectId(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId);
    if (error) throw error;
    return data || [];
  },
  async getByAssignee(userId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('assigned_to_user_id', userId);
    if (error) throw error;
    return data || [];
  },
  async create(task: Omit<Task, 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase.from('tasks').insert([task]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase.from('tasks').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
  async updateStatus(id: string, status: string): Promise<Task> {
    return await this.update(id, { status } as any);
  },
  async getByStatus(status: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('status', status);
    if (error) throw error;
    return data || [];
  },
  async getPending(): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').in('status', ['WAITING_APPROVAL', 'WAITING_CLIENT']);
    if (error) throw error;
    return data || [];
  },
  async bulkUpdate(taskIds: string[], updates: Partial<Task>): Promise<void> {
    const { error } = await supabase.from('tasks').update(updates).in('id', taskIds);
    if (error) throw error;
  }
};

/**
 * =====================
 * APPROVALS DATABASE OPERATIONS
 * =====================
 */
export const approvalsDB = {
  async getAll(): Promise<Approval[]> {
    return await db.getAll('approvals');
  },
  async getById(id: string): Promise<Approval | null> {
    const { data, error } = await supabase.from('approvals').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async getByTaskId(taskId: string): Promise<Approval | null> {
    const { data, error } = await supabase.from('approvals').select('*').eq('task_id', taskId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async create(approval: Omit<Approval, 'created_at' | 'updated_at'>): Promise<Approval> {
    const { data, error } = await supabase.from('approvals').insert([approval]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<Approval>): Promise<Approval> {
    const { data, error } = await supabase.from('approvals').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('approvals').delete().eq('id', id);
    if (error) throw error;
  },
  async getPending(): Promise<Approval[]> {
    const { data, error } = await supabase.from('approvals').select('*').in('status', ['PENDING_INTERNAL', 'PENDING_CLIENT']);
    if (error) throw error;
    return data || [];
  },
  async getByClientId(clientId: string): Promise<Approval[]> {
    const { data, error } = await supabase.from('approvals').select('*').eq('client_id', clientId);
    if (error) throw error;
    return data || [];
  }
};

/**
 * =====================
 * COMMUNITY POSTS DATABASE OPERATIONS
 * =====================
 */
export const communityPostsDB = {
  async getAll(): Promise<CommunityPost[]> {
    return await db.getAll('community_posts');
  },
  async getById(id: string): Promise<CommunityPost | null> {
    const { data, error } = await supabase.from('community_posts').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
  async getByDepartment(department: string): Promise<CommunityPost[]> {
    const { data, error } = await supabase.from('community_posts').select('*').eq('department', department);
    if (error) throw error;
    return data || [];
  },
  async getByUserId(userId: string): Promise<CommunityPost[]> {
    const { data, error } = await supabase.from('community_posts').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },
  async create(post: Omit<CommunityPost, 'created_at' | 'updated_at' | 'likes'>): Promise<CommunityPost> {
    const { data, error } = await supabase.from('community_posts').insert([{ ...post, likes: 0 }]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<CommunityPost>): Promise<CommunityPost> {
    const { data, error } = await supabase.from('community_posts').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('community_posts').delete().eq('id', id);
    if (error) throw error;
  },
  async addLike(id: string): Promise<CommunityPost> {
    const post = await this.getById(id);
    if (!post) throw new Error('Post not found');
    return await this.update(id, { likes: (post.likes || 0) + 1 });
  }
};

/**
 * =====================
 * PERFORMANCE DATABASE OPERATIONS
 * =====================
 */
export const performanceDB = {
  async getAll(): Promise<PerformanceSnapshot[]> {
    return await db.getAll('performance_snapshots');
  },
  async getByClientId(clientId: string): Promise<PerformanceSnapshot[]> {
    const { data, error } = await supabase.from('performance_snapshots').select('*').eq('client_id', clientId);
    if (error) throw error;
    return data || [];
  },
  async getByPlatform(platform: string): Promise<PerformanceSnapshot[]> {
    const { data, error } = await supabase.from('performance_snapshots').select('*').eq('platform', platform);
    if (error) throw error;
    return data || [];
  },
  async create(snapshot: Omit<PerformanceSnapshot, 'created_at' | 'updated_at'>): Promise<PerformanceSnapshot> {
    const { data, error } = await supabase.from('performance_snapshots').insert([snapshot]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<PerformanceSnapshot>): Promise<PerformanceSnapshot> {
    const { data, error } = await supabase.from('performance_snapshots').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('performance_snapshots').delete().eq('id', id);
    if (error) throw error;
  }
};

/**
 * =====================
 * ACTIVITY LOGS DATABASE OPERATIONS
 * =====================
 */
export const activityLogsDB = {
  async getAll(): Promise<ActivityLogEntry[]> {
    return await db.getAll('activity_logs');
  },
  async getByUserId(userId: string): Promise<ActivityLogEntry[]> {
    const { data, error } = await supabase.from('activity_logs').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },
  async create(log: Omit<ActivityLogEntry, 'created_at'>): Promise<ActivityLogEntry> {
    const { data, error } = await supabase.from('activity_logs').insert([log]).select().single();
    if (error) throw error;
    return data;
  },
  async logAction(userId: string, action: string, entityType?: string, entityId?: string): Promise<void> {
    await this.create({
      id: `log_${Date.now()}`,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId
    });
  }
};

/**
 * =====================
 * FILES DATABASE OPERATIONS
 * =====================
 */
export const filesDB = {
  async getAll(): Promise<FileAsset[]> {
    return await db.getAll('file_assets');
  },
  async getByClientId(clientId: string): Promise<FileAsset[]> {
    const { data, error } = await supabase.from('file_assets').select('*').eq('client', clientId);
    if (error) throw error;
    return data || [];
  },
  async create(file: Omit<FileAsset, 'created_at' | 'updated_at'>): Promise<FileAsset> {
    const { data, error } = await supabase.from('file_assets').insert([file]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<FileAsset>): Promise<FileAsset> {
    const { data, error } = await supabase.from('file_assets').update({
      ...updates,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('file_assets').delete().eq('id', id);
    if (error) throw error;
  },
  async uploadFile(file: File, clientId: string): Promise<FileAsset> {
    const filePath = `files/${clientId}/${Date.now()}-${file.name}`;
    const url = await storage.uploadFile(file, filePath);
    return await this.create({
      id: `file_${Date.now()}`,
      name: file.name,
      type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document',
      client: clientId,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      url,
      date: new Date().toISOString().split('T')[0]
    });
  }
};

/**
 * =====================
 * BATCH OPERATIONS
 * =====================
 */
export const batchDB = {
  async getAllData() {
    return {
      users: await usersDB.getAll(),
      clients: await clientsDB.getAll(),
      projects: await projectsDB.getAll(),
      tasks: await tasksDB.getAll(),
      accounts: await clientAccountsDB.getAll(),
      posts: await communityPostsDB.getAll(),
      approvals: await approvalsDB.getAll(),
      performance: await performanceDB.getAll(),
      activity: await activityLogsDB.getAll(),
      files: await filesDB.getAll()
    };
  },
  async syncData(changes: any) {
    try {
      if (changes.users) {
        for (const user of changes.users) {
          if (user.id.startsWith('new_')) {
            await usersDB.create(user);
          } else {
            await usersDB.update(user.id, user);
          }
        }
      }
      if (changes.clients) {
        for (const client of changes.clients) {
          if (client.id.startsWith('new_')) {
            await clientsDB.create(client);
          } else {
            await clientsDB.update(client.id, client);
          }
        }
      }
      if (changes.projects) {
        for (const project of changes.projects) {
          if (project.id.startsWith('new_')) {
            await projectsDB.create(project);
          } else {
            await projectsDB.update(project.id, project);
          }
        }
      }
      if (changes.tasks) {
        for (const task of changes.tasks) {
          if (task.id.startsWith('new_')) {
            await tasksDB.create(task);
          } else {
            await tasksDB.update(task.id, task);
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }
};

export default {
  users: usersDB,
  clients: clientsDB,
  projects: projectsDB,
  tasks: tasksDB,
  accounts: clientAccountsDB,
  posts: communityPostsDB,
  approvals: approvalsDB,
  performance: performanceDB,
  activity: activityLogsDB,
  files: filesDB,
  batch: batchDB
};
