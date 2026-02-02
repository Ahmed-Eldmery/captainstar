
import React, { useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Globe, Layout, Sparkles, Target, Users, TrendingUp, Instagram, Facebook, Smartphone,
  AtSign, LinkIcon, MoreVertical, Plus, X, ChevronLeft, BarChart3, Radio, FileText, Play, Trash2, Copy, Check,
  Youtube, Linkedin, Heart, MessageCircle, Send, Globe as GlobeIcon
} from 'lucide-react';
import { User, Role, TaskType, TaskStatus, Client, Project, Task, ClientAccount } from '../types';

interface ClientDetailsProps {
  user: User;
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  accounts: ClientAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<ClientAccount[]>>;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ user, clients, projects, tasks, accounts, setAccounts }) => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const client = useMemo(() => clients.find(c => c.id === id), [id, clients]);
  const clientProjects = useMemo(() => projects.filter(p => p.clientId === id), [id, projects]);
  const clientTasks = useMemo(() => tasks.filter(t => t.clientId === id), [id, tasks]);
  const clientAccounts = useMemo(() => accounts.filter(ca => ca.clientId === id), [id, accounts]);

  const postsDoneCount = useMemo(() => clientTasks.filter(t => t.type === TaskType.CONTENT && t.status === TaskStatus.DONE).length, [clientTasks]);
  const videosDoneCount = useMemo(() => clientTasks.filter(t => t.type === TaskType.VIDEO && t.status === TaskStatus.DONE).length, [clientTasks]);

  const [newAccount, setNewAccount] = useState({
    platform: 'Instagram',
    accountName: '',
    username: '',
    accountUrl: ''
  });

  if (!client) return <div className="p-20 text-center font-black">العميل غير موجود.</div>;

  const handleAddAccount = () => {
    if (!newAccount.accountName || !newAccount.username) return;
    const accountToAdd: ClientAccount = {
      id: `ca-${Date.now()}`,
      clientId: client.id,
      platform: newAccount.platform,
      accountName: newAccount.accountName,
      username: newAccount.username,
      accountUrl: newAccount.accountUrl,
      isActive: true
    };
    setAccounts([...accounts, accountToAdd]);
    setIsAddAccountModalOpen(false);
    setNewAccount({ platform: 'Instagram', accountName: '', username: '', accountUrl: '' });
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(accounts.filter(a => a.id !== accountId));
  };

  const handleCopyUsername = (username: string, accountId: string) => {
    navigator.clipboard.writeText(username);
    setCopiedId(accountId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isModerator = user.teamRole === 'مدير منصات' || user.teamRole === 'إدارة منصات' || user.role === Role.ADMIN || user.role === Role.OWNER;

  const tabs = [
    { id: 'overview', label: 'إدارة المحتوى', icon: Sparkles },
    { id: 'accounts', label: 'حسابات المنصات', icon: Layout },
    { id: 'team', label: 'فريق العمل', icon: Users },
    { id: 'projects', label: 'الحملات والمشاريع', icon: Target },
    { id: 'performance', label: 'النتائج والأداء', icon: BarChart3 },
    ...(isModerator ? [{ id: 'access', label: 'بيانات الوصول', icon: AtSign }] : []),
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-rose-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-rose-200 shrink-0">
            {client.name.charAt(0)}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-900">{client.name}</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
              <Globe className="w-4 h-4 text-rose-500" /> {client.country} &bull; {client.industry}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 px-8 py-4 rounded-[1.75rem] border border-slate-100 flex items-center gap-4">
          <div className="text-left border-l pl-4 border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase">الميزانية الشهرية</p>
            <p className="text-lg font-black text-emerald-600">{(client.monthlyBudget || 0).toLocaleString()} ر.س</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">نوع الباقة</p>
            <p className="text-sm font-black text-slate-900">{client.packageType || 'باقة مخصصة'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-xl inline-flex flex-wrap overflow-hidden">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 text-sm font-black rounded-2xl transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-rose-500' : ''}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            {/* معلومات العميل الأساسية */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
              <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                <Globe className="text-rose-600" /> معلومات العميل
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* الدولة */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
                  <p className="text-xs font-black text-blue-700 uppercase mb-2">الدولة</p>
                  <p className="text-2xl font-black text-slate-900">{client.country}</p>
                </div>

                {/* الصناعة */}
                <div className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl border-2 border-rose-200">
                  <p className="text-xs font-black text-rose-700 uppercase mb-2">الصناعة</p>
                  <p className="text-2xl font-black text-slate-900">{client.industry}</p>
                </div>

                {/* رقم الهاتف */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border-2 border-emerald-200">
                  <p className="text-xs font-black text-emerald-700 uppercase mb-2">رقم الهاتف</p>
                  <p className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    {client.phoneNumber || 'غير مسجل'}
                  </p>
                </div>

                {/* الموقع الإلكتروني */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200">
                  <p className="text-xs font-black text-purple-700 uppercase mb-2">الموقع الإلكتروني</p>
                  <div className="flex items-center gap-2">
                    <GlobeIcon className="w-5 h-5 text-purple-600" />
                    <span className="text-lg font-black text-slate-900">{client.hasWebsite ? 'متوفر ✓' : 'غير متوفر'}</span>
                  </div>
                </div>

                {/* عدد المنصات */}
                <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-200">
                  <p className="text-xs font-black text-amber-700 uppercase mb-2">عدد المنصات</p>
                  <p className="text-2xl font-black text-slate-900">{client.numPlatforms || 0} منصة</p>
                </div>

                {/* عدد الحملات */}
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border-2 border-indigo-200">
                  <p className="text-xs font-black text-indigo-700 uppercase mb-2">عدد الحملات</p>
                  <p className="text-2xl font-black text-slate-900">{client.numCampaigns || 0} حملة</p>
                </div>
              </div>
            </div>

            {/* الحملات النشطة */}
            {client.campaigns && client.campaigns.length > 0 && (
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
                <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                  <Target className="text-rose-600" /> الحملات النشطة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {client.campaigns.map((campaign, idx) => (
                    <div key={idx} className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2.5rem] border-2 border-slate-200 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-900">{campaign.name}</h4>
                        <span className="bg-rose-100 text-rose-600 text-[9px] font-black px-3 py-1 rounded-lg">{campaign.platform}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-xl">
                          <p className="text-xs font-bold text-slate-500 mb-1">الميزانية</p>
                          <p className="text-xl font-black text-slate-900">${campaign.budget}</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl">
                          <p className="text-xs font-bold text-slate-500 mb-1">المدة</p>
                          <p className="text-xl font-black text-slate-900">{campaign.duration}</p>
                        </div>
                      </div>
                      {campaign.description && (
                        <p className="text-sm font-bold text-slate-600 bg-white/50 p-4 rounded-xl">{campaign.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* متابعة المحتوى الشهري */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
              <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                <Sparkles className="text-rose-600" /> متابعة المحتوى الشهري
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <p className="text-xl font-black">{client.postsQuota || 0} بوست</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white rounded-full border p-1"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(postsDoneCount / (client.postsQuota || 1)) * 100}%` }}></div></div>
                    <p className="text-[10px] font-black text-slate-400">منجز {postsDoneCount} منشور</p>
                  </div>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <Play className="w-8 h-8 text-purple-600" />
                    <p className="text-xl font-black">{client.videosQuota || 0} فيديو</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white rounded-full border p-1"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(videosDoneCount / (client.videosQuota || 1)) * 100}%` }}></div></div>
                    <p className="text-[10px] font-black text-slate-400">منجز {videosDoneCount} فيديو</p>
                  </div>
                </div>
              </div>
            </div>

            {/* الملاحظات الاستراتيجية */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-12 rounded-[3.5rem] text-white border border-slate-800 shadow-xl">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">التوجه التسويقي <Target className="text-rose-500" /></h3>
              <p className="text-slate-300 font-bold leading-relaxed text-base bg-white/5 p-8 rounded-2xl border border-white/10">
                {client.onboardingNotes || 'لا توجد ملاحظات استراتيجية مسجلة. يرجى إضافة تفاصيل عن الاستراتيجية التسويقية للعميل.'}
              </p>
            </div>

            {/* ملخص سريع */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500 mb-2">الفريق</p>
                <p className="text-3xl font-black text-slate-900">{clientTasks.length}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">مهام موكلة</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg text-center">
                <Target className="w-8 h-8 text-rose-600 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500 mb-2">المشاريع</p>
                <p className="text-3xl font-black text-slate-900">{clientProjects.length}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">مشروع نشط</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg text-center">
                <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500 mb-2">المحتوى</p>
                <p className="text-3xl font-black text-slate-900">{postsDoneCount + videosDoneCount}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">منجز</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg text-center">
                <Layout className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500 mb-2">الحسابات</p>
                <p className="text-3xl font-black text-slate-900">{clientAccounts.length}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">منصة مربوطة</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2"><Layout className="text-rose-600" /> حسابات المنصات</h3>
                <p className="text-slate-500 font-bold">إدارة جميع حسابات العميل على المنصات المختلفة</p>
              </div>
              <button onClick={() => setIsAddAccountModalOpen(true)} className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-8 py-4 rounded-full font-black text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-3 w-fit"><Plus className="w-5 h-5" /> إضافة حساب</button>
            </div>

            {/* Link Tree Style Container */}
            <div className="max-w-2xl mx-auto w-full">
              {clientAccounts.length > 0 ? (
                <div className="space-y-4">
                  {clientAccounts.map((account) => {
                    const platformColors: Record<string, { bg: string, icon: string, gradient: string }> = {
                      'Instagram': { bg: 'from-pink-600 to-orange-500', icon: 'text-pink-600', gradient: 'from-pink-50 to-orange-50' },
                      'TikTok': { bg: 'from-black to-gray-800', icon: 'text-black', gradient: 'from-gray-50 to-black/5' },
                      'Snapchat': { bg: 'from-yellow-400 to-yellow-500', icon: 'text-yellow-500', gradient: 'from-yellow-50 to-yellow-100' },
                      'Twitter': { bg: 'from-sky-400 to-sky-600', icon: 'text-sky-600', gradient: 'from-sky-50 to-blue-50' },
                      'YouTube': { bg: 'from-red-600 to-red-700', icon: 'text-red-600', gradient: 'from-red-50 to-orange-50' },
                      'LinkedIn': { bg: 'from-blue-600 to-blue-700', icon: 'text-blue-600', gradient: 'from-blue-50 to-indigo-50' },
                      'Pinterest': { bg: 'from-red-600 to-red-700', icon: 'text-red-600', gradient: 'from-red-50 to-rose-50' },
                      'Telegram': { bg: 'from-sky-500 to-cyan-500', icon: 'text-sky-600', gradient: 'from-sky-50 to-cyan-50' },
                      'WhatsApp': { bg: 'from-green-600 to-teal-600', icon: 'text-green-600', gradient: 'from-green-50 to-teal-50' },
                      'Discord': { bg: 'from-indigo-600 to-purple-600', icon: 'text-indigo-600', gradient: 'from-indigo-50 to-purple-50' },
                      'Website': { bg: 'from-slate-600 to-slate-700', icon: 'text-slate-600', gradient: 'from-slate-50 to-slate-100' }
                    };

                    const colors = platformColors[account.platform] || { bg: 'from-gray-600 to-gray-700', icon: 'text-gray-600', gradient: 'from-gray-50 to-gray-100' };

                    return (
                      <a
                        key={account.id}
                        href={account.accountUrl || '#'}
                        target={account.accountUrl ? '_blank' : 'self'}
                        rel={account.accountUrl ? 'noopener noreferrer' : ''}
                        className="group block"
                      >
                        <div className={`relative overflow-hidden bg-gradient-to-r ${colors.gradient} border-2 border-slate-200 hover:border-rose-300 p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1`}>
                          {/* Gradient Background Effect */}
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${colors.bg} transition-all duration-300`}></div>

                          {/* Content */}
                          <div className="relative z-10 flex items-center justify-between">
                            {/* Left Side - Icon & Info */}
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                                {account.platform === 'Instagram' && <Instagram className="w-7 h-7" />}
                                {account.platform === 'TikTok' && <Radio className="w-7 h-7" />}
                                {account.platform === 'Snapchat' && <Smartphone className="w-7 h-7" />}
                                {account.platform === 'Twitter' && <AtSign className="w-7 h-7" />}
                                {account.platform === 'YouTube' && <Youtube className="w-7 h-7" />}
                                {account.platform === 'LinkedIn' && <Linkedin className="w-7 h-7" />}
                                {account.platform === 'Pinterest' && <Heart className="w-7 h-7" />}
                                {account.platform === 'Telegram' && <Send className="w-7 h-7" />}
                                {account.platform === 'WhatsApp' && <MessageCircle className="w-7 h-7" />}
                                {account.platform === 'Discord' && <MessageCircle className="w-7 h-7" />}
                                {account.platform === 'Website' && <GlobeIcon className="w-7 h-7" />}
                              </div>

                              {/* Text Info */}
                              <div className="text-right flex-1">
                                <h4 className="font-black text-slate-900 text-lg group-hover:text-rose-600 transition-colors">{account.accountName}</h4>
                                <p className="text-sm font-bold text-slate-500 flex items-center gap-2 justify-end mt-1">
                                  <AtSign className="w-4 h-4" /> {account.username}
                                </p>
                              </div>
                            </div>

                            {/* Right Side - Actions */}
                            <div className="flex items-center gap-2 mr-4">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCopyUsername(account.username, account.id);
                                }}
                                className={`p-3 rounded-xl transition-all ${copiedId === account.id ? 'bg-emerald-100 text-emerald-600' : 'bg-white/50 text-slate-400 hover:text-rose-600 hover:bg-white'}`}
                              >
                                {copiedId === account.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteAccount(account.id);
                                }}
                                className="p-3 bg-white/50 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-dashed border-slate-200">
                  <Layout className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-black text-lg mb-2">لم تضف أي حسابات حتى الآن</p>
                  <p className="text-slate-400 font-bold mb-6">ابدأ بربط حسابات العميل على المنصات المختلفة</p>
                  <button onClick={() => setIsAddAccountModalOpen(true)} className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-full font-black text-sm shadow-lg hover:shadow-xl inline-flex items-center gap-2 active:scale-95"><Plus className="w-5 h-5" /> إضافة حساب الآن</button>
                </div>
              )}
            </div>

            {/* Add Account Modal - Link Tree Style */}
            {isAddAccountModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-white w-full max-w-2xl rounded-3xl p-12 shadow-3xl space-y-10 overflow-y-auto max-h-[90vh]">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900">إضافة حساب منصة</h2>
                      <p className="text-slate-500 font-bold mt-2">اختر المنصة وأضف بيانات حساب العميل</p>
                    </div>
                    <button onClick={() => setIsAddAccountModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-all"><X className="w-6 h-6" /></button>
                  </div>

                  {/* Form */}
                  <div className="space-y-6">
                    {/* Platform Selection */}
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">المنصة</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { name: 'Instagram', icon: Instagram },
                          { name: 'TikTok', icon: Radio },
                          { name: 'YouTube', icon: Youtube },
                          { name: 'LinkedIn', icon: Linkedin },
                          { name: 'Twitter', icon: AtSign },
                          { name: 'Snapchat', icon: Smartphone },
                          { name: 'Pinterest', icon: Heart },
                          { name: 'Telegram', icon: Send },
                          { name: 'WhatsApp', icon: MessageCircle },
                          { name: 'Discord', icon: MessageCircle },
                          { name: 'Website', icon: GlobeIcon }
                        ].map(({ name, icon: IconComponent }) => (
                          <button
                            key={name}
                            onClick={() => setNewAccount({ ...newAccount, platform: name })}
                            className={`p-4 rounded-2xl font-black text-sm transition-all border-2 flex flex-col items-center gap-2 ${newAccount.platform === name ? 'border-rose-600 bg-rose-50 text-rose-600 shadow-lg scale-105' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-200'}`}
                          >
                            <IconComponent className="w-6 h-6" />
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest">اسم الحساب *</label>
                        <input
                          type="text"
                          placeholder="مثال: الحساب الرسمي"
                          value={newAccount.accountName}
                          onChange={e => setNewAccount({ ...newAccount, accountName: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest">اسم المستخدم @ *</label>
                        <input
                          type="text"
                          placeholder="مثال: @username"
                          value={newAccount.username}
                          onChange={e => setNewAccount({ ...newAccount, username: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* URL Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest">رابط الحساب (اختياري)</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/username"
                        value={newAccount.accountUrl}
                        onChange={e => setNewAccount({ ...newAccount, accountUrl: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-slate-200">
                    <button
                      onClick={() => setIsAddAccountModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleAddAccount}
                      disabled={!newAccount.accountName || !newAccount.username}
                      className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Plus className="w-5 h-5" /> إضافة الحساب
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Remaining tabs are simplified for state check */}
        {activeTab === 'team' && <div className="p-10 bg-white rounded-[3rem] text-center font-bold text-slate-400">سيتم عرض أعضاء الفريق المسندين هنا قريباً.</div>}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clientProjects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl group hover:border-rose-100">
                <h4 className="text-xl font-black text-slate-900 group-hover:text-rose-600">{p.name}</h4>
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                  <span className="text-sm font-black text-emerald-600">{p.totalBudget?.toLocaleString()} ر.س</span>
                  <ChevronLeft className="w-5 h-5 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
        {activeTab === 'performance' && <div className="p-12 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl text-center font-black text-slate-300 italic">بيانات الأداء المباشرة ستظهر هنا قريباً...</div>}

        {/* Access Tab - Moderators Only */}
        {activeTab === 'access' && isModerator && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
              <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                <AtSign className="text-rose-600" /> بيانات الوصول للحسابات
              </h3>
              <p className="text-sm text-slate-500 mb-8 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                ⚠️ هذه البيانات حساسة وتظهر فقط لمديري المنصات والإدارة. يُرجى التعامل معها بسرية تامة.
              </p>

              {clientAccounts.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-bold">
                  لا توجد حسابات مسجلة لهذا العميل.
                </div>
              ) : (
                <div className="space-y-6">
                  {clientAccounts.map(account => (
                    <div key={account.id} className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2.5rem] border-2 border-slate-200">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                            {account.platform.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900">{account.accountName}</h4>
                            <p className="text-sm font-bold text-slate-500">{account.platform}</p>
                          </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-xs font-black ${account.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          {account.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <p className="text-xs font-black text-slate-400 uppercase mb-2">اسم المستخدم</p>
                          <p className="text-lg font-black text-slate-900 flex items-center gap-2">
                            @{account.username || 'غير محدد'}
                            {account.username && (
                              <button
                                onClick={() => handleCopyUsername(account.username || '', account.id)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-all"
                              >
                                {copiedId === account.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                              </button>
                            )}
                          </p>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <p className="text-xs font-black text-slate-400 uppercase mb-2">البريد الإلكتروني</p>
                          <p className="text-lg font-black text-slate-900">{account.accessEmail || 'غير محدد'}</p>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <p className="text-xs font-black text-slate-400 uppercase mb-2">كلمة المرور</p>
                          <p className="text-lg font-black text-slate-900 font-mono tracking-wider">
                            {account.accessPassword ? '••••••••' : 'غير محدد'}
                          </p>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <p className="text-xs font-black text-slate-400 uppercase mb-2">رابط الحساب</p>
                          {account.accountUrl ? (
                            <a href={account.accountUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-black text-blue-600 hover:underline">
                              فتح الحساب ↗
                            </a>
                          ) : (
                            <p className="text-lg font-black text-slate-400">غير محدد</p>
                          )}
                        </div>
                      </div>

                      {account.notes && (
                        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="text-xs font-black text-amber-700 uppercase mb-2">ملاحظات</p>
                          <p className="text-sm font-bold text-slate-700">{account.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetails;
