
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Briefcase, CheckSquare, Clock, Plus, Target, TrendingUp, Sparkles, Star, Activity, BarChart2, FileText, Play
} from 'lucide-react';
import { User, Role, TaskStatus, TaskType, TaskPriority, Client, Project, Task } from '../types';
import { getVisibleTasks, getVisibleClients } from '../lib/permissions';

interface DashboardProps {
  user: User;
  clients: Client[];
  projects: Project[];
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, clients, projects, tasks }) => {
  const isAdmin = user.role === Role.ADMIN || user.role === Role.OWNER;
  const isAM = user.role === Role.ACCOUNT_MANAGER;
  
  const myTasks = useMemo(() => getVisibleTasks(user, tasks), [user, tasks]);
  const myClients = useMemo(() => getVisibleClients(user, clients, tasks), [user, clients, tasks]);
  
  const stats = useMemo(() => {
    if (isAdmin || isAM) {
      return [
        { name: 'إجمالي العملاء', value: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'نشطين' },
        { name: 'المشاريع الجارية', value: projects.filter(p => p.status === 'قيد التنفيذ').length, icon: Briefcase, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'تحت العمل' },
        { name: 'مهام معلقة', value: tasks.filter(t => t.status !== TaskStatus.DONE).length, icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-50', trend: 'تحتاج تنفيذ' },
        { name: 'معدل الإنجاز', value: '94%', icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: 'أداء ممتاز' },
      ];
    } else {
      const myPending = myTasks.filter(t => t.status !== TaskStatus.DONE);
      const myDone = myTasks.filter(t => t.status === TaskStatus.DONE);
      return [
        { name: 'مهامي الجارية', value: myPending.length, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'مطلوب إنجازها' },
        { name: 'مهام اكتملت', value: myDone.length, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'عمل رائع' },
        { name: 'عملائي', value: myClients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'شركاؤك' },
        { name: 'نسبة إنجازي', value: myTasks.length > 0 ? `${Math.round((myDone.length / myTasks.length) * 100)}%` : '0%', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50', trend: 'تطور مستمر' },
      ];
    }
  }, [isAdmin, isAM, myTasks, myClients, clients, projects, tasks]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 leading-tight">أهلاً بك، {user.name} 👋</h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">أنت تعمل بصلاحية <span className="text-rose-600">{user.teamRole}</span>. لديك مهام جديدة بانتظارك.</p>
        </div>
        <div className="flex gap-4">
           {(isAdmin || isAM) && (
             <Link to="/reports" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-rose-600 transition-all flex items-center gap-3">
               <TrendingUp className="w-5 h-5 text-rose-500" /> التقارير
             </Link>
           )}
           <Link to="/tasks" className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-3">
             <Plus className="w-5 h-5" /> إضافة مهمة
           </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg hover:scale-[1.03] transition-all group">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:rotate-6 transition-transform`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.name}</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Content Tracking */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl space-y-10">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                 <Sparkles className="text-rose-600" /> متابعة محتوى العملاء (شهرياً)
              </h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {myClients.slice(0, 4).map(client => {
                const postsDone = tasks.filter(t => t.clientId === client.id && t.type === TaskType.CONTENT && t.status === TaskStatus.DONE).length;
                const quota = client.postsQuota || 12;
                const progress = Math.min(100, Math.round((postsDone / quota) * 100));
                
                return (
                  <div key={client.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-slate-100 font-black">
                              {client.name.charAt(0)}
                           </div>
                           <p className="font-black text-slate-900 truncate max-w-[120px]">{client.name}</p>
                        </div>
                        <p className="text-[10px] font-black text-slate-400">{postsDone} / {quota} منشور</p>
                     </div>
                     <div className="space-y-2">
                        <div className="h-3 bg-white rounded-full border border-slate-100 p-0.5">
                           <div className="h-full bg-rose-600 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                           <span>تقدم المحتوى</span>
                           <span className="text-rose-600">{progress}%</span>
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Action Tasks */}
        <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
           <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <CheckSquare className="text-rose-500" /> مهام عاجلة
           </h3>
           <div className="space-y-5 relative z-10">
              {myTasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 4).map(task => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="block p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                   <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${task.priority === TaskPriority.CRITICAL ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                         {task.priority}
                      </span>
                      <span className="text-[9px] font-black text-rose-500">{task.type}</span>
                   </div>
                   <p className="text-sm font-bold group-hover:text-rose-400 transition-colors truncate">{task.title}</p>
                </Link>
              ))}
              {myTasks.filter(t => t.status !== TaskStatus.DONE).length === 0 && (
                <div className="text-center py-10 opacity-30">
                   <Star className="w-10 h-10 mx-auto mb-2" />
                   <p className="font-bold text-xs">لا توجد مهام حالية!</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
