
import React, { useState, useEffect } from 'react';
import Estimator from './components/Estimator';
import ProjectsDashboard from './components/ProjectsDashboard';
import Admin from './components/Admin';
import MaterialCatalog from './components/MaterialCatalog';
import BrandingSettings from './components/BrandingSettings';
import QuotationDesigner from './components/QuotationDesigner';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Login from './components/Login';
import { APP_CONFIG } from './constants';
import { AppConfig, User, Role, Template, Permissions, AuditLog, Language } from './types';
import { useTranslation } from './i18n';

const INITIAL_ADMIN_PERMISSIONS: Permissions = {
  canAccessEstimator: true,
  canAccessCatalog: true,
  canAccessProjects: true,
  canAccessLayout: true,
  canAccessAdmin: true,
};

const DEFAULT_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    passwordHash: 'admin123',
    name: 'Mustafa Ahmed',
    role: Role.ADMIN,
    email: 'admin@exhibiprice.com',
    avatar: 'https://i.pravatar.cc/150?u=admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: INITIAL_ADMIN_PERMISSIONS
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'estimator' | 'catalog' | 'layout' | 'admin' | 'settings' | 'profile' | 'identity'>('dashboard');
  const [config, setConfig] = useState<AppConfig>(APP_CONFIG);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingProject, setEditingProject] = useState<Template | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const t = useTranslation(lang);

  useEffect(() => {
    const savedLang = localStorage.getItem('exhibiprice_lang') as Language;
    if (savedLang) setLang(savedLang);
    
    const savedConfig = localStorage.getItem('exhibiprice_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...APP_CONFIG, ...parsed });
      } catch (e) {
        console.error("Config parse error");
      }
    }

    const savedLogs = localStorage.getItem('exhibiprice_audit_logs');
    if (savedLogs) setAuditLogs(JSON.parse(savedLogs));

    const savedUsers = localStorage.getItem('exhibiprice_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));

    // Check Local Session
    const savedAuth = localStorage.getItem('exhibiprice_session');
    if (savedAuth) {
      const sessionUser = JSON.parse(savedAuth) as User;
      // تأكيد أن المستخدم لا يزال مسؤولاً
      if (sessionUser.role === Role.ADMIN) {
        setCurrentUser(sessionUser);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('exhibiprice_session');
      }
    }
  }, []);

  useEffect(() => {
    const doc = document.documentElement;
    doc.dir = lang === 'ar' ? 'rtl' : 'ltr';
    doc.lang = lang;
    doc.setAttribute('data-theme', config.themeMode);
    doc.setAttribute('data-style', config.themeStyle);
    
    doc.style.setProperty('--density-scale', config.layoutDensity.toString());
    const currentBg = config.pageBackgrounds[activeTab] || config.bgColor;
    doc.style.setProperty('--bg', currentBg);
    doc.style.setProperty('--accent', config.themeColor);
    doc.style.setProperty('--surface', config.surfaceColor || '#ffffff');
    doc.style.setProperty('--text-main', config.mainTextColor || '#000000');
    doc.style.setProperty('--text-muted', config.mutedTextColor || '#475569');
    doc.style.setProperty('--radius', `${config.borderRadius}px`);
    doc.style.setProperty('--app-font', config.fontFamily + ', sans-serif');
    doc.style.setProperty('--app-font-weight', config.fontWeight === 'bold' ? '900' : '400');
    doc.style.setProperty('--main-text-transform', config.mainTextTransform || 'none');
    doc.style.setProperty('--secondary-text-transform', config.secondaryTextTransform || 'none');
    
    let borderWidth = '1px';
    if (config.borderType === 'none' || !config.showBorders) borderWidth = '0px';
    doc.style.setProperty('--border-width', borderWidth);

    localStorage.setItem('exhibiprice_config', JSON.stringify(config));
    localStorage.setItem('exhibiprice_lang', lang);
  }, [lang, config, activeTab]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('exhibiprice_session', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (!window.confirm(lang === 'ar' ? "هل تريد تسجيل الخروج؟" : "Terminate admin session?")) return;
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('exhibiprice_session');
    setActiveTab('dashboard');
  };

  const handleConfigUpdate = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  const handleUsersUpdate = (newUsers: User[], log?: AuditLog) => {
    setUsers(newUsers);
    localStorage.setItem('exhibiprice_users', JSON.stringify(newUsers));
    if (log) {
      const updatedLogs = [log, ...auditLogs].slice(0, 100);
      setAuditLogs(updatedLogs);
      localStorage.setItem('exhibiprice_audit_logs', JSON.stringify(updatedLogs));
    }
  };

  const handleUserUpdate = (userId: string, updates: Partial<User>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setUsers(updated);
    localStorage.setItem('exhibiprice_users', JSON.stringify(updated));
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('exhibiprice_session', JSON.stringify(updatedUser));
    }
  };

  const handlePasswordChange = (newPassword: string) => {
    if (!currentUser) return;
    handleUserUpdate(currentUser.id, { passwordHash: newPassword });
  };

  const hasAccess = (tab: string) => {
    if (!currentUser) return false;
    // في هذا النظام الجديد، كل شيء متاح للأدمن فقط
    return currentUser.role === Role.ADMIN;
  };

  const handleLoadProject = (project: Template) => {
    setEditingProject(project);
    setActiveTab('estimator');
  };

  const handleNewProject = (template?: Template) => {
    localStorage.removeItem('exhibiprice_current_draft');
    if (template) {
      const newProj = { 
        ...template, 
        id: '', 
        clientName: '', 
        name: `${template.name} (Copy)`,
        proposalDate: new Date().toISOString().split('T')[0],
        proposalId: ''
      };
      setEditingProject(newProj);
    } else {
      setEditingProject(null);
    }
    setActiveTab('estimator');
  };

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} users={users} config={config} lang={lang} />;
  }

  const primaryNavItems = [
    { id: 'dashboard', label: t('projects'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2zM3 7l9 6 9-6" /></svg> },
    { id: 'estimator', label: t('estimator'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'catalog', label: t('catalog'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'layout', label: 'Quotation Designer', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
  ];

  const bottomNavItems = [
    { id: 'identity', label: t('layout'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17l.01.01" /></svg> },
    { id: 'admin', label: t('admin'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'settings', label: t('settings'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className={`min-h-screen flex bg-[var(--bg)] theme-text transition-all duration-300`}>
      <aside className={`no-print hidden md:flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-300 shadow-[var(--shadow)] ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-24 flex items-center justify-between px-6 border-b border-[var(--border)] bg-slate-50/50">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center text-white font-black rounded-2xl shadow-xl overflow-hidden bg-white border border-slate-100" style={{ backgroundColor: config.themeColor }}>
                {config.appIcon.length > 2 ? <img src={config.appIcon} className="w-full h-full object-cover" /> : config.appIcon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs uppercase tracking-widest truncate main-text-style" style={{ color: 'var(--text-main)' }}>{config.appName}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter secondary-text-style truncate">Enterprise v4.5</span>
              </div>
            </div>
          )}
          {isSidebarCollapsed && (
             <div className="w-10 h-10 mx-auto flex items-center justify-center text-white font-black rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: config.themeColor }}>
               {config.appIcon.length > 2 ? <img src={config.appIcon} className="w-full h-full object-cover" /> : config.appIcon.charAt(0)}
             </div>
          )}
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {primaryNavItems.map(item => hasAccess(item.id) && (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (item.id !== 'estimator') setEditingProject(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === item.id ? 'bg-[var(--accent)] text-white shadow-xl scale-[1.02]' : 'hover:bg-slate-50 text-[var(--text-muted)] hover:text-slate-900'}`}
              style={activeTab === item.id ? { backgroundColor: config.themeColor } : {}}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && <span className="truncate main-text-style">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="py-6 px-4 space-y-2 border-t border-[var(--border)] bg-slate-50/30">
          {bottomNavItems.map(item => hasAccess(item.id) && (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === item.id ? 'bg-[var(--accent)] text-white shadow-lg' : 'hover:bg-slate-50 text-[var(--text-muted)]'}`}
              style={activeTab === item.id ? { backgroundColor: config.themeColor } : {}}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && <span className="truncate main-text-style">{item.label}</span>}
            </button>
          ))}
          
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all text-red-500 hover:bg-red-50 mt-4 border border-transparent hover:border-red-100`}
          >
            <span className="flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </span>
            {!isSidebarCollapsed && <span className="truncate main-text-style">{t('logout')}</span>}
          </button>

          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 mt-6 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 transition"
          >
            <svg className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? (lang === 'ar' ? 'rotate-0' : 'rotate-180') : (lang === 'ar' ? 'rotate-180' : 'rotate-0')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print h-20 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
             <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] main-text-style">{activeTab === 'layout' ? 'Quotation Designer' : t(activeTab as any)}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all secondary-text-style">
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            <div 
               onClick={() => setActiveTab('profile')}
               className="flex items-center gap-4 border-l border-slate-100 pl-6 rtl:pl-0 rtl:pr-6 rtl:border-l-0 rtl:border-r cursor-pointer group transition-all"
            >
               <div className="text-right rtl:text-left">
                  <p className="text-[11px] font-black group-hover:text-blue-600 transition-colors">{currentUser?.name}</p>
                  <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest secondary-text-style">{currentUser?.role}</p>
               </div>
               <img src={currentUser?.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-2xl border-2 border-white shadow-xl object-cover transition-transform group-hover:scale-105" />
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-8 transition-all duration-300 relative`}>
           {activeTab === 'dashboard' && <ProjectsDashboard onLoadProject={handleLoadProject} onNewProject={handleNewProject} lang={lang} config={config} />}
           {activeTab === 'estimator' && <Estimator config={config} initialProject={editingProject} lang={lang} />}
           {activeTab === 'catalog' && <MaterialCatalog config={config} lang={lang} />}
           {activeTab === 'layout' && <QuotationDesigner config={config} lang={lang} />}
           {activeTab === 'identity' && <BrandingSettings config={config} onConfigChange={handleConfigUpdate} lang={lang} />}
           {activeTab === 'admin' && (
              <Admin 
                config={config} 
                onConfigChange={handleConfigUpdate} 
                users={users}
                onUsersUpdate={handleUsersUpdate} 
                currentUser={currentUser!}
                onSwitchUser={(id) => {
                  const user = users.find(u => u.id === id);
                  if (user) {
                    setCurrentUser(user);
                    localStorage.setItem('exhibiprice_session', JSON.stringify(user));
                  }
                }}
                auditLogs={auditLogs}
                lang={lang}
              />
           )}
           {activeTab === 'settings' && <Settings config={config} onConfigChange={handleConfigUpdate} lang={lang} currentUser={currentUser!} onPasswordChange={handlePasswordChange} />}
           {activeTab === 'profile' && <Profile user={currentUser!} onUserUpdate={(updates) => handleUserUpdate(currentUser!.id, updates)} lang={lang} onLogout={handleLogout} />}

           {activeTab !== 'dashboard' && (
             <button 
               onClick={() => setActiveTab('dashboard')}
               className="fixed bottom-6 left-6 z-[60] flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all no-print group border border-white/10"
             >
               <svg className="w-5 h-5 text-blue-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
               <span className="text-[11px] font-black uppercase tracking-[0.2em] main-text-style">{t('projects')}</span>
             </button>
           )}
        </main>
      </div>
    </div>
  );
};

export default App;
