
import React, { useState, useEffect } from 'react';
import { Template, AppConfig, Language, LineItem } from '../types';
import ProposalGenerator from './ProposalGenerator';

interface Props {
  config: AppConfig;
  lang: Language;
}

const QuotationDesigner: React.FC<Props> = ({ config, lang }) => {
  const [projects, setProjects] = useState<Template[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('exhibiprice_templates');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed);
      if (parsed.length > 0) {
        setSelectedProjectId(parsed[0].id);
        setSelectedProject(parsed[0]);
      }
    }
  }, []);

  const handleProjectSelect = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setSelectedProjectId(id);
      setSelectedProject({ ...proj });
    }
  };

  const updateField = (field: keyof Template, value: any) => {
    if (!selectedProject) return;
    setSelectedProject({ ...selectedProject, [field]: value });
  };

  const updateLineItem = (groupId: string, itemId: string, updates: Partial<LineItem>) => {
    if (!selectedProject) return;
    const updatedGroups = selectedProject.groups.map(g => {
      if (g.id === groupId) {
        const updatedItems = g.items.map(it => {
          if (it.id === itemId) {
            const newItem = { ...it, ...updates };
            if ('quantity' in updates || 'unitPrice' in updates) {
               newItem.total = newItem.quantity * newItem.unitPrice;
            }
            return newItem;
          }
          return it;
        });
        return { ...g, items: updatedItems };
      }
      return g;
    });
    setSelectedProject({ ...selectedProject, groups: updatedGroups });
  };

  const removeLineItem = (groupId: string, itemId: string) => {
    if (!selectedProject) return;
    const updatedGroups = selectedProject.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter(it => it.id !== itemId) };
      }
      return g;
    });
    setSelectedProject({ ...selectedProject, groups: updatedGroups });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateField('customLogo', ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const saveToArchive = () => {
    if (!selectedProject) return;
    const updated = projects.map(p => p.id === selectedProject.id ? selectedProject : p);
    setProjects(updated);
    localStorage.setItem('exhibiprice_templates', JSON.stringify(updated));
    alert("Official Quotation state saved to project archive.");
  };

  if (projects.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div>
          <h2 className="text-xl font-black uppercase text-slate-900">No Projects Found</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Create an estimate first to design a quotation.</p>
        </div>
      </div>
    );
  }

  const calculateDocumentValue = () => {
    if (!selectedProject) return 0;
    return selectedProject.groups.reduce((acc, g) => {
      const groupSum = g.items.reduce((sum, item) => sum + item.total, 0);
      return acc + groupSum;
    }, 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {showPreview && selectedProject && (
        <ProposalGenerator 
          config={config} 
          project={selectedProject} 
          lang={lang} 
          onClose={() => setShowPreview(false)} 
        />
      )}

      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-900 shadow-xl flex items-center justify-center bg-slate-50 relative group">
                {selectedProject?.customLogo ? (
                  <img src={selectedProject.customLogo} className="w-full h-full object-cover" alt="Custom Logo" />
                ) : config.appIcon.length > 2 ? (
                  <img src={config.appIcon} className="w-full h-full object-cover opacity-50" alt="App Icon" />
                ) : (
                  <span className="text-3xl font-black opacity-50">{config.appIcon}</span>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
            </div>
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Quotation Designer</h1>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em]">Refine Branding & Logic Node</p>
            </div>
        </div>
        <div className="flex gap-4">
          <select 
            value={selectedProjectId}
            onChange={(e) => handleProjectSelect(e.target.value)}
            className="px-6 py-3 bg-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-slate-900/10 transition-all"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button 
            onClick={saveToArchive}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Commit Design
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 border-b pb-4">Identity & Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quote Official #</label>
                <input 
                  type="text" 
                  value={selectedProject?.proposalId || ''} 
                  onChange={(e) => updateField('proposalId', e.target.value)}
                  className="w-full px-5 py-3 text-xs font-black rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 outline-none transition" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validity Limit</label>
                <input 
                  type="text" 
                  value={selectedProject?.validUntil || ''} 
                  onChange={(e) => updateField('validUntil', e.target.value)}
                  className="w-full px-5 py-3 text-xs font-black rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 outline-none transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client Recipient</label>
                <input 
                  type="text" 
                  value={selectedProject?.clientName || ''} 
                  onChange={(e) => updateField('clientName', e.target.value)}
                  className="w-full px-5 py-3 text-xs font-black rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 outline-none transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Accent</label>
                <input 
                  type="color" 
                  value={selectedProject?.primaryColor || '#34548a'} 
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="w-full h-11 p-0 rounded-xl bg-transparent border-none cursor-pointer"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600">Line-Item Adjuster</h3>
              <p className="text-[8px] font-black text-slate-400 uppercase">Direct modification of quantity & assets</p>
            </div>
            
            <div className="space-y-10">
              {selectedProject?.groups.map(group => (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: group.headerColor || '#000' }}></div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">{group.name}</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {group.items.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 group/item">
                        <div className="col-span-5 flex items-center gap-3">
                           {item.imageRef ? (
                             <img src={item.imageRef} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm" alt="Line Item" />
                           ) : (
                             <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             </div>
                           )}
                           <input 
                            className="w-full bg-transparent border-none p-0 text-[10px] font-black uppercase outline-none focus:ring-0 text-slate-800"
                            value={item.name}
                            onChange={(e) => updateLineItem(group.id, item.id, { name: e.target.value })}
                           />
                        </div>
                        <div className="col-span-2">
                           <div className="flex flex-col">
                             <label className="text-[7px] font-black text-slate-400 uppercase mb-0.5">QTY</label>
                             <input 
                              type="number"
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-black outline-none focus:border-slate-900 text-center"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(group.id, item.id, { quantity: +e.target.value })}
                             />
                           </div>
                        </div>
                        <div className="col-span-3">
                           <div className="flex flex-col">
                             <label className="text-[7px] font-black text-slate-400 uppercase mb-0.5">UNIT (EGP)</label>
                             <input 
                              type="number"
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-black outline-none focus:border-slate-900 text-right"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(group.id, item.id, { unitPrice: +e.target.value })}
                             />
                           </div>
                        </div>
                        <div className="col-span-2 text-right">
                           <button 
                            onClick={() => removeLineItem(group.id, item.id)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            
            <div className="space-y-8 relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Layout Strategy</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">PDF Optimization</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">Fit inventory to one page</p>
                   </div>
                   <button 
                    onClick={() => updateField('fitToPage', !selectedProject?.fitToPage)}
                    className={"w-12 h-6 rounded-full transition-all relative " + (selectedProject?.fitToPage ? 'bg-emerald-500' : 'bg-slate-700')}
                   >
                     <div className={"absolute top-1 w-4 h-4 rounded-full bg-white transition-all " + (selectedProject?.fitToPage ? 'right-1' : 'left-1')}></div>
                   </button>
                </div>

                <div className="space-y-2 px-1">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Document Scaling</label>
                      <span className="text-xs font-black">{selectedProject?.scalePercent || 100}%</span>
                   </div>
                   <input 
                    type="range" min="30" max="150" step="5"
                    value={selectedProject?.scalePercent || 100}
                    onChange={(e) => updateField('scalePercent', parseInt(e.target.value))}
                    className="w-full accent-white h-1.5 bg-slate-700 rounded-full appearance-none"
                   />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Payment Logic</label>
                  <textarea 
                    value={selectedProject?.paymentTerms || ''} 
                    onChange={(e) => updateField('paymentTerms', e.target.value)}
                    className="w-full px-5 py-3 text-[10px] font-bold rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-blue-500 transition h-24 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">T&C Exceptions</label>
                  <textarea 
                    value={selectedProject?.notes || ''} 
                    onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full px-5 py-3 text-[10px] font-bold rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-emerald-500 transition h-32 resize-none"
                  />
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10">
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document Value</span>
                    <span className="text-3xl font-black tracking-tighter">
                        {Math.round(calculateDocumentValue()).toLocaleString()} <span className="text-xs opacity-40">EGP</span>
                    </span>
                 </div>
                 
                 <button 
                  onClick={() => setShowPreview(true)}
                  className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  Launch Official Preview
                </button>
              </div>
            </div>
          </section>

          <div className="p-8 rounded-[3rem] bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-center">
             <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Design State</p>
                <div className="flex items-center gap-2 justify-center">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-xs font-black uppercase tracking-tight text-slate-900">Workspace Real-time Sync</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDesigner;
