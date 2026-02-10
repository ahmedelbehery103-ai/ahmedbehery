
import React, { useState } from 'react';
import { User } from '../types';
import { useTranslation } from '../i18n';

interface ProfileProps {
  user: User;
  onUserUpdate: (updates: Partial<User>) => void;
  lang: 'en' | 'ar';
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate, lang, onLogout }) => {
  const t = useTranslation(lang);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    onUserUpdate(formData);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onUserUpdate({ avatar: ev.target.result as string });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="bg-[var(--surface)] p-10 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow)] space-y-10">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <img 
              src={user.avatar || 'https://i.pravatar.cc/150'} 
              className="w-32 h-32 rounded-full border-4 border-[var(--surface-muted)] shadow-xl object-cover transition-transform group-hover:scale-105" 
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black uppercase tracking-tight">{user.name}</h1>
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{user.role} • @{user.username}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border)] pb-2">{t('personal_info')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('full_name')}</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-[var(--radius)] bg-[var(--surface-muted)] border border-[var(--border)] text-xs font-black outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('email_address')}</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-[var(--radius)] bg-[var(--surface-muted)] border border-[var(--border)] text-xs font-black outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleSave}
              className="flex-1 py-4 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest rounded-[var(--radius)] shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              {t('update_profile')}
            </button>
            <button 
              onClick={onLogout}
              className="px-8 py-4 bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-[var(--radius)] border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
            >
              {t('logout')}
            </button>
          </div>

          {isSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-[var(--radius)] text-center text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
              Profile information updated successfully
            </div>
          )}
        </div>

        <div className="p-6 bg-[var(--bg)] rounded-[var(--radius)] border border-[var(--border)] space-y-4 text-center">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Security Center</h3>
           <p className="text-[9px] text-slate-400 font-bold uppercase">To update your password, please navigate to the Admin Settings module.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
