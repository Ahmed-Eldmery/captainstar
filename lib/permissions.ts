
import { Role, User, Task, Client, Project } from '../types';

export const PERMISSIONS = {
  VIEW_FINANCIALS: ['مدير حسابات', 'مشتري إعلانات', 'مدير مبيعات'],
  CREATE_CLIENT: ['مبيعات', 'مدير مبيعات', 'مدير حسابات'],
  CREATE_PROJECT: ['مدير حسابات', 'مدير مبيعات'],
  CREATE_TASK: ['مدير حسابات', 'مشتري إعلانات', 'خبير سيو', 'مدير مبيعات'],
  UPLOAD_FILES: ['مصمم جرافيك', 'مونتير فيديو', 'مبرمج ويب', 'مصمم واجهات', 'صانع محتوى'],
  APPROVE_WORK: ['مدير حسابات', 'مدير مبيعات'],
  VIEW_REPORTS: ['مشتري إعلانات', 'مدير حسابات', 'خبير سيو', 'مدير مبيعات'],
  MANAGE_TEAM: ['OWNER', 'ADMIN'],
};

export const canUserDo = (user: User, action: keyof typeof PERMISSIONS): boolean => {
  if (user.role === Role.OWNER) return true;
  if (user.role === Role.ADMIN) {
     return true;
  }
  const allowedRoles = PERMISSIONS[action];
  return allowedRoles?.includes(user.teamRole as string) || false;
};

// وظيفة الحماية المطلقة للمالك
export const canManageTargetUser = (actor: User, target: User): boolean => {
  // لا أحد يستطيع تعديل المالك (OWNER) تحت أي ظرف
  if (target.role === Role.OWNER) return false;
  
  // المالك (OWNER) يمتلك السيطرة الكاملة على كل الرتب الأخرى
  if (actor.role === Role.OWNER) return true; 
  
  // الآدمن (ADMIN) يستطيع تعديل الموظفين فقط (وليس المالك أو الآدمن الآخرين)
  if (actor.role === Role.ADMIN && target.role !== Role.ADMIN) return true;
  
  return false;
};

export const getVisibleTasks = (user: User, allTasks: Task[]): Task[] => {
  if (user.role === Role.OWNER || user.role === Role.ADMIN || user.role === Role.ACCOUNT_MANAGER) return allTasks;
  return allTasks.filter(t => t.assignedToUserId === user.id || t.createdByUserId === user.id);
};

export const getVisibleClients = (user: User, allClients: Client[], allTasks: Task[]): Client[] => {
  if (user.role === Role.OWNER || user.role === Role.ADMIN || user.role === Role.ACCOUNT_MANAGER) return allClients;
  const myTaskClientIds = new Set(allTasks.filter(t => t.assignedToUserId === user.id).map(t => t.clientId));
  return allClients.filter(c => myTaskClientIds.has(c.id));
};
