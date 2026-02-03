
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  Files, ThumbsUp, BarChart3, ListTodo, LogOut, Menu,
  Search, Bell, User as UserIcon, Sparkles, X, Check, Settings, Shield,
  Users2, MessagesSquare, Database, Download, Upload as UploadIcon, Loader2, Moon, Sun
} from 'lucide-react';

import {
  USERS as INITIAL_USERS,
  CLIENTS as INITIAL_CLIENTS,
  PROJECTS as INITIAL_PROJECTS,
  TASKS as INITIAL_TASKS,
  CLIENT_ACCOUNTS as INITIAL_ACCOUNTS,
  PERFORMANCE as INITIAL_PERFORMANCE,
  ACTIVITY_LOGS as INITIAL_LOGS
} from './mockData.ts';
import { User, Role, Client, Project, Task, ClientAccount, PerformanceSnapshot, ActivityLogEntry, CommunityPost, FileAsset, AgencySettings } from './types.ts';
import { canUserDo } from './lib/permissions.ts';
import { supabase, db } from './lib/supabase.ts';
import { testDatabaseConnection } from './lib/test-db.ts';

// Pages
import Dashboard from './pages/Dashboard.tsx';
import Clients from './pages/Clients.tsx';
import ClientDetails from './pages/ClientDetails.tsx';
import Projects from './pages/Projects.tsx';
import ProjectDetails from './pages/ProjectDetails.tsx';
import Tasks from './pages/Tasks.tsx';
import TaskDetails from './pages/TaskDetails.tsx';
import FilesPage from './pages/Files.tsx';
import Approvals from './pages/Approvals.tsx';
import Reports from './pages/Reports.tsx';
import ActivityLog from './pages/ActivityLog.tsx';
import Login from './pages/Login.tsx';
import AICenter from './pages/AICenter.tsx';
import Profile from './pages/Profile.tsx';
import UserManagement from './pages/UserManagement.tsx';
import Community from './pages/Community.tsx';
import ChatBotFloating from './components/ChatBotFloating';
import ChatSidebar from './components/ChatSidebar';
import ChatPage from './pages/Chat';

