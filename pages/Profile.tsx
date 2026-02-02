
import React, { useState, useRef, useMemo } from 'react';
import {
   Camera, Shield, User as UserIcon, Mail, Key, CheckCircle2, Save,
   Database, Download, Upload as UploadIcon, Zap, Bell, Check, RefreshCw
} from 'lucide-react';
import { User } from '../types';
import { db } from '../lib/supabase';
import { USERS, CLIENTS, PROJECTS, TASKS, APPROVALS, ACTIVITY_LOGS, CLIENT_ACCOUNTS, PERFORMANCE } from '../mockData';

interface ProfileProps {
   user: User;
   users: User[];
   setUsers: React.Dispatch<React.SetStateAction<User[]>>;
   onUpdate: (updatedUser: User) => void;
   exportDatabase: () => void;
   importDatabase: (e: React.ChangeEvent<HTMLInputElement>) => void;
   tasks: any[];
}

const Profile: React.FC<ProfileProps> = ({ user, users, setUsers, onUpdate, exportDatabase, importDatabase, tasks }) => {
   const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
      password: '',
      avatarUrl: user.avatarUrl || ''
   });
   const [isSaved, setIsSaved] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const dbInputRef = useRef<HTMLInputElement>(null);

   const [isRestoring, setIsRestoring] = useState(false);

   const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            const base64 = reader.result as string;
            setFormData(prev => ({ ...prev, avatarUrl: base64 }));
         };
         reader.readAsDataURL(file);
      }
   };

   const handleRestoreData = async () => {
      if (!confirm('هل تريد استعادة البيانات الافتراضية؟ سيتم إضافة بيانات تجريبية لقاعدة البيانات.')) return;
      setIsRestoring(true);
      try {
         // Seed Users
         for (const u of USERS) {
            await db.insert('users', { ...u, password_hash: u.passwordHash, team_role: u.teamRole, is_active: u.isActive, created_at: u.createdAt }).catch(() => { });
         }
         // Seed Clients
         for (const c of CLIENTS) {
            const { campaigns, ...clientData } = c;
            await db.insert('clients', { ...clientData, posts_quota: c.postsQuota, videos_quota: c.videosQuota, created_at: c.createdAt }).catch(() => { });
            // We skip detailed campaigns for now to avoid complexity or loop properly
         }
         // Seed Projects
         for (const p of PROJECTS) {
            await db.insert('projects', { ...p, total_budget: p.totalBudget, created_by: p.createdByUserId, created_at: p.createdAt }).catch(() => { });
         }
         // Seed Tasks
         for (const t of TASKS) {
            await db.insert('tasks', { ...t, assigned_to: t.assignedToUserId, created_by: t.createdByUserId, created_at: t.createdAt }).catch(() => { });
         }
         // Seed Accounts
         for (const a of CLIENT_ACCOUNTS) {
            await db.insert('client_accounts', { ...a, client_id: a.clientId, account_name: a.accountName, is_active: a.isActive }).catch(() => { });
         }

         alert('تم استعادة البيانات بنجاح! يرجى تحديث الصفحة.');
         window.location.reload();
      } catch (err: any) {
         alert('حدث خطأ أثناء الاستعادة: ' + err.message);
      } finally {
         setIsRestoring(false);
      }
   };

   const handleSave = async () => {
      const updatedUser = {
         ...user,
         name: formData.name,
         email: formData.email,
         avatarUrl: formData.avatarUrl,
         // Only update password if provided
         ...(formData.password ? { password: formData.password, password_hash: formData.password } : {})
      };

      try {
         // Save to Database
         await db.update('users', updatedUser.id, updatedUser);

         // Update Local State
         setIsSaved(true);
         onUpdate(updatedUser);
         // Update Users List
         setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));

         // Update LocalStorage to persist login session
         localStorage.setItem('cs_user', JSON.stringify(updatedUser));

         setTimeout(() => setIsSaved(false), 3000);
      } catch (e) {
         console.error(e);
         alert('فشل حفظ البيانات في قاعدة البيانات');
      }
   };

   // إحصائيات المهام
   const userTasks = useMemo(() => tasks.filter(t => t.assignedToUserId === user.id), [tasks, user.id]);
   const completed = userTasks.filter(t => t.status === 'مكتمل' || t.status === 'DONE').length;
   const inProgress = userTasks.filter(t => t.status === 'قيد العمل' || t.status === 'IN_PROGRESS').length;
   const overdue = userTasks.filter(t => t.status === 'متأخر' || t.status === 'OVERDUE').length;
   const total = userTasks.length;
   const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

   // رسم بياني دائري بسيط (SVG)
   const chartData = [
      { label: 'مكتملة', value: completed, color: '#10b981' },
      { label: 'قيد العمل', value: inProgress, color: '#f59e42' },
      { label: 'متأخرة', value: overdue, color: '#ef4444' },
   ];
   const chartTotal = chartData.reduce((sum, d) => sum + d.value, 0) || 1;
   let offset = 0;

   return (
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
         <div className="flex items-center gap-6">
            <div
               onClick={() => fileInputRef.current?.click()}
               className="w-24 h-24 bg-rose-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-rose-200 relative group cursor-pointer overflow-hidden border-4 border-white"
            >
               {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                  user.name.charAt(0)
               )}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Camera className="w-8 h-8 text-white" />
               </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <div>
               <h1 className="text-4xl font-black text-slate-900">{user.name}</h1>
               <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-rose-500" /> {user.teamRole} &bull; {user.role}
               </p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8">
                  <h3 className="text-xl font-black text-slate-900 border-b pb-4">المعلومات الأساسية</h3>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase pr-2">الاسم الكامل</label>
                        <div className="relative group">
                           <UserIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                           <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-2xl font-bold outline-none transition-all"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase pr-2">البريد الإلكتروني المهني</label>
                        <div className="relative group">
                           <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                           <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-2xl font-bold outline-none transition-all"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase pr-2">تغيير كلمة المرور</label>
                        <div className="relative group">
                           <Key className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                           <input
                              type="password"
                              placeholder="اتركها فارغة إذا لم ترد التغيير"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-2xl font-bold outline-none transition-all"
                           />
                        </div>
                     </div>
                  </div>

                  <button
                     onClick={handleSave}
                     className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl shadow-slate-200 hover:bg-rose-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                     {isSaved ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Save className="w-6 h-6" />}
                     <span>{isSaved ? 'تم حفظ التعديلات بنجاح' : 'حفظ التعديلات'}</span>
                  </button>
               </div>

               {/* إدارة قاعدة البيانات المضافة */}
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8">
                  <h3 className="text-xl font-black text-slate-900 border-b pb-4 flex items-center gap-3">
                     <Database className="w-5 h-5 text-rose-600" /> إدارة البيانات (Data Center)
                  </h3>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed">
                     هذه النسخة تحفظ البيانات في متصفحك. يمكنك تحميل نسخة احتياطية من كافة العملاء، المهام، والمنشورات ونقلها لجهاز آخر.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <button
                        onClick={exportDatabase}
                        className="p-6 border-2 border-slate-100 rounded-3xl hover:border-rose-200 hover:bg-rose-50 transition-all flex flex-col items-center gap-3 group"
                     >
                        <Download className="w-8 h-8 text-rose-500 group-hover:scale-110 transition-transform" />
                        <span className="font-black text-xs text-slate-700">تصدير قاعدة البيانات (JSON)</span>
                     </button>
                     <button
                        onClick={() => dbInputRef.current?.click()}
                        className="p-6 border-2 border-slate-100 rounded-3xl hover:border-emerald-200 hover:bg-emerald-50 transition-all flex flex-col items-center gap-3 group"
                     >
                        <UploadIcon className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span className="font-black text-xs text-slate-700">استيراد نسخة احتياطية</span>
                        <input type="file" ref={dbInputRef} className="hidden" accept=".json" onChange={importDatabase} />
                     </button>
                     <button
                        onClick={handleRestoreData}
                        disabled={isRestoring}
                        className="p-6 border-2 border-slate-100 rounded-3xl hover:border-amber-200 hover:bg-amber-50 transition-all flex flex-col items-center gap-3 group"
                     >
                        <RefreshCw className={`w-8 h-8 text-amber-500 group-hover:rotate-180 transition-transform ${isRestoring ? 'animate-spin' : ''}`} />
                        <span className="font-black text-xs text-slate-700">{isRestoring ? 'جاري الاستعادة...' : 'استعادة البيانات الافتراضية'}</span>
                     </button>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <Zap className="absolute -bottom-10 -left-10 w-40 h-40 opacity-10" />
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3">إحصائيات الإنجاز
                     <span className="text-xs font-bold text-emerald-400">({total} مهمة)</span>
                  </h3>
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                     <svg width="120" height="120" viewBox="0 0 36 36" className="block">
                        {chartData.map((d, i) => {
                           const val = d.value / chartTotal * 100;
                           const dash = (val * 100) / 100;
                           const el = (
                              <circle
                                 key={d.label}
                                 r="16"
                                 cx="18"
                                 cy="18"
                                 fill="transparent"
                                 stroke={d.color}
                                 strokeWidth="4"
                                 strokeDasharray={`${dash} ${100 - dash}`}
                                 strokeDashoffset={offset}
                                 style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                              />
                           );
                           offset -= dash;
                           return el;
                        })}
                        <text x="18" y="20" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">{completionRate}%</text>
                     </svg>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#10b981' }}></span>
                           <span className="font-bold">مكتملة:</span>
                           <span>{completed}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#f59e42' }}></span>
                           <span className="font-bold">قيد العمل:</span>
                           <span>{inProgress}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#ef4444' }}></span>
                           <span className="font-bold">متأخرة:</span>
                           <span>{overdue}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                  <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                     <Bell className="w-5 h-5 text-rose-500" /> الإشعارات
                  </h3>
                  <div className="space-y-4">
                     {[
                        { label: 'تنبيهات البريد', enabled: true },
                        { label: 'إشعارات المتصفح', enabled: false },
                        { label: 'رسائل النظام', enabled: true },
                     ].map(item => (
                        <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-sm font-bold text-slate-700">{item.label}</span>
                           <div className={`w-10 h-6 rounded-full p-1 transition-all ${item.enabled ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'}`}>
                              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Profile;
