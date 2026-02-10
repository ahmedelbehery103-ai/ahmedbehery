
import React, { useState } from 'react';
import { AppConfig, User, Role, Permissions, AuditLog, Material } from '../types';

interface AdminProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  users: User[];
  onUsersUpdate: (users: User[], log?: AuditLog) => void;
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  auditLogs: AuditLog[];
  lang: string;
}

const Admin: React.FC<AdminProps> = ({ config, onConfigChange, users, onUsersUpdate, currentUser, onSwitchUser, auditLogs }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    username: '',
    email: '',
    role: Role.USER,
    isActive: true
  });

  const createLog = (targetUserId: string, action: AuditLog['action'], before?: string, after?: string): AuditLog => ({
    id: 'log-' + Date.now(),
    adminId: currentUser.id,
    adminName: currentUser.name,
    targetUserId,
    action,
    before,
    after,
    createdAt: new Date().toISOString()
  });

  const updateUser = (userId: string, updates: Partial<User>) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const before = JSON.stringify(userToUpdate);
    const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    const after = JSON.stringify(updated.find(u => u.id === userId));
    
    const action = updates.isActive === false ? 'DEACTIVATE_USER' : updates.isActive === true ? 'ACTIVATE_USER' : 'EDIT_USER';
    
    onUsersUpdate(updated, createLog(userId, action, before, after));
  };

  const updatePermissions = (userId: string, key: keyof Permissions, val: boolean) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, permissions: { ...u.permissions, [key]: val } };
      }
      return u;
    });
    // Explicitly convert key (which could be string | number | symbol) to string to fix implicit conversion error.
    onUsersUpdate(updated, createLog(userId, 'EDIT_USER', `Permission ${String(key)} changed`));
  };

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.username) return;
    
    const newId = 'u' + Date.now();
    const user: User = {
      id: newId,
      name: newUser.name!,
      username: newUser.username!,
      passwordHash: 'admin123', // Default password
      email: newUser.email || `${newUser.username}@exhibiprice.com`,
      role: newUser.role as Role,
      avatar: `https://i.pravatar.cc/150?u=${newId}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: {
        canAccessEstimator: true,
        canAccessCatalog: false,
        canAccessProjects: true,
        canAccessLayout: false,
        canAccessAdmin: false,
      }
    };
    
    onUsersUpdate([...users, user], createLog(newId, 'CREATE_USER', undefined, user.name));
    setShowAddModal(false);
    setNewUser({ name: '', username: '', email: '', role: Role.USER });
  };

  const handlePhotoUpload = (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateUser(userId, { avatar: ev.target.result as string });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- Master System Controls ---
  const exportSystemState = () => {
    const materials = JSON.parse(localStorage.getItem('exhibiprice_library_materials') || '[]');
    const categories = JSON.parse(localStorage.getItem('exhibiprice_library_categories') || '[]');
    
    const systemState = {
      config,
      materials,
      categories,
      users,
      timestamp: new Date().toISOString(),
      version: "4.1-PRO"
    };

    const blob = new Blob([JSON.stringify(systemState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExhibiPrice_System_Default_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importSystemState = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const state = JSON.parse(ev.target?.result as string);
          if (state.config && state.materials) {
            onConfigChange(state.config);
            onUsersUpdate(state.users);
            localStorage.setItem('exhibiprice_library_materials', JSON.stringify(state.materials));
            localStorage.setItem('exhibiprice_library_categories', JSON.stringify(state.categories));
            alert("System state restored successfully!");
            window.location.reload();
          }
        } catch (err) {
          alert("Invalid system file.");
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const saveAllAsDefault = () => {
    setSaveStatus('Saving...');
    // In this web app, localStorage is our default. 
    // This button ensures all states are synced and provides visual feedback.
    localStorage.setItem('exhibiprice_config', JSON.stringify(config));
    localStorage.setItem('exhibiprice_users', JSON.stringify(users));
    
    setTimeout(() => {
      setSaveStatus('Success!');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Master Control Center</h1>
          <p className="text-xs text-slate-500 font-medium">System orchestration & global persistence</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={saveAllAsDefault}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all flex items-center gap-2 ${saveStatus === 'Success!' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}
          >
            {saveStatus === 'Success!' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
            {saveStatus || 'Save All As App Default'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
          >
            Provision Staff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          {/* Staff Directory */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active Staff Directory</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity & Contact</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">System Role</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Modules</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${currentUser.id === u.id ? 'bg-blue-50/20' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative group">
                            <img src={u.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm object-cover" alt="" />
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer rounded-2xl">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(u.id, e)} />
                            </label>
                          </div>
                          <div className="space-y-1">
                            <input 
                              className="text-xs font-black text-slate-800 uppercase tracking-tight bg-transparent border-none p-0 w-full focus:ring-0" 
                              value={u.name} 
                              onChange={e => updateUser(u.id, { name: e.target.value })}
                            />
                            <input 
                              className="text-[9px] text-slate-400 font-bold bg-transparent border-none p-0 w-full focus:ring-0" 
                              value={u.email} 
                              onChange={e => updateUser(u.id, { email: e.target.value })}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <select 
                           value={u.role} 
                           onChange={e => updateUser(u.id, { role: e.target.value as Role })}
                           className="text-[10px] font-black uppercase tracking-widest bg-slate-100 border-none rounded-lg px-3 py-2 outline-none"
                         >
                           {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                         </select>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-1">
                          {[
                            { key: 'canAccessEstimator' as const, char: 'E' },
                            { key: 'canAccessCatalog' as const, char: 'C' },
                            { key: 'canAccessProjects' as const, char: 'P' },
                            { key: 'canAccessLayout' as const, char: 'L' },
                            { key: 'canAccessAdmin' as const, char: 'A' }
                          ].map(perm => (
                            <button
                              key={perm.key}
                              onClick={() => updatePermissions(u.id, perm.key, !u.permissions[perm.key])}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-[9px] font-black border transition-all ${u.permissions[perm.key] ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-300 border-slate-100'}`}
                            >
                              {perm.char}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end items-center gap-2">
                           <button 
                            onClick={() => onSwitchUser(u.id)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition ${currentUser.id === u.id ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {currentUser.id === u.id ? 'Active Self' : 'Switch'}
                          </button>
                          {currentUser.id !== u.id && (
                            <button 
                              onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                              className={`p-2 rounded-xl transition ${u.isActive ? 'text-red-300 hover:text-red-500 hover:bg-red-50' : 'text-green-300 hover:text-green-500 hover:bg-green-50'}`}
                            >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {u.isActive ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Persistence / Backup Section */}
          <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex-1 space-y-2">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Enterprise Configuration Snapshot</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                  Export all master data (Materials, Users, Brand Config) as a single recovery file. 
                  This is the ultimate "App Default" preservation method.
                </p>
             </div>
             <div className="flex gap-4 shrink-0">
                <label className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-slate-200 transition">
                  Restore Snapshot
                  <input type="file" accept=".json" onChange={importSystemState} className="hidden" />
                </label>
                <button 
                  onClick={exportSystemState}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-100 hover:brightness-110 transition"
                >
                  Export Master File
                </button>
             </div>
          </section>

          {/* Mini Audit Log */}
          <section className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
             <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Trail</h3>
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Real-time Stream</span>
             </div>
             <div className="max-h-48 overflow-y-auto">
                {auditLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="px-6 py-3 border-b border-white/5 flex justify-between items-center text-[10px] group hover:bg-white/5 transition">
                    <div className="flex items-center gap-3">
                       <span className="text-slate-600 font-mono text-[8px]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                       <span className="text-white font-black">{log.adminName}</span>
                       <span className="text-blue-500 uppercase font-black text-[8px] tracking-tighter">{log.action}</span>
                    </div>
                    <span className="text-slate-500 italic truncate max-w-[200px]">{log.targetUserId}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* System Health / Policies */}
        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">System Integrity</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Persistent Cache Active</p>
                 </div>
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Schema Version 4.1</p>
                 </div>
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Automatic Sync Ready</p>
                 </div>
              </div>
           </div>

           <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Master Override</h3>
              <p className="text-[10px] text-blue-100 leading-relaxed font-bold mb-4 opacity-80 uppercase">
                "Save All As App Default" commits current brand, logic, and users to the browser's persistent layer as the new baseline.
              </p>
              <div className="space-y-1">
                {['Global Rates', 'Brand Colors', 'Staff DB', 'Catalog Assets'].map(t => (
                  <p key={t} className="text-[9px] font-black uppercase tracking-widest opacity-60">• {t}</p>
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Provision New Staff</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">IAM Access Provisioning</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Identity Name</label>
                <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-3 text-xs font-bold bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none" placeholder="e.g. Ahmed Kamal" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">System Username</label>
                <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-3 text-xs font-bold bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none" placeholder="akamal" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Primary Assignment</label>
                <select 
                  value={newUser.role} 
                  onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                  className="w-full px-4 py-3 text-xs font-bold bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none uppercase"
                >
                  <option value={Role.USER}>General User</option>
                  <option value={Role.SALES}>Sales Team</option>
                  <option value={Role.ESTIMATOR}>Estimator Pro</option>
                  <option value={Role.ADMIN}>Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowAddModal(false)} className="flex-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
              <button onClick={handleCreateUser} className="flex-1 py-4 bg-blue-600 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl shadow-blue-200 tracking-widest">Activate Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
