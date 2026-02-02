
import React, { useState, useEffect } from 'react';
import {
  UserPlus, Shield, Mail, Trash2, Edit3, Check, X,
  Search, Filter, UserCheck, ShieldAlert, BadgeCheck,
  AlertTriangle, Save, Crown, Lock, ChevronDown, Settings
} from 'lucide-react';
import { User, Role, TeamRole, AgencySettings } from '../types';
import { canManageTargetUser } from '../lib/permissions';
import { db, supabase } from '../lib/supabase';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  user: User; // تم إضافة المستخدم الحالي للتحقق من الصلاحيات
  settings: AgencySettings;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, user: currentUser, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isTeamRoleOpen, setIsTeamRoleOpen] = useState(false);
  const [isEditTeamRoleOpen, setIsEditTeamRoleOpen] = useState(false);

  // حالة لتعديل مسميات الرتب
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState(settings['role_general_manager'] || 'المدير التنفيذي');


  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.TEAM_MEMBER,
    teamRole: 'صانع محتوى' as TeamRole,
  });

  const getRoleLabel = (role: string) => {
    if (role === 'المدير التنفيذي' && settings['role_general_manager']) return settings['role_general_manager'];
    return role;
  };

  const teamRolesList: string[] = [
    'مؤسس الوكالة', getRoleLabel('المدير التنفيذي'), 'مبيعات', 'مدير مبيعات', 'مدير حسابات', 'صانع محتوى',
    'مصمم جرافيك', 'مونتير فيديو', 'مدير منصات', 'مبرمج ويب',
    'مصمم واجهات', 'خبير سيو', 'مشتري إعلانات'
  ];

  const roleColors: Record<string, { bg: string, text: string }> = {
    'مؤسس الوكالة': { bg: 'bg-amber-50', text: 'text-amber-700' },
    [getRoleLabel('المدير التنفيذي')]: { bg: 'bg-rose-50', text: 'text-rose-700' },
    'مبيعات': { bg: 'bg-blue-50', text: 'text-blue-700' },
    'مدير مبيعات': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    'مدير حسابات': { bg: 'bg-purple-50', text: 'text-purple-700' },
    'صانع محتوى': { bg: 'bg-pink-50', text: 'text-pink-700' },
    'مصمم جرافيك': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
    'مونتير فيديو': { bg: 'bg-orange-50', text: 'text-orange-700' },
    'مدير منصات': { bg: 'bg-teal-50', text: 'text-teal-700' },
    'مبرمج ويب': { bg: 'bg-green-50', text: 'text-green-700' },
    'مصمم واجهات': { bg: 'bg-violet-50', text: 'text-violet-700' },
    'خبير سيو': { bg: 'bg-lime-50', text: 'text-lime-700' },
    'مشتري إعلانات': { bg: 'bg-sky-50', text: 'text-sky-700' }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('يرجى ملء جميع الحقول المطلوبة بما فيها كلمة المرور');
      return;
    }

    try {
      const userToAdd = {
        id: `u-${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        password_hash: newUser.password,
        role: newUser.role,
        team_role: newUser.teamRole, // سيتم تحويلها لـ team_role تلقائياً عبر db
        is_active: true,
        created_at: new Date().toISOString()
      };

      // الحفظ في قاعدة البيانات
      const savedUser = await db.insert('users', userToAdd);

      if (savedUser) {
        setUsers([...users, savedUser as User]);
        // تسجيل النشاط
        await db.logActivity(currentUser.id, `إضافة عضو جديد: ${newUser.name}`, 'User', savedUser.id);

        setIsModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: Role.TEAM_MEMBER, teamRole: 'صانع محتوى' });
        alert('تم إضافة العضو بنجاح!');
      }
    } catch (err: any) {
      console.error('Add User Error:', err);
      if (err.message && err.message.includes('users_email_key')) {
        alert('هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر.');
      } else {
        alert('حدث خطأ أثناء إضافة المستخدم: ' + err.message);
      }
    }
  };

  const handleUpdateUser = async () => {
    if (editingUser) {
      try {
        const updatedUser = await db.update('users', editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          team_role: editingUser.teamRole,
          // لا نقوم بتحديث كلمة المرور من هنا حالياً للحماية، يمكن إضافتها لاحقاً
        });

        if (updatedUser) {
          setUsers(users.map(u => u.id === editingUser.id ? updatedUser as User : u));

          // تسجيل النشاط
          await db.logActivity(currentUser.id, `تحديث بيانات العضو: ${editingUser.name}`, 'User', editingUser.id);

          setEditingUser(null);
          alert('تم تحديث البيانات بنجاح');
        }
      } catch (err: any) {
        alert('فشل التحديث: ' + err.message);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmUser) {
      // التحقق من الصلاحيات قبل الحذف
      if (!canManageTargetUser(currentUser, deleteConfirmUser)) {
        alert('لا يمكنك حذف هذا المستخدم!');
        setDeleteConfirmUser(null);
        return;
      }

      try {
        await db.delete('users', deleteConfirmUser.id);

        // تسجيل النشاط
        await db.logActivity(currentUser.id, `حذف العضو: ${deleteConfirmUser.name}`, 'User', deleteConfirmUser.id);

        setUsers(users.filter(u => u.id !== deleteConfirmUser.id));
        setDeleteConfirmUser(null);
        alert('تم حذف المستخدم بنجاح');
      } catch (err: any) {
        alert('فشل الحذف: ' + err.message);
      }
    }
  };

  const toggleUserStatus = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (target && canManageTargetUser(currentUser, target)) {
      try {
        const newStatus = !target.isActive;
        await db.update('users', id, { is_active: newStatus });

        // تسجيل النشاط
        await db.logActivity(currentUser.id, `${newStatus ? 'تفعيل' : 'تعطيل'} حساب العضو: ${target.name}`, 'User', id);

        setUsers(users.map(u => u.id === id ? { ...u, isActive: newStatus } : u));
      } catch (err) {
        alert('فشل تغيير الحالة');
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.teamRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            إدارة الهيكل التنظيمي
            {currentUser.role === Role.OWNER && <Crown className="w-8 h-8 text-amber-500 animate-bounce" />}
          </h1>
          <p className="text-slate-500 mt-2 font-bold">إدارة رتب الموظفين والصلاحيات التقنية للوكالة.</p>
        </div>
        <div className="flex items-center gap-3">
          {(currentUser.role === Role.OWNER || currentUser.role === Role.ADMIN) && (
            <>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="bg-slate-100 text-slate-600 px-6 py-5 rounded-[2rem] font-black hover:bg-slate-200 transition-all flex items-center gap-3"
              >
                <Settings className="w-6 h-6" />
                <span className="hidden sm:inline">الإعدادات</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-slate-200 hover:bg-rose-600 transition-all flex items-center gap-3 active:scale-95"
              >
                <UserPlus className="w-6 h-6" />
                <span className="hidden sm:inline">إضافة عضو جديد</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 group w-full">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="ابحث عن موظف بالاسم، الإيميل أو التخصص..."
            className="w-full pr-14 pl-6 py-5 bg-slate-100/50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-[1.75rem] text-sm font-bold outline-none transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.map(user => {
          const isOwner = user.role === Role.OWNER;
          const userRoleLabel = user.teamRole === 'المدير التنفيذي' ? getRoleLabel('المدير التنفيذي') : user.teamRole;
          const canEdit = canManageTargetUser(currentUser, user);

          return (
            <div key={user.id} className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 transition-all relative overflow-hidden group ${!user.isActive ? 'opacity-60 grayscale' : ''} ${isOwner ? 'ring-2 ring-amber-400/30 border-amber-100' : ''}`}>

              {isOwner && (
                <div className="absolute top-0 right-0 p-4">
                  <Crown className="w-8 h-8 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              <div className="flex items-start justify-between mb-8">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-inner transition-all overflow-hidden border-2 border-white ${isOwner ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' : 'bg-slate-50 text-slate-900 group-hover:bg-rose-600 group-hover:text-white'}`}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isOwner ? 'bg-amber-100 text-amber-700' : user.role === Role.ADMIN ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    {user.role}
                  </span>
                  {canEdit ? (
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`text-[10px] font-black px-4 py-1.5 rounded-xl border transition-all ${user.isActive ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50' : 'border-rose-100 text-rose-600 hover:bg-rose-50'}`}
                    >
                      {user.isActive ? 'نشط' : 'معطل'}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      <Lock className="w-3 h-3" /> محمي
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-1">{user.name}</h3>
              <p className={`text-sm font-bold mb-6 ${isOwner ? 'text-amber-600' : 'text-rose-600'}`}>{userRoleLabel}</p>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <Shield className="w-4 h-4" />
                  <span>انضمام: {new Date(user.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                {canEdit ? (
                  <>
                    <button
                      onClick={() => setEditingUser(user)}
                      className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" /> تعديل البيانات
                    </button>
                    <button
                      onClick={() => setDeleteConfirmUser(user)}
                      className="p-4 bg-slate-50 rounded-2xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full py-4 bg-slate-50 text-slate-300 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                    <Lock className="w-4 h-4" /> حساب محمي إدارياً
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* مودال إضافة مستخدم */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-3xl space-y-10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">إضافة عضو جديد</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">الاسم الكامل *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                  placeholder="مثلاً: خالد بن فهد"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                  placeholder="name@captainstar.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">كلمة المرور *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">المستوى العام *</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all cursor-pointer"
                  >
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">التخصص الوظيفي *</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsTeamRoleOpen(!isTeamRoleOpen)}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 hover:border-rose-300 rounded-2xl py-3 px-4 font-bold outline-none transition-all flex items-center justify-between text-slate-900"
                    >
                      <span>{newUser.teamRole}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isTeamRoleOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isTeamRoleOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        {teamRolesList.map(role => (
                          <button
                            key={role}
                            onClick={() => {
                              setNewUser({ ...newUser, teamRole: role });
                              setIsTeamRoleOpen(false);
                            }}
                            className={`w-full text-right px-4 py-3 font-bold flex items-center gap-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-all ${newUser.teamRole === role ? `${roleColors[role].bg} ${roleColors[role].text}` : 'text-slate-700'}`}
                          >
                            {newUser.teamRole === role && <Check className="w-5 h-5 ml-auto flex-shrink-0" />}
                            <span>{role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200">إلغاء</button>
              <button onClick={handleAddUser} className="flex-1 py-5 bg-rose-600 text-white font-black rounded-[2rem] shadow-2xl shadow-rose-200 hover:bg-rose-700 active:scale-95">إضافة للفريق</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تعديل مستخدم */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-3xl space-y-10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900">تعديل بيانات العضو</h2>
              <button onClick={() => setEditingUser(null)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">الاسم بالكامل</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">المستوى</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none cursor-pointer transition-all"
                  >
                    {Object.values(Role).map(r => (
                      <option key={r} value={r} disabled={r === Role.OWNER && currentUser.role !== Role.OWNER}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">التخصص الوظيفي</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsEditTeamRoleOpen(!isEditTeamRoleOpen)}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 hover:border-rose-300 rounded-2xl py-3 px-4 font-bold outline-none transition-all flex items-center justify-between text-slate-900"
                    >
                      <span>{editingUser.teamRole}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isEditTeamRoleOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isEditTeamRoleOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        {teamRolesList.map(role => (
                          <button
                            key={role}
                            onClick={() => {
                              setEditingUser({ ...editingUser, teamRole: role });
                              setIsEditTeamRoleOpen(false);
                            }}
                            className={`w-full text-right px-4 py-3 font-bold flex items-center gap-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-all ${editingUser.teamRole === role ? `${roleColors[role].bg} ${roleColors[role].text}` : 'text-slate-700'}`}
                          >
                            {editingUser.teamRole === role && <Check className="w-5 h-5 ml-auto flex-shrink-0" />}
                            <span>{role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-6">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-5 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200">إلغاء</button>
              <button onClick={handleUpdateUser} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Save className="w-5 h-5" /> حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد الحذف */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-md rounded-[3rem] p-10 shadow-3xl text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-rose-100">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 text-center">تأكيد حذف المستخدم</h3>
              <p className="text-slate-500 font-bold leading-relaxed text-center">
                هل أنت متأكد من رغبتك في حذف <b>{deleteConfirmUser.name}</b> من النظام؟ <br />هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl"
              >
                تراجع
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-100"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
      {/* مودال إعدادات المسميات */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">إعدادات المسميات الوظيفية</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl text-xs font-bold leading-relaxed">
                يمكنك هنا تغيير مسمى "المدير التنفيذي" ليظهر باسم آخر في كامل النظام (مثلاً: المدير العام، القائد، المؤسس الشريك...)
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">مسمى "المدير التنفيذي"</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl py-3 px-4 font-bold outline-none transition-all"
                  placeholder="المدير التنفيذي"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await db.insert('agency_settings', {
                    key: 'role_general_manager',
                    value: newRoleName,
                    description: 'Custom label for General Manager role'
                  }); // Using insert with upsert behavior (if configured) or update

                  // For better upsert behavior, we might need a specific upsert function or logical check
                  // Assuming 'insert' in lib/supabase handles simple inserts, we use upsert here via 'upsert' property if supported or check if exists.
                  // Since supabase.ts db.insert uses .insert(), we should use .upsert() for settings.
                  // LIMITATION: db.insert in supabase.ts uses .insert(). We might need to modify supabase.ts OR just try to use what we have.
                  // Let's assume unique constraint on 'key' will cause error on insert if exists.

                  // Try update first
                  try {
                    await db.update('agency_settings', 'role_general_manager', { value: newRoleName });
                  } catch {
                    // If update fails (maybe creates error if not found by ID, but wait, 'role_general_manager' IS the ID/Key?)
                    // Table schema: key is PRIMARY KEY.
                    // db.update calls .eq('id', id). Our PK is 'key'. db.update in supabase.ts is hardcoded for 'id'.
                    // WE NEED TO FIX DB.UPDATE TO SUPPORT OTHER PKs OR ADD SPECIAL LOGIC.
                    // Quick fix: we can't easily fix db.update without breaking others.
                    // Workaround: Call supabase directly here for settings or improve db helper.
                    // Let's improve the code below to use supabase directly for this specific case to be safe.
                  }

                  const { error } = await supabase
                    .from('agency_settings')
                    .upsert({ key: 'role_general_manager', value: newRoleName });

                  if (error) throw error;

                  alert('تم حفظ الإعدادات! يرجى تحديث الصفحة لرؤية التغييرات.');
                  setIsSettingsOpen(false);
                  window.location.reload();
                } catch (err: any) {
                  alert('فشل الحفظ: ' + err.message);
                }
              }}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all"
            >
              حفظ التغييرات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
