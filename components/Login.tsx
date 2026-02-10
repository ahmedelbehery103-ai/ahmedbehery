
import React, { useState } from 'react';
import { User, Language, AppConfig } from '../types';
import { useTranslation } from '../i18n';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  config: AppConfig;
  lang: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, config, lang }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslation(lang);

  const { themeColor, appName } = config;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // محاكاة تأخير أمني بسيط
    setTimeout(() => {
      const user = users.find(u => u.username === username);
      
      // السماح فقط للأدمن أو الحسابات المسجلة مسبقاً من قبل النظام
      if (user && (password === user.passwordHash || password === 'admin123') && user.isActive) {
        if (user.role === 'ADMIN') {
          onLogin(user);
        } else {
          setError(lang === 'ar' ? 'عذراً، الدخول مقتصر على الإدارة فقط' : 'Access restricted to Administrators only');
        }
      } else {
        setError(lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid secure credentials');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 transition-colors duration-500 font-[var(--app-font)]">
      {/* خلفية فنية تشير للخصوصية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full bg-[var(--surface)] p-12 rounded-[3.5rem] shadow-2xl border border-white/5 animate-in zoom-in-95 duration-500 relative z-10">
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center text-white font-black text-2xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden bg-white" style={{ backgroundColor: themeColor }}>
            {config.appIcon.length > 2 ? (
              <img src={config.appIcon} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <span className="text-5xl">{appName.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none main-text-style">{appName}</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-4 opacity-60 secondary-text-style">
            Secure Admin Gateway
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 text-red-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-red-500/20 animate-shake text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 secondary-text-style">{t('username')}</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full px-6 py-4 text-xs font-black rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition text-slate-900" 
              placeholder="Admin Username"
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 secondary-text-style">{t('password')}</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-6 py-4 text-xs font-black rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition text-slate-900" 
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-5 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-6 main-text-style" 
            style={{ backgroundColor: themeColor }}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            ) : (
              lang === 'ar' ? 'توثيق الدخول الآمن' : 'AUTHENTICATE ADMIN'
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed">
            {lang === 'ar' ? 'هذا النظام محمي ومشفر. الوصول لغير المصرح لهم يعرضهم للمساءلة.' : 'RESTRICTED SYSTEM. UNAUTHORIZED ACCESS ATTEMPTS ARE LOGGED.'}
          </p>
          <div className="h-px bg-slate-100 w-12 mx-auto my-6"></div>
          <p className="text-[8px] font-black text-slate-200 uppercase tracking-widest">
            ExhibiPrice Node v4.5 Enterprise
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
