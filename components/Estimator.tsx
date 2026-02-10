
import React, { useState, useMemo, useEffect } from 'react';
import { SEED_MATERIALS, SEED_TRANSPORT } from '../constants';
import { Material, LineItem, Template, AppConfig, Language, ProjectType, ProjectGroup } from '../types';
import { useTranslation } from '../i18n';
import { suggestMaterials } from '../services/geminiService';
import ProposalGenerator from './ProposalGenerator';

const CATEGORY_COLORS: Record<string, string> = {
  'Wood': '#92400e',
  'Finishing': '#065f46',
  'Printing': '#1e40af',
  'Metal': '#334155',
  'Lighting': '#ea580c',
  'Tools': '#be123c',
  'Custom': '#4338ca',
  'AI Recommendation': '#0891b2'
};

const SECTION_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#475569'
];

const getRandomSectionColor = () => SECTION_COLORS[Math.floor(Math.random() * SECTION_COLORS.length)];

interface EstimatorProps {
  config: AppConfig;
  initialProject?: Template | null;
  lang: Language;
}

const Estimator: React.FC<EstimatorProps> = ({ config, initialProject, lang }) => {
  const [projectType, setProjectType] = useState<ProjectType>(initialProject?.projectType || 'single');
  const [dimensions, setDimensions] = useState(initialProject?.dimensions || { l: 3, w: 3, h: 2.5 });
  const [clientName, setClientName] = useState(initialProject?.clientName || '');
  const [projectName, setProjectName] = useState(initialProject?.name || '');
  const [projectDate, setProjectDate] = useState<string>(initialProject?.proposalDate || new Date().toISOString().split('T')[0]);
  const [groups, setGroups] = useState<ProjectGroup[]>(initialProject?.groups || [{ id: 'default', name: 'Main Module', items: [], imageRefs: [], headerColor: SECTION_COLORS[0] }]);
  const [materialsLibrary, setMaterialsLibrary] = useState<Material[]>(SEED_MATERIALS);
  const [selectedTransport, setSelectedTransport] = useState<string>(initialProject?.selectedTransport || 't1');
  const [currentId, setCurrentId] = useState<string | null>(initialProject?.id || null);
  const [showProposal, setShowProposal] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);
  const [selectorGroupId, setSelectorGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stagedMaterials, setStagedMaterials] = useState<Set<string>>(new Set());
  const [workspaceScale, setWorkspaceScale] = useState(3);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const t = useTranslation(lang);
  const isUpdateMode = !!currentId;

  const resetEstimator = () => {
    if (!window.confirm(lang === 'ar' ? "هل أنت متأكد من مسح البيانات؟" : "Are you sure you want to clear all data?")) return;
    setDimensions({ l: 3, w: 3, h: 2.5 });
    setClientName('');
    setProjectName('');
    setProjectDate(new Date().toISOString().split('T')[0]);
    setGroups([{ 
      id: 'default', 
      name: lang === 'ar' ? 'الوحدة الرئيسية' : 'Main Module', 
      items: [], 
      imageRefs: [], 
      headerColor: SECTION_COLORS[0] 
    }]);
    setSelectedTransport('t1');
    setCurrentId(null);
    localStorage.removeItem('exhibiprice_current_draft');
  };

  useEffect(() => {
    const savedMaterials = localStorage.getItem('exhibiprice_library_materials');
    if (savedMaterials) setMaterialsLibrary(JSON.parse(savedMaterials) as Material[]);

    if (!initialProject) {
      const savedDraft = localStorage.getItem('exhibiprice_current_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setProjectType(draft.projectType || 'single');
          setDimensions(draft.dimensions || { l: 3, w: 3, h: 2.5 });
          setClientName(draft.clientName || '');
          setProjectName(draft.name || '');
          setProjectDate(draft.proposalDate || new Date().toISOString().split('T')[0]);
          setGroups(draft.groups || [{ id: 'default', name: 'Main Module', items: [], imageRefs: [], headerColor: SECTION_COLORS[0] }]);
          setSelectedTransport(draft.selectedTransport || 't1');
        } catch (e) {
          console.error("Failed to load draft");
        }
      }
    }
  }, [initialProject]);

  useEffect(() => {
    if (!currentId) {
      const draft = {
        projectType, dimensions, clientName, name: projectName, proposalDate: projectDate, groups, selectedTransport
      };
      localStorage.setItem('exhibiprice_current_draft', JSON.stringify(draft));
    }
  }, [projectType, dimensions, clientName, projectName, projectDate, groups, selectedTransport, currentId]);

  const handleSaveDraft = () => {
    const draft = {
      projectType,
      dimensions,
      clientName,
      name: projectName,
      proposalDate: projectDate,
      groups,
      selectedTransport
    };
    localStorage.setItem('exhibiprice_current_draft', JSON.stringify(draft));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    alert(lang === 'ar' ? "تم حفظ المسودة بنجاح" : "Draft saved successfully as a local work-in-progress.");
  };

  const addGroup = () => {
    const newId = 'g' + Date.now();
    const newGroup: ProjectGroup = {
      id: newId,
      name: lang === 'ar' ? `وحدة جديدة ${groups.length + 1}` : `New Component ${groups.length + 1}`,
      items: [],
      imageRefs: [],
      headerColor: getRandomSectionColor()
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    if (groups.length === 1) return;
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const updateGroupName = (groupId: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g));
  };

  const updateGroupColor = (groupId: string, color: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, headerColor: color } : g));
  };

  const addItemToGroup = (mat: Material | Partial<LineItem>, groupId: string) => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      materialId: (mat as Material).id || 'custom',
      name: mat.name || 'Custom Item',
      quantity: (mat as Partial<LineItem>).quantity || 1,
      unit: mat.unit || 'pcs',
      unitPrice: (mat as Material).price || 0,
      total: ((mat as Material).price || 0) * (1 + ((mat as Material).wasteFactor || 0)),
      category: (mat as Material).category || 'Custom',
      imageRef: (mat as LineItem).imageRef
    };
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, items: [...g.items, newItem] } : g));
  };

  const addMultipleItemsToGroup = () => {
    if (!selectorGroupId) return;
    const selected = materialsLibrary.filter(m => stagedMaterials.has(m.id));
    
    setGroups(prev => prev.map(g => {
      if (g.id === selectorGroupId) {
        const newItems = selected.map(mat => ({
          id: Math.random().toString(36).substr(2, 9),
          materialId: mat.id,
          name: mat.name,
          quantity: 1,
          unit: mat.unit,
          unitPrice: mat.price,
          total: mat.price * (1 + mat.wasteFactor),
          category: mat.category
        }));
        return { ...g, items: [...g.items, ...newItems] };
      }
      return g;
    }));
    
    setSelectorGroupId(null);
    setStagedMaterials(new Set());
    setSearchQuery('');
  };

  const removeItemFromGroup = (groupId: string, itemId: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, items: g.items.filter(i => i.id !== itemId) } : g));
  };

  const updateItemQty = (groupId: string, itemId: string, qty: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map(it => {
            if (it.id === itemId) {
              const mat = materialsLibrary.find(m => m.id === it.materialId);
              const waste = mat ? mat.wasteFactor : 0;
              const newQty = Math.max(0, qty);
              return { ...it, quantity: newQty, total: newQty * it.unitPrice * (1 + waste) };
            }
            return it;
          })
        };
      }
      return g;
    }));
  };

  const updateItemPrice = (groupId: string, itemId: string, price: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map(it => {
            if (it.id === itemId) {
              const mat = materialsLibrary.find(m => m.id === it.materialId);
              const waste = mat ? mat.wasteFactor : 0;
              const newPrice = Math.max(0, price);
              return { ...it, unitPrice: newPrice, total: it.quantity * newPrice * (1 + waste) };
            }
            return it;
          })
        };
      }
      return g;
    }));
  };

  const updateItemName = (groupId: string, itemId: string, name: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map(it => (it.id === itemId ? { ...it, name } : it))
        };
      }
      return g;
    }));
  };

  const handleLineItemImage = (groupId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setGroups(prev => prev.map(g => {
              if (g.id === groupId) {
                if (itemId === 'temp') {
                  const currentRefs = g.imageRefs || [];
                  return { ...g, imageRefs: [...currentRefs, reader.result as string] };
                } else {
                  return {
                    ...g,
                    items: g.items.map(it => it.id === itemId ? { ...it, imageRef: reader.result as string } : it)
                  };
                }
              }
              return g;
            }));
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeGroupImage = (groupId: string, index: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const newRefs = [...(g.imageRefs || [])];
        newRefs.splice(index, 1);
        return { ...g, imageRefs: newRefs };
      }
      return g;
    }));
  };

  const materialSubtotal = useMemo(() => {
    return groups.reduce((acc, group) => acc + group.items.reduce((a, c) => a + c.total, 0), 0);
  }, [groups]);

  const transportSubtotal = useMemo(() => {
    const transportRule = SEED_TRANSPORT.find(tr => tr.id === selectedTransport);
    return transportRule ? transportRule.basePrice + transportRule.loadingFee : 0;
  }, [selectedTransport]);

  const directCosts = materialSubtotal + transportSubtotal;
  const overheadAmt = directCosts * config.DEFAULT_OVERHEAD;
  const profitAmt = (directCosts + overheadAmt) * config.DEFAULT_MARKUP;
  const grandTotal = (directCosts + overheadAmt + profitAmt) * (1 + config.VAT_RATE);

  const chartData = [
    { name: 'Assets', value: Math.round(materialSubtotal), color: '#2563eb' },
    { name: 'Logistics', value: Math.round(transportSubtotal), color: '#f59e0b' },
    { name: 'Overhead', value: Math.round(overheadAmt), color: '#dc2626' },
    { name: 'Profit', value: Math.round(profitAmt), color: '#10b981' }
  ];

  const saveTemplate = () => {
    const finalProjectName = projectName || 'Unnamed Project';
    const projectId = currentId || Date.now().toString();
    const newTemplate: Template = {
      id: projectId,
      name: finalProjectName,
      clientName: clientName,
      projectType,
      dimensions,
      groups,
      laborDays: 0,
      accommodationPerDay: 0,
      selectedTransport,
      markup: config.DEFAULT_MARKUP,
      overhead: config.DEFAULT_OVERHEAD,
      proposalId: initialProject?.proposalId,
      proposalDate: projectDate,
      paymentTerms: config.defaultPaymentTerms,
      validityPeriod: config.defaultValidityPeriod,
      notes: config.defaultTerms,
      primaryColor: initialProject?.primaryColor,
      customLogo: initialProject?.customLogo,
      fitToPage: initialProject?.fitToPage,
      scalePercent: initialProject?.scalePercent
    };
    
    const currentSaved = JSON.parse(localStorage.getItem('exhibiprice_templates') || '[]') as Template[];
    const updated = currentId 
      ? currentSaved.map((t: Template) => t.id === currentId ? newTemplate : t) 
      : [...currentSaved, newTemplate];
    
    localStorage.setItem('exhibiprice_templates', JSON.stringify(updated));
    localStorage.removeItem('exhibiprice_current_draft');
    setCurrentId(projectId);
    setProjectName(finalProjectName);
    setShowSaveModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleAISuggest = async (groupId: string) => {
    if (isSuggesting) return;
    setIsSuggesting(groupId);
    try {
      const suggestions = await suggestMaterials(dimensions, "Exhibition Booth");
      if (Array.isArray(suggestions)) {
        (suggestions as any[]).forEach((s: any) => {
          addItemToGroup({
            name: s.name,
            quantity: s.quantity,
            unit: s.unit,
            category: 'AI Recommendation',
            price: 0
          }, groupId);
        });
      }
    } catch (err) {
      console.error("AI suggestion failed", err);
    } finally {
      setIsSuggesting(null);
    }
  };

  const categorizedMaterials = useMemo<Record<string, Material[]>>(() => {
    const filtered = materialsLibrary.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const groupsMap: Record<string, Material[]> = {};
    filtered.forEach(m => {
      if (!groupsMap[m.category]) groupsMap[m.category] = [];
      groupsMap[m.category].push(m);
    });
    return groupsMap;
  }, [materialsLibrary, searchQuery]);

  const toggleStageMaterial = (id: string) => {
    const next = new Set(stagedMaterials);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setStagedMaterials(next);
  };

  const ws = {
    columns: workspaceScale === 1 ? 'columns-1 md:columns-3 xl:columns-4' : 
             workspaceScale === 2 ? 'columns-1 md:columns-2 xl:columns-3' : 
             workspaceScale === 3 ? 'columns-1 lg:columns-2' : 'columns-1',
    gap: workspaceScale === 1 ? 'gap-3' : workspaceScale === 2 ? 'gap-4' : workspaceScale === 3 ? 'gap-6' : 'gap-8',
    groupPad: workspaceScale === 1 ? 'p-2' : workspaceScale === 2 ? 'p-3' : workspaceScale === 3 ? 'p-4' : 'p-6',
    itemPad: workspaceScale === 1 ? 'py-0.5 px-1.5' : workspaceScale === 2 ? 'py-1 px-2' : workspaceScale === 3 ? 'py-2 px-3' : 'py-3 px-4',
    itemFont: workspaceScale === 1 ? 'text-[7px]' : workspaceScale === 2 ? 'text-[8px]' : workspaceScale === 3 ? 'text-[10px]' : 'text-[11px]',
    headerFont: workspaceScale === 1 ? 'text-[8px]' : workspaceScale === 2 ? 'text-[9px]' : workspaceScale === 3 ? 'text-[11px]' : 'text-[12px]',
    inputPad: workspaceScale === 1 ? 'py-0.5 px-1' : workspaceScale === 2 ? 'py-1 px-1.5' : workspaceScale === 3 ? 'py-1.5 px-2' : 'py-2 px-3',
    margin: workspaceScale === 1 ? 'mb-2' : workspaceScale === 2 ? 'mb-3' : workspaceScale === 3 ? 'mb-4' : 'mb-6',
    btnFont: workspaceScale === 1 ? 'text-[7px]' : workspaceScale === 2 ? 'text-[8px]' : workspaceScale === 3 ? 'text-[9px]' : 'text-[10px]',
    btnPad: workspaceScale === 1 ? 'py-1.5 px-2' : workspaceScale === 2 ? 'py-2 px-3' : workspaceScale === 3 ? 'py-3 px-4' : 'py-3 px-5',
    iconSize: workspaceScale === 1 ? 'w-3 h-3' : workspaceScale === 2 ? 'w-3.5 h-3.5' : 'w-4 h-4',
    thumbnail: workspaceScale === 1 ? 'w-8 h-8' : workspaceScale === 2 ? 'w-12 h-12' : workspaceScale === 3 ? 'w-16 h-16' : 'w-20 h-20'
  };

  const currentProjectTemplate: Template = {
    id: currentId || 'temp',
    name: projectName || 'Draft Project',
    clientName,
    projectType,
    dimensions,
    groups,
    laborDays: 0,
    accommodationPerDay: 0,
    selectedTransport,
    markup: config.DEFAULT_MARKUP,
    overhead: config.DEFAULT_OVERHEAD,
    proposalId: initialProject?.proposalId,
    proposalDate: projectDate,
    paymentTerms: config.defaultPaymentTerms,
    validityPeriod: config.defaultValidityPeriod,
    notes: config.defaultTerms,
    primaryColor: initialProject?.primaryColor,
    customLogo: initialProject?.customLogo,
    fitToPage: initialProject?.fitToPage,
    scalePercent: initialProject?.scalePercent
  };

  const masonryClasses = projectType === 'bundle' ? (ws.columns + ' ' + ws.gap) : 'grid grid-cols-1 space-y-6';

  return (
    <div className="relative animate-in fade-in duration-300">
      {showProposal && (
        <ProposalGenerator config={config} project={currentProjectTemplate} lang={lang} onClose={() => setShowProposal(false)} />
      )}

      {selectorGroupId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[700] flex items-center justify-center p-4 no-print">
          <div className="bg-[var(--surface)] w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-muted)]">
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-main)] main-text-style">Asset Catalog</h2>
                   <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 secondary-text-style">Select items for {groups.find(g => g.id === selectorGroupId)?.name}</p>
                </div>
                <div className="flex gap-4">
                   <div className="relative">
                      <input 
                        type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="SEARCH..." 
                        className="px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-[var(--accent)] w-64"
                      />
                   </div>
                   <button onClick={() => {setSelectorGroupId(null); setStagedMaterials(new Set());}} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="space-y-10">
                   {(Object.entries(categorizedMaterials) as [string, Material[]][]).map(([cat, items]) => (
                     <div key={cat} className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#000' }}></div>
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] secondary-text-style">{cat}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                           {items.map(m => (
                             <button 
                                key={m.id} onClick={() => toggleStageMaterial(m.id)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all group flex justify-between items-center ${stagedMaterials.has(m.id) ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg scale-[1.02]' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]'}`}
                             >
                                <div>
                                   <p className="text-[11px] font-black uppercase tracking-tight">{m.name}</p>
                                   <p className={`text-[9px] font-bold uppercase mt-1 ${stagedMaterials.has(m.id) ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{m.price} EGP / {m.unit}</p>
                                </div>
                                {stagedMaterials.has(m.id) && (
                                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                                     <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                )}
                             </button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="p-8 border-t border-[var(--border)] flex justify-between items-center bg-[var(--surface-muted)]">
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest">{stagedMaterials.size} Assets Staged</p>
                <div className="flex gap-4">
                   <button onClick={() => {setSelectorGroupId(null); setStagedMaterials(new Set());}} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cancel</button>
                   <button 
                    onClick={addMultipleItemsToGroup} disabled={stagedMaterials.size === 0}
                    className="px-10 py-3 bg-[var(--accent)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 disabled:opacity-30 disabled:shadow-none hover:scale-105 active:scale-95 transition-all main-text-style"
                   >
                     Inject To Workspace
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pb-16 items-start no-print">
        <div className="lg:col-span-3">
          <div className={`bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm space-y-6 ${ws.margin}`}>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-1.5 p-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)]">
                   <button onClick={() => setProjectType('single')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all secondary-text-style ${projectType === 'single' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)]'}`}>Single Unit</button>
                   <button onClick={() => setProjectType('bundle')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all secondary-text-style ${projectType === 'bundle' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)]'}`}>Complex Bundle</button>
                </div>
                <div className="flex gap-2">
                   <button onClick={resetEstimator} className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-muted)] transition secondary-text-style">Clear</button>
                   <button onClick={handleSaveDraft} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 px-4 py-2 rounded-lg border border-emerald-100 hover:bg-emerald-50 transition secondary-text-style">Save as Draft</button>
                   <button onClick={() => setShowSaveModal(true)} className="text-[9px] font-black uppercase tracking-widest bg-[var(--accent)] text-white px-6 py-2 rounded-lg shadow-md hover:brightness-110 transition main-text-style">
                     {isUpdateMode ? 'Update Project' : 'Save Project'}
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest secondary-text-style">Client Name</label>
                      <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="..." className="w-full px-4 py-2 text-xs font-black rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-[var(--text-main)]" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest secondary-text-style">Project ID</label>
                      <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="..." className="w-full px-4 py-2 text-xs font-black rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-[var(--text-main)]" />
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                   <div className="md:col-span-2 grid grid-cols-3 gap-2">
                     {['L', 'W', 'H'].map((d, i) => (
                        <div key={d}>
                           <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-0.5 secondary-text-style">{d} (m)</label>
                           <input type="number" value={Object.values(dimensions)[i]} onChange={e => setDimensions({...dimensions, [d.toLowerCase()]: +e.target.value})} className="w-full px-4 py-2 text-xs font-black rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] outline-none text-[var(--text-main)]" />
                        </div>
                     ))}
                   </div>
                   <div>
                      <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-0.5 secondary-text-style">Proposal Date</label>
                      <input type="date" value={projectDate} onChange={e => setProjectDate(e.target.value)} className="w-full px-4 py-2 text-xs font-black rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] outline-none text-[var(--text-main)]" />
                   </div>
                </div>
             </div>
          </div>
          
          <div className={`transition-all duration-500 ${masonryClasses}`}>
            {groups.map((group) => {
              const sectionColor = group.headerColor || SECTION_COLORS[0];

              return (
                <div 
                  key={group.id} 
                  className="bg-[var(--surface)] rounded-[1.5rem] border-2 shadow-sm overflow-hidden animate-in fade-in h-fit transition-all hover:shadow-lg mb-4 break-inside-avoid" 
                  style={{ borderColor: sectionColor }}
                >
                  <div className="px-4 py-2 border-b flex justify-between items-center" style={{ backgroundColor: sectionColor + '15', borderBottomColor: sectionColor }}>
                     <div className="flex items-center gap-2 flex-1">
                        <div className="relative group/cp shadow-sm">
                           <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: sectionColor }}></div>
                           <input
                              type="color"
                              value={sectionColor}
                              onChange={(e) => updateGroupColor(group.id, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                           />
                        </div>
                        <input 
                          className={ws.headerFont + " font-black uppercase tracking-tight bg-transparent border-none focus:ring-0 w-full outline-none text-[var(--text-main)] main-text-style"}
                          value={group.name}
                          onChange={(e) => updateGroupName(group.id, e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-1.5">
                        <button onClick={() => handleAISuggest(group.id)} disabled={!!isSuggesting} className="p-1.5 bg-[var(--surface)] text-[var(--accent)] rounded-lg shadow-sm border border-[var(--border)] transition hover:scale-105 active:scale-95">
                           {isSuggesting === group.id ? <svg className={ws.iconSize + " animate-spin"} viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : <svg className={ws.iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        </button>
                        {projectType === 'bundle' && (
                          <button onClick={() => removeGroup(group.id)} className="text-red-500 p-1.5 bg-[var(--surface)] rounded-lg shadow-sm border border-[var(--border)] transition hover:bg-red-50 active:scale-95">
                             <svg className={ws.iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                     </div>
                  </div>
                  
                  <div className={ws.groupPad} style={{ backgroundColor: sectionColor + '05' }}>
                     <div className="space-y-1 overflow-x-auto scrollbar-hide">
                        <div className="grid grid-cols-12 gap-1 px-2 py-1 text-[7px] font-black uppercase text-[var(--text-muted)] border-b border-[var(--border)] mb-1 secondary-text-style">
                           <div className="col-span-5">Spec</div>
                           <div className="col-span-2 text-center">Qty</div>
                           <div className="col-span-3 text-right">Rate</div>
                           <div className="col-span-2 text-right">Total</div>
                        </div>

                        <div className="space-y-1">
                          {group.items.map(item => {
                            const catColor = CATEGORY_COLORS[item.category] || '#6366f1';
                            return (
                              <div key={item.id} className={"grid grid-cols-12 gap-1.5 items-center " + ws.itemPad + " rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group/row shadow-sm"}>
                                <div className="col-span-5 flex items-center gap-1.5">
                                  <div className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: catColor }}></div>
                                  <input 
                                    className={"font-black text-[var(--text-main)] uppercase truncate w-full bg-transparent border-none p-0 focus:ring-0 outline-none " + ws.itemFont + " main-text-style"}
                                    value={item.name}
                                    onChange={(e) => updateItemName(group.id, item.id, e.target.value)}
                                  />
                                </div>
                                <div className="col-span-2">
                                   <input type="number" value={item.quantity} onChange={e => updateItemQty(group.id, item.id, +e.target.value)} className={"w-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-main)] rounded-md " + ws.inputPad + " text-center font-black outline-none focus:border-[var(--accent)] " + ws.itemFont} />
                                </div>
                                <div className="col-span-3">
                                   <input type="number" value={item.unitPrice} onChange={e => updateItemPrice(group.id, item.id, +e.target.value)} className={"w-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-main)] rounded-md " + ws.inputPad + " text-right font-black outline-none focus:border-[var(--accent)] " + ws.itemFont} />
                                </div>
                                <div className="col-span-2 text-right flex items-center justify-end gap-1">
                                   <p className={"font-black text-[var(--text-main)] " + ws.itemFont}>{Math.round(item.total).toLocaleString()}</p>
                                   <button onClick={() => removeItemFromGroup(group.id, item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition p-0.5">
                                     <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                     </div>

                     <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
                       <div className="flex gap-1.5">
                          <button onClick={() => setSelectorGroupId(group.id)} className={"flex-1 " + ws.btnPad + " rounded-xl border border-dashed border-[var(--border)] " + ws.btnFont + " font-black text-[var(--text-muted)] uppercase tracking-widest hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all flex items-center justify-center gap-1.5 bg-[var(--surface)] secondary-text-style"}>
                            <svg className={ws.iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            Catalog
                          </button>
                          <button onClick={() => addItemToGroup({ name: 'Custom Item', category: 'Custom', unit: 'pcs', price: 0 }, group.id)} className={ws.btnPad + " rounded-xl border border-[var(--border)] " + ws.btnFont + " font-black text-[var(--text-muted)] uppercase tracking-widest hover:bg-[var(--surface)] bg-[var(--surface-muted)] secondary-text-style"}>
                            + Custom
                          </button>
                       </div>

                       <div className="pt-2 border-t border-[var(--border)]">
                          <div className="flex justify-between items-center mb-1.5">
                             <h4 className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest main-text-style">Visual Assets</h4>
                             <label className="text-[7px] font-black text-[var(--accent)] hover:underline cursor-pointer uppercase tracking-widest secondary-text-style">
                                + Add
                                <input type="file" multiple accept="image/*" onChange={(e) => handleLineItemImage(group.id, 'temp', e)} className="hidden" />
                             </label>
                          </div>
                          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                            {group.imageRefs?.map((img, idx) => (
                              <div key={idx} className={"relative group/img shrink-0 " + ws.thumbnail + " rounded-lg overflow-hidden border border-[var(--border)] bg-white"}>
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => removeGroupImage(group.id, idx)}
                                  className="absolute inset-0 bg-red-600/60 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all"
                                >
                                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                       </div>
                     </div>
                  </div>
                </div>
              );
            })}

            {projectType === 'bundle' && (
              <button 
                onClick={addGroup} 
                className="rounded-[1.5rem] border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:bg-white hover:text-[var(--accent)] transition-all flex flex-col items-center justify-center gap-2 py-12 group bg-[var(--surface)]/50 min-h-[200px] mb-4 break-inside-avoid w-full"
              >
                 <div className="w-10 h-10 rounded-full bg-[var(--surface)] border-2 border-dashed border-[var(--border)] flex items-center justify-center group-hover:scale-110 group-hover:border-[var(--accent)] transition-all shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] main-text-style">Add Module Component</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 no-print">
           <div className="sticky top-20 space-y-4">
              <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-white/5 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                 <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 pb-2 border-b border-white/5 main-text-style">Quotation Summary</h2>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-slate-500 uppercase tracking-widest main-text-style">Materials</span>
                      <span>{Math.round(materialSubtotal).toLocaleString()} <span className="text-[8px] opacity-40 uppercase">EGP</span></span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-slate-500 uppercase tracking-widest main-text-style">Logistics</span>
                      <span>{Math.round(transportSubtotal).toLocaleString()} <span className="text-[8px] opacity-40 uppercase">EGP</span></span>
                    </div>
                    <div className="pt-6 border-t border-white/5 space-y-2">
                       <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] main-text-style">Total Quote</p>
                       <p className="text-4xl font-black tracking-tighter leading-none truncate">{Math.round(grandTotal).toLocaleString()}</p>
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest main-text-style">VAT Inclusive (14%)</p>
                    </div>
                 </div>
                 <div className="mt-8 space-y-3">
                    <button onClick={() => setShowSaveModal(true)} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all main-text-style">
                      {isUpdateMode ? 'Update Record' : 'Commit To Archive'}
                    </button>
                    <button onClick={() => setShowProposal(true)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all main-text-style">Official Proposal</button>
                 </div>
              </div>

              <div className="bg-[var(--surface)] p-6 rounded-[2rem] border-2 shadow-sm border-[var(--border)]">
                 <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-6 text-center border-b pb-2 main-text-style">Asset Allocation</h3>
                 <div className="space-y-5">
                   {chartData.map((item, idx) => {
                     const percentage = grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
                     return (
                       <div key={idx} className="space-y-2">
                         <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] main-text-style">{item.name}</span>
                           <span className="text-[10px] font-black text-[var(--text-main)]">{Math.round(percentage)}%</span>
                         </div>
                         <div className="h-2 w-full bg-[var(--surface-muted)] rounded-full overflow-hidden border border-[var(--border)]">
                           <div className="h-full transition-all duration-1000 ease-out rounded-full shadow-inner" style={{ width: percentage + '%', backgroundColor: item.color }}></div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-[600] flex items-center gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl no-print">
         <button onClick={() => setWorkspaceScale(prev => Math.max(1, prev - 1))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg>
         </button>
         <div className="px-3 flex flex-col items-center">
            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest secondary-text-style">Density</span>
            <span className="text-[11px] font-black text-white">L{workspaceScale}</span>
         </div>
         <button onClick={() => setWorkspaceScale(prev => Math.min(5, prev + 1))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
         </button>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex items-center justify-center p-6 no-print">
          <div className="bg-[var(--surface)] w-full max-w-[320px] p-8 rounded-[2rem] shadow-2xl border-2 border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-2 main-text-style">{isUpdateMode ? 'Update Archive' : 'Commit To Archive'}</h2>
            <p className="text-[9px] text-[var(--text-muted)] font-black mb-6 uppercase tracking-[0.2em] secondary-text-style">Recording project state for {projectName || 'New Project'}</p>
            <div className="flex flex-col gap-3">
              <button onClick={saveTemplate} className="w-full py-4 bg-[var(--accent)] text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all main-text-style">{isUpdateMode ? 'Confirm Update' : 'Initialize Record'}</button>
              <button onClick={() => setShowSaveModal(false)} className="w-full py-4 text-[var(--text-muted)] text-[10px] font-black uppercase border border-[var(--border)] rounded-xl transition-all main-text-style">Cancel Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estimator;
