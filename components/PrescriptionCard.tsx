

import React, { useRef, useState } from 'react';
import { PrescriptionCardType, PrescriptionTemplate } from '../types';
import { TypewriterText } from './TypewriterText';
import { X, Download, ZoomIn, ZoomOut, RefreshCcw, Share2, ChevronLeft } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';

interface PrescriptionCardProps {
  card: PrescriptionCardType;
  isSelected?: boolean;
  isDragging?: boolean;
  onMouseDown: (e: React.PointerEvent, id: string) => void;
  onClose: (id: string) => void;
  isStatic?: boolean; 
  onTypingComplete?: () => void;
  onRestore?: (id: string) => void;
}

const TEMPLATE_STYLES: Record<PrescriptionTemplate, string> = {
  classic: "bg-[#fcfbf9] border border-stone-200 text-stone-900",
  royal: "bg-white border-4 border-double border-stone-800 text-stone-900",
  aged: "bg-[#eaddcf] border border-stone-400 sepia-[0.3] text-stone-900",
  minimalist: "bg-white border border-gray-100 shadow-sm font-sans text-gray-800",
  lab: "bg-[#f8fdff] border-2 border-blue-100 text-slate-800",
  prestige: "bg-[#fffaf0] border-2 border-[#d4af37] text-stone-900",
  glass: "bg-white/40 backdrop-blur-md border border-white/50 shadow-lg text-slate-800",
  dark_modern: "bg-[#1a1a1a] border border-[#d4af37] text-[#d4af37]"
};

