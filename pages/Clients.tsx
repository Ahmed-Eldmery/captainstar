
import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, Building2, Phone, FileUp, Globe, X, Loader2, Package, BarChart3, Grid3x3, CheckCircle2, Image as ImageIcon, Trash2, Upload, Check, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Role, Client, TaskType, TaskStatus } from '../types';
import { getVisibleClients, canUserDo } from '../lib/permissions';
import { db, storage, generateId } from '../lib/supabase';

// Toggle Component
const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  bgColor?: string;
}> = ({ checked, onChange, icon, label, description, bgColor = 'bg-slate-50' }) => (
  <div className={`flex items-center justify-between p-5 ${bgColor} rounded-2xl cursor-pointer hover:opacity-90 transition-all group border-2 ${checked ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}>
    <div className="flex items-center gap-3 flex-1">
      <div className={`w-5 h-5 text-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="font-black text-slate-900 text-sm">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all ${checked ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-lg shadow-rose-200' : 'bg-slate-300'
        }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${checked ? 'translate-x-1.5' : '-translate-x-1.5'
          }`}
      />
    </button>
  </div>
);

interface ClientsPageProps {
  user: User;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  tasks: any[];
  users: User[];
}

const Clients: React.FC<ClientsPageProps> = ({ user, clients, setClients, tasks, users }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    industry: '',
    country: 'السعودية',
    packageType: 'باقة أساسية',
    phoneNumber: '',
    postsQuota: 12,
    videosQuota: 4,
    hasWebsite: false,
    fileUpload: false,
    numCampaigns: 1,
    numPlatforms: 1,
    hasCampaign: false,
    campaigns: [],
    coverImage: '',
    assignedTeamIds: []
  });

  const visibleClients = useMemo(() => getVisibleClients(user, clients, tasks), [user, clients, tasks]);

  const filteredClients = useMemo(() => {
    return visibleClients.filter(c =>
      c.name.includes(searchTerm) || c.industry?.includes(searchTerm)
    );
  }, [visibleClients, searchTerm]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // رفع الصورة إلى Supabase Storage
        const fileName = `clients/${Date.now()}_${file.name}`;
        const imageUrl = await storage.uploadFile(file, fileName);
        setNewClient({ ...newClient, coverImage: imageUrl });
      } catch (err) {
        alert('فشل رفع الصورة');
      }
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClientId(client.id);
    setNewClient(client);
    setImagePreview(client.coverImage || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClientId(null);
    setImagePreview(null);
    setNewClient({
      name: '',
      industry: '',
      country: 'السعودية',
      packageType: 'باقة أساسية',
      phoneNumber: '',
      postsQuota: 12,
      videosQuota: 4,
      hasWebsite: false,
      fileUpload: false,
      numCampaigns: 1,
      numPlatforms: 1,
      hasCampaign: false,
      campaigns: [],
      coverImage: ''
    });
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phoneNumber) return;
    setIsSubmitting(true);
    try {
      if (editingClientId) {
        // تحديث عميل موجود
        const updatedClient = {
          ...newClient,
          id: editingClientId
        } as Client;

        await db.update('clients', editingClientId, {
          name: newClient.name,
          industry: newClient.industry,
          country: newClient.country,
          packageType: newClient.packageType,
          phoneNumber: newClient.phoneNumber,
          postsQuota: newClient.postsQuota,
          videosQuota: newClient.videosQuota,
          hasWebsite: newClient.hasWebsite || false,
          fileUpload: newClient.fileUpload || false,
          numCampaigns: newClient.numCampaigns || 1,
          numPlatforms: newClient.numPlatforms || 1,
          hasCampaign: newClient.hasCampaign || false,
          campaigns: newClient.hasCampaign ? (newClient.campaigns || []) : [],
          coverImage: newClient.coverImage || ''
        });

        await db.logActivity(user.id, `تحديث بيانات عميل: ${newClient.name}`, 'clients', editingClientId);
        setClients(clients.map(c => c.id === editingClientId ? updatedClient : c));
      } else {
        // إضافة عميل جديد
        const clientData = {
          id: generateId(),
          name: newClient.name,
          industry: newClient.industry,
          country: newClient.country,
          packageType: newClient.packageType,
          phoneNumber: newClient.phoneNumber,
          postsQuota: newClient.postsQuota,
          videosQuota: newClient.videosQuota,
          hasWebsite: newClient.hasWebsite || false,
          fileUpload: newClient.fileUpload || false,
          numCampaigns: newClient.numCampaigns || 1,
          numPlatforms: newClient.numPlatforms || 1,
          hasCampaign: newClient.hasCampaign || false,
          campaigns: newClient.hasCampaign ? (newClient.campaigns || []) : [],
          coverImage: newClient.coverImage || '',
          assignedTeamIds: newClient.assignedTeamIds || [],
          created_at: new Date().toISOString()
        };

        const savedClient = await db.insert('clients', clientData);
        await db.logActivity(user.id, `إضافة عميل جديد: ${newClient.name}`, 'clients', savedClient.id);
        setClients([savedClient, ...clients]);
      }

      closeModal();
    } catch (err) {
      alert(editingClientId ? 'فشل تعديل العميل' : 'فشل حفظ العميل في قاعدة البيانات السحابية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">شركاء النجاح</h1>
          <p className="text-slate-500 mt-2 font-bold">إدارة عملاء الوكالة عبر سحابة Supabase.</p>
        </div>
        {canUserDo(user, 'CREATE_CLIENT') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-rose-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-3 active:scale-95"
          >
            <Plus className="w-6 h-6" />
            <span>إضافة عميل جديد</span>
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-6">
        <div className="relative flex-1 group w-full">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="ابحث عن اسم الشركة..."
            className="w-full pr-14 pl-6 py-5 bg-slate-100/50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-[1.75rem] text-sm font-bold outline-none transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredClients.map(client => {
          const postsDone = tasks.filter(t => t.clientId === client.id && t.type === TaskType.CONTENT && t.status === TaskStatus.DONE).length;
          return (
            <div key={client.id} className="bg-gradient-to-br from-white to-slate-50 rounded-[3rem] border-2 border-slate-100 shadow-lg hover:shadow-2xl hover:border-rose-200 transition-all duration-300 group overflow-hidden flex flex-col">
              {/* Cover Image */}
              {client.coverImage ? (
                <div className="h-32 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                  <img src={client.coverImage} alt={client.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-white opacity-40" />
                </div>
              )}

              {/* Content */}
              <div className="p-8 flex flex-col flex-grow">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:scale-110 transition-transform -mt-12 border-4 border-white">
                    {client.name.charAt(0)}
                  </div>
                  <span className="bg-rose-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{client.packageType}</span>
                </div>

                {/* Title & Phone */}
                <Link to={`/clients/${client.id}`}>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors mb-1 line-clamp-2">{client.name}</h3>
                </Link>
                <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-6">
                  <Phone className="w-4 h-4 text-rose-600" /> {client.phoneNumber || 'غير محدد'}
                </p>

                {/* Industry */}
                <p className="text-xs font-bold text-slate-600 flex items-center gap-2 mb-6">
                  <Building2 className="w-4 h-4 text-rose-500" /> {client.industry || 'غير محدد'}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-200">
                  <div className="p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">المحتوى</p>
                    <p className="text-sm font-black text-blue-600">{postsDone}/{client.postsQuota || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">الفيديوهات</p>
                    <p className="text-sm font-black text-purple-600">{client.videosQuota || 0}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">الحملات</p>
                    <p className="text-sm font-black text-amber-600">{client.numCampaigns || 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">المنصات</p>
                    <p className="text-sm font-black text-emerald-600">{client.numPlatforms || 0}</p>
                  </div>
                </div>

                {/* Services */}
                <div className="mt-6 space-y-2">
                  {client.hasWebsite && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> موقع إلكتروني
                    </div>
                  )}
                  {client.fileUpload && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> تحميل ملفات
                    </div>
                  )}
                  {client.hasCampaign && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> حملة إعلانية
                    </div>
                  )}
                </div>

                {/* Campaigns Info */}
                {client.hasCampaign && client.campaigns && client.campaigns.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    {client.campaigns.map(campaign => (
                      <div key={campaign.id} className="text-xs font-bold text-slate-700">
                        <p className="text-amber-700">📊 {campaign.name} - {campaign.platform}</p>
                        <p className="text-amber-600">💰 {campaign.budget.toLocaleString()} ر.س</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-auto pt-8">
                  <button
                    onClick={() => openEditModal(client)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-black text-xs shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    تعديل
                  </button>
                  <Link to={`/clients/${client.id}`} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl font-black text-center text-xs shadow-lg hover:shadow-xl hover:from-rose-700 hover:to-rose-800 transition-all active:scale-95">إدارة العميل</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-3xl space-y-8 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-white pb-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900">{editingClientId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
                <p className="text-sm text-slate-500 mt-1">{editingClientId ? 'حدّث معلومات العميل' : 'ملء جميع البيانات المطلوبة'}</p>
              </div>
              <button onClick={closeModal} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-all hover:bg-rose-50">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              {/* Upload Cover Image */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-600" /> صورة الشركة
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-rose-500 rounded-2xl py-6 px-4 font-bold text-slate-600 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    اضغط لرفع الصورة
                  </button>
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img src={imagePreview} alt="preview" className="w-full h-32 object-cover rounded-xl" />
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setNewClient({ ...newClient, coverImage: '' });
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2 flex items-center gap-2">
                    <span className="text-rose-600">*</span> اسم الشركة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شركة النجم"
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-rose-600" /> رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    placeholder="مثال: 966501234567"
                    value={newClient.phoneNumber}
                    onChange={e => setNewClient({ ...newClient, phoneNumber: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Industry & Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2">المجال</label>
                  <input
                    type="text"
                    placeholder="مثال: تقنية المعلومات"
                    value={newClient.industry}
                    onChange={e => setNewClient({ ...newClient, industry: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-rose-600" /> نوع الباقة
                  </label>
                  <select
                    value={newClient.packageType}
                    onChange={e => setNewClient({ ...newClient, packageType: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  >
                    <option>باقة أساسية</option>
                    <option>باقة متقدمة</option>
                    <option>باقة احترافية</option>
                    <option>باقة مخصصة</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Posts & Videos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2">عدد البوستات الشهرية</label>
                  <input
                    type="number"
                    min="0"
                    value={newClient.postsQuota}
                    onChange={e => setNewClient({ ...newClient, postsQuota: Number(e.target.value) })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2">عدد الفيديوهات الشهرية</label>
                  <input
                    type="number"
                    min="0"
                    value={newClient.videosQuota}
                    onChange={e => setNewClient({ ...newClient, videosQuota: Number(e.target.value) })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Campaigns & Platforms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-rose-600" /> عدد الحملات
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newClient.numCampaigns}
                    onChange={e => setNewClient({ ...newClient, numCampaigns: Number(e.target.value) })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2 flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4 text-rose-600" /> عدد المنصات
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newClient.numPlatforms}
                    onChange={e => setNewClient({ ...newClient, numPlatforms: Number(e.target.value) })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                  />
                </div>
              </div>

              {/* Toggles Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <Toggle
                  checked={newClient.hasWebsite || false}
                  onChange={(val) => setNewClient({ ...newClient, hasWebsite: val })}
                  icon={<Globe className="w-5 h-5 text-rose-600" />}
                  label="موقع إلكتروني"
                  description="هل سيعمل موقع إلكتروني للعميل؟"
                />
                <Toggle
                  checked={newClient.fileUpload || false}
                  onChange={(val) => setNewClient({ ...newClient, fileUpload: val })}
                  icon={<FileUp className="w-5 h-5 text-rose-600" />}
                  label="تحميل الملفات"
                  description="هل سيتم تحميل ملفات من قبل العميل؟"
                />
                <Toggle
                  checked={newClient.hasCampaign || false}
                  onChange={(val) => setNewClient({ ...newClient, hasCampaign: val, campaigns: val ? [{ id: '1', name: '', platform: 'Instagram', budget: 0 }] : [] })}
                  icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
                  label="حملة إعلانية"
                  description="هل ستكون هناك حملة إعلانية للعميل؟"
                  bgColor="bg-amber-50"
                />
              </div>

              {/* Campaign Details */}
              {newClient.hasCampaign && (
                <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-4">
                  <h4 className="font-black text-slate-900 text-sm">تفاصيل الحملة الإعلانية</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2">اسم الحملة</label>
                      <input
                        type="text"
                        placeholder="مثال: حملة الصيف"
                        value={newClient.campaigns?.[0]?.name || ''}
                        onChange={e => {
                          const campaigns = newClient.campaigns || [];
                          campaigns[0] = { ...campaigns[0] || { id: '1' }, name: e.target.value, platform: 'Instagram', budget: campaigns[0]?.budget || 0 };
                          setNewClient({ ...newClient, campaigns });
                        }}
                        className="w-full bg-white border-2 border-amber-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2">المنصة</label>
                        <select
                          value={newClient.campaigns?.[0]?.platform || 'Instagram'}
                          onChange={e => {
                            const campaigns = newClient.campaigns || [];
                            campaigns[0] = { ...campaigns[0] || { id: '1' }, name: campaigns[0]?.name || '', platform: e.target.value, budget: campaigns[0]?.budget || 0 };
                            setNewClient({ ...newClient, campaigns });
                          }}
                          className="w-full bg-white border-2 border-amber-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                        >
                          <option>Instagram</option>
                          <option>TikTok</option>
                          <option>Facebook</option>
                          <option>Google Ads</option>
                          <option>متعددة</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2">ميزانية الحملة (ر.س)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={newClient.campaigns?.[0]?.budget || 0}
                          onChange={e => {
                            const campaigns = newClient.campaigns || [];
                            campaigns[0] = { ...campaigns[0] || { id: '1' }, name: campaigns[0]?.name || '', platform: campaigns[0]?.platform || 'Instagram', budget: Number(e.target.value) };
                            setNewClient({ ...newClient, campaigns });
                          }}
                          className="w-full bg-white border-2 border-amber-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none shadow-inner transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Assignment */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest pr-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" /> تعيين فريق العمل
                </label>
                <p className="text-xs text-slate-400">اختر الموظفين الذين سيعملون على هذا العميل</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl">
                  {users.filter(u => u.id !== user.id).map(teamMember => (
                    <button
                      key={teamMember.id}
                      type="button"
                      onClick={() => {
                        const currentIds = newClient.assignedTeamIds || [];
                        if (currentIds.includes(teamMember.id)) {
                          setNewClient({ ...newClient, assignedTeamIds: currentIds.filter(id => id !== teamMember.id) });
                        } else {
                          setNewClient({ ...newClient, assignedTeamIds: [...currentIds, teamMember.id] });
                        }
                      }}
                      className={`p-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${(newClient.assignedTeamIds || []).includes(teamMember.id) ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
                    >
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black">
                        {teamMember.name.charAt(0)}
                      </div>
                      <span className="truncate">{teamMember.name}</span>
                    </button>
                  ))}
                </div>
                {(newClient.assignedTeamIds?.length || 0) > 0 && (
                  <p className="text-xs text-emerald-600 font-bold">✓ تم اختيار {newClient.assignedTeamIds?.length} أعضاء</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-200 sticky bottom-0 bg-white">
              <button
                onClick={closeModal}
                className="flex-1 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddClient}
                disabled={isSubmitting || !newClient.name || !newClient.phoneNumber}
                className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingClientId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span>{editingClientId ? 'حفظ التعديلات' : 'إضافة العميل'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
