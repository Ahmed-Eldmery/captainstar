
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend, Cell
} from 'recharts';
import { 
  Filter, Download, Target, DollarSign, Eye, UserCheck, 
  Sparkles, Calendar, Smartphone, Search, Globe, Instagram,
  TrendingUp, MousePointer2, Clock, ChevronLeft
} from 'lucide-react';
import { User, PerformanceSnapshot, Client } from '../types';

interface ReportsProps {
  user: User;
  clients: Client[];
  performance: PerformanceSnapshot[];
}

const Reports: React.FC<ReportsProps> = ({ user, clients, performance }) => {
  const [selectedClientId, setSelectedClientId] = useState('All');

  const filteredPerformance = useMemo(() => {
    if (selectedClientId === 'All') return performance;
    return performance.filter(p => p.clientId === selectedClientId);
  }, [selectedClientId, performance]);

  const totals = useMemo(() => {
    return filteredPerformance.reduce((acc, curr) => ({
      spend: acc.spend + (curr.spend || 0),
      impressions: acc.impressions + (curr.impressions || 0),
      clicks: acc.clicks + (curr.clicks || 0),
      leads: acc.leads + (curr.leads || 0),
    }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });
  }, [filteredPerformance]);

  const platformIcons: Record<string, { icon: any, color: string, bg: string }> = {
    'Snapchat': { icon: Smartphone, color: 'text-amber-500', bg: 'bg-amber-50' },
    'TikTok': { icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
    'Instagram': { icon: Instagram, color: 'text-purple-600', bg: 'bg-purple-50' },
    'Google Ads': { icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
    'Facebook': { icon: Globe, color: 'text-blue-700', bg: 'bg-blue-50' },
  };

  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} يوم`;
  };

  const chartData = useMemo(() => {
    const grouped: Record<string, any> = {};
    filteredPerformance.forEach(p => {
      const month = new Date(p.date).toLocaleDateString('ar-SA', { month: 'short' });
      if (!grouped[month]) grouped[month] = { month, spend: 0, leads: 0 };
      grouped[month].spend += p.spend || 0;
      grouped[month].leads += p.leads || 0;
    });
    return Object.values(grouped);
  }, [filteredPerformance]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900">تقارير الحملات الإعلانية</h1>
          <p className="text-slate-500 mt-2 font-bold">تحليل دقيق للأداء المالي والنتائج عبر المنصات المختلفة.</p>
        </div>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black hover:bg-rose-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95">
          <Download className="w-5 h-5" />
          <span>تصدير ملف Excel</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-[240px]">
          <Filter className="w-6 h-6 text-slate-400" />
          <select 
            className="bg-transparent text-lg font-black focus:ring-0 outline-none cursor-pointer text-slate-900 w-full"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="All">جميع العملاء</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
        <div className="flex items-center gap-4">
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">تحديث الأداء:</span>
           <span className="bg-rose-50 px-5 py-2 rounded-xl text-sm font-bold text-rose-600 border border-rose-100">مباشر الآن</span>
        </div>
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي الإنفاق', value: `${totals.spend.toLocaleString()} ر.س`, icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'إجمالي الوصول', value: (totals.impressions / 1000000).toFixed(1) + 'M', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'العملاء المحتملون', value: totals.leads.toLocaleString(), icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'تكلفة العميل (CPL)', value: `${(totals.spend / (totals.leads || 1)).toFixed(1)} ر.س`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-rose-100 transition-all">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Campaigns Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xl font-black text-slate-900">تفاصيل أداء الحملات النشطة</h3>
           <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
             <Clock className="w-4 h-4" /> مرتبة حسب التاريخ الأحدث
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-10 py-6">اسم الحملة والمنصة</th>
                <th className="px-10 py-6">مدة الحملة</th>
                <th className="px-10 py-6">الإنفاق</th>
                <th className="px-10 py-6">النتائج (Leads)</th>
                <th className="px-10 py-6">تكلفة النتيجة</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPerformance.map((p) => {
                const Platform = platformIcons[p.platform] || { icon: Target, color: 'text-slate-500', bg: 'bg-slate-50' };
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 ${Platform.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                           <Platform.icon className={`w-6 h-6 ${Platform.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{p.campaignName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.platform}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                         <Calendar className="w-4 h-4 text-rose-500" />
                         <span className="text-sm font-bold text-slate-600">{calculateDuration(p.startDate, p.endDate)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mr-7">{p.startDate} &larr; {p.endDate}</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-black text-slate-900">{p.spend?.toLocaleString()} ر.س</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-black text-slate-900">{p.leads}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-xs font-black text-slate-700">
                        {((p.spend || 0) / (p.leads || 1)).toFixed(1)} ر.س
                      </span>
                    </td>
                    <td className="px-10 py-6 text-left">
                       <button className="p-3 text-slate-300 hover:text-rose-600 transition-colors">
                          <ChevronLeft className="w-6 h-6" />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="text-2xl font-black text-slate-900">تحليل كفاءة الإنفاق</h3>
            <p className="text-slate-400 font-bold mt-1">تتبع العلاقة بين ميزانية الإعلانات وعدد العملاء المستقطبين.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-600"></div>
                <span className="text-xs font-black text-slate-500">الإنفاق</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-xs font-black text-slate-500">النتائج</span>
             </div>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSpendRep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLeadsRep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-15} />
              <Tooltip />
              <Area type="monotone" dataKey="spend" stroke="#e11d48" fillOpacity={1} fill="url(#colorSpendRep)" strokeWidth={4} />
              <Area type="monotone" dataKey="leads" stroke="#2563eb" fillOpacity={1} fill="url(#colorLeadsRep)" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
