
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, Clock, AlertCircle, 
  ArrowRightLeft, User, ChevronRight, Filter, ChevronLeft, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { CLIENTS, USERS } from '../mockData';
import { User as UserType, TaskStatus, Task } from '../types';

interface ApprovalsProps {
  user: UserType;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Approvals: React.FC<ApprovalsProps> = ({ user, tasks, setTasks }) => {
  const [filter, setFilter] = useState('All');

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => 
      task.status === TaskStatus.WAITING_APPROVAL || 
      task.status === TaskStatus.WAITING_CLIENT
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'All') return pendingTasks;
    if (filter === 'INTERNAL') return pendingTasks.filter(t => t.status === TaskStatus.WAITING_APPROVAL);
    if (filter === 'CLIENT') return pendingTasks.filter(t => t.status === TaskStatus.WAITING_CLIENT);
    return pendingTasks;
  }, [filter, pendingTasks]);

  const statusMap = {
    [TaskStatus.WAITING_APPROVAL]: { label: 'اعتماد داخلي', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    [TaskStatus.WAITING_CLIENT]: { label: 'اعتماد العميل', icon: ArrowRightLeft, color: 'text-orange-600', bg: 'bg-orange-50' },
  };

  const handleApprove = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: TaskStatus.DONE } : t
    ));
  };

  const handleReject = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: TaskStatus.IN_PROGRESS } : t
    ));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">الاعتمادات والمراجعات</h1>
          <p className="text-slate-500 mt-2 font-bold">تتبع وإدارة طلبات الاعتماد الداخلية ومن العملاء لضمان جودة العمل.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-6">
        <Filter className="w-6 h-6 text-slate-400" />
        <select 
          className="bg-transparent text-lg font-black focus:ring-0 outline-none cursor-pointer text-slate-900 flex-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">جميع طلبات الاعتماد ({pendingTasks.length})</option>
          <option value="INTERNAL">اعتمادات داخلية ({pendingTasks.filter(t => t.status === TaskStatus.WAITING_APPROVAL).length})</option>
          <option value="CLIENT">اعتمادات العملاء ({pendingTasks.filter(t => t.status === TaskStatus.WAITING_CLIENT).length})</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {filteredTasks.map(task => {
          const client = CLIENTS.find(c => c.id === task.clientId);
          const creator = USERS.find(u => u.id === task.createdByUserId);
          const assignee = USERS.find(u => u.id === task.assignedToUserId);
          const statusConfig = statusMap[task.status as TaskStatus.WAITING_APPROVAL | TaskStatus.WAITING_CLIENT];

          return (
            <div key={task.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:border-rose-100 transition-all relative group overflow-hidden">
              <div className="flex items-start gap-6 flex-1">
                <div className={`p-5 rounded-[1.5rem] ${statusConfig.bg} shadow-inner group-hover:scale-110 transition-transform`}>
                  <statusConfig.icon className={`w-8 h-8 ${statusConfig.color}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{task.title}</h3>
                  <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <span className="text-slate-400">العميل:</span>
                    <span className="text-rose-600">{client?.name}</span>
                  </p>
                  {task.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center mt-4 gap-4">
                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <User className="w-3.5 h-3.5 ml-2 text-rose-500" />
                      <span>من: {creator?.name}</span>
                    </div>
                    {assignee && (
                      <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <User className="w-3.5 h-3.5 ml-2 text-blue-500" />
                        <span>منوط به: {assignee?.name}</span>
                      </div>
                    )}
                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Clock className="w-3.5 h-3.5 ml-2 text-amber-500" />
                      <span>{new Date(task.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto border-t lg:border-t-0 pt-6 lg:pt-0">
                <div className="text-right">
                  <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-sm ${statusConfig.bg} ${statusConfig.color} border-opacity-30`}>
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(task.id)}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 active:scale-95 whitespace-nowrap"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>موافق</span>
                  </button>
                  <button
                    onClick={() => handleReject(task.id)}
                    className="bg-rose-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-rose-700 transition-all shadow-lg flex items-center gap-2 active:scale-95 whitespace-nowrap"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>رفض</span>
                  </button>
                  <Link 
                    to={`/tasks/${task.id}`}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 active:scale-95"
                  >
                    <span>عرض</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100">
            <CheckCircle2 className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-xl font-black text-slate-300">لا توجد طلبات اعتماد معلقة حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
