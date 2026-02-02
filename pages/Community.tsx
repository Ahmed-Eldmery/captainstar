
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, MessageSquare, Megaphone, HelpCircle, 
  Heart, Send, Link as LinkIcon, Award, Sparkles, 
  Filter, Zap, ChevronLeft, Globe, Star, Plus, ShieldCheck
} from 'lucide-react';
import { User, Role, CommunityPost, TeamRole } from '../types';
import { db, generateId } from '../lib/supabase.ts';

interface CommunityProps {
  user: User;
  users: User[];
  posts: CommunityPost[];
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
}

const Community: React.FC<CommunityProps> = ({ user, users, posts, setPosts }) => {
  const [selectedDept, setSelectedDept] = useState<string>(user.teamRole);
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'announcement' | 'discussion' | 'help'>('discussion');

  const departments = [
    'مبرمج ويب', 'صانع محتوى', 'مصمم جرافيك', 'مونتير فيديو', 
    'مشتري إعلانات', 'مدير حسابات', 'مدير منصات', 'خبير سيو'
  ];

  // التحكم في الأقسام المتاحة للعرض حسب الصلاحيات
  const availableDepartments = useMemo(() => {
    // Owner يرى كل الأقسام
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      return departments;
    }
    // الموظفون العاديون يرون فقط قسمهم
    return [user.teamRole];
  }, [user.role, user.teamRole]);

  // إذا كان المستخدم لا ينتمي إلى القسم المختار (عند الدخول)، اختر القسم الأول المتاح
  useEffect(() => {
    if (!availableDepartments.includes(selectedDept)) {
      setSelectedDept(availableDepartments[0]);
    }
  }, [availableDepartments, selectedDept]);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => p.department === selectedDept);
  }, [posts, selectedDept]);

  // منطق حساب "نجم القسم" المختار
  const deptHero = useMemo(() => {
    // 1. العثور على الموظفين الذين ينتمون لهذا القسم
    const deptMembers = users.filter(u => u.teamRole === selectedDept);
    if (deptMembers.length === 0) return null;

    // 2. حساب نقاط التفاعل لكل موظف في هذا القسم بناءً على منشوراته ولايكاته
    const membersWithScores = deptMembers.map(member => {
      const memberPosts = posts.filter(p => p.userId === member.id && p.department === selectedDept);
      const totalLikesReceived = memberPosts.reduce((sum, p) => sum + p.likes, 0);
      // النقاط = عدد المنشورات + عدد اللايكات التي حصل عليها
      const score = memberPosts.length + totalLikesReceived;
      return { member, score };
    });

    // 3. ترتيبهم تنازلياً واختيار صاحب المركز الأول
    membersWithScores.sort((a, b) => b.score - a.score);
    
    // إذا لم يوجد أي تفاعل، نعرض أول عضو في القسم كافتراضي
    return membersWithScores[0].score >= 0 ? membersWithScores[0].member : deptMembers[0];
  }, [users, posts, selectedDept]);

  const handleAddPost = async () => {
    if (!postContent.trim()) return;
    const newPost: CommunityPost = {
      id: generateId(),
      userId: user.id,
      department: selectedDept,
      content: postContent,
      type: postType,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    try {
      await db.insert('community_posts', newPost);
      setPosts([newPost, ...posts]);
      setPostContent('');
    } catch (err) {
      alert('فشل حفظ المنشور في قاعدة البيانات');
      console.error(err);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    try {
      const updatedPost = { ...post, likes: post.likes + 1 };
      await db.update('community_posts', postId, updatedPost);
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    } catch (err) {
      alert('فشل تحديث الإعجابات');
      console.error(err);
    }
  };

  const deptResources: Record<string, { title: string, link: string }[]> = {
    'مبرمج ويب': [
      { title: 'دليل React 19 الجديد', link: '#' },
      { title: 'أفضل إضافات VS Code 2024', link: '#' }
    ],
    'مصمم جرافيك': [
      { title: 'مجموعة خطوط عربية نادرة', link: '#' },
      { title: 'أسرار تصميم الهويات التجارية', link: '#' }
    ],
    'صانع محتوى': [
      { title: 'كيفية استخدام Gemini في الكتابة', link: '#' },
      { title: 'ترندات المحتوى في السعودية Q3', link: '#' }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            نادي النجوم <Sparkles className="text-rose-600 animate-pulse" />
          </h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">الساحة التفاعلية لتبادل الخبرات والتعاون بين الأقسام.</p>
        </div>
        <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl">
           <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center font-black">
              {selectedDept.charAt(0)}
           </div>
           <div>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">ساحة العمل الحالية</p>
              <p className="text-sm font-black">{selectedDept}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Sidebar Left: Departments */}
        <div className="lg:col-span-3 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                 <Users className="w-4 h-4 text-rose-600" /> ساحات الأقسام
                 {(user.role === Role.OWNER || user.role === Role.ADMIN) && (
                   <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg mr-auto">مالك</span>
                 )}
              </h3>
              <div className="space-y-1">
                 {availableDepartments.map(dept => (
                   <button 
                    key={dept} 
                    onClick={() => setSelectedDept(dept)}
                    className={`w-full text-right px-6 py-4 rounded-2xl text-xs font-black transition-all flex items-center justify-between group relative ${selectedDept === dept ? 'bg-rose-600 text-white shadow-xl shadow-rose-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                   >
                     <span>{dept}</span>
                     {user.role === Role.OWNER || user.role === Role.ADMIN ? (
                       <span className="text-[7px] font-black uppercase text-amber-300">👑</span>
                     ) : null}
                     <ChevronLeft className={`w-4 h-4 transition-transform ${selectedDept === dept ? 'translate-x-0' : 'translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-2'}`} />
                   </button>
                 ))}
              </div>
           </div>

           {/* Department Hero Section - التحديث هنا */}
           <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group min-h-[220px] flex flex-col justify-center">
              <Star className="absolute -top-10 -left-10 w-40 h-40 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
              <h3 className="text-sm font-black mb-6 relative z-10 flex items-center gap-2">
                 نجم قسم {selectedDept} <Award className="text-amber-500" />
              </h3>
              
              {deptHero ? (
                <div className="text-center space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                   <div className="w-20 h-20 bg-white/10 rounded-[2rem] mx-auto flex items-center justify-center text-3xl font-black border-2 border-amber-500/50 shadow-inner overflow-hidden">
                      {deptHero.avatarUrl ? (
                        <img src={deptHero.avatarUrl} alt={deptHero.name} className="w-full h-full object-cover" />
                      ) : (
                        deptHero.name.charAt(0)
                      )}
                   </div>
                   <div>
                      <p className="font-black text-lg text-white">{deptHero.name}</p>
                      <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">أكثر الأعضاء تفاعلاً هذا الأسبوع</p>
                   </div>
                </div>
              ) : (
                <div className="text-center py-4 relative z-10 opacity-40">
                   <p className="text-xs font-bold italic">لا يوجد أعضاء مسجلين في هذا القسم بعد</p>
                </div>
              )}
           </div>
        </div>

        {/* Content Section: Posts Feed */}
        <div className="lg:col-span-6 space-y-8">
           {/* تحذير إذا كان المستخدم ليس لديه صلاحية */}
           {user.role !== Role.OWNER && user.role !== Role.ADMIN && (
             <div className="bg-blue-50 border-2 border-blue-200 rounded-[2.5rem] p-6 flex items-center gap-4">
               <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
               <div>
                 <p className="font-black text-blue-900 text-sm">ساحة خاصة برقم قسمك</p>
                 <p className="text-xs text-blue-700 mt-1">يمكنك فقط عرض ونشر محتوى في قسم <span className="font-black">{user.teamRole}</span>. فقط المالك والمديرين يمكنهم عرض جميع الأقسام.</p>
               </div>
             </div>
           )}

           {/* Create Post Card */}
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black overflow-hidden border border-slate-200 shadow-sm">
                    {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                 </div>
                 <h2 className="text-xl font-black text-slate-900">انشر خبراً أو اطلب مساعدة...</h2>
              </div>
              <textarea 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={`اكتب شيئاً لزملائك في قسم ${selectedDept}...`}
                className="w-full h-32 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-3xl p-8 font-bold outline-none transition-all shadow-inner resize-none text-slate-700"
              />
              <div className="flex flex-wrap items-center justify-between gap-4">
                 <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => setPostType('announcement')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${postType === 'announcement' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                    >إعلان</button>
                    <button 
                      onClick={() => setPostType('discussion')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${postType === 'discussion' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                    >نقاش</button>
                    <button 
                      onClick={() => setPostType('help')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${postType === 'help' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                    >مساعدة</button>
                 </div>
                 <button 
                  onClick={handleAddPost}
                  disabled={!postContent.trim()}
                  className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                 >
                    <Send className="w-4 h-4 rotate-180" />
                    <span>نشر التحديث</span>
                 </button>
              </div>
           </div>

           {/* Feed */}
           <div className="space-y-6">
              {filteredPosts.map(post => {
                const author = users.find(u => u.id === post.userId);
                return (
                  <div key={post.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden group">
                     {post.type === 'announcement' && <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-600"></div>}
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shadow-lg overflow-hidden border border-slate-800">
                              {author?.avatarUrl ? <img src={author.avatarUrl} className="w-full h-full object-cover" /> : author?.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-black text-slate-900 text-sm">{author?.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{author?.teamRole} &bull; {new Date(post.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                           </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${post.type === 'announcement' ? 'bg-rose-50 text-rose-600 border border-rose-100' : post.type === 'help' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                           {post.type === 'announcement' ? 'إعلان هام' : post.type === 'help' ? 'طلب مساعدة' : 'نقاش عام'}
                        </span>
                     </div>
                     <p className="text-lg text-slate-700 font-medium leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border border-slate-50 shadow-inner">
                        {post.content}
                     </p>
                     <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-3 text-slate-400 hover:text-rose-600 font-black text-xs transition-all group"
                        >
                           <Heart className={`w-5 h-5 transition-all ${post.likes > 0 ? 'fill-rose-600 text-rose-600 scale-110' : 'group-hover:scale-110'}`} />
                           <span>{post.likes} تفاعل</span>
                        </button>
                        <button className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-black text-xs transition-all">
                           <MessageSquare className="w-5 h-5" />
                           <span>0 تعليقات</span>
                        </button>
                     </div>
                  </div>
                );
              })}
              {filteredPosts.length === 0 && (
                <div className="p-24 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center space-y-6">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <MessageSquare className="w-10 h-10" />
                   </div>
                   <p className="text-xl font-black text-slate-300 italic">لا توجد نقاشات في قسم {selectedDept} بعد...</p>
                </div>
              )}
           </div>
        </div>

        {/* Sidebar Right: Resources & Goals */}
        <div className="lg:col-span-3 space-y-10">
           {/* KPI Section */}
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                 أهداف القسم <Zap className="w-4 h-4 text-rose-600" />
              </h3>
              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                       <span>كفاءة العمل</span>
                       <span className="text-rose-600">85%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                       <div className="h-full bg-rose-600 rounded-full w-[85%]"></div>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                       <span>رضا العملاء</span>
                       <span className="text-blue-600">92%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                       <div className="h-full bg-blue-600 rounded-full w-[92%]"></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Resources Section */}
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                 مصادر مفيدة <LinkIcon className="w-4 h-4 text-rose-600" />
              </h3>
              <div className="space-y-4">
                 {(deptResources[selectedDept] || [{ title: 'لا توجد مصادر حالياً لـ ' + selectedDept, link: '#' }]).map((res, i) => (
                   <a 
                    key={i} 
                    href={res.link}
                    className="block p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group"
                   >
                     <p className="text-xs font-black text-slate-700 group-hover:text-rose-600 truncate">{res.title}</p>
                     <div className="flex items-center gap-1 mt-1">
                        <Globe className="w-3 h-3 text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">موقع خارجي</span>
                     </div>
                   </a>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Community;
