
import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, User, Clock,
  MessageSquare, Send, Sparkles, Loader2,
  AlertCircle, CheckCircle2, ChevronDown, Flag,
  Trash2, ShieldCheck, CalendarIcon, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { generateAIResponse } from '../lib/gemini';
import { TaskStatus, TaskPriority, TaskType, User as UserType, Client, Task } from '../types.ts';
import { db } from '../lib/supabase.ts';

interface TaskDetailsProps {
  user: UserType;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  clients: Client[];
  users: UserType[];
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ user, tasks, setTasks, clients, users }) => {
  const { id } = useParams<{ id: string }>();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  const task = useMemo(() => tasks.find(t => t.id === id), [id, tasks]);
  const client = useMemo(() => clients.find(c => c.id === task?.clientId), [task, clients]);

  const [localStatus, setLocalStatus] = useState<TaskStatus | null>(null);
  const [localAssignee, setLocalAssignee] = useState<string | null>(null);
  const [localPriority, setLocalPriority] = useState<TaskPriority | null>(null);
  const [localDueDate, setLocalDueDate] = useState<string | null>(null);

  const currentStatus = localStatus || task?.status;
  const currentAssigneeId = localAssignee || task?.assignedToUserId;
  const currentPriority = localPriority || task?.priority || TaskPriority.MEDIUM;
  const currentDueDate = localDueDate || task?.dueDate || '';

  const assignee = useMemo(() => users.find(u => u.id === currentAssigneeId), [currentAssigneeId, users]);

  if (!task) return <div className="p-20 text-center font-black text-slate-400" dir="rtl">المهمة غير موجودة.</div>;

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `بصفتك مستشار تسويق خبير في وكالة كابتن ستار، حلل هذه المهمة واقترح خطة تنفيذ مختصرة (5 نقاط) مع تحديد المهارات المطلوبة وكيفية التأكد من جودة المخرجات:
      المهمة: ${task.title}
      الوصف: ${task.description || 'لا يوجد وصف'}
      العميل: ${client?.name || 'عام'}
      الأولوية: ${currentPriority}`;

      const response = await generateAIResponse(prompt);
      setAiAnalysis(response || "لم نتمكن من تحليل المهمة حالياً.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("حدث خطأ أثناء التحليل. يرجى المحاولة لاحقاً.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const updatedTask = {
        ...task,
        status: currentStatus as TaskStatus,
        priority: currentPriority as TaskPriority,
        assignedToUserId: currentAssigneeId,
        dueDate: currentDueDate
      };
      await db.update('tasks', task.id, updatedTask);

      // Log activity
      await db.logActivity(
        user.id,
        `تحديث مهمة: ${task.title}`,
        'tasks',
        task.id
      );

      const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      setTasks(updatedTasks);
      setIsSavedNotify(true);
      setTimeout(() => setIsSavedNotify(false), 3000);
    } catch (err) {
      alert('فشل حفظ التعديلات في قاعدة البيانات');
      console.error(err);
    }
  };

  const priorityLabels: Record<string, { text: string, color: string, iconColor: string }> = {
    [TaskPriority.LOW]: { text: 'منخفضة', color: 'bg-blue-50 text-blue-600 border-blue-100', iconColor: 'text-blue-400' },
    [TaskPriority.MEDIUM]: { text: 'متوسطة', color: 'bg-slate-50 text-slate-600 border-slate-100', iconColor: 'text-slate-400' },
    [TaskPriority.HIGH]: { text: 'عالية', color: 'bg-orange-50 text-orange-600 border-orange-100', iconColor: 'text-orange-400' },
    [TaskPriority.CRITICAL]: { text: 'حرجة', color: 'bg-rose-50 text-rose-600 border-rose-100', iconColor: 'text-rose-500' },
  };

  const currentPriorityLabel = priorityLabels[currentPriority] || priorityLabels[TaskPriority.MEDIUM];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-top-4 duration-500" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
          <Link to="/tasks" className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-slate-900 font-black">تفاصيل المهمة #{task.id.split('-')[1] || task.id}</span>
              {isSavedNotify && <span className="text-emerald-500 text-[10px] animate-pulse flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> تم حفظ التعديلات</span>}
            </div>
            <p className="text-xs text-slate-400">تاريخ الإنشاء: {new Date(task.createdAt).toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
            <div className="p-10 lg:p-14 space-y-10">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-inner ${currentPriorityLabel.color}`}>
                    أولوية {currentPriorityLabel.text}
                  </span>
                  <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-lg">
                    {task.type}
                  </span>
                  {new Date(currentDueDate) < new Date() && currentStatus !== TaskStatus.DONE && (
                    <span className="px-4 py-1.5 rounded-xl text-[10px] font-black bg-rose-600 text-white flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" /> متأخرة
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-black text-slate-900 leading-[1.3]">{task.title}</h1>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 font-black border border-rose-100">
                    {client?.name.charAt(0)}
                  </div>
                  <p className="text-lg text-slate-500 font-bold">العميل: <span className="text-slate-900">{client?.name}</span></p>
                </div>
              </div>

              <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-6 shadow-inner">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-4">مواصفات التنفيذ</h3>
                <div className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-line">
                  {task.description || 'لا يوجد وصف متاح لهذه المهمة بعد. يرجى مراجعة مدير الحساب للحصول على التفاصيل.'}
                </div>
              </div>

              {aiAnalysis && (
                <div className="p-10 bg-rose-600 text-white rounded-[3rem] shadow-2xl shadow-rose-200 relative overflow-hidden animate-in zoom-in-95 duration-500 group">
                  <Sparkles className="absolute -top-10 -right-10 w-56 h-56 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-[1.25rem] flex items-center justify-center backdrop-blur-md">
                        <Sparkles className="w-7 h-7 text-white animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-black">تحليل الدميري للعملية</h3>
                    </div>
                    <div className="text-base leading-relaxed bg-white/10 p-8 rounded-[2rem] backdrop-blur-sm border border-white/20 shadow-inner">
                      {aiAnalysis}
                    </div>
                    <div className="flex justify-end pt-2">
                      <p className="text-[10px] font-black text-rose-200 uppercase tracking-[0.2em]">تحليل ذكاء اصطناعي فوري</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 p-10 space-y-10">
            <div className="space-y-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-6 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-rose-600" /> لوحة التحكم والتحرير
              </h3>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">الحالة الراهنة</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setLocalStatus(e.target.value as TaskStatus)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 outline-none hover:border-rose-100 transition-all cursor-pointer"
                >
                  {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">تعيين المسؤول</label>
                <select
                  value={currentAssigneeId || ''}
                  onChange={(e) => setLocalAssignee(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 outline-none hover:border-rose-100 transition-all cursor-pointer"
                >
                  <option value="">غير معين</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.teamRole})</option>)}
                </select>
                {assignee && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-500">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 overflow-hidden shadow-sm">
                      {assignee.avatarUrl ? <img src={assignee.avatarUrl} className="w-full h-full object-cover" /> : assignee.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-900 truncate">{assignee.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{assignee.teamRole}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">مستوى الأولوية</label>
                <select
                  value={currentPriority}
                  onChange={(e) => setLocalPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 outline-none hover:border-rose-100 transition-all cursor-pointer"
                >
                  {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">تاريخ التسليم</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={currentDueDate}
                    onChange={(e) => setLocalDueDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-6 pl-12 text-sm font-black text-slate-800 outline-none hover:border-rose-100 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              {(currentStatus === TaskStatus.WAITING_APPROVAL || currentStatus === TaskStatus.WAITING_CLIENT) && (
                <div className="space-y-3 border-t pt-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">إجراءات الاعتماد</p>
                  <button
                    onClick={() => {
                      setLocalStatus(TaskStatus.DONE);
                      setTimeout(() => handleSaveChanges(), 100);
                    }}
                    className="w-full py-4 bg-emerald-600 text-white font-black rounded-[1.75rem] flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    موافقة واعتماد
                  </button>
                  <button
                    onClick={() => {
                      setLocalStatus(TaskStatus.IN_PROGRESS);
                      setTimeout(() => handleSaveChanges(), 100);
                    }}
                    className="w-full py-4 bg-rose-600 text-white font-black rounded-[1.75rem] flex items-center justify-center gap-3 shadow-lg hover:bg-rose-700 transition-all active:scale-95"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    طلب تعديلات
                  </button>
                </div>
              )}
              <button
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-5 bg-rose-600 text-white font-black rounded-[1.75rem] flex items-center justify-center gap-3 shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                تحليل الدميري الذكي
              </button>
              <button
                onClick={handleSaveChanges}
                className="w-full py-5 bg-slate-950 text-white font-black rounded-[1.75rem] flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all active:scale-95 border-b-4 border-rose-600"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> حفظ التحديثات النهائية
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="w-16 h-16" />
            </div>
            <h4 className="text-sm font-black mb-4 relative z-10">الحالة الزمنية</h4>
            <div className="space-y-2 relative z-10">
              <p className="text-[10px] text-slate-500 font-bold">باقي على التسليم تقريباً:</p>
              <p className="text-xl font-black text-rose-500">
                {task.status === TaskStatus.DONE ? 'مكتملة ✅' : (new Date(currentDueDate) < new Date() ? 'متأخرة ⚠️' : 'قيد المتابعة ⏱️')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
