
import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, RefreshCw, Sparkles, ChevronDown, MessageSquarePlus, History, X, Trash2, MessageCircleQuestion, Bot, SendHorizontal, ChevronRight, ChevronUp, LayoutTemplate, Mic, Image as ImageIcon, Video, Paperclip, Volume2 } from 'lucide-react';
import { generatePrescription, createChatSession, generateChatSuggestions } from './services/geminiService';
import { setAudioMuted } from './services/audioService';
import { PrescriptionCardType, CardPosition, PrescriptionData, AppSettings, BackgroundType, HistoryItem, ChatMessage, Attachment } from './types';
import { PrescriptionCard } from './components/PrescriptionCard';
import { Header } from './components/Header';
import { Typewriter } from './components/Typewriter';
import { Chat, GenerateContentResponse } from '@google/genai';

const QUICK_ISSUES = [
  { label: "熬夜急救", value: "熬夜后皮肤暗沉、发黄，有黑眼圈" },
  { label: "祛痘", value: "面部反复长痘，有红肿痘印" },
  { label: "抗衰除皱", value: "面部松弛，有法令纹和鱼尾纹" },
  { label: "美白亮肤", value: "肤色不均，有晒斑，想要变白" },
  { label: "补水保湿", value: "换季干燥起皮，上妆卡粉" },
  { label: "敏感修护", value: "角质层薄，容易泛红发痒" },
  { label: "一键美白", value: "肤色暗沉、发黄，想要整体提亮" },
  { label: "屏障恢复", value: "皮肤受损、泛红刺痛，需要修复皮肤屏障" },
  { label: "轮廓美化", value: "下颌线模糊、面部松弛，需要提升轮廓" },
];

const RANDOM_NAMES = [
  "梓涵", "梦琪", "诗涵", "欣怡", "雨桐", "Bella", "Vivian", "Coco", "安娜",
  "徽音", "婉儿", "清照", "若兰", "晚吟", "易安", "如是", "半夏",
  "熬夜冠军", "奶茶续命", "秃头小宝贝", "迪士尼在逃公主", "精致穷", "只有脸好看", "吃土少女", "暴躁老姐", "发际线保卫者"
];

const BACKGROUND_STYLES: Record<BackgroundType, string> = {
    wood: "bg-[#2d1b15] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]",
    marble: "bg-[#eceff1] bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]",
    dark: "bg-[#121212] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]",
    felt: "bg-[#1b5e20] bg-[url('https://www.transparenttextures.com/patterns/felt.png')]",
    leather: "bg-[#3e2723] bg-[url('https://www.transparenttextures.com/patterns/leather.png')]",
    concrete: "bg-[#90a4ae] bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')]",
    linen: "bg-[#d7ccc8] bg-[url('https://www.transparenttextures.com/patterns/linen.png')]",
    silk: "bg-[#1a1a1a] bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]",
    starry: "bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
};

const getRandomName = () => RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];

const DEFAULT_SETTINGS: AppSettings = {
  background: 'wood',
  soundEnabled: true,
  aiPersona: 'professional',
  template: 'classic'
};

type ConsultationStep = 'name' | 'symptom' | 'photo' | 'review';

