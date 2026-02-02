
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  Video, ImageIcon, MessageSquare, Sparkles,
  Send, Upload, Download, RefreshCw, Loader2, Info, Bot,
  Settings, CheckCircle2, Maximize, Image as LucideImage,
  Wand2, Eraser, Layout, AlertTriangle, Play, Zap, ShieldCheck,
  Globe, Cpu, Link as LinkIcon, X
} from 'lucide-react';

declare global {
  interface Window {
    aistudio: any;
  }
}

const AICenter: React.FC<{ user: any }> = ({ user }) => {
  const [activeTool, setActiveTool] = useState<'video' | 'image' | 'chat'>('chat');
  const [apiKeyStatus, setApiKeyStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // --- API Key Management ---
  // --- API Key Management ---
  const [manualKey, setManualKey] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      // Check for manual key first
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) {
        setApiKeyStatus('connected');
        return;
      }

      // Then check AI Studio extension
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyStatus(hasKey ? 'connected' : 'disconnected');
      } else {
        setApiKeyStatus('disconnected');
      }
    };
    checkStatus();
  }, []);

  const handleSaveManualKey = () => {
    if (manualKey) {
      localStorage.setItem('gemini_api_key', manualKey);
      setApiKeyStatus('connected');
      alert('تم حفظ المفتاح بنجاح! يمكنك الآن استخدام أدوات الذكاء الاصطناعي.');
    }
  };

  const getApiKey = async () => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) return stored;
    return process.env.API_KEY; // Fallback to env
  };

  const checkKeyBeforeAction = async () => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) return true;

    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        return true;
      }
      return true;
    }

    // If no key and no extension
    const key = prompt('الرجاء إدخال مفتاح Gemini API الخاص بك للمتابعة:');
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      setApiKeyStatus('connected');
      return true;
    }
    return false;
  };

  // --- Image Studio States ---
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'generate' | 'edit'>('generate');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Video Studio States (Veo) ---
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // --- Chat States (Ad-Damiri) ---
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>(() => {
    // Load history from localStorage on init
    const saved = localStorage.getItem('ai_chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isChatting, setIsChatting] = useState(false);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // --- Handlers ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageMode('edit');
        setResultImageUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageAction = async () => {
    if (!imagePrompt) return;
    setIsProcessingImage(true);
    setError(null);

    try {
      await checkKeyBeforeAction();
      const key = await getApiKey();
      const ai = new GoogleGenAI({ apiKey: key });

      let response;
      if (imageMode === 'generate') {
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: imagePrompt }] },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: imageSize
            }
          }
        });
      } else {
        if (!selectedImage) {
          setError("يرجى رفع صورة أولاً للبدء في التعديل.");
          setIsProcessingImage(false);
          return;
        }
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.split(';')[0].split(':')[1];

        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: mimeType } },
              { text: imagePrompt }
            ]
          }
        });
      }

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        setResultImageUrl(`data:image/png;base64,${part.inlineData.data}`);
      } else {
        setError("لم يرجع النموذج أي بيانات، حاول تبسيط الوصف.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("المفتاح المختار غير مفعل أو لا يدعم هذا الموديل. يرجى اختيار مفتاح مشروع مدفوع.");
        await window.aistudio.openSelectKey();
      } else {
        setError("حدث خطأ تقني. تأكد من تفعيل الفوترة لمشروعك في Google Cloud.");
      }
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt) return;
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    setError(null);

    try {
      await checkKeyBeforeAction();
      const key = await getApiKey();
      const ai = new GoogleGenAI({ apiKey: key });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: videoAspectRatio }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const key = await getApiKey();
        const res = await fetch(`${downloadLink}&key=${key}`);
        const blob = await res.blob();
        setGeneratedVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(err);
      setError("خطأ في إنتاج الفيديو. يتطلب موديل Veo حساباً بفوترة مفعلة.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput) return;
    const msg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatting(true);

    try {
      const key = await getApiKey();
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: msg,
        config: {
          systemInstruction: "أنت الدميري، المساعد الذكي لوكالة كابتن ستار للتسويق في السعودية. أنت خبير في صياغة المحتوى، تحليل الترندات، ومساعدة فريق الوكالة في المهام اليومية بلهجة سعودية مهنية."
        }
      });
      setChatHistory(prev => [...prev, { role: 'model', text: response.text || "عذراً، لم أستطع الرد حالياً." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700 font-sans" dir="rtl">
      {/* --- Header & Status --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-rose-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 leading-tight">مركز النجم للذكاء الاصطناعي</h1>
              {apiKeyStatus === 'connected' ? (
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100 flex items-center gap-1.5 animate-in zoom-in-90 duration-300">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  المفتاح متصل
                </div>
              ) : apiKeyStatus === 'disconnected' ? (
                <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black border border-rose-100 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                  المفتاح غير مربوط
                </div>
              ) : (
                <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black border border-slate-100">
                  جاري التحقق...
                </div>
              )}
            </div>
            <p className="text-slate-500 font-bold mt-1 text-lg">استخدم مفتاحك الآن لتفعيل أقوى نماذج Gemini Pro و Veo.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {apiKeyStatus !== 'connected' && (
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="أدخل Gemini API Key هنا..."
                value={manualKey}
                onChange={e => setManualKey(e.target.value)}
                className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-500"
              />
              <button onClick={handleSaveManualKey} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-rose-600 transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          )}
          {apiKeyStatus === 'connected' && (
            <button
              onClick={() => { localStorage.removeItem('gemini_api_key'); setApiKeyStatus('disconnected'); }}
              className="px-6 py-3 bg-rose-50 text-rose-600 font-black rounded-xl hover:bg-rose-100 transition-all text-xs"
            >
              فصل المفتاح
            </button>
          )}
        </div>
      </div>

      {/* --- Tool Selector --- */}
      <div className="bg-white p-2 rounded-[2.5rem] border-2 border-slate-100 shadow-xl inline-flex flex-wrap gap-1">
        {[
          { id: 'chat', label: 'الدميري (Chat)', icon: Bot },
          { id: 'image', label: 'استوديو الصور (Gemini 3 Pro)', icon: ImageIcon },
          { id: 'video', label: 'مصنع الفيديو (Veo)', icon: Video },
        ].map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as any)}
            className={`px-10 py-4 rounded-2xl text-sm font-black transition-all duration-300 flex items-center gap-3 ${activeTool === tool.id ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <tool.icon className={`w-5 h-5 ${activeTool === tool.id ? 'text-rose-500' : ''}`} />
            {tool.label}
          </button>
        ))}
      </div>

      {/* --- Main Workspace --- */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[700px] flex flex-col relative transition-all">

        {/* Error Notification */}
        {error && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 px-8 py-4 rounded-2xl flex items-center gap-4 shadow-2xl">
              <AlertTriangle className="w-6 h-6" />
              <p className="font-bold text-sm">{error}</p>
              <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- IMAGE STUDIO --- */}
        {activeTool === 'image' && (
          <div className="p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">وضع العمل</label>
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex p-1 bg-white border border-slate-100 rounded-2xl">
                    <button
                      onClick={() => { setImageMode('generate'); setSelectedImage(null); }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${imageMode === 'generate' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Wand2 className="w-4 h-4" /> توليد (Pro)
                    </button>
                    <button
                      onClick={() => setImageMode('edit')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${imageMode === 'edit' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Eraser className="w-4 h-4" /> تعديل (Flash)
                    </button>
                  </div>
                </div>

                {imageMode === 'edit' && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-44 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition-all overflow-hidden shadow-inner group"
                  >
                    {selectedImage ? <img src={selectedImage} className="w-full h-full object-contain" /> : <><Upload className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform" /><p className="text-sm font-black text-slate-400 mt-3">ارفع صورة الأصول للتعديل</p></>}
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">وصف الإبداع المتقدم (Prompt)</label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder={imageMode === 'generate' ? "رائد فضاء يركب جملاً في صحراء العلا، أسلوب واقعي، إضاءة سينمائية..." : "أضف سماء وردية، أزل الشخص الواقف، اجعل الألوان دافئة..."}
                    className="w-full h-40 bg-white border-2 border-slate-100 rounded-[2rem] p-8 outline-none focus:border-rose-200 transition-all resize-none font-bold text-slate-800 shadow-sm"
                  />
                </div>

                {imageMode === 'generate' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الدقة القصوى (Pro)</label>
                      <div className="flex gap-2">
                        {(['1K', '2K', '4K'] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => setImageSize(size)}
                            className={`flex-1 py-3 rounded-xl font-black text-xs border-2 transition-all ${imageSize === size ? 'border-rose-600 bg-rose-50 text-rose-600 shadow-inner' : 'border-white bg-white text-slate-400'}`}
                          >{size}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الأبعاد السينمائية</label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as any)}
                        className="w-full bg-white border-2 border-white rounded-xl py-3 px-4 font-black text-xs outline-none focus:border-rose-100 appearance-none cursor-pointer"
                      >
                        <option value="1:1">1:1 (مربع السوشيال)</option>
                        <option value="16:9">16:9 (عرضي سينمائي)</option>
                        <option value="9:16">9:16 (طولي تيك توك)</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={processImageAction}
                  disabled={isProcessingImage || !imagePrompt}
                  className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center justify-center gap-4 text-lg active:scale-95"
                >
                  {isProcessingImage ? <Loader2 className="w-7 h-7 animate-spin" /> : <Zap className="w-7 h-7 text-rose-500 animate-pulse" />}
                  {imageMode === 'generate' ? 'توليد الصورة بـ Gemini 3 Pro' : 'تطبيق التعديلات بـ Gemini 2.5'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden min-h-[550px] shadow-inner group">
              {resultImageUrl ? (
                <div className="relative w-full h-full animate-in zoom-in-95 duration-700">
                  <img src={resultImageUrl} className="w-full h-full object-contain" alt="AI Result" />
                  <div className="absolute bottom-10 left-10 flex gap-4">
                    <a
                      href={resultImageUrl}
                      download={`CaptainStar_AI_${Date.now()}.png`}
                      className="p-6 bg-white rounded-[1.75rem] shadow-2xl text-slate-900 font-black flex items-center gap-3 hover:bg-rose-600 hover:text-white transition-all scale-100 hover:scale-105"
                    >
                      <Download className="w-6 h-6" /> تحميل العمل
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center opacity-10 flex flex-col items-center">
                  <div className="w-32 h-32 bg-slate-200 rounded-[3rem] flex items-center justify-center mb-6">
                    <LucideImage className="w-16 h-16" />
                  </div>
                  <h4 className="text-2xl font-black">جاهز لاستقبال إبداعك</h4>
                  <p className="text-sm font-bold mt-2">المفتاح متصل وجاهز للمعالجة</p>
                </div>
              )}

              {isProcessingImage && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center space-y-6 z-20">
                  <div className="relative">
                    <div className="w-20 h-20 border-8 border-slate-100 border-t-rose-600 rounded-full animate-spin"></div>
                    <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-rose-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">جاري المعالجة الفنية...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CHAT TOOL --- */}
        {activeTool === 'chat' && (
          <div className="flex-1 flex flex-col p-8 lg:p-12">
            <div className="flex-1 overflow-y-auto space-y-8 mb-10 pr-2 scrollbar-hide">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40 py-20">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                    <Bot className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">أهلاً بك يا زميل، أنا الدميري.<br />كيف أقدر أخدمك اليوم؟</h3>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-7 rounded-[2.5rem] text-sm font-bold leading-relaxed shadow-sm border ${msg.role === 'user' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-rose-600 text-white border-rose-500 shadow-rose-200/50'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-end">
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                    <span className="text-xs font-black text-slate-400 italic">الدميري يكتب...</span>
                  </div>
                </div>
              )}
            </div>
            <div className="relative group p-4 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="اطلب أفكاراً، تحليلاً، أو محتوى إبداعياً..."
                className="w-full bg-white border-2 border-transparent focus:border-rose-100 rounded-[2.5rem] py-6 px-10 pr-16 outline-none transition-all font-bold shadow-sm"
              />
              <button onClick={handleChat} className="absolute left-6 top-1/2 -translate-y-1/2 p-5 bg-rose-600 text-white rounded-[2rem] shadow-xl hover:bg-rose-700 transition-all active:scale-90">
                <Send className="w-6 h-6 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* --- VIDEO STUDIO --- */}
        {activeTool === 'video' && (
          <div className="flex-1 p-10 lg:p-14 flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-500">
            <div className="w-full max-w-3xl space-y-10">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600 mx-auto shadow-inner border border-rose-100">
                  <Video className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">مصنع الفيديو الذكي (Veo 3.1)</h2>
                <p className="text-slate-500 font-bold max-w-lg mx-auto italic">حول نصوصك إلى لقطات سينمائية واقعية بدقة 720p. الإنتاج يستغرق دقائق، اجلس واستمتع.</p>
              </div>

              <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-100 space-y-8 shadow-inner">
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="وصف المشهد: لقطة جوية لصحراء النفود وقت الشروق، حركة كاميرا انسيابية..."
                  className="w-full h-44 bg-white border-2 border-transparent focus:border-rose-100 rounded-[2.5rem] p-8 font-bold outline-none shadow-sm transition-all resize-none"
                />
                <div className="flex gap-4">
                  <button onClick={() => setVideoAspectRatio('16:9')} className={`flex-1 py-4 rounded-2xl font-black text-xs border-2 transition-all ${videoAspectRatio === '16:9' ? 'border-rose-600 bg-rose-50 text-rose-600' : 'border-white bg-white text-slate-400'}`}>16:9 (عرضي)</button>
                  <button onClick={() => setVideoAspectRatio('9:16')} className={`flex-1 py-4 rounded-2xl font-black text-xs border-2 transition-all ${videoAspectRatio === '9:16' ? 'border-rose-600 bg-rose-50 text-rose-600' : 'border-white bg-white text-slate-400'}`}>9:16 (طولي)</button>
                </div>
                <button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo || !videoPrompt}
                  className="w-full py-7 bg-slate-900 text-white font-black rounded-[2.5rem] text-xl shadow-2xl hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  {isGeneratingVideo ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 text-rose-500" />}
                  {isGeneratingVideo ? 'جاري الإنتاج (يستغرق دقائق)...' : 'بدأ عملية التصوير (Veo)'}
                </button>
              </div>
            </div>
            {generatedVideoUrl && (
              <div className="w-full max-w-4xl space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                <video src={generatedVideoUrl} controls className="w-full rounded-[3.5rem] border-8 border-white shadow-3xl bg-slate-900" />
                <div className="flex justify-center">
                  <a href={generatedVideoUrl} download="CS_Veo_AI.mp4" className="px-10 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-900 hover:border-rose-600 transition-all flex items-center gap-3 shadow-xl">
                    <Download className="w-6 h-6 text-rose-600" /> تحميل الفيديو النهائي
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Footer Note --- */}
      <div className="flex items-center justify-center gap-10 text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">تفعيل Gemini 3 Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">اتصال آمن ومباشر</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">خوادم معالجة سريعة</span>
        </div>
      </div>
    </div>
  );
};

export default AICenter;
