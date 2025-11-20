

import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  isPrinting: boolean;
  isLoading?: boolean;
}

export const Typewriter: React.FC<TypewriterProps> = ({ isPrinting, isLoading = false }) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // QWERTY Layout Definition
  const ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  // Effect to randomly press keys during printing or loading
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPrinting || isLoading) {
      const speed = isPrinting ? 100 : 300; // Faster when printing, slower when thinking
      
      interval = setInterval(() => {
        // Pick a random row and key
        const randomRowIdx = Math.floor(Math.random() * ROWS.length);
        const randomRow = ROWS[randomRowIdx];
        const randomKey = randomRow[Math.floor(Math.random() * randomRow.length)];
        
        setActiveKey(randomKey);
        
        // Reset key quickly
        setTimeout(() => {
          setActiveKey(null);
        }, 100);
      }, speed);
    }

    return () => clearInterval(interval);
  }, [isPrinting, isLoading]);

  return (
    <div className="relative w-full max-w-[800px] h-64 md:h-80 z-40 flex flex-col items-center pointer-events-none transform transition-transform duration-300 origin-bottom scale-[0.55] sm:scale-[0.8] md:scale-100">
        
        {/* Carriage / Roller Area */}
        <div className={`w-[92%] md:w-[88%] h-16 md:h-24 bg-[#1a1a1a] rounded-full relative -bottom-10 shadow-2xl z-50 flex items-center justify-center border-b-4 border-stone-900 transition-transform duration-100 ${isPrinting ? 'translate-x-1' : ''}`}>
             {/* Metallic Sheen */}
             <div className="w-[98%] h-full bg-gradient-to-b from-[#4a4a4a] via-[#222] to-[#000] rounded-full opacity-100 shadow-inner border-t border-stone-600/30"></div>
             
             {/* Paper Guide / Scale */}
             <div className="absolute -top-4 w-[94%] h-5 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-400 rounded-sm shadow-lg flex items-end justify-between px-2 overflow-hidden border border-stone-500">
                 {Array.from({length: 60}).map((_, i) => (
                     <div key={i} className={`w-[1px] bg-stone-700 ${i % 5 === 0 ? 'h-3' : 'h-1.5'}`}></div>
                 ))}
             </div>

             {/* Return Lever (Left) */}
             <div className={`absolute -left-6 md:-left-12 top-6 w-24 h-4 bg-gradient-to-r from-stone-500 to-stone-300 origin-right transform rotate-[-12deg] transition-transform duration-300 shadow-xl rounded-l-full border border-stone-400 ${isPrinting ? 'rotate-[-6deg]' : ''}`}>
                 <div className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-stone-200 rounded-full shadow-inner border border-stone-500"></div>
             </div>

             {/* Platen Knobs */}
             <div className={`absolute -left-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#111] rounded-full border-[5px] border-[#333] shadow-xl z-30 flex items-center justify-center ${isPrinting ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }}>
                <div className="w-full h-1.5 bg-[#555] transform rotate-45 rounded"></div>
                <div className="w-1.5 h-full bg-[#555] transform rotate-45 rounded"></div>
             </div>
             <div className={`absolute -right-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#111] rounded-full border-[5px] border-[#333] shadow-xl z-30 flex items-center justify-center ${isPrinting ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }}>
                <div className="w-full h-1.5 bg-[#555] transform rotate-45 rounded"></div>
                <div className="w-1.5 h-full bg-[#555] transform rotate-45 rounded"></div>
             </div>
        </div>
        
        {/* Main Body Block - Solid Background to Mask Paper */}
        <div className="w-full h-full bg-[#222] rounded-t-[40px] md:rounded-t-[60px] shadow-[0_-10px_50px_rgba(0,0,0,0.9)] relative border-t-[8px] border-[#444] flex justify-center overflow-hidden z-40">
            {/* Grain Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#383838] to-[#1a1a1a] opacity-90"></div>

            {/* Ribbon Spools (Visible through cover) */}
            <div className="absolute top-10 left-20 md:left-28 w-16 h-16 rounded-full border-[3px] border-stone-700 opacity-40 animate-spin duration-[5000ms]" style={{ animationPlayState: isPrinting ? 'running' : 'paused' }}>
                <div className="w-full h-full border-dashed border-2 border-stone-600 rounded-full"></div>
            </div>
            <div className="absolute top-10 right-20 md:right-28 w-16 h-16 rounded-full border-[3px] border-stone-700 opacity-40 animate-spin duration-[5000ms] direction-reverse" style={{ animationPlayState: isPrinting ? 'running' : 'paused' }}>
                <div className="w-full h-full border-dashed border-2 border-stone-600 rounded-full"></div>
            </div>

            {/* Brand Plate */}
             <div className="absolute top-6 md:top-10 z-50">
                <div className="bg-black/90 px-5 py-1.5 border border-yellow-700/50 rounded shadow-lg backdrop-blur-sm">
                     <span className="text-yellow-600/90 font-chinese tracking-[0.1em] text-[10px] md:text-xs font-bold drop-shadow-md">
                       {isLoading ? "ANALYZING..." : "BCC 美容皮肤科小智"}
                     </span>
                </div>
            </div>

            {/* Keyboard Area - Recessed */}
            <div className="mt-20 md:mt-24 w-[90%] md:w-[82%] h-full bg-[#181818] rounded-t-[24px] shadow-[inset_0_15px_30px_rgba(0,0,0,1)] p-5 md:p-8 flex flex-col items-center justify-start gap-3 relative border-t-[3px] border-stone-700/40">
                
                {/* Key Rows */}
                {ROWS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 md:gap-3 justify-center w-full" style={{ marginLeft: rowIndex * 10 }}>
                        {row.map((key) => (
                             <div key={key} className={`
                                w-7 h-7 md:w-10 md:h-10 rounded-full bg-[#ccc] border-[3px] md:border-[4px] border-[#666] 
                                shadow-[0_4px_0_#222,0_6px_8px_rgba(0,0,0,0.7)] 
                                flex items-center justify-center transition-transform duration-75 relative cursor-default
                                ${activeKey === key ? 'translate-y-[4px] shadow-none bg-[#bbb] border-[#555]' : ''} 
                            `}>
                                 {/* Key Cap Concave Effect */}
                                 <div className="w-[85%] h-[85%] bg-gradient-to-br from-[#fdfdfd] to-[#dcdcdc] rounded-full shadow-[inset_1px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] flex items-center justify-center border border-stone-300/50">
                                     <span className="text-[9px] md:text-[12px] text-[#333] font-typewriter font-bold">
                                        {key}
                                     </span>
                                 </div>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Space Bar Row */}
                <div className="flex gap-4 md:gap-6 mt-2 w-full justify-center items-start">
                    <div className="w-12 h-8 md:w-16 md:h-10 bg-[#252525] rounded shadow-[0_4px_0_#111] flex items-center justify-center border border-[#333]">
                        <span className="text-[7px] text-stone-600 font-sans tracking-wider">SHIFT</span>
                    </div>

                    {/* Space Bar */}
                    <div className={`w-[140px] md:w-[280px] h-8 md:h-10 bg-[#2a2a2a] rounded-sm shadow-[0_5px_0_#111] border-t border-stone-600 flex items-center justify-center transition-transform duration-75 ${activeKey === ' ' ? 'translate-y-[4px] shadow-none' : ''}`}>
                         <div className="w-[95%] h-[70%] bg-[#333] rounded-sm opacity-40 shadow-inner"></div>
                    </div>

                     <div className="w-12 h-8 md:w-16 md:h-10 bg-[#252525] rounded shadow-[0_4px_0_#111] flex items-center justify-center border border-[#333]">
                        <span className="text-[7px] text-stone-600 font-sans tracking-wider">SHIFT</span>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
