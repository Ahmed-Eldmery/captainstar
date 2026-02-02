/**
 * =====================
 * ADVANCED DATABASE EXAMPLES
 * =====================
 */

import React, { useState, useEffect } from 'react';
import database from '../lib/database';
import { supabase } from '../lib/supabase';
import { TaskStatus, ProjectStatus, Task } from '../types';

/**
 * 1. Real-time Updates
 * ===============
 */
export function useRealtimeClients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    // جلب البيانات الأولية
    const loadClients = async () => {
      const data = await database.clients.getAll();
      setClients(data);
    };
    loadClients();

    // الاستماع للتغييرات الحية
    const subscription = supabase
      .channel('clients-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setClients(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setClients(prev =>
              prev.map(c => c.id === payload.new.id ? payload.new as any : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setClients(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return clients;
}

/**
 * 2. Pagination (التقسيم إلى صفحات)
 * ===============
 */
export async function getPaginatedClients(page: number = 1, pageSize: number = 10) {
  const { data, error, count } = await supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    pages: Math.ceil((count || 0) / pageSize),
    currentPage: page
  };
}

/**
 * 3. Search و Filtering
 * ===============
 */
export async function searchClients(query: string, filters?: {
  country?: string;
  hasWebsite?: boolean;
  minCampaigns?: number;
}) {
  let queryBuilder = supabase
    .from('clients')
    .select('*');

  // البحث بالاسم
  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }

  // الفلاتر
  if (filters?.country) {
    queryBuilder = queryBuilder.eq('country', filters.country);
  }
  if (filters?.hasWebsite !== undefined) {
    queryBuilder = queryBuilder.eq('has_website', filters.hasWebsite);
  }
  if (filters?.minCampaigns !== undefined) {
    queryBuilder = queryBuilder.gte('num_campaigns', filters.minCampaigns);
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * 4. Advanced Filtering
 * ===============
 */
export async function getTasksWithFilters(filters: {
  status?: string[];
  priority?: string[];
  assignedTo?: string;
  projectId?: string;
  dueAfter?: Date;
  dueBefore?: Date;
}) {
  let query = supabase.from('tasks').select('*');

  if (filters.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters.priority?.length) {
    query = query.in('priority', filters.priority);
  }
  if (filters.assignedTo) {
    query = query.eq('assigned_to_user_id', filters.assignedTo);
  }
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId);
  }
  if (filters.dueAfter) {
    query = query.gte('due_date', filters.dueAfter.toISOString().split('T')[0]);
  }
  if (filters.dueBefore) {
    query = query.lte('due_date', filters.dueBefore.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * 5. Aggregation و Statistics
 * ===============
 */
export async function getClientStatistics(clientId: string) {
  // عدد المشاريع
  const projects = await database.projects.getByClientId(clientId);
  
  // عدد المهام
  const tasks = await database.tasks.getByClientId(clientId);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE as any) as Task[];
  
  // الأداء
  const performance = await database.performance.getByClientId(clientId);
  const totalSpend = performance.reduce((sum, p) => sum + (p.spend || 0), 0);
  const totalImpressions = performance.reduce((sum, p) => sum + (p.impressions || 0), 0);
  const totalClicks = performance.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const totalConversions = performance.reduce((sum, p) => sum + (p.conversions || 0), 0);

  return {
    client_id: clientId,
    projects: {
      total: projects.length,
      active: projects.filter(p => p.status !== (ProjectStatus.ON_HOLD as any)).length,
      completed: projects.filter(p => p.status === (ProjectStatus.COMPLETED as any)).length
    },
    tasks: {
      total: tasks.length,
      completed: completedTasks.length,
      pending: tasks.length - completedTasks.length,
      completionRate: ((completedTasks.length / tasks.length) * 100).toFixed(2) + '%'
    },
    performance: {
      spend: totalSpend.toFixed(2),
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%',
      cpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0',
      roas: totalSpend > 0 ? (totalConversions / totalSpend).toFixed(2) : '0'
    },
    accounts: {
      total: (await database.accounts.getByClientId(clientId)).length
    }
  };
}

/**
 * 6. Team Performance Analysis
 * ===============
 */
export async function getTeamAnalytics() {
  const users = await database.users.getActive();
  
  const analytics = await Promise.all(users.map(async (user) => {
    const assignedTasks = await database.tasks.getByAssignee(user.id);
    const completedTasks = assignedTasks.filter(t => t.status === (TaskStatus.DONE as any)) as Task[];
    const posts = await database.posts.getByUserId(user.id);
    
    return {
      user_id: user.id,
      name: user.name,
      role: user.role,
      team_role: user.teamRole,
      tasks: {
        assigned: assignedTasks.length,
        completed: completedTasks.length,
        pending: assignedTasks.length - completedTasks.length,
        completionRate: assignedTasks.length > 0 
          ? ((completedTasks.length / assignedTasks.length) * 100).toFixed(2) + '%'
          : 'N/A'
      },
      community: {
        posts: posts.length,
        totalLikes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
        engagement: posts.length > 0
          ? (posts.reduce((sum, p) => sum + (p.likes || 0), 0) / posts.length).toFixed(2)
          : 0
      }
    };
  }));

  return {
    total_users: users.length,
    active_users: users.length,
    team_members: analytics
  };
}

/**
 * 7. Campaign Performance
 * ===============
 */
export async function getCampaignPerformance(projectId: string) {
  const project = await database.projects.getById(projectId);
  if (!project) throw new Error('Project not found');

  const performance = await database.performance.getByClientId(project.clientId);
  const campaignPerformance = performance.filter(p => 
    p.campaignName === project.name || p.campaignName?.includes(project.name)
  );

  const byPlatform = {};
  campaignPerformance.forEach(p => {
    if (!byPlatform[p.platform]) {
      byPlatform[p.platform] = {
        platform: p.platform,
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        conversions: 0
      };
    }
    byPlatform[p.platform].spend += p.spend || 0;
    byPlatform[p.platform].impressions += p.impressions || 0;
    byPlatform[p.platform].clicks += p.clicks || 0;
    byPlatform[p.platform].leads += p.leads || 0;
    byPlatform[p.platform].conversions += p.conversions || 0;
  });

  return {
    project_name: project.name,
    project_id: projectId,
    total_spend: Object.values(byPlatform).reduce((sum, p: any) => sum + p.spend, 0),
    by_platform: Object.values(byPlatform),
    metrics: calculateMetrics(Object.values(byPlatform))
  };
}

function calculateMetrics(platforms: any[]) {
  const total = {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0
  };

  platforms.forEach(p => {
    total.spend += p.spend || 0;
    total.impressions += p.impressions || 0;
    total.clicks += p.clicks || 0;
    total.conversions += p.conversions || 0;
  });

  return {
    totalSpend: total.spend.toFixed(2),
    ctr: total.impressions > 0 ? ((total.clicks / total.impressions) * 100).toFixed(2) + '%' : '0%',
    cpc: total.clicks > 0 ? (total.spend / total.clicks).toFixed(2) : '0',
    costPerConversion: total.conversions > 0 ? (total.spend / total.conversions).toFixed(2) : '0',
    roas: total.spend > 0 ? (total.conversions / total.spend).toFixed(2) : '0'
  };
}

/**
 * 8. Bulk Operations with Validation
 * ===============
 */
export async function bulkAssignTasks(
  taskIds: string[],
  assigneeId: string,
  updateNotification: boolean = true
) {
  try {
    // التحقق من أن المستخدم موجود
    const user = await database.users.getById(assigneeId);
    if (!user) throw new Error('User not found');

    // التحقق من أن جميع المهام موجودة
    const tasks = await database.tasks.getAll();
    const validTasks = taskIds.filter(id => tasks.some(t => t.id === id));
    
    if (validTasks.length === 0) throw new Error('No valid tasks found');

    // تحديث المهام
    await database.tasks.bulkUpdate(validTasks, { assignedToUserId: assigneeId });

    // تسجيل النشاط
    for (const taskId of validTasks) {
      await database.activity.logAction(
        'system', // أو الـ current user
        'bulk_assigned_task',
        'Task',
        taskId
      );
    }

    return {
      success: true,
      updated: validTasks.length,
      assignee: user.name
    };
  } catch (error) {
    console.error('Bulk assignment failed:', error);
    throw error;
  }
}

/**
 * 9. Transaction-like Operations
 * ===============
 */
export async function completeProject(projectId: string, notes?: string) {
  try {
    // 1. تحديث حالة المشروع
    const updatedProject = await database.projects.updateStatus(projectId, 'COMPLETED');

    // 2. إكمال جميع المهام المعلقة
    const tasks = await database.tasks.getByProjectId(projectId);
    const pendingTasks = tasks.filter(t => !['DONE', 'CANCELLED'].includes(t.status));
    
    for (const task of pendingTasks) {
      await database.tasks.updateStatus(task.id, 'DONE');
    }

    // 3. إنشاء سجل النشاط
    await database.activity.logAction(
      'system',
      'project_completed',
      'Project',
      projectId
    );

    // 4. تحديث إحصائيات العميل
    const client = await database.clients.getById(updatedProject.clientId);
    if (client) {
      await database.clients.update(client.id, {
        // update stats if needed
      });
    }

    return {
      success: true,
      project: updatedProject,
      completedTasks: pendingTasks.length
    };
  } catch (error) {
    console.error('Project completion failed:', error);
    throw error;
  }
}

/**
 * 10. Export Data (تصدير البيانات)
 * ===============
 */
export async function exportClientData(clientId: string, format: 'json' | 'csv' = 'json') {
  try {
    const client = await database.clients.getById(clientId);
    const projects = await database.projects.getByClientId(clientId);
    const tasks = await database.tasks.getByClientId(clientId);
    const accounts = await database.accounts.getByClientId(clientId);
    const performance = await database.performance.getByClientId(clientId);

    const data = {
      client,
      projects,
      tasks,
      accounts,
      performance,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // تحويل إلى CSV
      return convertToCSV(data);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

function convertToCSV(data: any): string {
  const rows = [];
  
  // رأس الجدول
  const headers = Object.keys(data.client || {});
  rows.push(headers.join(','));

  // البيانات
  const client = data.client;
  rows.push(headers.map(h => JSON.stringify(client[h])).join(','));

  return rows.join('\n');
}

/**
 * 11. Notifications / Reminders
 * ===============
 */
export async function checkPendingTasks(userId?: string) {
  const allTasks = await database.tasks.getPending();
  
  const pendingTasks = userId
    ? allTasks.filter(t => t.assignedToUserId === userId)
    : allTasks;

  const notifications = pendingTasks.map(task => ({
    id: task.id,
    title: task.title,
    message: `Task "${task.title}" is waiting for approval`,
    priority: task.priority,
    dueDate: task.dueDate
  }));

  return notifications;
}

/**
 * 12. Audit Log
 * ===============
 */
export async function getUserAuditLog(userId: string, days: number = 30) {
  const allLogs = await database.activity.getByUserId(userId);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentLogs = allLogs.filter(log => new Date(log.createdAt) >= cutoffDate);

  return {
    userId,
    period: `Last ${days} days`,
    actions: recentLogs.length,
    log: recentLogs.map(log => ({
      action: log.action,
      entity: `${log.entityType}#${log.entityId}`,
      timestamp: log.createdAt
    }))
  };
}

export default {
  useRealtimeClients,
  getPaginatedClients,
  searchClients,
  getTasksWithFilters,
  getClientStatistics,
  getTeamAnalytics,
  getCampaignPerformance,
  bulkAssignTasks,
  completeProject,
  exportClientData,
  checkPendingTasks,
  getUserAuditLog
};
