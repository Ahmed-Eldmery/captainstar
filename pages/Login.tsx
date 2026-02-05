
import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Sparkles, Target, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase.ts';

const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@captainstar.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // البحث عن المستخدم في جدول users في Supabase
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password) // استخدام snake_case لمطابقة اسم الحقل في Supabase
        .single();

      if (dbError || !data) {
        // محاولة تسجيل الدخول باستخدام البيانات المحلية كـ fallback
        const { USERS } = await import('../mockData');
        const localUser = USERS.find(u => u.email === email && u.passwordHash === password);

        if (localUser) {
          if (!localUser.isActive) {
            throw new Error('عذراً، هذا الحساب معطل حالياً.');
          }
          onLogin(localUser);
          return;
        }

        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }

      // تحويل snake_case إلى camelCase
      const userData = {
        ...data,
        passwordHash: data.password_hash,
        isActive: data.is_active,
        teamRole: data.team_role,
        createdAt: data.created_at,
        avatarUrl: data.avatar_url
      };

      if (!userData.isActive) {
        throw new Error('عذراً، هذا الحساب معطل حالياً.');
      }

      onLogin(userData as User);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6 selection:bg-rose-100 selection:text-rose-600">
      <div className="w-full max-w-[540px] relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-rose-600 text-white rounded-[3rem] font-black text-5xl italic mb-10 shadow-3xl shadow-rose-200 relative overflow-hidden group">
            <span className="relative z-10">CS</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">كابتن <span className="inline-block animate-spin text-amber-400 align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.39 7.19H22l-5.8 4.21L18.19 22 12 17.27 5.81 22l1.99-8.6L2 9.19h7.61z" /></svg></span></h1>
          <p className="text-slate-400 font-bold mt-3 uppercase tracking-[0.3em] text-xs">قاعدة بيانات سحابية موحدة</p>
        </div>

        <div className="bg-white p-12 lg:p-16 rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pr-2">البريد الإلكتروني المهني</label>
              <div className="relative group">
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-14 pl-6 py-5 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-[2rem] outline-none transition-all text-slate-900 font-bold shadow-inner"
                  placeholder="name@captainstar.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">كلمة المرور</label>
              </div>
              <div className="relative group">
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-14 pl-6 py-5 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-[2rem] outline-none transition-all text-slate-900 font-bold shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-4 text-rose-600 text-sm bg-rose-50 p-6 rounded-[2rem] border border-rose-100 animate-in shake duration-500">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-slate-200 hover:bg-slate-800 transform transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 text-xl"
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <span>دخول النظام السحابي</span>
                  <Zap className="w-6 h-6 text-rose-500" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
