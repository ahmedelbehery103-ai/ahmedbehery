
import React, { useState, useEffect, useMemo } from 'react';
import { SEED_MATERIALS } from '../constants';
import { Material, AppConfig } from '../types';

const CATEGORY_THEMES_DEFAULT: Record<string, { base: string; surface: string; content: string; border: string; }> = {
  'Wood': { base: '#92400e', surface: '#fffbeb', content: '#78350f', border: '#fde68a' },
  'Finishing': { base: '#059669', surface: '#f0fdf4', content: '#064e3b', border: '#bbf7d0' },
  'Printing': { base: '#2563eb', surface: '#eff6ff', content: '#172554', border: '#bfdbfe' },
  'Metal': { base: '#475569', surface: '#f8fafc', content: '#0f172a', border: '#e2e8f0' },
  'Lighting': { base: '#d97706', surface: '#fff7ed', content: '#7c2d12', border: '#fed7aa' },
  'Tools': { base: '#dc2626', surface: '#fef2f2', content: '#7f1d1d', border: '#fecaca' },
  'Custom': { base: '#7c3aed', surface: '#f5f3ff', content: '#2e1065', border: '#ddd6fe' },
  'AI Recommendation': { base: '#0891b2', surface: '#ecfeff', content: '#164e63', border: '#a5f3fc' }
};

interface Props {
  config: AppConfig;
  lang: string;
}

