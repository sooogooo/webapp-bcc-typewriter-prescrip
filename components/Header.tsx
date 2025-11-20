
import React, { useState } from 'react';
import { Info, HelpCircle, X, Settings as SettingsIcon, Volume2, VolumeX, Check, LayoutTemplate } from 'lucide-react';
import { AppSettings, BackgroundType, AIPersona, PrescriptionTemplate } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}

const BACKGROUNDS: { id: BackgroundType; name: string; color: string }[] = [
    { id: 'wood', name: 'Classic Wood', color: 'bg-[#3e2723]' },
    { id: 'marble', name: 'White Marble', color: 'bg-[#eceff1]' },
    { id: 'dark', name: 'Carbon Fiber', color: 'bg-[#121212]' },
    { id: 'felt', name: 'Retro Felt', color: 'bg-[#1b5e20]' },
    { id: 'leather', name: 'Luxury Leather', color: 'bg-[#4e342e]' },
    { id: 'concrete', name: 'Modern Concrete', color: 'bg-[#90a4ae]' },
    { id: 'linen', name: 'Soft Linen', color: 'bg-[#d7ccc8]' },
    { id: 'silk', name: 'Dark Silk', color: 'bg-[#1a1a1a]' },
    { id: 'starry', name: 'Starry Night', color: 'bg-[#0f172a]' },
];

const PERSONAS: { id: AIPersona; name: string; desc: string }[] = [
    { id: 'gentle', name: '温柔 (Gentle)', desc: '知心姐姐，温暖治愈' },
    { id: 'professional', name: '专业 (Pro)', desc: '严谨客观，权威专家' },
    { id: 'witty', name: '幽默 (Witty)', desc: '风趣幽默，拒绝焦虑' },
    { id: 'ancient', name: '古风 (Ancient)', desc: '悬壶济世，古韵医嘱' },
];

const TEMPLATES: { id: PrescriptionTemplate; name: string; color: string }[] = [
    { id: 'classic', name: '经典 (Classic)', color: 'bg-[#fcfbf9]' },
    { id: 'royal', name: '皇家 (Royal)', color: 'bg-white border-2 border-stone-800' },
    { id: 'aged', name: '复古 (Aged)', color: 'bg-[#eaddcf]' },
    { id: 'minimalist', name: '极简 (Minimal)', color: 'bg-white border border-stone-200' },
    { id: 'lab', name: '实验室 (Lab)', color: 'bg-blue-50 border border-blue-200' },
    { id: 'prestige', name: '臻金 (Prestige)', color: 'bg-[#fffaf0] border border-[#d4af37]' },
    { id: 'glass', name: '极光 (Glass)', color: 'bg-gradient-to-br from-white/60 to-white/30' },
    { id: 'dark_modern', name: '黑金 (Black Gold)', color: 'bg-[#1a1a1a] border border-[#d4af37]' },
];

