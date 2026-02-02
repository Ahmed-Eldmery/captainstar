
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Calendar, DollarSign, ChevronRight, X,
  Target, Layers, Zap, Trash2, Check, ChevronDown, Instagram,
  Facebook, AtSign, Smartphone, Heart, Copy, Eye, EyeOff, Globe, AlertCircle
} from 'lucide-react';
import { ProjectStatus, User, TaskStatus, Client, Project } from '../types';
import { canUserDo } from '../lib/permissions.ts';
import { db, generateId } from '../lib/supabase.ts';

interface ProjectsProps {
  user: User;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  accounts: any[];
  tasks: any[];
}

const Projects: React.FC<ProjectsProps> = ({ user, projects, setProjects, clients, accounts, tasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    clientId: clients[0]?.id || '',
    niche: '',
    receivedDate: new Date().toISOString().split('T')[0],
    brief: '',
    totalBudget: 0,
    platforms: [],
    campaignTypes: [],
    website: { link: '', username: '', password: '', type: '' },
    accounts: [],
    driveLink: '',
    productSheetLink: '',
    copyAndDesign: '',
    motion: '',
    campaignDetails: { startDate: '', endDate: '', notes: '' },
    monthlyReport: '',
    clientStatus: '',
  });

  const statusColors = {
    [ProjectStatus.PLANNED]: { label: 'مخطط له', color: 'text-slate-500 bg-slate-50 border-slate-100' },
    [ProjectStatus.IN_PROGRESS]: { label: 'قيد التنفيذ', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    [ProjectStatus.ON_HOLD]: { label: 'متوقف مؤقتاً', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    [ProjectStatus.COMPLETED]: { label: 'مكتمل', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    [ProjectStatus.CANCELLED]: { label: 'ملغي', color: 'text-rose-600 bg-rose-50 border-rose-100' },
  };

  const platformList = ['Instagram', 'Facebook', 'Snapchat', 'TikTok', 'Twitter'];
  const campaignTypesList = ['صورة ثابتة', 'فيديو', 'كاروسيل', 'Reels', 'Stories', 'متعدد'];
  const websiteTypesList = ['WordPress', 'Shopify', 'WooCommerce', 'Wix', 'Squarespace', 'كاستم'];

  const selectedClient = clients.find(c => c.id === newProject.clientId);
  const clientAccounts = accounts?.filter(a => a.clientId === newProject.clientId) || [];

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.clientId) return;
    const projectToAdd: Project = {
      id: generateId(),
      clientId: newProject.clientId!,
      name: newProject.name!,
      status: ProjectStatus.PLANNED,
      type: 'حملة إعلانية',
      niche: newProject.niche,
      receivedDate: newProject.receivedDate,
      brief: newProject.brief,
      totalBudget: newProject.totalBudget,
      platforms: newProject.platforms,
      campaignTypes: newProject.campaignTypes,
      website: newProject.website,
      accounts: newProject.accounts,
      driveLink: newProject.driveLink,
      productSheetLink: newProject.productSheetLink,
      copyAndDesign: newProject.copyAndDesign,
      motion: newProject.motion,
      campaignDetails: newProject.campaignDetails,
      monthlyReport: newProject.monthlyReport,
      clientStatus: newProject.clientStatus,
      startDate: newProject.campaignDetails?.startDate,
      endDate: newProject.campaignDetails?.endDate,
      createdByUserId: user.id,
      createdAt: new Date().toISOString(),
      description: `حملة على منصات: ${newProject.platforms?.join(', ')}`
    };

    try {
      await db.insert('projects', projectToAdd);
      await db.logActivity(user.id, `إنشاء مشروع: ${projectToAdd.name}`, 'projects', projectToAdd.id);
      setProjects([projectToAdd, ...projects]);
      setIsModalOpen(false);
      setCurrentStep(1);
      setNewProject({
        name: '',
        clientId: clients[0]?.id || '',
        niche: '',
        receivedDate: new Date().toISOString().split('T')[0],
        brief: '',
        totalBudget: 0,
        platforms: [],
        campaignTypes: [],
        website: { link: '', username: '', password: '', type: '' },
        accounts: [],
        driveLink: '',
        productSheetLink: '',
        copyAndDesign: '',
        motion: '',
        campaignDetails: { startDate: '', endDate: '', notes: '' },
        monthlyReport: '',
        clientStatus: '',
      });
    } catch (err) {
      alert('فشل حفظ المشروع في قاعدة البيانات');
      console.error(err);
    }
  };

  const filteredProjects = useMemo(() => {
    let relevantProjects = projects;

    // Filter projects for non-admins: Only show if they created it OR have tasks in it
    if (!['admin', 'owner', 'manager', 'general_manager'].includes(user.role?.toLowerCase() || '')) {
      relevantProjects = projects.filter(p =>
        p.createdByUserId === user.id ||
        tasks.some(t => (t.projectId === p.id || t.clientId === p.clientId) && t.assignedToUserId === user.id)
      );
    }

    return relevantProjects.filter(p =>
      p.name.includes(searchTerm) ||
      clients.find(c => c.id === p.clientId)?.name.includes(searchTerm)
    );
  }, [projects, clients, searchTerm, user, tasks]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">الحملات الإعلانية</h1>
          <p className="text-slate-500 mt-2 font-bold">إدارة وتتبع الحملات الإعلانية متعددة المنصات للعملاء.</p>
        </div>
        {canUserDo(user, 'CREATE_PROJECT') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-slate-200 hover:bg-rose-600 transition-all flex items-center gap-3 active:scale-95"
          >
            <Plus className="w-6 h-6" />
            <span>إطلاق مشروع جديد</span>
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-6">
        <div className="relative flex-1 group w-full">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="ابحث عن اسم الحملة أو العميل..."
            className="w-full pr-14 pl-6 py-5 bg-slate-100/50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => {
          const client = clients.find(c => c.id === project.clientId);
          const projectTasks = tasks.filter(t => t.projectId === project.id || (t.clientId === project.clientId && !t.projectId));
          const completedTasks = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
          const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
          const status = statusColors[project.status] || statusColors[ProjectStatus.PLANNED];

          return (
            <div key={project.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all group relative">
              <div className="p-10 space-y-8">
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:rotate-12 transition-transform`}>
                    <Target className="w-7 h-7 text-rose-600" />
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <Link to={`/projects/${project.id}`} className="block">
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">{project.name}</h3>
                  </Link>
                  <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-500" /> {client?.name}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase">مستوى الإنجاز</span>
                    <span className="text-sm font-black text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50 shadow-inner">
                    <div className="h-full bg-rose-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-rose-500" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">عدد المنصات</p>
                      <p className="text-xs font-bold text-slate-700">{project.description?.split('منصة')[0].split(' ')[4] || '0'} منصات</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">الإجمالي</p>
                      <p className="text-xs font-bold text-slate-700">{project.totalBudget?.toLocaleString()} ر.س</p>
                    </div>
                  </div>
                </div>

                <Link to={`/projects/${project.id}`} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-rose-600 transition-all active:scale-95">
                  <span>تفاصيل العمليات</span>
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] p-12 shadow-3xl space-y-10 relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black">إنشاء حملة إعلانية</h2>
                <p className="text-sm text-slate-500 mt-2">الخطوة {currentStep} من 4</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setCurrentStep(1); }} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* شريط التقدم */}
            <div className="flex gap-4 mb-10">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className={`flex-1 h-2 rounded-full transition-all ${step <= currentStep ? 'bg-rose-600' : 'bg-slate-200'}`}></div>
              ))}
            </div>

            <div className="space-y-6">
              {/* الخطوة 1: معلومات الحملة الأساسية */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">اسم الحملة *</label>
                    <input type="text" value={newProject.name || ''} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" placeholder="مثلاً: حملة العودة للمدارس" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">العميل *</label>
                    <select value={newProject.clientId || ''} onChange={e => {
                      const clientId = e.target.value;
                      setNewProject({ ...newProject, clientId });
                      // تحديث الحسابات التلقائية عند تغيير العميل
                      const clientAccounts = accounts?.filter(a => a.clientId === clientId) || [];
                      setNewProject(prev => ({
                        ...prev,
                        accounts: clientAccounts.map(acc => ({
                          platformId: acc.id,
                          platform: acc.platform,
                          username: acc.username,
                          password: acc.notes
                        }))
                      }));
                    }} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none cursor-pointer transition-all">
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">النيتش</label>
                      <input type="text" value={newProject.niche || ''} onChange={e => setNewProject({ ...newProject, niche: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" placeholder="مثلاً: التعليم" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">تاريخ الاستلام</label>
                      <input type="date" value={newProject.receivedDate || ''} onChange={e => setNewProject({ ...newProject, receivedDate: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">البريف</label>
                    <textarea value={newProject.brief || ''} onChange={e => setNewProject({ ...newProject, brief: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all h-24 resize-none" placeholder="وصف المتطلبات..." />
                  </div>
                </>
              )}

              {/* الخطوة 2: المنصات والميزانية */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">الميزانية الإجمالية (ر.س) *</label>
                    <input type="number" value={newProject.totalBudget || 0} onChange={e => setNewProject({ ...newProject, totalBudget: Number(e.target.value) })} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" placeholder="0" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">المنصات الإعلانية</label>
                    <div className="grid grid-cols-2 gap-3">
                      {platformList.map(platform => (
                        <button
                          key={platform}
                          onClick={() => {
                            const platforms = newProject.platforms || [];
                            setNewProject({
                              ...newProject,
                              platforms: platforms.includes(platform)
                                ? platforms.filter(p => p !== platform)
                                : [...platforms, platform]
                            });
                          }}
                          className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${(newProject.platforms || []).includes(platform)
                            ? 'bg-rose-100 border-rose-300 text-rose-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-rose-200'
                            }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">أنواع الحملات</label>
                    <div className="grid grid-cols-2 gap-3">
                      {campaignTypesList.map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            const types = newProject.campaignTypes || [];
                            setNewProject({
                              ...newProject,
                              campaignTypes: types.includes(type)
                                ? types.filter(t => t !== type)
                                : [...types, type]
                            });
                          }}
                          className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${(newProject.campaignTypes || []).includes(type)
                            ? 'bg-blue-100 border-blue-300 text-blue-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-200'
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">تفاصيل الحملة</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600">تاريخ البداية</label>
                        <input type="date" value={newProject.campaignDetails?.startDate || ''} onChange={e => setNewProject({ ...newProject, campaignDetails: { ...newProject.campaignDetails, startDate: e.target.value } })} className="w-full mt-2 bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-xl py-2 px-3 font-bold outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600">تاريخ النهاية</label>
                        <input type="date" value={newProject.campaignDetails?.endDate || ''} onChange={e => setNewProject({ ...newProject, campaignDetails: { ...newProject.campaignDetails, endDate: e.target.value } })} className="w-full mt-2 bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-xl py-2 px-3 font-bold outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* الخطوة 3: المنصات والويبسايت */}
              {currentStep === 3 && (
                <>
                  <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl">
                    <h3 className="font-black text-blue-900 mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> اكسس وباسوورد المنصات</h3>
                    {clientAccounts.length > 0 ? (
                      <div className="space-y-3">
                        {clientAccounts.map(account => (
                          <div key={account.id} className="bg-white p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-black text-slate-900">{account.platform}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">اليوزر:</span>
                                <span className="font-bold text-slate-700">{account.username || 'غير محدد'}</span>
                              </div>
                              {account.notes && (
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500">الباسوورد:</span>
                                  <span className="font-bold text-slate-700 flex items-center gap-2">
                                    {showPasswordFields[account.id] ? account.notes : '••••••••'}
                                    <button onClick={() => setShowPasswordFields({ ...showPasswordFields, [account.id]: !showPasswordFields[account.id] })} className="text-rose-600 hover:text-rose-700">
                                      {showPasswordFields[account.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> لم يتم إضافة حسابات للعميل في صفحة التفاصيل</p>
                    )}
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl">
                    <h3 className="font-black text-amber-900 mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> الويبسايت</h3>
                    <label className="flex items-center gap-3 mb-4 cursor-pointer">
                      <input type="checkbox" checked={!!newProject.website?.link} onChange={e => setNewProject({ ...newProject, website: { ...newProject.website, link: e.target.checked ? '' : null } })} className="w-5 h-5 rounded accent-amber-600" />
                      <span className="font-bold text-slate-700">إضافة ويبسايت</span>
                    </label>
                    {newProject.website?.link !== null && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-2">رابط الويبسايت</label>
                          <input type="url" value={newProject.website?.link || ''} onChange={e => setNewProject({ ...newProject, website: { ...newProject.website, link: e.target.value } })} placeholder="https://..." className="w-full bg-white border-2 border-amber-100 focus:border-amber-500 rounded-xl py-2 px-3 font-bold outline-none transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-2">نوع الويبسايت</label>
                          <select value={newProject.website?.type || ''} onChange={e => setNewProject({ ...newProject, website: { ...newProject.website, type: e.target.value } })} className="w-full bg-white border-2 border-amber-100 focus:border-amber-500 rounded-xl py-2 px-3 font-bold outline-none cursor-pointer transition-all">
                            <option value="">اختر نوع الويبسايت</option>
                            {websiteTypesList.map(type => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-2">اليوزر</label>
                            <input type="text" value={newProject.website?.username || ''} onChange={e => setNewProject({ ...newProject, website: { ...newProject.website, username: e.target.value } })} placeholder="اسم المستخدم" className="w-full bg-white border-2 border-amber-100 focus:border-amber-500 rounded-xl py-2 px-3 font-bold outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-2">الباسوورد</label>
                            <div className="relative">
                              <input type={showPasswordFields['website'] ? 'text' : 'password'} value={newProject.website?.password || ''} onChange={e => setNewProject({ ...newProject, website: { ...newProject.website, password: e.target.value } })} placeholder="الباسوورد" className="w-full bg-white border-2 border-amber-100 focus:border-amber-500 rounded-xl py-2 px-3 pr-10 font-bold outline-none transition-all" />
                              <button onClick={() => setShowPasswordFields({ ...showPasswordFields, website: !showPasswordFields['website'] })} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600">
                                {showPasswordFields['website'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* الخطوة 4: الملفات والتقارير */}
              {currentStep === 4 && (
                <>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">رابط Drive</label>
                    <input type="url" value={newProject.driveLink || ''} onChange={e => setNewProject({ ...newProject, driveLink: e.target.value })} placeholder="https://drive.google.com/..." className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">شيت المنتجات والحملة</label>
                    <input type="url" value={newProject.productSheetLink || ''} onChange={e => setNewProject({ ...newProject, productSheetLink: e.target.value })} placeholder="https://docs.google.com/..." className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">الكوبي والديزاين</label>
                      <input type="text" value={newProject.copyAndDesign || ''} onChange={e => setNewProject({ ...newProject, copyAndDesign: e.target.value })} placeholder="ملاحظات..." className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">الموشن</label>
                      <input type="text" value={newProject.motion || ''} onChange={e => setNewProject({ ...newProject, motion: e.target.value })} placeholder="ملاحظات..." className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">حالة العميل وتفاصيله</label>
                    <textarea value={newProject.clientStatus || ''} onChange={e => setNewProject({ ...newProject, clientStatus: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all h-20 resize-none" placeholder="ملاحظات عن حالة العميل..." />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">التقرير الشهري والبلان</label>
                    <input type="url" value={newProject.monthlyReport || ''} onChange={e => setNewProject({ ...newProject, monthlyReport: e.target.value })} placeholder="رابط التقرير..." className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all" />
                  </div>
                </>
              )}
            </div>

            {/* أزرار التنقل */}
            <div className="flex gap-6 pt-8 border-t border-slate-200">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all"
                >
                  رجوع
                </button>
              )}
              {currentStep < 4 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all"
                >
                  التالي
                </button>
              )}
              {currentStep === 4 && (
                <button
                  onClick={handleAddProject}
                  disabled={!newProject.name || !newProject.clientId}
                  className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check className="w-5 h-5" /> إنشاء الحملة
                </button>
              )}
              <button
                onClick={() => { setIsModalOpen(false); setCurrentStep(1); }}
                className="px-6 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
