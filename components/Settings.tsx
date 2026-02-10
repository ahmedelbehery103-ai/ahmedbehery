
import React, { useRef, useState } from 'react';
import { AppConfig, User } from '../types';
import { useTranslation } from '../i18n';

interface SettingsProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  lang: 'en' | 'ar';
  currentUser: User;
  onPasswordChange: (newPassword: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onConfigChange, lang, currentUser, onPasswordChange }) => {
  const t = useTranslation(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const updateConfig = (key: keyof AppConfig, val: any) => {
    onConfigChange({ ...config, [key]: val });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateConfig('appIcon', ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleManualSave = () => {
    setIsSaving(true);
    localStorage.setItem('exhibiprice_config', JSON.stringify(config));
    setTimeout(() => {
      setIsSaving(false);
      alert(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    }, 600);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);

    if (passwordData.current !== currentUser.passwordHash) {
      setPwdError(t('wrong_current_password'));
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPwdError(t('password_mismatch'));
      return;
    }
    if (passwordData.new.length < 4) {
      setPwdError(lang === 'ar' ? 'كلمة المرور قصيرة جداً' : 'Password is too short');
      return;
    }

    onPasswordChange(passwordData.new);
    setPwdSuccess(true);
    setPasswordData({ current: '', new: '', confirm: '' });
    setTimeout(() => setPwdSuccess(false), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end border-b border-[var(--border)] pb-6">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 main-text-style">{t('settings')}</h1>
           <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] secondary-text-style">System Orchestration & Identity</p>
        </div>
        <button 
          onClick={handleManualSave}
          disabled={isSaving}
          className="px-8 py-3 bg-[var(--accent)] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
        >
          {isSaving ? (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          )}
          {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Branding & Security Column */}
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-[var(--surface)] p-8 rounded-[2rem] border border-[var(--border)] shadow-sm space-y-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-[var(--border)] pb-4 flex items-center gap-2 main-text-style">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {t('branding_assets')}
            </h2>

            <div className="flex flex-col items-center gap-6">
              <div 
                className="w-32 h-32 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group cursor-pointer relative transition-all hover:border-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                {config.appIcon.length > 2 ? (
                  <img src={config.appIcon} className="w-full h-full object-cover p-2" alt="Logo Preview" />
                ) : (
                  <span className="text-4xl font-black text-slate-300">{config.appIcon || 'E'}</span>
                )}
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              
              <div className="w-full space-y-2 text-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] secondary-text-style">App Label</label>
                <input 
                  type="text" 
                  value={config.appName} 
                  onChange={e => updateConfig('appName', e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-[var(--border)] text-xs font-black outline-none focus:border-blue-500 text-center" 
                />
              </div>
            </div>
          </section>

          {/* New Change Password Section */}
          <section className="bg-[var(--surface)] p-8 rounded-[2rem] border border-[var(--border)] shadow-sm space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600 border-b border-[var(--border)] pb-4 flex items-center gap-2 main-text-style">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Account Security
            </h2>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {pwdError && <p className="text-[10px] font-black text-red-500 uppercase">{pwdError}</p>}
              {pwdSuccess && <p className="text-[10px] font-black text-emerald-500 uppercase">{t('password_updated')}</p>}
              
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('current_password')}</label>
                <input 
                  type="password" 
                  value={passwordData.current} 
                  onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('new_password')}</label>
                <input 
                  type="password" 
                  value={passwordData.new} 
                  onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('confirm_password')}</label>
                <input 
                  type="password" 
                  value={passwordData.confirm} 
                  onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none" 
                  required
                />
              </div>
              
              <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                {t('change_password')}
              </button>
            </form>
          </section>
        </div>

        {/* Corporate Profile Column */}
        <div className="lg:col-span-2">
          <section className="bg-[var(--surface)] p-8 rounded-[2rem] border border-[var(--border)] shadow-sm space-y-8 h-full">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-[var(--border)] pb-4 flex items-center gap-2 main-text-style">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              {t('corporate_profile')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] secondary-text-style">{t('company_address')}</label>
                  <textarea 
                    value={config.companyAddress} 
                    onChange={e => updateConfig('companyAddress', e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-[var(--border)] text-xs font-black outline-none focus:border-blue-500 transition h-20 resize-none" 
                  />
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] secondary-text-style">{t('company_phone')}</label>
                  <input 
                    type="text" 
                    value={config.companyPhone} 
                    onChange={e => updateConfig('companyPhone', e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-[var(--border)] text-xs font-black outline-none focus:border-blue-500 transition" 
                  />
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] secondary-text-style">{t('company_email')}</label>
                  <input 
                    type="email" 
                    value={config.companyEmail} 
                    onChange={e => updateConfig('companyEmail', e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-[var(--border)] text-xs font-black outline-none focus:border-blue-500 transition" 
                  />
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] secondary-text-style">{t('company_website')}</label>
                  <input 
                    type="text" 
                    value={config.companyWebsite} 
                    onChange={e => updateConfig('companyWebsite', e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-[var(--border)] text-xs font-black outline-none focus:border-blue-500 transition" 
                  />
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] secondary-text-style">{t('company_tax_id')}</label>
                  <input 
                    type="text" 
                    value={config.companyTaxId} 
                    onChange={e => updateConfig('companyTaxId', e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-[var(--border)] text-xs font-black outline-none focus:border-blue-500 transition" 
                  />
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
