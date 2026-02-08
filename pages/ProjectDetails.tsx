
import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, DollarSign, Target, CheckSquare,
  Clock, Users, ChevronLeft, MoreHorizontal, Layout,
  Zap, AlertCircle, CheckCircle2, ListTodo, FileText, Play,
  Plus, X, Check, Trash2, Edit2, Save
} from 'lucide-react';
import { ProjectStatus, TaskStatus, Project, Client, Task, User } from '../types';

interface ProjectDetailsProps {
  user: User;
  projects: Project[];
  clients: Client[];
  tasks: Task[];
  users: User[];
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ user, projects, clients, tasks, users }) => {
  const { id } = useParams<{ id: string }>();
  const project = useMemo(() => projects.find(p => p.id === id), [id, projects]);
  const client = useMemo(() => clients.find(c => c.id === project?.clientId), [project, clients]);

  const projectTasks = useMemo(() => {
    const allTasks = tasks.filter(t => t.projectId === id || (t.clientId === project?.clientId && !t.projectId));

    // If Admin, Owner, or General Manager, show all tasks
    if (['admin', 'owner', 'manager', 'general_manager'].includes(user.role?.toLowerCase() || '')) {
      return allTasks;
    }

    // Otherwise, only show tasks assigned to the current user (using loose comparison for safety)
    return allTasks.filter(t => String(t.assignedToUserId) === String(user.id));
  }, [id, project, tasks, user]);

  // حالة المهام والأهداف المحلية
  const [localGoals, setLocalGoals] = useState<Array<{ id: string, title: string, completed: boolean }>>([]);
  const [localTodos, setLocalTodos] = useState<Array<{ id: string, title: string, completed: boolean }>>([]);
  const [newGoal, setNewGoal] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isEditingTodos, setIsEditingTodos] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    setLocalGoals([...localGoals, { id: `goal-${Date.now()}`, title: newGoal, completed: false }]);
    setNewGoal('');
  };

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    setLocalTodos([...localTodos, { id: `todo-${Date.now()}`, title: newTodo, completed: false }]);
    setNewTodo('');
  };

  const handleToggleGoal = (id: string) => {
    setLocalGoals(localGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const handleToggleTodo = (id: string) => {
    setLocalTodos(localTodos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteGoal = (id: string) => {
    setLocalGoals(localGoals.filter(g => g.id !== id));
  };

  const handleDeleteTodo = (id: string) => {
    setLocalTodos(localTodos.filter(t => t.id !== id));
  };

  if (!project) return <div className="p-20 text-center font-black text-slate-400">المشروع غير موجود.</div>;

  const completedTasksCount = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0;

  const statusMap: Record<string, { label: string, color: string }> = {
    [ProjectStatus.PLANNED]: { label: 'مخطط له', color: 'bg-slate-100 text-slate-500' },
    [ProjectStatus.IN_PROGRESS]: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-600' },
    [ProjectStatus.ON_HOLD]: { label: 'متوقف مؤقتاً', color: 'bg-amber-100 text-amber-600' },
    [ProjectStatus.COMPLETED]: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-600' },
    [ProjectStatus.CANCELLED]: { label: 'ملغي', color: 'bg-rose-100 text-rose-600' },
  };

  const currentStatusConfig = statusMap[project.status] || { label: project.status, color: 'bg-slate-100 text-slate-500' };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link to="/projects" className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <ArrowRight className="w-6 h-6 text-slate-400" />
          </Link>
          <div className="text-right">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-black text-slate-900">{project.name}</h1>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${currentStatusConfig.color}`}>
                {currentStatusConfig.label}
              </span>
            </div>
            <p className="text-slate-400 font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" /> مشروع لصالح: <span className="text-slate-900">{client?.name}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-4 relative">
          <div className="relative">
            <button
              onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-rose-600 transition-all flex items-center gap-3 active:scale-95"
            >
              <Zap className="w-5 h-5 text-rose-500" /> إجراء سريع
            </button>

            {isQuickActionOpen && (
              <div className="absolute top-full left-0 mt-3 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-50 w-64 overflow-hidden">
                {/* تغيير الحالة */}
                <div className="border-b border-slate-100">
                  <p className="text-xs font-black text-slate-500 uppercase px-4 pt-4 pb-2">تغيير الحالة</p>
                  <div className="space-y-2 px-2 pb-4">
                    {[
                      { value: ProjectStatus.PLANNED, label: 'مخطط له' },
                      { value: ProjectStatus.IN_PROGRESS, label: 'قيد التنفيذ' },
                      { value: ProjectStatus.COMPLETED, label: 'مكتمل' },
                      { value: ProjectStatus.ON_HOLD, label: 'متوقف مؤقتاً' },
                      { value: ProjectStatus.CANCELLED, label: 'ملغي' }
                    ].map(status => (
                      <button
                        key={status.value}
                        onClick={() => {
                          // تغيير الحالة هنا
                          console.log('تغيير الحالة إلى:', status.value);
                          setIsQuickActionOpen(false);
                        }}
                        className={`w-full text-right px-4 py-2 rounded-lg font-bold text-sm transition-all ${project.status === status.value ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* إضافة مهمة سريعة */}
                <div className="border-b border-slate-100">
                  <p className="text-xs font-black text-slate-500 uppercase px-4 pt-4 pb-2">إضافة مهمة سريعة</p>
                  <div className="space-y-2 px-4 pb-4">
                    {['محتوى', 'تصميم', 'فيديو', 'سيو'].map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          handleAddTodo();
                          console.log('إضافة مهمة من نوع:', type);
                          setIsQuickActionOpen(false);
                        }}
                        className="w-full text-right px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all"
                      >
                        + {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* تصدير وإجراءات أخرى */}
                <div className="px-2 py-4 space-y-2">
                  <button
                    onClick={() => {
                      console.log('تصدير تقرير المشروع');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full text-right px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 transition-all"
                  >
                    📊 تصدير تقرير
                  </button>
                  <button
                    onClick={() => {
                      console.log('مشاركة المشروع');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full text-right px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-all"
                  >
                    🔗 مشاركة المشروع
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center space-y-2 group hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">الفترة الزمنية</p>
          <p className="text-sm font-black text-slate-900">{project.startDate} &larr; {project.endDate}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center space-y-2 group hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-4 shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">إجمالي الميزانية</p>
          <p className="text-sm font-black text-slate-900">{project.totalBudget?.toLocaleString()} ر.س</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center space-y-2 group hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
            <CheckSquare className="w-6 h-6" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">إنجاز المهام</p>
          <p className="text-sm font-black text-slate-900">{completedTasksCount} / {projectTasks.length} مهام</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center space-y-2 group hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">نسبة التقدم</p>
          <p className="text-sm font-black text-slate-900">{progress}% مكتمل</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 mb-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500"></div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">بطاقة المشروع</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأول: المعلومات الأساسية */}
          <div className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">تفاصيل الحملة</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">{project.type || 'غير محدد'}</span>
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">{project.niche || 'غير محدد'}</span>
                </div>
                {Array.isArray(project.campaignTypes) && project.campaignTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-200">
                    {project.campaignTypes.map(t => (
                      <span key={t} className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">المنصات المستهدفة</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(project.platforms) && project.platforms.length > 0 ? (
                    project.platforms.map(p => (
                      <span key={p} className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm font-bold">{p}</span>
                    ))
                  ) : <span className="text-slate-400 text-sm font-bold">لم تحدد منصات</span>}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-24 h-24 text-slate-900" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">ملخص المشروع (Brief)</p>
              <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap relative z-10">
                {project.brief || 'لا يوجد ملخص متاح لهذا المشروع.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-3">
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">توجيهات الكوبي والديزاين</p>
                <p className="text-sm font-bold text-slate-700">{project.copyAndDesign || 'لا توجد توجيهات'}</p>
              </div>
              <div className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100 space-y-3">
                <p className="text-xs font-black text-purple-400 uppercase tracking-widest">توجيهات الموشن</p>
                <p className="text-sm font-bold text-slate-700">{project.motion || 'لا توجد توجيهات'}</p>
              </div>
            </div>
          </div>

          {/* العمود الثاني: الروابط والوصول */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200">
              <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> روابط سريعة
              </h4>
              <div className="space-y-4">
                {project.website?.link && (
                  <a href={project.website.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                    <span className="font-bold text-sm">الموقع الإلكتروني</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white -rotate-45 transition-colors" />
                  </a>
                )}
                {project.driveLink && (
                  <a href={project.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                    <span className="font-bold text-sm">Google Drive</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white -rotate-45 transition-colors" />
                  </a>
                )}
                {project.productSheetLink && (
                  <a href={project.productSheetLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                    <span className="font-bold text-sm">شيت المنتجات</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white -rotate-45 transition-colors" />
                  </a>
                )}
                {project.monthlyReport && (
                  <a href={project.monthlyReport} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                    <span className="font-bold text-sm">التقرير الشهري</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white -rotate-45 transition-colors" />
                  </a>
                )}
              </div>
            </div>

            {project.website && (project.website.username || project.website.password) && (
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layout className="w-4 h-4" /> بيانات الدخول للموقع
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-amber-100 pb-2">
                    <span className="text-amber-800/60 font-bold">User:</span>
                    <span className="font-bold text-amber-900 select-all">{project.website.username || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-amber-800/60 font-bold">Pass:</span>
                    <span className="font-bold text-amber-900 select-all blur hover:blur-none transition-all cursor-pointer">{project.website.password || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {Array.isArray(project.accounts) && project.accounts.length > 0 && (
              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" /> حسابات المنصات
                </p>
                <div className="space-y-4">
                  {project.accounts.map((acc, idx) => (
                    <div key={idx} className="border-b border-indigo-200/50 pb-3 last:border-0 last:pb-0">
                      <p className="font-bold text-indigo-900 mb-1">{acc.platform}</p>
                      <div className="space-y-1">
                        {acc.username && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-800/60 font-bold">User:</span>
                            <span className="font-bold text-indigo-900 select-all">{acc.username}</span>
                          </div>
                        )}
                        {acc.password && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-800/60 font-bold">Pass:</span>
                            <span className="font-bold text-indigo-900 select-all blur hover:blur-none transition-all cursor-pointer">{acc.password}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">تواريخ هامة</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">تاريخ الاستلام</span>
                  <span className="font-black text-slate-900">{project.receivedDate || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">البداية</span>
                  <span className="font-black text-slate-900">{project.startDate || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">النهاية</span>
                  <span className="font-black text-slate-900">{project.endDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* تفاصيل المشروع الكاملة - تم نقلها للأعلى */}
        <div className="lg:col-span-2 space-y-10 text-right">
          {/* أهداف الحملة */}
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Target className="text-rose-600 w-7 h-7" /> أهداف الحملة
              </h3>
              <button
                onClick={() => setIsEditingGoals(!isEditingGoals)}
                className={`p-2 rounded-lg transition-all ${isEditingGoals ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:text-rose-600'}`}
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            {isEditingGoals ? (
              <div className="space-y-4">
                {localGoals.length > 0 && (
                  <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border-2 border-slate-200">
                    {localGoals.map(goal => (
                      <div key={goal.id} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 group">
                        <button
                          onClick={() => handleToggleGoal(goal.id)}
                          className={`p-2 rounded-lg transition-all shrink-0 ${goal.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {goal.completed ? <CheckCircle2 className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                        </button>
                        <span className={`flex-1 font-bold ${goal.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {goal.title}
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={e => setNewGoal(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddGoal()}
                    placeholder="أضف هدف جديد..."
                    className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl py-3 px-4 font-bold outline-none transition-all"
                  />
                  <button
                    onClick={handleAddGoal}
                    className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2 font-black text-sm"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-600 font-bold leading-relaxed text-lg bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-inner space-y-3">
                {localGoals.length > 0 ? (
                  localGoals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-3">
                      {goal.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <CheckSquare className="w-6 h-6 text-slate-400 shrink-0" />
                      )}
                      <span className={goal.completed ? 'line-through text-slate-400' : ''}>
                        {goal.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <p>{project.objective || 'لا توجد أهداف محددة مسجلة لهذا المشروع حالياً.'}</p>
                    <p className="text-sm text-slate-400">اضغط على الأيقونة لتحرير الأهداف</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* قائمة المهام والمتطلبات */}
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <ListTodo className="text-rose-600 w-7 h-7" /> قائمة المتطلبات والمهام
              </h3>
              <button
                onClick={() => setIsEditingTodos(!isEditingTodos)}
                className={`p-2 rounded-lg transition-all ${isEditingTodos ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:text-rose-600'}`}
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            {isEditingTodos ? (
              <div className="space-y-4">
                {localTodos.length > 0 && (
                  <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border-2 border-slate-200">
                    {localTodos.map(todo => (
                      <div key={todo.id} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 group">
                        <button
                          onClick={() => handleToggleTodo(todo.id)}
                          className={`p-2 rounded-lg transition-all shrink-0 ${todo.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                        </button>
                        <span className={`flex-1 font-bold ${todo.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {todo.title}
                        </span>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={e => setNewTodo(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddTodo()}
                    placeholder="أضف متطلب أو مهمة جديدة..."
                    className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl py-3 px-4 font-bold outline-none transition-all"
                  />
                  <button
                    onClick={handleAddTodo}
                    className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2 font-black text-sm"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                {localTodos.length > 0 ? (
                  localTodos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <CheckSquare className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <span className={`flex-1 font-bold ${todo.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {todo.title}
                      </span>
                      {todo.completed && <Check className="w-5 h-5 text-emerald-600" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 font-bold">لا توجد متطلبات أو مهام بعد</p>
                    <p className="text-sm text-slate-400 mt-2">اضغط على الأيقونة لإضافة متطلبات الحملة</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* جدول المهام الرسمية */}
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <ListTodo className="text-rose-600 w-7 h-7" /> جدول العمليات والمهام المسندة
              </h3>
              <Link to="/tasks" className="text-xs font-black text-rose-600 hover:underline">عرض الكل &rarr;</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {projectTasks.length > 0 ? projectTasks.map(task => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center justify-between p-8 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${task.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-100'}`}>
                      {task.status === TaskStatus.DONE ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 group-hover:text-rose-600 transition-colors">{task.title}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{task.type} &bull; {task.priority}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm">
                      {users.find(u => u.id === task.assignedToUserId)?.name.charAt(0) || '?'}
                    </div>
                    <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-rose-600 transition-transform" />
                  </div>
                </Link>
              )) : (
                <div className="p-20 text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-slate-200 mx-auto" />
                  <p className="text-xl font-black text-slate-400">لا توجد مهام مرتبطة بهذا المشروع بعد.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10 text-right">
          <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden">
            <Zap className="absolute -bottom-10 -left-10 w-40 h-40 opacity-10" />
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10 justify-end">
              فريق العمل المجمع <Users className="text-rose-500" />
            </h3>
            <div className="space-y-6 relative z-10">
              {projectTasks.length > 0 ? (
                <div className="flex flex-wrap gap-4 justify-end">
                  {Array.from(new Set(projectTasks.map(t => t.assignedToUserId))).filter(id => id).map(id => {
                    const u = users.find(user => user.id === id);
                    return (
                      <div key={id} className="group relative">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-rose-500 font-black text-xl hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-lg" title={u?.name}>
                          {u?.name.charAt(0)}
                        </div>
                        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-white text-slate-900 text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl whitespace-nowrap">
                          {u?.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 font-bold text-sm">سيظهر أعضاء الفريق هنا عند تعيين مهام لهم.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