// Image compression utility
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl);
        } else {
            reject(new Error('Canvas context error'));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<PrescriptionCardType[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<CardPosition>({ x: 0, y: 0 });
  const isGesturing = useRef(false);

  // Settings & History
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('bcc_app_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
      try {
          const saved = localStorage.getItem('bcc_app_history');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistoryItem | null>(null);

  // Chat State
  const [chatVisible, setChatVisible] = useState(false);
  const [activeChatContext, setActiveChatContext] = useState<PrescriptionData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const chatInstanceRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const chatVideoInputRef = useRef<HTMLInputElement>(null);

  // Printing Animation
  const [printingData, setPrintingData] = useState<PrescriptionData | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paperFeed, setPaperFeed] = useState(false);

  // UI State
  const [mode, setMode] = useState<'quick' | 'consultation'>('quick');
  const [consultStep, setConsultStep] = useState<ConsultationStep>('name');
  const [isInputHidden, setIsInputHidden] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: getRandomName(),
    symptom: '',
    image: null as string | null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('bcc_app_settings', JSON.stringify(settings));
    setAudioMuted(!settings.soundEnabled);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('bcc_app_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (chatEndRef.current && chatVisible) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatVisible, attachments]);

  useEffect(() => {
    if (isPrinting) {
        setTimeout(() => setPaperFeed(true), 100);
    } else {
        setPaperFeed(false);
    }
  }, [isPrinting]);

  const refreshName = () => {
    setFormData(prev => ({ ...prev, name: getRandomName() }));
  };

  const handleGenerate = async (overrideSymptom?: string) => {
    if (loading || isPrinting) return;
    setLoading(true);

    const nameToUse = mode === 'quick' ? getRandomName() : formData.name;
    const symptomToUse = overrideSymptom || formData.symptom;
    const imageToUse = formData.image || undefined;
    
    const result = await generatePrescription(symptomToUse, nameToUse, imageToUse, settings.aiPersona);

    const dataWithImageAndTemplate: PrescriptionData = {
        ...result,
        userImage: imageToUse || undefined,
        template: settings.template 
    };

    setLoading(false);
    setPrintingData(dataWithImageAndTemplate);
    setIsPrinting(true);
    
    if (mode === 'consultation') {
        setConsultStep('name');
        setFormData(prev => ({ ...prev, symptom: '', image: null }));
    }
  };

  const handlePrintingComplete = () => {
    if (!printingData) return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const side = Math.random() > 0.5 ? 'left' : 'right';
    let randomX = side === 'left' ? Math.random() * (screenW * 0.2) : (screenW * 0.7) + Math.random() * (screenW * 0.2);
    let randomY = 100 + Math.random() * (screenH * 0.5);
    randomX = Math.max(20, Math.min(randomX, screenW - 350));

    const newCard: PrescriptionCardType = {
      id: Date.now().toString(),
      data: printingData,
      position: { x: randomX, y: randomY },
      rotation: Math.random() * 20 - 10,
      timestamp: Date.now(),
      isTypingComplete: true,
      userImage: printingData.userImage,
      scale: 1
    };

    setCards(prev => [...prev, newCard]);
    setSelectedId(newCard.id);
    
    setHistory(prev => [{
        id: newCard.id,
        timestamp: newCard.timestamp,
        data: newCard.data
    }, ...prev]);

    setPrintingData(null);
    setIsPrinting(false);
    setPaperFeed(false);
  };

  // --- Chat Functions ---
  
  const startChat = async (data: PrescriptionData) => {
      setViewingHistoryItem(null); // Close history detail view
      chatInstanceRef.current = createChatSession(data, settings.aiPersona);
      setActiveChatContext(data);
      setChatVisible(true);
      setShowHistory(false);
      setChatMessages([{ role: 'model', text: `你好，我是${data.patientName}的专属医美顾问。关于这份处方，你有什么想了解的吗？` }]);
      setAttachments([]);
      
      // Generate initial suggested questions
      setIsChatThinking(true);
      const prescriptionSummary = `处方: ${data.treatment}\n建议: ${data.advice}`;
      const suggestions = await generateChatSuggestions(prescriptionSummary, true);
      setChatSuggestions(suggestions);
      setIsChatThinking(false);
  };

  const handleChatAttachment = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Limit video size to 5MB
      if (type === 'video' && file.size > 5 * 1024 * 1024) {
          alert("视频文件不能超过 5MB (Video must be under 5MB)");
          return;
      }

      try {
          const base64 = await fileToBase64(file);
          setAttachments(prev => [...prev, {
              type,
              url: URL.createObjectURL(file),
              base64,
              mimeType: file.type
          }]);
      } catch (err) {
          console.error("File processing failed", err);
      }
      
      // Reset input
      e.target.value = '';
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Standard for modern browsers
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = () => {
                  const base64 = reader.result as string;
                  setAttachments(prev => [...prev, {
                      type: 'audio',
                      url: URL.createObjectURL(audioBlob),
                      base64: base64,
                      mimeType: 'audio/webm'
                  }]);
              };
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Microphone access denied", err);
          alert("无法访问麦克风 (Cannot access microphone)");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const sendChatMessage = async (overrideText?: string) => {
      const textToSend = overrideText || chatInput;
      if ((!textToSend.trim() && attachments.length === 0) || !chatInstanceRef.current) return;

      const userMsg = textToSend;
      const currentAttachments = [...attachments];

      setChatInput('');
      setAttachments([]);
      setChatSuggestions([]); // Clear suggestions while thinking
      
      setChatMessages(prev => [...prev, { 
          role: 'user', 
          text: userMsg,
          attachments: currentAttachments
      }]);
      setIsChatThinking(true);

      try {
          // Prepare parts for Gemini
          let parts: any[] = [];
          
          // Add attachments
          for (const att of currentAttachments) {
              const base64Data = att.base64.split(',')[1];
              parts.push({
                  inlineData: {
                      data: base64Data,
                      mimeType: att.mimeType
                  }
              });
          }
          
          // Add text
          if (userMsg.trim()) {
              parts.push({ text: userMsg });
          } else if (currentAttachments.length > 0 && currentAttachments[0].type === 'audio') {
             // Prompt for audio processing
             parts.push({ text: "请听这段语音并回答。" });
          }

          // @ts-ignore - SDK handles parts structure
          const result = await chatInstanceRef.current.sendMessageStream({ parts });
          
          let fullText = '';
          setChatMessages(prev => [...prev, { role: 'model', text: '' }]); 

          for await (const chunk of result) {
              const c = chunk as GenerateContentResponse;
              if (c.text) {
                  fullText += c.text;
                  setChatMessages(prev => {
                      const newHistory = [...prev];
                      newHistory[newHistory.length - 1].text = fullText;
                      return newHistory;
                  });
              }
          }
          
          // Generate new follow-up suggestions based on the AI's response
          const newSuggestions = await generateChatSuggestions(fullText, false);
          setChatSuggestions(newSuggestions);

      } catch (error) {
          console.error("Chat Error", error);
          setChatMessages(prev => [...prev, { role: 'model', text: "抱歉，连接似乎有点问题，请重试。" }]);
      } finally {
          setIsChatThinking(false);
      }
  };

  // --- Gestures & Interaction ---
  
  const handleCardPointerDown = (e: React.PointerEvent, id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    setCards(prev => [...prev.filter(c => c.id !== id), card]);
    setSelectedId(id); 
    setDragId(id); 
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragOffset({ x: e.clientX - card.position.x, y: e.clientY - card.position.y });
    e.stopPropagation();
  };
  
  const handleCardPointerMove = (e: React.PointerEvent) => {
      if (!dragId) return;
      e.preventDefault();
      setCards(prev => prev.map(card => {
          if (card.id === dragId) {
              return { ...card, position: { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } };
          }
          return card;
      }));
  };

  const handleCardPointerUp = (e: React.PointerEvent) => {
      if (dragId) {
          (e.target as Element).releasePointerCapture(e.pointerId);
          setDragId(null);
      }
  };
  
  const handleBackgroundClick = () => {
      if (!isGesturing.current) {
          setSelectedId(null); 
      }
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file);
        setFormData(prev => ({ ...prev, image: compressedDataUrl }));
        if (consultStep === 'photo') nextStep();
      } catch (error) {
        alert("照片处理失败，请重试");
      }
    }
  };

  const nextStep = () => {
    if (consultStep === 'name') setConsultStep('symptom');
    else if (consultStep === 'symptom') setConsultStep('photo');
    else if (consultStep === 'photo') setConsultStep('review');
  };

  const deleteHistory = (id: string) => {
      setHistory(prev => prev.filter(item => item.id !== id));
  };

  const restoreToDesk = (item: HistoryItem) => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const randomX = Math.random() * (screenW - 300);
      const randomY = 100 + Math.random() * (screenH * 0.5);

      const newCard: PrescriptionCardType = {
        id: Date.now().toString(),
        data: item.data,
        position: { x: randomX, y: randomY },
        rotation: Math.random() * 20 - 10,
        timestamp: item.timestamp,
        isTypingComplete: true,
        userImage: item.data.userImage,
        scale: 1
      };
    
      setCards(prev => [...prev, newCard]);
      setSelectedId(newCard.id);
      setShowHistory(false);
      setViewingHistoryItem(null);
  };

  return (
    <div 
        className={`w-full h-screen overflow-hidden flex flex-col items-center justify-between relative transition-colors duration-700 ease-in-out ${BACKGROUND_STYLES[settings.background]}`}
        onPointerMove={handleCardPointerMove}
        onPointerUp={handleCardPointerUp}
        onPointerLeave={handleCardPointerUp}
        onPointerDown={handleBackgroundClick} 
    >
      {/* Hidden Logo for WeChat Sharing Thumbnail */}
      <div style={{display: 'none'}}>
         <img src="https://docs.bccsw.cn/logo.png" alt="BCC Logo" />
      </div>

      <Header settings={settings} onSettingsChange={setSettings} />

      {/* Desk Area */}
      <div className="absolute inset-0 z-10 touch-none">
         {cards.map(card => (
             <PrescriptionCard 
                key={card.id} 
                card={card} 
                isSelected={selectedId === card.id}
                isDragging={dragId === card.id}
                onMouseDown={handleCardPointerDown}
                onClose={removeCard}
                onRestore={(id) => {}} 
             />
         ))}
      </div>

      {/* Main Interaction Area */}
      <main className="w-full flex flex-col items-center justify-end pb-0 z-20 h-full relative pointer-events-none">
        
        {isPrinting && printingData && (
            <div 
                className={`absolute bottom-[15%] left-1/2 -translate-x-1/2 z-30 transition-transform duration-[5000ms] ease-linear will-change-transform`}
                style={{ 
                    transform: paperFeed ? 'translate(-50%, -100%)' : 'translate(-50%, 40%)' 
                }}
            >
                <PrescriptionCard 
                    card={{
                        id: 'printing',
                        data: printingData,
                        position: { x: 0, y: 0 },
                        rotation: 0,
                        timestamp: Date.now(),
                        isTypingComplete: false,
                        userImage: printingData.userImage,
                        scale: 1
                    }}
                    isSelected={false}
                    isDragging={false}
                    onMouseDown={() => {}}
                    onClose={() => {}}
                    isStatic={true}
                />
            </div>
        )}

        <div className="mb-0 absolute bottom-0 w-full flex justify-center pointer-events-auto z-40">
            <Typewriter isPrinting={isPrinting} isLoading={loading} />
        </div>

        <div className={`
            w-full max-w-2xl bg-[#fdfbf7]/90 backdrop-blur-sm shadow-2xl rounded-t-3xl border-t border-white/50 p-6 md:p-8 
            transition-all duration-700 ease-in-out transform z-50 pb-24 md:pb-20 pointer-events-auto relative mb-2
            ${(isPrinting || loading || isInputHidden) ? 'translate-y-[120%] opacity-0' : 'translate-y-0 opacity-100'}
        `}>
          
          <button 
             onClick={() => setIsInputHidden(true)}
             className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-100"
             title="隐藏面板"
          >
             <ChevronDown size={24} />
          </button>

          <div className="flex justify-center mb-6">
            <div className="bg-stone-200 p-1 rounded-full flex gap-1 shadow-inner">
               <button 
                 onClick={() => setMode('quick')}
                 className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'quick' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
               >
                 快速处方
               </button>
               <button 
                 onClick={() => setMode('consultation')}
                 className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'consultation' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
               >
                 专家问诊
               </button>
            </div>
          </div>

          {mode === 'quick' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {QUICK_ISSUES.map((issue) => (
                  <button
                    key={issue.label}
                    onClick={() => handleGenerate(issue.value)}
                    disabled={loading}
                    className="p-3 bg-white border border-stone-200 rounded-xl hover:border-stone-400 hover:shadow-md transition-all text-left group active:scale-95"
                  >
                    <div className="font-bold text-stone-800 text-sm mb-1 group-hover:text-[#1a237e]">{issue.label}</div>
                    <div className="text-[10px] text-stone-500 line-clamp-1">{issue.value}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'consultation' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex gap-2 mb-6 justify-center">
                    {['name', 'symptom', 'photo', 'review'].map((step, i) => {
                        const steps: ConsultationStep[] = ['name', 'symptom', 'photo', 'review'];
                        const currentIndex = steps.indexOf(consultStep);
                        const stepIndex = steps.indexOf(step as ConsultationStep);
                        return (
                            <div key={step} className={`h-1 w-8 rounded-full transition-colors ${stepIndex <= currentIndex ? 'bg-stone-800' : 'bg-stone-200'}`}></div>
                        );
                    })}
                </div>

                <div className="min-h-[180px]">
                  {consultStep === 'name' && (
                      <div className="text-center">
                          <h3 className="font-chinese text-xl mb-4 font-bold">患者姓名</h3>
                          <div className="flex gap-2 justify-center items-center">
                              <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="bg-transparent border-b-2 border-stone-300 text-center text-xl py-2 w-48 focus:outline-none focus:border-stone-800 font-typewriter"
                              />
                              <button onClick={refreshName} className="p-2 text-stone-400 hover:text-stone-800" title="随机姓名">
                                  <RefreshCw size={18} />
                              </button>
                          </div>
                          <button onClick={nextStep} className="mt-8 bg-stone-800 text-white px-6 py-2 rounded-full font-bold hover:bg-black transition-all active:scale-95">
                              下一步
                          </button>
                      </div>
                  )}

                  {consultStep === 'symptom' && (
                      <div>
                          <h3 className="font-chinese text-lg mb-3 font-bold text-center">症状描述</h3>
                          <textarea 
                            value={formData.symptom}
                            onChange={(e) => setFormData({...formData, symptom: e.target.value})}
                            placeholder="请详细描述您的皮肤问题..."
                            className="w-full h-24 p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none text-sm"
                          ></textarea>
                          <div className="mt-4 text-center">
                            <button 
                                onClick={nextStep} 
                                disabled={!formData.symptom}
                                className="bg-stone-800 text-white px-6 py-2 rounded-full font-bold hover:bg-black transition-all disabled:opacity-50 active:scale-95"
                            >
                                下一步
                            </button>
                          </div>
                      </div>
                  )}

                  {consultStep === 'photo' && (
                      <div className="text-center">
                          <h3 className="font-chinese text-lg mb-4 font-bold">面部照片 (可选)</h3>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <div className="flex justify-center gap-4">
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-32 h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-stone-800 hover:text-stone-800 transition-all bg-white"
                              >
                                  {formData.image ? (
                                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                      <>
                                        <Camera size={24} />
                                        <span className="text-xs">点击上传</span>
                                      </>
                                  )}
                              </button>
                          </div>
                          <button onClick={nextStep} className="mt-6 text-stone-500 text-sm underline hover:text-stone-800">
                              {formData.image ? '确认照片' : '跳过此步'}
                          </button>
                      </div>
                  )}

                  {consultStep === 'review' && (
                      <div className="text-center">
                          <h3 className="font-chinese text-lg mb-2 font-bold">确认信息</h3>
                          <div className="bg-white p-4 rounded-xl border border-stone-200 text-left text-sm mb-4 shadow-sm">
                              <p><span className="text-stone-400">姓名:</span> {formData.name}</p>
                              <p className="truncate"><span className="text-stone-400">症状:</span> {formData.symptom}</p>
                              <p><span className="text-stone-400">照片:</span> {formData.image ? '已上传' : '无'}</p>
                          </div>
                          <button 
                            onClick={() => handleGenerate()} 
                            className="bg-[#1a237e] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#283593] transition-all flex items-center gap-2 mx-auto active:scale-95"
                          >
                              <Sparkles size={18} /> 生成处方
                          </button>
                      </div>
                  )}
                </div>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-stone-200/50 flex justify-between items-end text-xs text-stone-400">
             <div className="flex flex-col gap-1">
               <div className="italic font-chinese font-bold text-stone-500">BCC 美容皮肤科小智</div>
             </div>
             <div>EST. 2025</div>
          </div>
        </div>
        
        {!isPrinting && !loading && isInputHidden && (
            <button 
                onClick={() => setIsInputHidden(false)}
                className="fixed bottom-8 right-4 z-[70] bg-slate-600 text-white p-3 md:px-5 md:py-3 rounded-full shadow-2xl hover:bg-slate-700 transition-all active:scale-95 animate-float-subtle flex items-center gap-2 border-2 border-white/20 pointer-events-auto"
            >
                <MessageSquarePlus size={24} />
                <span className="font-bold hidden md:inline">问诊 / Diagnosis</span>
            </button>
        )}
        
        {!isPrinting && !loading && (
            <button 
                onClick={() => setShowHistory(true)}
                className="fixed bottom-8 left-4 z-[70] bg-stone-800/80 backdrop-blur-sm text-white p-3 rounded-full shadow-xl hover:bg-stone-900 transition-all active:scale-95 pointer-events-auto border border-white/10"
                title="处方历史"
            >
                <History size={24} />
            </button>
        )}

        {/* History List Modal */}
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 pointer-events-auto">
            <div className="bg-[#fcfbf9] w-full max-w-md rounded shadow-2xl border border-stone-300 relative h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t">
                  <h3 className="font-chinese font-bold text-lg flex items-center gap-2 text-stone-800"><History size={20}/> 处方历史 / History</h3>
                  <button onClick={() => setShowHistory(false)} className="text-stone-400 hover:text-stone-800"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {history.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-stone-400">
                         <History size={48} className="mb-2 opacity-20"/>
                         <p>暂无历史记录</p>
                     </div>
                  ) : (
                     history.map(item => (
                        <div key={item.id} className="bg-white rounded-lg border border-stone-200 shadow-sm hover:border-stone-400 transition-all group overflow-hidden">
                            <div 
                                className="p-3 cursor-pointer hover:bg-stone-50 transition-colors"
                                onClick={() => setViewingHistoryItem(item)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-chinese font-bold text-stone-800 text-base">
                                            {item.data.patientName}
                                        </div>
                                        <div className="text-[10px] text-stone-400">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                                        {item.data.diagnosis}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                     <span className="text-xs text-stone-500 truncate max-w-[180px]">{item.data.treatment}</span>
                                     <ChevronRight size={16} className="text-stone-300"/>
                                </div>
                            </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Standalone History Item View */}
        {viewingHistoryItem && (
            <div 
                className="fixed inset-0 z-[105] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300"
                onClick={() => setViewingHistoryItem(null)}
            >
                <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="relative transform scale-90 md:scale-100 transition-transform max-w-[90vw]"
                >
                    <PrescriptionCard 
                        card={{
                            id: viewingHistoryItem.id,
                            data: viewingHistoryItem.data,
                            position: { x: 0, y: 0 },
                            rotation: 0,
                            timestamp: viewingHistoryItem.timestamp,
                            isTypingComplete: true,
                            userImage: viewingHistoryItem.data.userImage,
                            scale: 1
                        }}
                        isSelected={false}
                        isDragging={false}
                        onMouseDown={() => {}}
                        onClose={() => setViewingHistoryItem(null)}
                        isStatic={true}
                    />
                    
                    {/* Action Bar for Standalone View */}
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col md:flex-row gap-3 w-full justify-center items-center min-w-[280px]">
                        <button 
                            onClick={() => startChat(viewingHistoryItem.data)}
                            className="w-full bg-[#d4af37] hover:bg-[#c4a030] text-black px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 animate-bounce"
                        >
                           <MessageCircleQuestion size={18} /> 咨询 AI 医生 / Ask Doctor
                        </button>
                        <button 
                            onClick={() => restoreToDesk(viewingHistoryItem)}
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-full backdrop-blur-md text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                           <LayoutTemplate size={18} /> 恢复到桌面 / Restore
                        </button>
                    </div>
                </div>
                
                <button 
                    onClick={() => setViewingHistoryItem(null)}
                    className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full"
                >
                    <X size={24} />
                </button>
            </div>
        )}

        {/* Elegant Chat Modal (Dr. AI) */}
        {chatVisible && activeChatContext && (
             <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200 pointer-events-auto">
                <div className="bg-[#1c1917] w-full h-[95vh] sm:h-[700px] sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-300 overflow-hidden border border-[#d4af37]/30 ring-1 ring-white/10">
                    
                    {/* Elegant Header */}
                    <div className="px-6 py-4 bg-[#292524] border-b border-[#d4af37]/20 flex justify-between items-center shadow-md z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#a68b2d] p-0.5 shadow-lg">
                                <div className="w-full h-full rounded-full bg-[#1c1917] flex items-center justify-center">
                                    <Bot size={20} className="text-[#d4af37]"/>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-chinese font-bold text-lg text-[#e7e5e4] tracking-wide">BCC 专家顾问</h3>
                                <div className="text-[10px] text-[#a8a29e] flex items-center gap-1 uppercase tracking-wider">
                                    AI Consultant · {activeChatContext.patientName}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setChatVisible(false)} 
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#a8a29e] hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[#1c1917] custom-scrollbar space-y-6">
                        <div className="flex justify-center py-2">
                             <span className="text-[10px] text-[#d4af37] border border-[#d4af37]/30 px-3 py-1 rounded-full bg-[#d4af37]/5 tracking-widest uppercase">
                                 Diagnosis: {activeChatContext.diagnosis}
                             </span>
                        </div>
                        
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`
                                    max-w-[85%] p-4 text-sm leading-relaxed shadow-lg
                                    ${msg.role === 'user' 
                                        ? 'bg-[#44403c] text-white rounded-2xl rounded-tr-sm border border-white/10' 
                                        : 'bg-[#f5f5f4] text-stone-900 rounded-2xl rounded-tl-sm border border-stone-200'}
                                `}>
                                    {/* Attachments in bubble */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {msg.attachments.map((att, i) => (
                                                <div key={i} className="rounded-lg overflow-hidden border border-white/20 w-20 h-20 relative">
                                                    {att.type === 'image' && <img src={att.url} className="w-full h-full object-cover" />}
                                                    {att.type === 'video' && <video src={att.url} className="w-full h-full object-cover" />}
                                                    {att.type === 'audio' && <div className="w-full h-full flex items-center justify-center bg-stone-800"><Volume2 size={16} className="text-white"/></div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        
                        {isChatThinking && (
                            <div className="flex justify-start">
                                <div className="bg-[#f5f5f4] p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Suggestions Area */}
                    {chatSuggestions.length > 0 && !isChatThinking && (
                        <div className="px-4 py-3 bg-[#1c1917]/95 border-t border-[#d4af37]/10 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                             {chatSuggestions.map((sug, i) => (
                                 <button 
                                    key={i}
                                    onClick={() => sendChatMessage(sug)}
                                    className="whitespace-nowrap px-3 py-1.5 bg-[#292524] border border-[#d4af37]/30 text-[#d4af37] text-xs rounded-full hover:bg-[#d4af37] hover:text-black transition-colors active:scale-95 flex-shrink-0"
                                 >
                                     {sug}
                                 </button>
                             ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-[#292524] border-t border-[#d4af37]/20">
                        {attachments.length > 0 && (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                {attachments.map((att, i) => (
                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-600 group shrink-0">
                                        {att.type === 'image' && <img src={att.url} className="w-full h-full object-cover" />}
                                        {att.type === 'video' && <video src={att.url} className="w-full h-full object-cover" />}
                                        {att.type === 'audio' && <div className="w-full h-full bg-stone-700 flex items-center justify-center"><Volume2 className="text-white"/></div>}
                                        <button 
                                            onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-0 right-0 bg-black/50 text-white p-0.5 hover:bg-red-600"
                                        >
                                            <X size={12}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-end gap-3">
                            {/* Hidden Inputs */}
                            <input type="file" accept="image/*" ref={chatImageInputRef} className="hidden" onChange={(e) => handleChatAttachment(e, 'image')} />
                            <input type="file" accept="video/*" ref={chatVideoInputRef} className="hidden" onChange={(e) => handleChatAttachment(e, 'video')} />

                            <div className="flex gap-1 pb-1">
                                <button 
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'text-[#a8a29e] hover:text-[#d4af37] hover:bg-white/5'}`}
                                    title="语音 (Voice)"
                                >
                                    <Mic size={20} />
                                </button>
                                <button 
                                    onClick={() => chatImageInputRef.current?.click()}
                                    className="p-2 text-[#a8a29e] hover:text-[#d4af37] hover:bg-white/5 rounded-full transition-colors"
                                    title="图片 (Image)"
                                >
                                    <ImageIcon size={20} />
                                </button>
                                <button 
                                    onClick={() => chatVideoInputRef.current?.click()}
                                    className="p-2 text-[#a8a29e] hover:text-[#d4af37] hover:bg-white/5 rounded-full transition-colors"
                                    title="短视频 (Video < 5MB)"
                                >
                                    <Video size={20} />
                                </button>
                            </div>

                            <div className="flex-1 bg-[#1c1917] border border-[#44403c] rounded-2xl flex items-center px-3 py-2 focus-within:border-[#d4af37]/50 focus-within:ring-1 focus-within:ring-[#d4af37]/20 transition-all">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                                    placeholder="输入消息..."
                                    className="flex-1 bg-transparent text-stone-200 placeholder-stone-600 text-sm focus:outline-none"
                                />
                            </div>
                            
                            <button 
                                onClick={() => sendChatMessage()}
                                disabled={(!chatInput.trim() && attachments.length === 0) || isChatThinking}
                                className="bg-[#d4af37] text-black p-2.5 rounded-full hover:bg-[#facc15] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 mb-0.5"
                            >
                                <SendHorizontal size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {!isPrinting && !loading && (
            <footer className="absolute bottom-2 z-60 w-full flex flex-col items-center justify-center pointer-events-auto pb-1 pointer-events-none">
                 <a href="https://work.weixin.qq.com/kfid/kfcfc2a809493f31e8f" target="_blank" rel="noopener noreferrer" className="mb-2 transition-transform hover:scale-105 block pointer-events-auto">
                   <img src="https://docs.bccsw.cn/consultant.png" alt="Consultant QR" className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-md bg-white p-1 rounded-sm" />
                </a>
            </footer>
        )}

      </main>
    </div>
  );
};

export default App;
