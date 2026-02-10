import React, { useState, useEffect } from 'react';
import { AppConfig, ThemeMode, BorderType, ThemeStyle, Language, TextTransform } from '../types';
import { useTranslation } from '../i18n';
import { APP_CONFIG } from '../constants';

interface Props {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  lang: Language;
}

const BrandingSettings: React.FC<Props> = ({ config, onConfigChange, lang }) => {
  const t = useTranslation(lang);
  const [activePanel, setActivePanel] = useState<'identity' | 'dna' | 'context'>('identity');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const updateConfig = (updates: Partial<AppConfig>) => {
    onConfigChange({ ...config, ...updates });
    setLastSaved(new Date().toLocaleTimeString());
  };

  const resetToDefault = () => {
    if (window.confirm("Restore factory visual settings?")) {
      onConfigChange({ ...config, ...APP_CONFIG });
      setLastSaved(new Date().toLocaleTimeString());
    }
  };

  const PANELS = [
    { id: 'identity', label: 'Core Identity', desc: 'Chroma & Brand Marks', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17l.01.01" /></svg> },
    { id: 'dna', label: 'Visual DNA', desc: 'Themes, Styles & Type', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'context', label: 'Environment', desc: 'Module Backgrounds', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 9h16" /></svg> },
  ];

  const TRANSFORMS: {id: TextTransform, name: string}[] = [
    { id: 'none', name: 'Normal' },
    { id: 'uppercase', name: 'CAPS' },
    { id: 'lowercase', name: 'small' },
    { id: 'capitalize', name: 'Mixed' },
  ];

  const FONTS = ['Inter', 'Roboto', 'Montserrat', 'Cairo', 'Tajawal', 'Poppins', 'Work Sans'];

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500">
      <aside className="w-full lg:w-72 shrink-0 space-y-3">
        <div className="px-5 mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Identity</h2>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Design System Orchestrator</p>
            {lastSaved && <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Saved</span>}
          </div>
        </div>
        
        <div className="space-y-2">
          {PANELS.map(panel => (
            <button key={panel.id} onClick={() => setActivePanel(panel.id as any)} className={`w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] border-2 transition-all group ${activePanel === panel.id ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white text-slate-400 border-transparent hover:bg-slate-50 hover:border-slate-100'}`}>
              <div className={`p-2 rounded-xl transition-colors ${activePanel === panel.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-white'}`}>{panel.icon}</div>
              <div className="text-left rtl:text-right flex-1">
                <p className="font-black text-[12px] uppercase tracking-widest leading-none mb-1">{panel.label}</p>
                <p className={`text-[9px] font-bold uppercase tracking-tight opacity-50 ${activePanel === panel.id ? 'text-white' : 'text-slate-400'}`}>{panel.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-12 px-2"><button onClick={resetToDefault} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100">Restore Factory DNA</button></div>
      </aside>

      <main className="flex-1 min-w-0">
        {activePanel === 'identity' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <section className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-sm space-y-12">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                 <div><h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Chroma Engine</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Color System</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { label: 'Primary Accent', key: 'themeColor', value: config.themeColor },
                  { label: 'Surface Base', key: 'surfaceColor', value: config.surfaceColor },
                  { label: 'Global Background', key: 'bgColor', value: config.bgColor },
                  { label: 'Main Text', key: 'mainTextColor', value: config.mainTextColor },
                  { label: 'Muted Text', key: 'mutedTextColor', value: config.mutedTextColor }
                ].map(color => (
                  <div key={color.key} className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-2">{color.label}</label>
                    <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner group transition-all hover:bg-white hover:border-slate-300">
                      <div className="relative">
                        <input type="color" value={color.value} onChange={e => updateConfig({ [color.key]: e.target.value })} className="w-16 h-16 rounded-3xl cursor-pointer border-4 border-white shadow-xl bg-transparent transition-transform hover:scale-110 z-10 relative" />
                        <div className="absolute inset-0 bg-slate-200 rounded-3xl animate-pulse -z-0"></div>
                      </div>
                      <input type="text" value={color.value} onChange={e => updateConfig({ [color.key]: e.target.value })} className="flex-1 font-black uppercase text-sm outline-none bg-transparent tracking-widest focus:text-slate-900" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-sm space-y-12">
               <div className="border-b border-slate-100 pb-6"><h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Typography Casing</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Text Transformation Strategy</p></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-2">Main Header Text</label>
                     <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-[2rem] border border-slate-100 shadow-inner">
                        {TRANSFORMS.map(tf => (
                          <button key={tf.id} onClick={() => updateConfig({ mainTextTransform: tf.id })} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${config.mainTextTransform === tf.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-400 hover:text-slate-600'}`}>{tf.name}</button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-6">
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-2">Secondary Labels</label>
                     <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-[2rem] border border-slate-100 shadow-inner">
                        {TRANSFORMS.map(tf => (
                          <button key={tf.id} onClick={() => updateConfig({ secondaryTextTransform: tf.id })} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${config.secondaryTextTransform === tf.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-400 hover:text-slate-600'}`}>{tf.name}</button>
                        ))}
                     </div>
                  </div>
               </div>
            </section>
          </div>
        )}

        {activePanel === 'dna' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <section className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-sm space-y-12">
              <div className="border-b border-slate-100 pb-6"><h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Atmosphere DNA</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interface Lighting & Physics</p></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { id: 'light', name: 'Light Solar', desc: 'Max Clarity', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                  { id: 'gray', name: 'Industrial', desc: 'High Focus', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                  { id: 'dark', name: 'Deep Midnight', desc: 'Energy Efficient', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> }
                ].map(mode => (
                  <button key={mode.id} onClick={() => updateConfig({ themeMode: mode.id as ThemeMode })} className={`flex flex-col items-center text-center gap-4 p-8 rounded-[3rem] border-2 transition-all ${config.themeMode === mode.id ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                    <div className={`p-3 rounded-2xl ${config.themeMode === mode.id ? 'bg-white/10' : 'bg-white'}`}>{mode.icon}</div>
                    <div><p className="text-[11px] font-black uppercase tracking-widest">{mode.name}</p><p className={`text-[8px] font-bold uppercase mt-1 opacity-50 ${config.themeMode === mode.id ? 'text-white' : 'text-slate-400'}`}>{mode.desc}</p></div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default BrandingSettings;