export const Header: React.FC<HeaderProps> = ({ settings, onSettingsChange }) => {
  const [activeModal, setActiveModal] = useState<'about' | 'usage' | 'settings' | null>(null);

  const toggleSound = () => {
    onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const setBackground = (bg: BackgroundType) => {
    onSettingsChange({ ...settings, background: bg });
  };

  const setPersona = (p: AIPersona) => {
    onSettingsChange({ ...settings, aiPersona: p });
  };

  const setTemplate = (t: PrescriptionTemplate) => {
    onSettingsChange({ ...settings, template: t });
  };

  const CompanyInfoFooter = () => (
    <div className="mt-8 pt-6 border-t border-stone-200 bg-stone-50 -mx-6 -mb-6 p-6 rounded-b text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
            <img src="https://docs.bccsw.cn/logo.png" alt="BCC Logo" className="h-10 w-auto object-contain" />
            <img src="https://docs.bccsw.cn/consultant.png" alt="QR Code" className="h-14 w-auto object-contain bg-white p-1 shadow-sm rounded-sm" />
        </div>
        <h4 className="font-bold text-stone-800 text-sm mb-1">重庆联合丽格科技有限公司</h4>
        <p className="text-[10px] text-stone-500">重庆市渝中区临江支路28号</p>
        <p className="text-[10px] text-stone-500">023-68726872</p>
    </div>
  );

  return (
    <>
      <header className="absolute top-0 left-0 w-full z-50 px-4 py-3 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          <img src="https://docs.bccsw.cn/logo.png" alt="BCC" className="w-10 h-10 object-contain drop-shadow-md" />
          <div className="flex flex-col">
            <h1 className="font-elegant text-stone-100 font-bold tracking-widest text-sm md:text-base shadow-black drop-shadow-md leading-none">BCC CLINIC</h1>
            <span className="text-[8px] text-stone-300 tracking-wider font-sans uppercase mt-0.5">Aesthetic Prescription Generator</span>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4">
          <button 
            onClick={() => setActiveModal('settings')}
            className="p-2 text-stone-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="设置"
          >
            <SettingsIcon size={20} />
          </button>
          <button 
            onClick={() => setActiveModal('usage')}
            className="p-2 text-stone-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="用法"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={() => setActiveModal('about')}
            className="p-2 text-stone-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="关于"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#fcfbf9] w-full max-w-md rounded shadow-2xl border border-stone-300 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-3 right-3 text-stone-400 hover:text-stone-800 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-6 font-chinese text-stone-800">
              {activeModal === 'settings' && (
                  <>
                    <h3 className="text-xl font-bold mb-6 border-b border-stone-200 pb-2 flex items-center gap-2">
                        <SettingsIcon size={20} /> 设置 / Settings
                    </h3>
                    
                    {/* Sound */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wide">音效 / Sound</label>
                        <button 
                            onClick={toggleSound}
                            className={`flex items-center gap-3 px-4 py-3 rounded border w-full transition-all ${settings.soundEnabled ? 'bg-stone-800 text-white border-stone-900' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                        >
                            {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            <span className="font-bold">{settings.soundEnabled ? '打字音效开启 (On)' : '静音 (Mute)'}</span>
                        </button>
                    </div>

                    {/* Template */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wide">处方模板 / Template</label>
                        <div className="grid grid-cols-1 gap-2">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTemplate(t.id)}
                                    className={`p-3 rounded border flex items-center justify-between transition-all ${settings.template === t.id ? 'border-stone-800 bg-[#f0f0eb] ring-1 ring-stone-800' : 'border-stone-200 hover:bg-stone-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-8 shadow-sm border border-stone-300 ${t.color}`}></div>
                                        <span className="font-bold text-sm">{t.name}</span>
                                    </div>
                                    {settings.template === t.id && <Check size={16} className="text-stone-800" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Backgrounds */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wide">背景 / Desk Surface</label>
                        <div className="grid grid-cols-2 gap-3">
                            {BACKGROUNDS.map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => setBackground(bg.id)}
                                    className={`p-2 rounded border flex items-center gap-2 transition-all ${settings.background === bg.id ? 'border-stone-800 bg-stone-100 ring-1 ring-stone-800' : 'border-stone-200 hover:bg-stone-50'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full shadow-sm border border-stone-300 ${bg.color}`}></div>
                                    <span className="text-xs font-bold">{bg.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Persona */}
                    <div className="mb-2">
                        <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wide">AI 医生风格 / Doctor Persona</label>
                        <div className="space-y-2">
                            {PERSONAS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setPersona(p.id)}
                                    className={`w-full p-3 rounded border text-left transition-all flex justify-between items-center ${settings.aiPersona === p.id ? 'bg-[#f0f0eb] border-stone-800' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-stone-800">{p.name}</div>
                                        <div className="text-[10px] text-stone-500">{p.desc}</div>
                                    </div>
                                    {settings.aiPersona === p.id && <Check size={16} className="text-stone-800" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Company Info Footer in Settings */}
                    <CompanyInfoFooter />
                  </>
              )}

              {activeModal === 'about' && (
                <>
                  <h3 className="text-xl font-bold mb-4 border-b border-stone-200 pb-2">关于 BCC 医美处方</h3>
                  
                  {/* Logo and QR Display */}
                  <div className="flex items-center justify-center gap-8 mb-6 py-4 bg-stone-50 rounded-lg border border-stone-100">
                      <img src="https://docs.bccsw.cn/logo.png" alt="BCC Logo" className="h-16 w-auto object-contain" />
                      <img src="https://docs.bccsw.cn/consultant.png" alt="QR Code" className="h-20 w-auto object-contain bg-white p-1 shadow-sm border border-stone-200" />
                  </div>

                  <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-stone-900 mb-1">公司信息</h4>
                        <div className="text-xs text-stone-600 space-y-0.5">
                          <p className="font-bold">重庆联合丽格科技有限公司</p>
                          <p>重庆市渝中区临江支路28号</p>
                          <p>023-68726872 | bccsw@cqlhlg.work</p>
                          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-stone-800 underline mt-1 block">
                            渝 ICP 备 2024023473 号
                          </a>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-bold text-stone-900 mb-1">医疗免责声明</h4>
                        <p className="text-xs text-stone-600">本应用生成的内容仅供娱乐和参考，不构成任何医疗建议、诊断或治疗方案。请勿依据本应用生成的处方进行自我用药或治疗。如有皮肤问题，请务必咨询专业医生。</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-stone-900 mb-1">AI 免责声明</h4>
                        <p className="text-xs text-stone-600">本应用使用人工智能技术生成内容，可能存在错误或偏差。生成的医生签名、诊断结果均为虚拟生成，与现实医疗机构无关。</p>
                    </div>
                  </div>
                  <div className="mt-6 text-xs text-stone-400 text-center">
                    Designed for Aesthetic Demonstration
                  </div>
                </>
              )}

              {activeModal === 'usage' && (
                <>
                  <h3 className="text-xl font-bold mb-4 border-b border-stone-200 pb-2">使用指南</h3>
                  <div className="space-y-6 text-sm text-stone-700">
                    <div className="flex justify-center mb-2">
                        <img src="https://docs.bccsw.cn/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                    </div>
                    
                    <div className="bg-stone-100 p-3 rounded">
                      <strong className="block text-stone-900 mb-1">1. 快速处方 (Quick Mode)</strong>
                      <p className="text-xs text-stone-600">适用于常见皮肤问题。直接点击下方标签（如“熬夜急救”、“美白亮肤”），AI将立即生成标准处方。</p>
                    </div>

                    <div className="bg-stone-100 p-3 rounded">
                      <strong className="block text-stone-900 mb-1">2. 专家问诊 (Consultation)</strong>
                      <p className="text-xs text-stone-600">模拟真实问诊流程。输入您的姓名（或使用随机化名），详细描述您的症状。强烈建议上传面部照片，AI 会进行更精准的面诊分析。</p>
                    </div>

                    <div className="bg-stone-100 p-3 rounded">
                      <strong className="block text-stone-900 mb-1">3. 处方互动</strong>
                      <p className="text-xs text-stone-600">处方生成后，您可以：</p>
                      <ul className="list-disc pl-4 mt-1 text-xs text-stone-600">
                          <li>拖动卡片，随意摆放。</li>
                          <li>点击卡片右上角放大按钮，查看细节。</li>
                          <li>点击保存按钮，将处方保存为图片分享。</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                      <div className="text-center">
                          <p className="text-xs text-stone-500 mb-2">添加福利官咨询</p>
                          <img src="https://docs.bccsw.cn/consultant.png" alt="Consultant" className="w-24 h-24 object-contain border border-stone-200 p-1 bg-white" />
                      </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
