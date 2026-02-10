
import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, Template, Language } from '../types';
import { SEED_TRANSPORT } from '../constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  config: AppConfig;
  project: Template;
  lang: Language;
  onClose: () => void;
}

const ProposalGenerator: React.FC<Props> = ({ config, project, lang, onClose }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [isFitToPage, setIsFitToPage] = useState(project.fitToPage ?? false);
  const [scalePercent, setScalePercent] = useState(project.scalePercent ?? 100);

  useEffect(() => {
    setIsFitToPage(project.fitToPage ?? false);
    setScalePercent(project.scalePercent ?? 100);
  }, [project.fitToPage, project.scalePercent]);

  const documentRef = useRef<HTMLDivElement>(null);

  // Derived Brand Color from Project or Logo context
  const corporateBlue = project.primaryColor || "#34548a"; 

  const materialSubtotal = project.groups.reduce((acc, g) => acc + g.items.reduce((a, c) => a + c.total, 0), 0);
  const tr = SEED_TRANSPORT.find(t => t.id === project.selectedTransport);
  const transportCost = tr ? tr.basePrice + tr.loadingFee : 0;
  
  const directCosts = materialSubtotal + transportCost;
  const overhead = directCosts * project.overhead;
  const profit = (directCosts + overhead) * project.markup;
  const subtotalBeforeVat = directCosts + overhead + profit;
  const vat = subtotalBeforeVat * config.VAT_RATE;
  const grandTotal = subtotalBeforeVat + vat;

  const displayDate = project.proposalDate 
    ? new Date(project.proposalDate).toLocaleDateString('en-US')
    : new Date().toLocaleDateString('en-US');

  const validUntilDate = project.validUntil || "30 Days from issue";
  const proposalNumber = project.proposalId || `[123456]`;
  const customerId = `[${project.clientName?.slice(0,3).toUpperCase() || '123'}]`;

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const a4Width = 210;
      const a4Height = 297;
      
      let imgWidth = a4Width;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const manualScaleFactor = scalePercent / 100;
      imgWidth *= manualScaleFactor;
      imgHeight *= manualScaleFactor;

      if (isFitToPage) {
        const widthRatio = a4Width / imgWidth;
        const heightRatio = a4Height / imgHeight;
        const fitScale = Math.min(widthRatio, heightRatio);
        
        imgWidth *= fitScale;
        imgHeight *= fitScale;
        
        pdf.addImage(imgData, 'PNG', (a4Width - imgWidth) / 2, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', (a4Width - imgWidth) / 2, position, imgWidth, imgHeight);
        heightLeft -= a4Height;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', (a4Width - imgWidth) / 2, position, imgWidth, imgHeight);
          heightLeft -= a4Height;
        }
      }

      pdf.save(`Quotation_${project.name || 'Pro'}_${proposalNumber}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleFinalEmailSend = () => {
    setIsSending(true);
    const subject = encodeURIComponent(`Quotation: ${project.name}`);
    const body = encodeURIComponent(`${emailMessage}\n\nTotal: ${Math.round(grandTotal).toLocaleString()} EGP`);
    setTimeout(() => {
      window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
      setIsSending(false);
      setShowEmailModal(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex flex-col items-center p-4 overflow-y-auto print:bg-white print:p-0">
      
      <div className="w-full max-w-[210mm] flex flex-col gap-4 bg-white p-5 rounded-3xl mb-8 shadow-2xl no-print border-t-[6px] sticky top-0 z-[210]" style={{ borderColor: corporateBlue }}>
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <button onClick={onClose} className="px-5 py-2 text-slate-500 font-black text-xs uppercase hover:bg-slate-50 rounded-xl transition-all tracking-widest">Close Preview</button>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="fitToPage" 
                  checked={isFitToPage} 
                  onChange={(e) => setIsFitToPage(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: corporateBlue }}
                />
                <label htmlFor="fitToPage" className="text-[10px] font-black uppercase text-slate-500 cursor-pointer">Fit to One Page</label>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Scale</span>
                <input 
                  type="number" 
                  min="10" 
                  max="200" 
                  value={scalePercent} 
                  onChange={(e) => setScalePercent(parseInt(e.target.value) || 100)}
                  className="w-12 bg-transparent border-none p-0 text-[10px] font-black focus:ring-0"
                  style={{ color: corporateBlue }}
                />
                <span className="text-[10px] font-black text-slate-400">%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowEmailModal(true)} className="px-6 py-2.5 bg-slate-100 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Email</button>
              <button 
                onClick={handleDownloadPDF} 
                disabled={isGeneratingPDF} 
                className="px-6 py-2.5 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: corporateBlue }}
              >
                {isGeneratingPDF ? (
                  <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                ) : null}
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={documentRef}
        className="w-[210mm] bg-white p-[20mm] flex flex-col shadow-2xl print:shadow-none print:p-0 print:m-0"
        style={{ direction: 'ltr', color: '#000', fontSize: '12px', lineHeight: '1.4', fontFamily: "'Inter', sans-serif" }}
      >
        <div className="flex justify-between items-start mb-10 border-b-2 border-slate-100 pb-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-5 mb-4">
               <div className="w-16 h-16 flex items-center justify-center text-white font-black text-3xl rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: corporateBlue }}>
                  {(project.customLogo || config.appIcon.length > 2) ? <img src={project.customLogo || config.appIcon} className="w-full h-full object-cover" alt="Brand Logo" /> : config.appIcon}
               </div>
               <div>
                  <h1 className="text-4xl font-black tracking-tighter" style={{ color: corporateBlue }}>{config.appName}</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Official Quotation Document</p>
               </div>
            </div>
            <div className="space-y-0.5 text-[11px] font-medium text-slate-500">
               <p className="text-slate-900 font-bold">{config.companyAddress || '[Street Address, City, ST ZIP]'}</p>
               <p>Website: <span className="font-bold underline" style={{ color: corporateBlue }}>{config.companyWebsite || 'somedomain.com'}</span></p>
               <p>Phone: <span className="text-slate-900 font-bold">{config.companyPhone || '[000-000-0000]'}</span></p>
            </div>
          </div>

          <div className="flex flex-col items-end">
             <h2 className="text-6xl font-black mb-6 tracking-widest uppercase opacity-10 leading-none" style={{ color: corporateBlue }}>QUOTE</h2>
             <table className="border-collapse border border-slate-900 text-[10px] w-52 shadow-sm">
                <tbody>
                  <tr className="bg-slate-50"><td className="border border-slate-900 p-2 text-right font-black uppercase w-2/5 text-slate-400">DATE</td><td className="border border-slate-900 p-2 text-center font-bold">{displayDate}</td></tr>
                  <tr><td className="border border-slate-900 p-2 text-right font-black uppercase text-slate-400">QUOTE #</td><td className="border border-slate-900 p-2 text-center font-bold">{proposalNumber}</td></tr>
                  <tr className="bg-slate-50"><td className="border border-slate-900 p-2 text-right font-black uppercase text-slate-400">CUSTOMER ID</td><td className="border border-slate-900 p-2 text-center font-bold">{customerId}</td></tr>
                  <tr><td className="border border-slate-900 p-2 text-right font-black uppercase text-slate-400">VALID UNTIL</td><td className="border border-slate-900 p-2 text-center font-bold text-red-600">{validUntilDate}</td></tr>
                </tbody>
             </table>
          </div>
        </div>

        <div className="mb-10 break-inside-avoid">
          <div className="text-white px-5 py-2 font-black uppercase text-[11px] tracking-widest shadow-md" style={{ backgroundColor: corporateBlue }}>CUSTOMER RECIPIENT</div>
          <div className="p-5 border border-t-0 border-slate-300 space-y-1 bg-slate-50/30">
            <p className="font-black text-lg text-slate-900 uppercase">[{project.clientName || 'Name'}]</p>
            <p className="font-bold uppercase text-[10px] tracking-widest" style={{ color: corporateBlue }}>{project.name || '[Project Description]'}</p>
            <p className="text-slate-500 font-medium">[Official Billing Address Line 1]</p>
            <p className="text-slate-500 font-medium">[City, State, Zip Code]</p>
          </div>
        </div>

        <div className="flex-1 space-y-12">
          {project.groups.map((group, groupIdx) => {
            const hasImages = group.imageRefs && group.imageRefs.length > 0;
            const groupSubtotal = group.items.reduce((sum, item) => sum + item.total, 0);
            
            return (
              <div key={group.id} className="break-inside-avoid">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-black text-xs" style={{ backgroundColor: corporateBlue }}>{groupIdx + 1}</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b-2 pb-1" style={{ borderBottomColor: corporateBlue }}>{group.name}</h3>
                </div>
                
                <div className="flex gap-8 items-start">
                  <div className={hasImages ? "flex-[2.5]" : "w-full"}>
                    <table className="w-full border-collapse border border-slate-900 text-[11px] shadow-sm">
                      <thead>
                        <tr className="text-white text-center font-black uppercase tracking-widest" style={{ backgroundColor: corporateBlue }}>
                          <th className="border border-slate-900 py-2.5 px-4 text-left">DESCRIPTION OF PRODUCTION ASSET</th>
                          <th className="border border-slate-900 py-2.5 px-3 w-20">UNIT PRICE</th>
                          <th className="border border-slate-900 py-2.5 px-3 w-16">QTY</th>
                          <th className="border border-slate-900 py-2.5 px-4 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="border-x border-slate-900 px-4 py-2 font-bold text-slate-700 uppercase">
                              <div className="flex items-center gap-3">
                                 {item.imageRef && (
                                   <div className="w-6 h-6 border border-slate-900 shrink-0 overflow-hidden bg-white">
                                     <img src={item.imageRef} className="w-full h-full object-cover" alt="Item Preview" />
                                   </div>
                                 )}
                                 <span className="leading-tight">{item.name}</span>
                              </div>
                            </td>
                            <td className="border-x border-slate-900 px-3 py-2 text-center font-medium">{item.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="border-x border-slate-900 px-3 py-2 text-center font-black">{item.quantity}</td>
                            <td className="border-x border-slate-900 px-4 py-2 text-right font-black text-slate-900">{item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100/50">
                          <td colSpan={3} className="border border-slate-900 px-4 py-2 text-right font-black uppercase tracking-widest text-[9px] text-slate-500">Section Subtotal</td>
                          <td className="border border-slate-900 px-4 py-2 text-right font-black text-slate-900">{groupSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {hasImages && (
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white px-3 py-1.5 mb-1" style={{ backgroundColor: corporateBlue }}>REF VISUALS</div>
                      <div className="grid grid-cols-2 gap-2">
                        {group.imageRefs?.map((img, i) => (
                          <div key={i} className="border border-slate-900 bg-white p-0.5 shadow-sm break-inside-avoid">
                            <div className="aspect-square overflow-hidden border border-slate-100">
                               <img src={img} alt={"Reference Visual " + (i + 1)} className="w-full h-full object-cover transition-transform hover:scale-105" />
                            </div>
                            <div className="mt-0.5 flex justify-center items-center px-0.5">
                               <span className="text-[6px] font-black uppercase text-slate-300 tracking-tighter">REF #{i+1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 pt-10 border-t-2 border-slate-900 flex gap-12 break-inside-avoid">
          <div className="flex-1 space-y-6">
            <div className="text-white px-5 py-2 font-black uppercase text-[10px] tracking-widest shadow-md" style={{ backgroundColor: corporateBlue }}>TERMS AND CONDITIONS</div>
            <div className="p-6 border border-t-0 border-slate-300 text-[10px] space-y-3 leading-relaxed text-slate-600 font-medium bg-slate-50/50">
               <div className="space-y-2">
                 <p><span className="font-black text-slate-900 mr-2">01.</span> Acceptance of this quote constitutes a formal contract for production and logistics.</p>
                 <p><span className="font-black text-slate-900 mr-2">02.</span> Payment terms: <span className="font-black text-slate-900 underline">{project.paymentTerms || config.defaultPaymentTerms}</span>.</p>
                 <p><span className="font-black text-slate-900 mr-2">03.</span> Quote validity: <span className="font-black text-slate-900 underline">{project.validityPeriod || config.defaultValidityPeriod}</span>.</p>
                 <p><span className="font-black text-slate-900 mr-2">04.</span> All production assets remain intellectual property of {config.appName} until full payment settlement.</p>
               </div>
               
               <div className="mt-10 pt-6 border-t border-slate-200">
                  <p className="font-black uppercase tracking-widest text-[8px] text-slate-400 mb-8">Official Customer Acceptance Signature:</p>
                  <div className="border-b-2 border-slate-900 w-full mb-2 opacity-20"></div>
                  <div className="flex justify-between font-black text-[9px] uppercase tracking-tighter text-slate-400">
                     <span>AUTHORIZED RECIPIENT REPRESENTATIVE</span>
                     <span>SIGNATURE DATE</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="w-[85mm] p-6 bg-white border-2 border-slate-900 shadow-xl flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rotate-45 -mr-10 -mt-10 border border-slate-200"></div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 tracking-widest">
                <span>Subtotal Assets</span>
                <span className="text-slate-900">{materialSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 tracking-widest">
                <span>Logistic Support</span>
                <span className="text-slate-900">{transportCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 tracking-widest">
                <span>Internal Overheads</span>
                <span className="text-slate-900">{(profit + overhead).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="h-px bg-slate-200 my-3"></div>
              <div className="flex justify-between text-[11px] font-black uppercase tracking-widest" style={{ color: corporateBlue }}>
                <span>VAT TAX (14.0%)</span>
                <span>{vat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
            
            <div className="pt-8 flex flex-col items-end border-t-2 border-slate-900 mt-8 text-white -mx-6 -mb-6 p-8" style={{ backgroundColor: corporateBlue }}>
              <span className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-3">Total Investment Portfolio</span>
              <span className="text-5xl font-black tracking-tighter leading-none">{Math.round(grandTotal).toLocaleString()} <span className="text-[14px] font-black opacity-30">EGP</span></span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
          <p>Electronically Verified Corporate Node</p>
          <p>© {new Date().getFullYear()} {config.appName} Egypt Region</p>
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 no-print z-[500]">
          <div className="bg-white w-full max-w-lg p-10 rounded-[2.5rem] shadow-2xl border-4 border-slate-900">
             <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Mail Dispatch</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Official Document Delivery</p>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block ml-1 text-slate-500">Destination Address</label>
                  <input 
                    type="email" 
                    value={recipientEmail} 
                    onChange={(e) => setRecipientEmail(e.target.value)} 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all" 
                    placeholder="client@corporate.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block ml-1 text-slate-500">Accompanying Statement</label>
                  <textarea 
                    value={emailMessage} 
                    onChange={(e) => setEmailMessage(e.target.value)} 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-40 resize-none font-bold outline-none focus:border-blue-500 transition-all" 
                    placeholder="Provide professional context for this quotation..." 
                  />
                </div>
             </div>
             
             <div className="mt-12 flex gap-4">
                <button onClick={() => setShowEmailModal(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400 tracking-widest hover:text-slate-900 transition">Discard</button>
                <button 
                  onClick={handleFinalEmailSend} 
                  disabled={!recipientEmail || isSending}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                >
                  {isSending ? 'Transmitting...' : 'Dispatch Document'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalGenerator;
