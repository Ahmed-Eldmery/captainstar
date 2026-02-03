
import React, { useState, useMemo } from 'react';
import {
  Plus, Search, LayoutGrid, List, Filter,
  Clock, CheckSquare, ChevronLeft, X, User as UserIcon,
  Calendar as CalendarIcon, AlertCircle, Flag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority, TaskType, Role, User as UserType, Client, Project } from '../types';
import { getVisibleTasks, canUserDo } from '../lib/permissions';
import { db, generateId, supabase } from '../lib/supabase.ts';

interface TasksPageProps {
  user: UserType;
  users: UserType[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  clients: Client[];
  projects: Project[];
}

const Tasks: React.FC<TasksPageProps> = ({ user, users, tasks, setTasks, clients, projects }) => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    clientId: clients[0]?.id || '',
    priority: TaskPriority.MEDIUM,
    type: TaskType.CONTENT,
    status: TaskStatus.TODO,
    assignedToUserId: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const visibleTasks = useMemo(() => getVisibleTasks(user, tasks), [user, tasks]);
  const filteredTasks = useMemo(() => {
    return visibleTasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [visibleTasks, searchTerm]);

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.clientId) return;
    const taskToAdd: Task = {
      id: generateId(),
      clientId: newTask.clientId!,
      projectId: newTask.projectId || undefined, // Send undefined if empty string
      title: newTask.title!,
      description: newTask.description,
      status: newTask.status || TaskStatus.TODO,
      priority: newTask.priority || TaskPriority.MEDIUM,
      type: newTask.type || TaskType.CONTENT,
      assignedToUserId: newTask.assignedToUserId || undefined, // Send undefined if empty string
      createdByUserId: user.id,
      dueDate: newTask.dueDate,
      createdAt: new Date().toISOString()
    };
    try {
      await db.insert('tasks', taskToAdd);
      await db.logActivity(user.id, `إنشاء مهمة: ${taskToAdd.title}`, 'tasks', taskToAdd.id);

      // Create notification for assigned user
      if (taskToAdd.assignedToUserId) {
        try {
          await supabase.from('notifications').insert({
            user_id: String(taskToAdd.assignedToUserId),
            type: 'task_assigned',
            title: '📋 مهمة جديدة',
            message: `تم تكليفك بمهمة: ${taskToAdd.title}`,
            link: `/task/${taskToAdd.id}`
          });
        } catch (e) {
          console.error('Failed to create notification:', e);
        }
      }

      setTasks([taskToAdd, ...tasks]);
      setIsModalOpen(false);
      setNewTask({
        title: '',
        clientId: clients[0]?.id || '',
        priority: TaskPriority.MEDIUM,
        type: TaskType.CONTENT,
        status: TaskStatus.TODO,
        assignedToUserId: '',
        dueDate: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      alert(`فشل الحفظ: ${err.message || 'خطأ غير معروف'}`);
      console.error(err);
    }
  };

  const columns = [
    { id: TaskStatus.TODO, title: 'مهام جديدة', color: 'from-blue-100 to-blue-50', text: 'text-blue-600', icon: '🆕' },
    { id: TaskStatus.IN_PROGRESS, title: 'قيد التنفيذ', color: 'from-amber-100 to-amber-50', text: 'text-amber-600', icon: '⚙️' },
    { id: TaskStatus.WAITING_APPROVAL, title: 'اعتماد داخلي', color: 'from-purple-100 to-purple-50', text: 'text-purple-600', icon: '✋' },
    { id: TaskStatus.WAITING_CLIENT, title: 'اعتماد العميل', color: 'from-orange-100 to-orange-50', text: 'text-orange-600', icon: '👤' },
    { id: TaskStatus.DONE, title: 'مكتملة', color: 'from-emerald-100 to-emerald-50', text: 'text-emerald-600', icon: '✅' },
  ];

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.CRITICAL: return 'text-rose-600 bg-rose-50 border-rose-100';
      case TaskPriority.HIGH: return 'text-orange-600 bg-orange-50 border-orange-100';
      case TaskPriority.MEDIUM: return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">إدارة العمليات</h1>
          <p className="text-slate-500 mt-2 font-bold">تتبع سير العمل والمهام المسندة لفريق الوكالة.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex">
            <button onClick={() => setView('kanban')} className={`p-3 rounded-xl transition-all ${view === 'kanban' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setView('list')} className={`p-3 rounded-xl transition-all ${view === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-5 h-5" />
            </button>
          </div>
          {canUserDo(user, 'CREATE_TASK') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-rose-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-5 h-5" /> مهمة جديدة
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-6">
        <div className="relative flex-1 group w-full">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="ابحث عن مهمة بالاسم..."
            className="w-full pr-14 pl-6 py-4 bg-slate-100/50 border-0 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-8 overflow-x-auto pb-12 scrollbar-hide">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="min-w-[380px] w-[380px] shrink-0 space-y-6">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{col.icon}</span>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{col.title}</h3>
                      <p className="text-[10px] text-slate-400 font-bold">{colTasks.length} مهام</p>
                    </div>
                  </div>
                </div>
                <div className={`p-5 rounded-[2.5rem] bg-gradient-to-b ${col.color} border-2 border-slate-200/40 space-y-4 min-h-[600px]`}>
                  {colTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm font-bold text-slate-400">لا توجد مهام</p>
                      </div>
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const client = clients.find(c => c.id === task.clientId);
                      const assignee = users.find(u => u.id === task.assignedToUserId);
                      return (
                        <div key={task.id} className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md hover:shadow-lg hover:border-rose-300 transition-all group cursor-pointer relative overflow-hidden hover:scale-105 duration-200">
                          {/* شريط الحالة */}
                          <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${col.color}`}></div>

                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 uppercase tracking-widest">{task.type}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                          </div>
                          <Link to={`/tasks/${task.id}`}>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors leading-relaxed line-clamp-2 mb-3">{task.title}</h4>
                          </Link>

                          {/* معلومات العميل والموعد */}
                          <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900 font-black text-xs">{client?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-300" />
                              <span className={`text-[10px] font-bold ${new Date(task.dueDate || '') < new Date() && task.status !== TaskStatus.DONE ? 'text-rose-500' : 'text-slate-400'}`}>
                                {task.dueDate || 'لم يحدد'}
                              </span>
                            </div>
                          </div>

                          {/* المسؤول */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-[9px] text-white font-black border-2 border-white shadow-sm overflow-hidden">
                                {assignee?.avatarUrl ? <img src={assignee.avatarUrl} className="w-full h-full object-cover" /> : (assignee?.name.charAt(0) || '?')}
                              </div>
                              <p className="text-[9px] text-slate-500 font-bold truncate max-w-[100px]">{assignee?.name || 'غير معين'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 text-slate-400 text-xs font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">المهمة</th>
                <th className="px-8 py-6">العميل</th>
                <th className="px-8 py-6">المسؤول</th>
                <th className="px-8 py-6">التسليم</th>
                <th className="px-8 py-6">الحالة</th>
                <th className="px-8 py-6">الأولوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTasks.map(task => {
                const assignee = users.find(u => u.id === task.assignedToUserId);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <Link to={`/tasks/${task.id}`} className="font-black text-slate-900 group-hover:text-rose-600">{task.title}</Link>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-500">{clients.find(c => c.id === task.clientId)?.name}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-black">{assignee?.name.charAt(0) || '?'}</div>
                        <span className="text-xs font-bold text-slate-600">{assignee?.name || 'غير معين'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-400">{task.dueDate}</td>
                    <td className="px-8 py-6"><span className="text-[10px] font-black px-3 py-1 bg-slate-100 rounded-lg">{task.status}</span></td>
                    <td className="px-8 py-6"><span className={`text-[10px] font-black px-3 py-1 rounded-lg border ${getPriorityColor(task.priority)}`}>{task.priority}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal إضافة مهمة المطور */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-3xl space-y-10 relative overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-200">
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black">مهمة جديدة</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">عنوان المهمة</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-2xl py-5 px-8 font-bold outline-none transition-all shadow-inner"
                  placeholder="ما الذي يجب إنجازه؟"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">العميل المرتبط</label>
                  <select
                    value={newTask.clientId}
                    onChange={e => setNewTask({ ...newTask, clientId: e.target.value, projectId: '' })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl py-4 px-6 font-bold outline-none cursor-pointer"
                  >
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">المشروع (اختياري)</label>
                  <select
                    value={newTask.projectId || ''}
                    onChange={e => setNewTask({ ...newTask, projectId: e.target.value || undefined })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl py-4 px-6 font-bold outline-none cursor-pointer"
                  >
                    <option value="">بدون مشروع</option>
                    {projects.filter(p => p.clientId === newTask.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">المسؤول عن التنفيذ</label>
                  <select
                    value={newTask.assignedToUserId}
                    onChange={e => setNewTask({ ...newTask, assignedToUserId: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl py-4 px-6 font-bold outline-none cursor-pointer"
                  >
                    <option value="">اختر موظفاً...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.teamRole})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">تاريخ التسليم</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl py-4 pr-6 pl-12 font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">الأولوية</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl py-4 px-6 font-bold outline-none cursor-pointer"
                  >
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">نوع المهمة</label>
                  <select
                    value={newTask.type}
                    onChange={e => setNewTask({ ...newTask, type: e.target.value as TaskType })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl py-4 px-6 font-bold outline-none cursor-pointer"
                  >
                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">تفاصيل إضافية</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl py-5 px-8 font-bold outline-none h-32 resize-none"
                  placeholder="اشرح المطلوب بوضوح لفريق العمل..."
                />
              </div>
            </div>

            <div className="flex gap-6 pt-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 font-black rounded-2xl hover:bg-slate-200 transition-colors">إلغاء</button>
              <button onClick={handleAddTask} className="flex-1 py-5 bg-rose-600 text-white font-black rounded-[2rem] shadow-2xl shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-3">
                <CheckSquare className="w-5 h-5" /> تأكيد الإسناد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