const PAPER_TEXTURES: Record<PrescriptionTemplate, string> = {
  classic: "https://www.transparenttextures.com/patterns/cream-paper.png",
  royal: "https://www.transparenttextures.com/patterns/white-paper.png",
  aged: "https://www.transparenttextures.com/patterns/rough-cloth-light.png",
  minimalist: "https://www.transparenttextures.com/patterns/subtle-white-feathers.png",
  lab: "https://www.transparenttextures.com/patterns/graphy.png",
  prestige: "https://www.transparenttextures.com/patterns/beige-paper.png",
  glass: "", // No texture for glass
  dark_modern: "https://www.transparenttextures.com/patterns/stardust.png"
};

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ 
  card, 
  isSelected = false,
  isDragging = false, 
  onMouseDown,
  onClose,
  isStatic = false,
  onTypingComplete,
  onRestore
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const dateStr = new Date(card.timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const userImage = card.data.userImage || card.userImage;
  const template = card.data.template || 'classic';

  // Helper to convert base64 to File object for sharing
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSave = async (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!cardRef.current || isSaving) return;
    
    setIsSaving(true);
    try {
      // Small delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3, // High res for phones
        useCORS: true,
        allowTaint: true,
        logging: false,
        ignoreElements: (element: Element) => element.hasAttribute('data-html2canvas-ignore')
      });
      
      const imgData = canvas.toDataURL('image/png');
      setPreviewUrl(imgData);
      
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("生成图片失败，请重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNativeShare = async () => {
    if (!previewUrl) return;
    
    try {
        const file = dataURLtoFile(previewUrl, `BCC_Prescription_${card.data.patientName}.png`);
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'BCC 医美处方',
                text: '我的专属医美处方，请查收。',
            });
        } else {
            // Fallback for desktop or unsupported browsers
            const link = document.createElement('a');
            link.download = `BCC_Prescription_${card.data.patientName}.png`;
            link.href = previewUrl;
            link.click();
        }
    } catch (error) {
        console.log('Share failed or cancelled', error);
    }
  };

  const toggleZoom = (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsZoomed(!isZoomed);
  };
  
  const handleClose = (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onClose(card.id);
  };

  const handleRestore = (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (onRestore) onRestore(card.id);
  };

  // Stop propagation for buttons
  const btnProps = {
      onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
      onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
      onClick: (e: React.MouseEvent) => e.stopPropagation()
  };

  // Style helpers for Dark Modern template
  const isDark = template === 'dark_modern';
  const textColor = isDark ? 'text-[#d4af37]' : 'text-stone-900';
  const labelColor = isDark ? 'text-stone-500' : 'text-stone-500';
  const headingColor = isDark ? 'text-white' : 'text-stone-900';

  return (
    <>
        <div
        ref={cardRef}
        onPointerDown={(e) => !isStatic && onMouseDown(e, card.id)}
        style={{
            transform: isStatic 
            ? `translate(0, 0) rotate(0deg)` 
            : `translate(${card.position.x}px, ${card.position.y}px) rotate(${card.rotation}deg) scale(${isZoomed ? 1.3 : (card.scale || 1)})`,
            zIndex: isStatic || isZoomed || isDragging || isSelected ? 50 : 10,
            touchAction: 'none',
            position: isStatic ? 'relative' : 'absolute', 
            cursor: isStatic ? 'default' : (isDragging ? 'grabbing' : 'grab'),
            pointerEvents: 'auto',
        }}
        className={`w-[85vw] max-w-[350px] md:max-w-[400px] shadow-xl rounded-sm transition-all duration-300 origin-center ${TEMPLATE_STYLES[template]} ${(isSelected || isDragging) && !isStatic ? 'shadow-2xl ring-2 ring-[#d4af37]/60' : ''} ${isZoomed ? 'shadow-2xl drop-shadow-2xl' : ''}`}
        >
        {/* Paper Texture overlay */}
        {PAPER_TEXTURES[template] && (
            <div 
            className="absolute inset-0 opacity-30 pointer-events-none z-0"
            style={{ backgroundImage: `url('${PAPER_TEXTURES[template]}')` }}
            ></div>
        )}
        
        {/* Tape visual - Only show on desk cards */}
        {!isStatic && template !== 'glass' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#e0e0e0] opacity-80 rotate-1 shadow-sm z-50 pointer-events-none backdrop-blur-[1px] border-l border-r border-white/40" data-html2canvas-ignore></div>
        )}

        {/* Actions - Visible when Selected or Active, but not Static */}
        {!isStatic && (isSelected || isDragging) && (
            <div 
                className="absolute -top-12 right-0 flex gap-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200" 
                data-html2canvas-ignore
            >
            <button 
                {...btnProps}
                onClick={toggleZoom}
                className="bg-stone-100 text-stone-700 p-2 rounded-full shadow-lg border border-stone-300 hover:bg-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                title="放大/缩小"
            >
                {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            </button>
            <button 
                {...btnProps}
                onClick={handleSave}
                className="bg-stone-800 text-[#fcfbf9] p-2 rounded-full shadow-lg hover:bg-black transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                title="保存图片"
            >
                {isSaving ? <span className="animate-spin block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Download size={16} />}
            </button>
            <button 
                {...btnProps}
                onClick={handleRestore}
                className="bg-emerald-700 text-white p-2 rounded-full shadow-lg hover:bg-emerald-800 transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                title="重开一张"
            >
                <RefreshCcw size={16} />
            </button>
            <button 
                {...btnProps}
                onClick={handleClose}
                className="bg-red-900 text-white p-2 rounded-full shadow-lg hover:bg-red-950 transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                title="删除"
            >
                <X size={16} />
            </button>
            </div>
        )}

        <div className="p-6 md:p-8 flex flex-col h-full relative z-10 select-none font-chinese">
            
            {/* User Photo - Attached Polaroid style */}
            {userImage && (
            <div className="absolute -right-4 -top-8 w-20 h-24 md:w-24 md:h-28 bg-white shadow-lg p-1.5 transform rotate-6 border border-stone-200 z-20">
                <div className="w-full h-16 md:h-20 bg-stone-100 overflow-hidden relative grayscale contrast-125">
                <img src={userImage} alt="Patient" className="w-full h-full object-cover" />
                </div>
                <div className="text-center mt-1">
                <span className="font-typewriter text-[8px] text-stone-500 block truncate px-1">{card.data.patientName}</span>
                </div>
                {/* Paperclip */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-6 border-2 border-stone-400 rounded-b-full border-t-0 z-30"></div>
            </div>
            )}

            {/* Header */}
            <div className={`text-center border-b-2 pb-3 mb-5 mt-2 
                ${template === 'royal' ? 'border-double border-b-4 border-stone-900' : ''} 
                ${template === 'lab' ? 'border-blue-900/20' : ''} 
                ${template === 'prestige' ? 'border-[#d4af37]' : ''}
                ${isDark ? 'border-[#d4af37]' : 'border-stone-900'}
                ${template === 'glass' ? 'border-white/40' : ''}
            `}>
            <h2 className={`font-elegant text-2xl md:text-3xl tracking-[0.2em] font-bold 
                ${template === 'lab' ? 'text-blue-900' : ''} 
                ${template === 'prestige' ? 'text-[#d4af37]' : ''}
                ${isDark ? 'text-[#d4af37]' : 'text-stone-900'}
            `}>BCC</h2>
            <p className={`font-vintage text-[10px] mt-1 tracking-widest uppercase ${isDark ? 'text-[#d4af37]/70' : 'text-stone-600'}`}>Aesthetic Clinic Prescription</p>
            </div>

            {/* Content */}
            <div className={`flex-1 space-y-5 relative z-10 ${isDark ? 'text-[#d4af37]' : 'text-stone-900'}`}>
            <div className={`flex justify-between items-end border-b border-dashed pb-2 
                ${template === 'lab' ? 'border-blue-200' : ''}
                ${isDark ? 'border-[#d4af37]/30' : 'border-stone-300'}
            `}>
                <div className="flex flex-col">
                <span className={`text-[9px] uppercase tracking-wide font-sans ${labelColor}`}>Date / 日期</span>
                <span className="font-typewriter text-xs md:text-sm font-bold">{dateStr}</span>
                </div>
                <div className="flex flex-col text-right pr-2">
                <span className={`text-[9px] uppercase tracking-wide font-sans ${labelColor}`}>Patient / 姓名</span>
                <span className="font-chinese font-bold text-base md:text-lg tracking-wider">{card.data.patientName}</span>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full 
                    ${template === 'lab' ? 'bg-blue-900' : ''}
                    ${isDark || template === 'prestige' ? 'bg-[#d4af37]' : 'bg-stone-900'}
                `}></div>
                <p className={`text-[10px] font-bold uppercase tracking-wide font-sans ${labelColor}`}>Diagnosis / 诊断</p>
                </div>
                <div className="min-h-[28px] pl-3">
                <TypewriterText 
                    text={card.data.diagnosis} 
                    speed={isStatic ? 60 : 0} 
                    startDelay={isStatic ? 500 : 0}
                    className={`font-chinese font-bold text-xl md:text-2xl ${isDark ? 'text-white' : 'text-stone-900'}`}
                />
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full 
                    ${template === 'lab' ? 'bg-blue-900' : ''}
                    ${isDark || template === 'prestige' ? 'bg-[#d4af37]' : 'bg-stone-900'}
                `}></div>
                <p className={`text-[10px] font-bold uppercase tracking-wide font-sans ${labelColor}`}>Treatment / 治疗方案</p>
                </div>
                <div className="min-h-[40px] relative pl-3">
                <TypewriterText 
                    text={card.data.treatment} 
                    speed={isStatic ? 40 : 0} 
                    startDelay={isStatic ? 1500 : 0}
                    className={`font-chinese text-sm md:text-base leading-relaxed font-medium ${isDark ? 'text-[#e6c86e]' : 'text-stone-800'}`}
                />
                </div>
            </div>

            <div className={`mt-4 p-3 md:p-4 rounded-sm border-l-[3px] relative overflow-hidden 
                ${template === 'prestige' ? 'bg-[#fcfbf9]/80 border-[#d4af37]' : ''}
                ${template === 'glass' ? 'bg-white/20 border-white' : ''}
                ${isDark ? 'bg-[#2a2a2a]/80 border-[#d4af37]' : 'bg-[#f0f0eb]/60 border-stone-800'}
            `}>
                <span className={`absolute top-0 left-1 text-4xl font-serif leading-none ${isDark ? 'text-stone-700' : 'text-stone-300'}`}>"</span>
                <div className="relative z-10 pl-4">
                    <TypewriterText 
                    text={card.data.advice} 
                    speed={isStatic ? 50 : 0} 
                    startDelay={isStatic ? 3500 : 0}
                    onComplete={isStatic ? onTypingComplete : undefined}
                    className={`italic text-xs md:text-sm font-serif leading-loose ${isDark ? 'text-stone-300' : 'text-stone-700'}`}
                    />
                </div>
            </div>
            </div>

            {/* Footer */}
            <div className="mt-6 md:mt-8 pt-2 flex justify-between items-end relative z-10">
            <div className="flex flex-col items-start z-10">
                <div className="h-12 relative min-w-[140px] flex items-end gap-2">
                    <span className={`font-signature text-3xl md:text-4xl -rotate-2 pb-1 
                        ${isDark ? 'text-[#d4af37]' : 'text-[#1a237e]'}
                    `}>bcc chongqing</span>
                </div>
                <div className="h-[1px] w-full bg-stone-400 mb-1"></div>
                <span className="text-[8px] text-stone-400 uppercase tracking-widest font-sans">Physician Signature</span>
            </div>
            
            {/* Stamp */}
            <div className={`w-16 h-16 md:w-20 md:h-20 border-[3px] rounded-full flex items-center justify-center rotate-[-12deg] mask-image: url('https://www.transparenttextures.com/patterns/grunge-wall.png') absolute right-14 bottom-2 pointer-events-none opacity-80 z-0 
                ${template === 'lab' ? 'border-blue-900/60 text-blue-900/60' : ''}
                ${isDark ? 'border-[#d4af37]/60 text-[#d4af37]/60' : 'border-red-900/60 text-red-900/60'}
            `}>
                <div className="text-center">
                    <span className="block font-vintage text-[9px] font-bold leading-none">BCC</span>
                    <span className="block font-vintage text-[7px] font-bold leading-none mt-0.5">CLINIC</span>
                    <span className="block font-serif text-[7px] mt-0.5 scale-75">VERIFIED</span>
                </div>
            </div>
            </div>

            {/* Disclaimer */}
            <div className={`mt-4 pt-2 border-t text-center ${isDark ? 'border-[#d4af37]/30' : 'border-stone-200'}`}>
            <p className="text-[8px] text-stone-400 scale-90 font-sans">仅供娱乐，不能替代专业诊疗 · Entertainment only</p>
            </div>
        </div>
        </div>

        {/* Preview Modal for Saving */}
        {previewUrl && (
            <div 
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4"
                onClick={() => setPreviewUrl(null)}
            >
                <div 
                    className="bg-transparent w-full max-w-md relative flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 className="text-white font-chinese text-lg mb-4 flex items-center gap-2">
                        <Share2 size={18} /> 
                        <span>处方已生成</span>
                    </h3>

                    <div className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-stone-800/50">
                         <img src={previewUrl} alt="Prescription Preview" className="max-w-full max-h-[65vh] object-contain block" />
                    </div>
                    
                    <div className="mt-6 flex flex-col items-center gap-3 w-full">
                        <button 
                            onClick={handleNativeShare}
                            className="w-full py-3.5 bg-[#d4af37] hover:bg-[#b5942f] text-white font-bold rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Share2 size={20} />
                            <span>保存到相册 / 分享</span>
                        </button>
                        <p className="text-white/60 text-xs animate-pulse">如果按钮无响应，请直接长按图片保存</p>
                    </div>

                    <button 
                        onClick={() => setPreviewUrl(null)}
                        className="absolute -top-12 right-0 text-white/80 hover:text-white p-2"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        )}
    </>
  );
};
