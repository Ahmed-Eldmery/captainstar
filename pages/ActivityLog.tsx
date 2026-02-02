
import React, { useState } from 'react';
import { Search, Filter, History, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { User, Role, ActivityLogEntry } from '../types';

interface ActivityLogProps {
  user: User;
  users: User[];
  logs: ActivityLogEntry[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ user, users, logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (user.role !== Role.ADMIN && user.role !== Role.OWNER) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center border-2 border-dashed border-rose-200">
           <ShieldAlert className="w-12 h-12 text-rose-500" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-black text-slate-900">وصول محدود</h2>
          <p className="text-slate-500 font-bold mt-2">سجل النشاطات متاح فقط لمديري النظام والمالك لمراقبة العمليات الحساسة.</p>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const u = users.find(user => user.id === log.userId);
    const matchesSearch = u?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">سجل النشاطات</h1>
          <p className="text-slate-500 mt-2 font-bold">مراقبة كافة العمليات والتعديلات التي تتم داخل النظام.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-6">
        <div className="relative flex-1 group w-full">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input 
            type="text" 
            placeholder="ابحث عن مستخدم أو عملية..." 
            className="w-full pr-14 pl-6 py-5 bg-slate-100/50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-[1.75rem] text-sm font-bold outline-none transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-50">
            <tr>
              <th className="px-10 py-6">المستخدم</th>
              <th className="px-10 py-6">العملية</th>
              <th className="px-10 py-6">الكيان</th>
              <th className="px-10 py-6">التوقيت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredLogs.map(log => {
              const u = users.find(user => user.id === log.userId);
              return (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                        {u?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{u?.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{u?.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <History className="w-5 h-5 text-blue-500" />
                      <span className="font-bold text-slate-700 text-sm">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="w-4 h-4 text-slate-300" />
                      <span className="font-bold text-slate-500">{log.entityType}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-bold">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-20 text-center font-bold text-slate-300">لا توجد سجلات مطابقة.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;
