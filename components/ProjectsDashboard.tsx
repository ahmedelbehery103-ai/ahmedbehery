
import React, { useState, useEffect } from 'react';
import { Template, Language, AppConfig } from '../types';
import { useTranslation } from '../i18n';
import ProposalGenerator from './ProposalGenerator';

interface Props {
  onLoadProject: (project: Template) => void;
  onNewProject: (template?: Template) => void;
  lang: Language;
  config: AppConfig;
}

const ProjectsDashboard: React.FC<Props> = ({ onLoadProject, onNewProject, lang, config }) => {
  const [projects, setProjects] = useState<Template[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [viewingProposal, setViewingProposal] = useState<Template | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [workspaceScale, setWorkspaceScale] = useState(3);
  const t = useTranslation(lang);

  useEffect(() => {
    const savedProjects = localStorage.getItem('exhibiprice_templates');
    if (savedProjects) setProjects(JSON.parse(savedProjects));

    const savedTemplates = localStorage.getItem('exhibiprice_saved_templates');
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
  }, []);

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(lang === 'ar' ? "حذف هذا المشروع نهائياً؟" : "Permanently delete this project?")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem('exhibiprice_templates', JSON.stringify(updated));
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(lang === 'ar' ? "حذف هذا القالب؟" : "Delete this template?")) return;
    const updated = templates.filter(p => p.id !== id);
    setTemplates(updated);
    localStorage.setItem('exhibiprice_saved_templates', JSON.stringify(updated));
  };

  const handleSaveAsTemplate = (project: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTemplate = { ...project, id: `tpl-${Date.now()}` };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('exhibiprice_saved_templates', JSON.stringify(updated));
    alert(lang === 'ar' ? "تم الحفظ كقالب في المكتبة!" : "Saved as template in library!");
  };

  const handleProposalPreview = (project: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingProposal(project);
  };

  const getGridCols = () => {
    switch(workspaceScale) {
      case 1: return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
      case 2: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 4: return 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';
      case 5: return 'grid-cols-1';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      {viewingProposal && (
        <ProposalGenerator config={config} project={viewingProposal} lang={lang} onClose={() => setViewingProposal(null)} />
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none main-text-style">
            {lang === 'ar' ? 'سجل المشاريع' : 'Project Ledger'}
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] secondary-text-style">
            {lang === 'ar' ? 'إدارة الأرشيف والتقديرات المالية' : 'Archive Management & Financial Estimates'}
          </p>
        </div>
        <button 
          onClick={() => setShowNewDialog(true)} 
          className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 main-text-style"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
          {t('new_estimate')}
        </button>
      </div>

      {/* Templates Section */}
      {templates.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest main-text-style">{t('my_templates')}</h2>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {templates.map(tpl => (
              <div 
                key={tpl.id} 
                className="min-w-[240px] bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group cursor-pointer hover:bg-black transition-all" 
                onClick={() => onNewProject(tpl)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                   <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                         <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <button onClick={(e) => deleteTemplate(tpl.id, e)} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>
                   <div>
                      <h4 className="text-[12px] font-black uppercase tracking-tight line-clamp-1 main-text-style">{tpl.name}</h4>
                      <p className="text-[8px] font-bold uppercase text-white/30 tracking-widest mt-1 secondary-text-style">{tpl.groups.length} Functional Units</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-slate-100 rounded-[4rem] p-32 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-slate-100">
             <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] mb-10 main-text-style">No projects archived in local storage</p>
          <button onClick={() => setShowNewDialog(true)} className="text-blue-600 font-black text-[12px] uppercase tracking-[0.2em] bg-blue-50 px-12 py-5 rounded-3xl hover:bg-blue-100 transition shadow-xl border-2 border-blue-100 main-text-style">
             Initiate First Quotation
          </button>
        </div>
      ) : (
        <div className={`grid ${getGridCols()} gap-6 transition-all duration-300`}>
          {projects.map(p => {
             const materialTotal = p.groups.reduce((acc, g) => acc + g.items.reduce((a, c) => a + c.total, 0), 0);
             const firstImage = p.groups.find(g => g.imageRefs && g.imageRefs.length > 0)?.imageRefs?.[0];
             
             return (
              <div key={p.id} onClick={() => onLoadProject(p)} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative cursor-pointer overflow-hidden flex flex-col">
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button onClick={(e) => handleProposalPreview(p, e)} className="p-3 bg-blue-600 rounded-2xl text-white hover:bg-blue-700 transition-all shadow-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                    <button onClick={(e) => handleSaveAsTemplate(p, e)} className="p-3 bg-slate-900 rounded-2xl text-white hover:bg-black transition-all shadow-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                    <button onClick={(e) => deleteProject(p.id, e)} className="p-3 bg-white rounded-2xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100 shadow-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>

                <div className="h-48 bg-slate-50 border-b border-slate-50 overflow-hidden relative">
                   {firstImage ? (
                     <img src={firstImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-slate-100/50">
                        <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                   )}
                   <div className="absolute bottom-4 left-4">
                      <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur shadow-lg border border-white">
                         {p.dimensions.l}x{p.dimensions.w}m
                      </div>
                   </div>
                </div>

                <div className="p-8 flex-1 flex flex-col gap-4">
                  <div>
                    <h3 className="text-[14px] font-black text-slate-900 truncate uppercase tracking-tighter main-text-style">{p.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest secondary-text-style truncate mt-1">
                      {p.clientName || 'Confidential Client'}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Value</p>
                        <p className="text-xl font-black text-emerald-600 tracking-tighter">
                          {(materialTotal / 1000).toFixed(1)}k <span className="text-[10px] opacity-40 uppercase">EGP</span>
                        </p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                     </div>
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      )}

      {/* New Project Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 main-text-style">{t('new_estimate')}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1 secondary-text-style">Initialize Workspace Strategy</p>
                </div>
                <button onClick={() => setShowNewDialog(false)} className="w-12 h-12 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <button 
                  onClick={() => { setShowNewDialog(false); onNewProject(); }} 
                  className="group p-12 border-4 border-dashed border-slate-100 rounded-[3rem] hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center text-center gap-8"
                >
                   <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 main-text-style">{t('create_blank')}</h3>
                      <p className="text-[9px] font-bold uppercase text-slate-400 mt-2 secondary-text-style">Start from zero with custom specs</p>
                   </div>
                </button>

                <div className="space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 ml-4 main-text-style">{t('my_templates')}</h3>
                   <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                      {templates.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Library empty</p>
                        </div>
                      ) : (
                        templates.map(tpl => (
                          <button 
                            key={tpl.id} 
                            onClick={() => { setShowNewDialog(false); onNewProject(tpl); }} 
                            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-blue-500 hover:shadow-2xl transition-all text-left flex items-center gap-6 group"
                          >
                             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             </div>
                             <div className="flex-1">
                                <p className="text-[12px] font-black uppercase tracking-tight text-slate-900 main-text-style">{tpl.name}</p>
                                <p className="text-[8px] font-bold uppercase text-slate-400 secondary-text-style">{tpl.groups.length} Production Blocks</p>
                             </div>
                          </button>
                        ))
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Density Floating Controller */}
      <div className="fixed bottom-10 right-10 z-[60] flex items-center gap-3 p-2 bg-slate-900 shadow-2xl rounded-[2rem] border border-white/10 no-print">
         <button 
           onClick={() => setWorkspaceScale(prev => Math.max(1, prev - 1))} 
           className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90"
         >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg>
         </button>
         <div className="px-4 flex flex-col items-center min-w-[60px]">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest secondary-text-style">Grid</span>
            <span className="text-[14px] font-black text-white leading-none mt-1">L{workspaceScale}</span>
         </div>
         <button 
           onClick={() => setWorkspaceScale(prev => Math.min(5, prev + 1))} 
           className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90"
         >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
         </button>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