const MaterialCatalog: React.FC<Props> = ({ config, lang }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryScales, setCategoryScales] = useState<Record<string, number>>({});
  const [globalScale, setGlobalScale] = useState(3);

  useEffect(() => {
    const savedMaterials = localStorage.getItem('exhibiprice_library_materials');
    const savedCategories = localStorage.getItem('exhibiprice_library_categories');
    const savedColors = localStorage.getItem('exhibiprice_library_category_colors');
    
    const loadedMats = savedMaterials ? JSON.parse(savedMaterials) as Material[] : SEED_MATERIALS;
    const loadedCats = savedCategories ? JSON.parse(savedCategories) as string[] : ['Wood', 'Finishing', 'Printing', 'Metal', 'Lighting'];
    const loadedColors = savedColors ? JSON.parse(savedColors) as Record<string, string> : {};
    
    setMaterials(loadedMats);
    setCategories(loadedCats);
    setCustomColors(loadedColors);
    
    const initialScales: Record<string, number> = {};
    loadedCats.forEach((c: string) => { initialScales[c] = globalScale; });
    setCategoryScales(initialScales);
  }, []);

  const handleGlobalScaleChange = (newScale: number) => {
    const clampedScale = Math.max(1, Math.min(5, newScale));
    setGlobalScale(clampedScale);
    const nextScales: Record<string, number> = {};
    categories.forEach(c => { nextScales[c] = clampedScale; });
    setCategoryScales(nextScales);
  };

  const saveToStorage = (mats: Material[], cats: string[], colors: Record<string, string>) => {
    localStorage.setItem('exhibiprice_library_materials', JSON.stringify(mats));
    localStorage.setItem('exhibiprice_library_categories', JSON.stringify(cats));
    localStorage.setItem('exhibiprice_library_category_colors', JSON.stringify(colors));
  };

  const getTheme = (cat: string) => {
    const customBase = customColors[cat];
    if (customBase) {
      return {
        base: customBase,
        surface: `${customBase}10`,
        content: customBase,
        border: `${customBase}40`
      };
    }
    return CATEGORY_THEMES_DEFAULT[cat] || { base: '#3730a3', surface: '#f5f3ff', content: '#1e1b4b', border: '#ddd6fe' };
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    const updated = materials.map(m => m.id === id ? { ...m, ...updates } : m);
    setMaterials(updated);
    saveToStorage(updated, categories, customColors);
  };

  const deleteMaterial = (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    saveToStorage(updated, categories, customColors);
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (categories.includes(cat)) return;
    const updatedCats = [...categories, cat];
    setCategories(updatedCats);
    setCategoryScales(prev => ({ ...prev, [cat]: globalScale }));
    saveToStorage(materials, updatedCats, customColors);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const deleteCategory = (catName: string) => {
    if (!window.confirm(`Permanently delete category "${catName}"?`)) return;
    const updatedCats = categories.filter(c => c !== catName);
    setCategories(updatedCats);
    saveToStorage(materials, updatedCats, customColors);
  };

  const updateCategoryColor = (cat: string, color: string) => {
    const updatedColors = { ...customColors, [cat]: color };
    setCustomColors(updatedColors);
    saveToStorage(materials, categories, updatedColors);
  };

  const addNewItem = (category: string) => {
    const newId = 'm' + Date.now();
    const newItem: Material = { id: newId, name: 'NEW MASTER ASSET', price: 0, unit: 'pcs', category, wasteFactor: 0.15 };
    const updated = [...materials, newItem];
    setMaterials(updated);
    saveToStorage(updated, categories, customColors);
  };

  const groupedMaterials = useMemo(() => {
    const filtered = materials.filter(m => 
      m.name.toLowerCase().includes(filter.toLowerCase()) || 
      m.category.toLowerCase().includes(filter.toLowerCase())
    );
    return categories.reduce((acc, cat) => {
      acc[cat] = filtered.filter(m => m.category === cat);
      return acc;
    }, {} as Record<string, Material[]>);
  }, [materials, filter, categories]);

  const setScale = (cat: string, direction: 'up' | 'down') => {
    setCategoryScales(prev => {
      const current = prev[cat] || globalScale;
      const next = direction === 'up' ? Math.min(5, current + 1) : Math.max(1, current - 1);
      return { ...prev, [cat]: next };
    });
  };

  const getGridCols = (scale: number, itemCount: number) => {
    if (itemCount > 0 && itemCount < 3 && scale < 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    switch(scale) {
      case 1: return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
      case 2: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5: return 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5';
    }
  };

  const getCardPadding = (scale: number) => {
    if (scale === 1) return 'p-1.5';
    if (scale === 2) return 'p-2';
    if (scale === 3) return 'p-2.5';
    if (scale === 4) return 'p-3.5';
    return 'p-5';
  };

  const getFontSize = (scale: number) => {
    if (scale <= 1) return 'text-[8px]';
    if (scale === 2) return 'text-[9px]';
    if (scale === 3) return 'text-[10px]';
    if (scale === 4) return 'text-[12px]';
    return 'text-[14px]';
  };

  const getIconSize = (scale: number) => {
    if (scale <= 2) return 'w-2.5 h-2.5';
    if (scale === 3) return 'w-3 h-3';
    return 'w-4 h-4';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Production Catalog</h1>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Enterprise Asset Repository</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" placeholder="Search Assets..." 
            value={filter} onChange={(e) => setFilter(e.target.value)}
            className="flex-1 md:w-64 px-4 py-2 text-[9px] border-2 border-slate-100 bg-white rounded-lg outline-none font-black uppercase focus:border-slate-900 transition-all"
          />
          <button 
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
          >
            + Create Category
          </button>
        </div>
      </div>

      {showAddCategory && (
        <div className="bg-white p-4 rounded-2xl border border-slate-900 shadow-xl animate-in zoom-in-95 flex flex-col sm:flex-row gap-2">
          <input 
            type="text" placeholder="CATEGORY IDENTITY..." 
            value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 px-4 py-2 text-[10px] border-2 border-slate-50 bg-slate-50 rounded-lg font-black outline-none focus:border-blue-500 uppercase transition-all"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAddCategory(false)} className="px-4 py-2 text-[9px] font-black uppercase text-slate-400">Cancel</button>
            <button onClick={addCategory} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Add</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {categories.map(category => {
          const items = groupedMaterials[category] || [];
          if (items.length === 0 && filter) return null;
          const theme = getTheme(category);
          const scale = categoryScales[category] || globalScale;

          return (
            <div key={category} className="group/cat space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm transition-colors group-hover/cat:border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="relative shadow-inner rounded-md overflow-hidden">
                     <div className="w-5 h-5 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: theme.base }}>
                        <span className="font-black text-[9px]">{category.charAt(0)}</span>
                     </div>
                     <input
                        type="color"
                        value={theme.base}
                        onChange={(e) => updateCategoryColor(category, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                     />
                  </div>
                  <h2 className="text-[11px] font-black uppercase tracking-tight" style={{ color: theme.content }}>{category}</h2>
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">[{items.length}]</span>
                </div>
                
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setScale(category, 'down')} className="w-5 h-5 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all active:scale-90"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg></button>
                    <div className="px-1.5"><span className="text-[8px] font-black text-slate-400 uppercase">L{scale}</span></div>
                    <button onClick={() => setScale(category, 'up')} className="w-5 h-5 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all active:scale-90"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg></button>
                  </div>
                  <div className="h-3 w-px bg-slate-200 mx-1"></div>
                  <button onClick={() => addNewItem(category)} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[7px] font-black hover:border-slate-900 transition-all uppercase" style={{ color: theme.base }}>+ Asset</button>
                  <button onClick={() => deleteCategory(category)} className="p-1 text-slate-200 hover:text-red-500 opacity-0 group-hover/cat:opacity-100 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>

              <div className={`grid ${getGridCols(scale, items.length)} gap-1.5 transition-all duration-300`}>
                {items.map(m => (
                  <div 
                    key={m.id} 
                    className={`rounded-lg border-2 transition-all shadow-sm flex flex-col group/item relative overflow-hidden ${getCardPadding(scale)} min-h-[50px]`}
                    style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                  >
                    <div className="flex justify-between items-start mb-1 opacity-0 group-hover/item:opacity-100 transition-opacity absolute top-1 right-1">
                       <button onClick={() => deleteMaterial(m.id)} className="p-0.5 text-slate-300 hover:text-red-600 bg-white/80 rounded-md shadow-sm transition-all"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    
                    <div className="mb-1 pr-4">
                      <textarea 
                        className={`w-full font-black uppercase bg-transparent border-none p-0 focus:ring-0 resize-none leading-tight tracking-tight h-auto ${getFontSize(scale)}`}
                        style={{ color: theme.content }}
                        value={m.name} 
                        onChange={(e) => updateMaterial(m.id, { name: e.target.value })}
                        spellCheck={false}
                        rows={1}
                      />
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-1 pt-1 border-t border-black/5">
                       <div className="flex-1 flex items-baseline gap-0.5">
                          <span className="text-[6px] font-black opacity-30 uppercase" style={{ color: theme.base }}>EGP</span>
                          <input 
                            type="number" 
                            className={`w-full font-black bg-transparent border-none p-0 focus:ring-0 ${getFontSize(scale)}`}
                            style={{ color: theme.base }}
                            value={m.price} 
                            onChange={(e) => updateMaterial(m.id, { price: +e.target.value })}
                          />
                       </div>
                       <input 
                        className="w-8 font-bold uppercase text-center rounded bg-white/40 border border-black/5 outline-none focus:border-black/20 text-[7px]"
                        style={{ color: theme.content }}
                        value={m.unit} 
                        onChange={(e) => updateMaterial(m.id, { unit: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => addNewItem(category)}
                  className={`border-2 border-dashed rounded-lg flex items-center justify-center gap-1.5 transition-all group/addbtn ${getCardPadding(scale)} min-h-[50px]`}
                  style={{ borderColor: `${theme.base}40`, color: theme.base, backgroundColor: `${theme.base}05` }}
                >
                   <svg className={getIconSize(scale)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                   <span className="text-[7px] font-black uppercase tracking-widest opacity-60 group-hover/addbtn:opacity-100">Add Asset</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-6 right-6 z-[600] flex items-center gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl no-print">
         <button onClick={() => handleGlobalScaleChange(globalScale - 1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg>
         </button>
         <div className="px-3 flex flex-col items-center">
            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest secondary-text-style">Catalog Density</span>
            <span className="text-[11px] font-black text-white">L{globalScale}</span>
         </div>
         <button onClick={() => handleGlobalScaleChange(globalScale + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
         </button>
      </div>
    </div>
  );
};

export default MaterialCatalog;