const Layout: React.FC<{ children: React.ReactNode; user: User; onLogout: () => void }> = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(() => parseInt(localStorage.getItem('unread_messages') || '0'));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const location = useLocation();

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.eq.all`)
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setNotifications(data);
      } catch (e) {
        console.log('Notifications table not ready yet');
      }
    };
    fetchNotifications();

    // Subscribe to new notifications
    const notifSub = supabase
      .channel('notifications_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new;
        if (String(newNotif.user_id) === String(user.id) || newNotif.user_id === 'all') {
          setNotifications(prev => [newNotif, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifSub);
    };
  }, [user.id]);

  // Listen for new message events from App.tsx
  useEffect(() => {
    const handleNewMessage = () => {
      setUnreadMessages(parseInt(localStorage.getItem('unread_messages') || '0'));
    };
    window.addEventListener('newMessage', handleNewMessage);
    // Also check on mount
    setUnreadMessages(parseInt(localStorage.getItem('unread_messages') || '0'));
    return () => window.removeEventListener('newMessage', handleNewMessage);
  }, []);

  // Clear unread count when navigating to chat
  useEffect(() => {
    if (location.pathname === '/chat') {
      localStorage.setItem('unread_messages', '0');
      setUnreadMessages(0);
    }
  }, [location.pathname]);

  const navigation = [
    { name: 'الرئيسية', href: '/', icon: LayoutDashboard, visible: true, badge: 0 },
    { name: 'الدردشة', href: '/chat', icon: Users, visible: true, badge: unreadMessages },
    { name: 'الكميونتي', href: '/community', icon: MessagesSquare, visible: true, badge: 0 },
    { name: 'الدميري (AI)', href: '/ai-center', icon: Sparkles, visible: true, badge: 0 },
    { name: 'العملاء', href: '/clients', icon: Users, visible: canUserDo(user, 'VIEW_CLIENTS'), badge: 0 },
    { name: 'إدارة الفريق', href: '/users', icon: Users2, visible: user.role === Role.ADMIN || user.role === Role.OWNER, badge: 0 },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban, visible: true, badge: 0 },
    { name: 'المهام', href: '/tasks', icon: CheckSquare, visible: true, badge: 0 },
    { name: 'الملفات والويب', href: '/files', icon: Files, visible: true, badge: 0 },
    { name: 'الاعتمادات', href: '/approvals', icon: ThumbsUp, visible: canUserDo(user, 'APPROVE_WORK'), badge: 0 },
    { name: 'التقارير', href: '/reports', icon: BarChart3, visible: canUserDo(user, 'VIEW_REPORTS'), badge: 0 },
    { name: 'السجل', href: '/activity-log', icon: ListTodo, visible: user.role === Role.ADMIN || user.role === Role.OWNER, badge: 0 },
  ];

  const activePage = navigation.find(item =>
    item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
  );

  return (
    <div className={`min-h-screen flex font-sans overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-[#fcfcfc]'}`} dir="rtl">
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`
        fixed inset-y-0 right-0 w-72 bg-slate-950 text-white z-50 transform transition-transform duration-500
        lg:relative lg:translate-x-0 border-l border-white/5
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-10 flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl shadow-rose-900/50">CS</div>
            <div>
              <span className="text-xl font-black tracking-tight block">كابتن <span className="inline-block animate-spin text-amber-400 align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.39 7.19H22l-5.8 4.21L18.19 22 12 17.27 5.81 22l1.99-8.6L2 9.19h7.61z" /></svg></span></span>
              <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest opacity-80">نظام الإدارة الذكي</span>
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-1 overflow-y-auto scrollbar-hide">
            {navigation.map((item) => (
              item.visible && (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-4 space-x-reverse px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 relative
                    ${activePage?.href === item.href
                      ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/40 scale-[1.02]'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 ${activePage?.href === item.href ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              )
            ))}
          </nav>

          <div className="p-8 border-t border-white/5 bg-white/[0.02]">
            <Link to="/profile" className="flex items-center space-x-4 space-x-reverse mb-8 group p-2 hover:bg-white/5 rounded-2xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 shadow-lg shrink-0 group-hover:border-rose-500/50 transition-colors overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-rose-500" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black truncate group-hover:text-rose-500 transition-colors">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{user.teamRole}</p>
              </div>
            </Link>
            <button onClick={onLogout} className="w-full flex items-center justify-center space-x-3 space-x-reverse px-4 py-4 text-sm font-black text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-white/5">
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-slate-900' : ''}`}>
        <header className={`h-24 backdrop-blur-xl border-b flex items-center justify-between px-8 lg:px-12 sticky top-0 z-30 transition-colors duration-300 ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-white/70 border-slate-100'}`}>
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-3 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
            <Menu className="w-7 h-7" />
          </button>

          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
              <input type="text" placeholder="ابحث عن مهام، عملاء، أو ملفات..." className="w-full pr-14 pl-6 py-4 bg-slate-100/50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-[1.5rem] text-sm font-bold outline-none transition-all" />
            </div>
          </div>

          <div className="flex items-center space-x-6 space-x-reverse relative">

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-700 text-amber-400' : 'bg-slate-100/50 text-slate-500 hover:text-rose-600'}`}
              title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-3 rounded-2xl transition-all ${notifOpen ? 'bg-rose-600 text-white shadow-xl shadow-rose-200' : 'bg-slate-100/50 text-slate-500 hover:text-rose-600'}`}
              >
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.read_at).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter(n => !n.read_at).length > 9 ? '9+' : notifications.filter(n => !n.read_at).length}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="absolute left-0 top-14 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-black text-slate-900">الإشعارات</h3>
                    <button
                      onClick={async () => {
                        // Mark all as read
                        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
                        if (unreadIds.length > 0) {
                          await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
                          setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
                        }
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      قراءة الكل
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-bold">
                        لا توجد إشعارات
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={async () => {
                            if (!notif.read_at) {
                              await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notif.id);
                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
                            }
                            if (notif.link) window.location.hash = notif.link;
                            setNotifOpen(false);
                          }}
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-all ${!notif.read_at ? 'bg-rose-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${!notif.read_at ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                            <div className="flex-1">
                              <p className="font-black text-sm text-slate-900">{notif.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2">
                                {new Date(notif.created_at).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="p-1 bg-slate-100 rounded-full hover:ring-2 ring-rose-500 transition-all overflow-hidden w-11 h-11 border-2 border-white shadow-sm">
              <div className="w-full h-full bg-rose-600 flex items-center justify-center text-white font-black text-xs">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
            </Link>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide ${darkMode ? 'text-white' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  // استرجاع بيانات المستخدم من localStorage (إن وجدت)
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('cs_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [performance, setPerformance] = useState<PerformanceSnapshot[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [settings, setSettings] = useState<AgencySettings>({});

  // جلب كافة البيانات من سوبا بيز عند تشغيل التطبيق
  useEffect(() => {
    testDatabaseConnection();
    const fetchAllData = async () => {
      try {
        const [uData, settingsData, cData, pData, tData, accData, perfData, logData, postData, fileData] = await Promise.all([
          db.getAll('users').catch(err => { console.warn('Users Error:', err); return []; }),
          db.getAll('agency_settings').catch(err => { console.warn('Settings Error:', err); return []; }),
          db.getAll('clients').catch(err => { console.warn('Clients Error:', err); return []; }),
          db.getAll('projects').catch(err => { console.warn('Projects Error:', err); return []; }),
          db.getAll('tasks').catch(err => { console.warn('Tasks Error:', err); return []; }),
          db.getAll('client_accounts').catch(err => { console.warn('Accounts Error:', err); return []; }),
          db.getAll('performance_snapshots').catch(err => { console.warn('Performance Error:', err); return []; }),
          db.getAll('activity_logs').catch(err => { console.warn('Logs Error:', err); return []; }),
          db.getAll('community_posts').catch(err => { console.warn('Posts Error:', err); return []; }),
          db.getAll('file_assets').catch(err => { console.warn('Files Error:', err); return []; })
        ]);

        setUsers(uData as User[]);

        // تحويل مصفوفة الإعدادات إلى كائن
        const settingsMap: AgencySettings = {};
        if (Array.isArray(settingsData)) {
          settingsData.forEach((item: any) => {
            if (item.key && item.value) settingsMap[item.key] = item.value;
          });
        }
        setSettings(settingsMap);

        setClients(cData as Client[]);
        setProjects(pData as Project[]);
        setTasks(tData as Task[]);
        setAccounts(accData as ClientAccount[]);
        setPerformance(perfData as PerformanceSnapshot[]);
        setLogs(logData as ActivityLogEntry[]);
        setPosts(postData as CommunityPost[]);
        setFiles(fileData as FileAsset[]);

        // We forgot file_assets in the destructuring (should be index 9)
        // Let's rely on the Promise.all result array directly to be safe? 
        // No, let's just use the result array directly which is safer if we missed one in destructuring
        // But for minimal change, let's fix the variable naming or just access the Promise result.
        // Actually, let's assume the destructuring missed the last one.
        // Let's refactor the destructuring to be clean.

      } catch (err) {
        console.error('خطأ في جلب البيانات:', err);
        // استخدام البيانات الفارغة في حال الفشل
        setUsers([]);
        setClients([]);
        setProjects([]);
        setTasks([]);
        setAccounts([]);
        setPerformance([]);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();

      // --- Realtime Subscriptions ---
      const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => { });
      };

      const subscription = supabase
        .channel('global_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task;
            setTasks(prev => {
              if (prev.some(t => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
            if (String(newTask.assignedToUserId) === String(user.id)) {
              playNotificationSound();
              alert(`🔔 مهمة جديدة: ${newTask.title}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects(prev => {
              if (prev.some(p => p.id === (payload.new as Project).id)) return prev;
              return [payload.new as Project, ...prev];
            });
          }
          else if (payload.eventType === 'UPDATE') setProjects(prev => prev.map(p => p.id === payload.new.id ? payload.new as Project : p));
          else if (payload.eventType === 'DELETE') setProjects(prev => prev.filter(p => p.id !== payload.old.id));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setClients(prev => {
              if (prev.some(c => c.id === (payload.new as Client).id)) return prev;
              return [payload.new as Client, ...prev];
            });
          }
          else if (payload.eventType === 'UPDATE') setClients(prev => prev.map(c => c.id === payload.new.id ? payload.new as Client : c));
          else if (payload.eventType === 'DELETE') setClients(prev => prev.filter(c => c.id !== payload.old.id));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'client_accounts' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setAccounts(prev => {
              if (prev.some(a => a.id === (payload.new as ClientAccount).id)) return prev;
              return [payload.new as ClientAccount, ...prev];
            });
          }
          else if (payload.eventType === 'UPDATE') setAccounts(prev => prev.map(a => a.id === payload.new.id ? payload.new as ClientAccount : a));
          else if (payload.eventType === 'DELETE') setAccounts(prev => prev.filter(a => a.id !== payload.old.id));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMsg = payload.new;
          // If message is for current user
          if (String(newMsg.receiver_id) === String(user.id)) {
            playNotificationSound();
            // Update unread count in localStorage for now (simple approach)
            const currentCount = parseInt(localStorage.getItem('unread_messages') || '0');
            localStorage.setItem('unread_messages', String(currentCount + 1));
            // Trigger window event for components to listen
            window.dispatchEvent(new CustomEvent('newMessage', { detail: newMsg }));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('cs_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cs_user');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 flex-col gap-6">
        <div className="w-20 h-20 bg-rose-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl animate-bounce shadow-2xl shadow-rose-900">CS</div>
        <div className="flex items-center gap-3 text-rose-500 font-black tracking-widest uppercase text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> جاري الاتصال بقاعدة البيانات...
        </div>
      </div>
    );
  }

  // إظهار صفحة تسجيل الدخول إذا لم يكن المستخدم مسجلاً
  if (!user) return <HashRouter><Routes><Route path="*" element={<Login onLogin={handleLogin} />} /></Routes></HashRouter>;

  const appProps = {
    user, setUser, users, setUsers, clients, setClients,
    projects, setProjects, tasks, setTasks, accounts, setAccounts,
    performance, setPerformance, logs, setLogs, posts, setPosts,
    files, setFiles, settings
  };

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard {...appProps} />} />
          <Route path="/profile" element={<Profile {...appProps} onUpdate={setUser} exportDatabase={() => { }} importDatabase={() => { }} tasks={tasks} />} />
          <Route path="/ai-center" element={<AICenter user={user} />} />
          <Route path="/community" element={<Community {...appProps} />} />
          <Route path="/clients" element={<Clients {...appProps} />} />
          <Route path="/clients/:id" element={<ClientDetails {...appProps} />} />
          <Route path="/users" element={<UserManagement {...appProps} />} />
          <Route path="/projects" element={<Projects {...appProps} />} />
          <Route path="/projects/:id" element={<ProjectDetails {...appProps} />} />
          <Route path="/tasks" element={<Tasks {...appProps} />} />
          <Route path="/tasks/:id" element={<TaskDetails {...appProps} />} />
          <Route path="/files" element={<FilesPage {...appProps} />} />
          <Route path="/approvals" element={<Approvals user={user} {...appProps} />} />
          <Route path="/reports" element={<Reports {...appProps} />} />
          <Route path="/activity-log" element={<ActivityLog {...appProps} />} />
          <Route path="/chat" element={<ChatPage users={users} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatBotFloating />
        <ChatSidebar users={users} />
      </Layout>
    </HashRouter>
  );
};

export default App;
