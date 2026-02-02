import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const FAQ = [
  { q: 'كيف أضيف عميل جديد؟', a: 'من صفحة العملاء، اضغط على زر "إضافة عميل جديد" واملأ البيانات المطلوبة.' },
  { q: 'كيف أرفع ملف؟', a: 'من صفحة الملفات، اضغط على زر "رفع ملف" واختر الملف من جهازك.' },
  { q: 'ما معنى حالة المهمة "قيد التنفيذ"؟', a: 'تعني أن المهمة بدأ العمل عليها من قبل أحد أعضاء الفريق.' },
  { q: 'كيف أعدل بيانات مشروع؟', a: 'من صفحة المشاريع، اضغط على المشروع ثم زر التعديل أعلى الصفحة.' },
  { q: 'كيف أستخدم الدردشة؟', a: 'اضغط على أيقونة الدردشة الجانبية لبدء محادثة مع أي عضو في الفريق.' },
];

export default function ChatBotFloating() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'مرحباً 👋! أنا الدميري، مساعدك الذكي. اسألني عن أي ميزة أو زر أو صفحة في النظام.' }
  ]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages(msgs => [...msgs, userMsg]);
    // رد تلقائي بسيط
    const found = FAQ.find(f => input.includes(f.q.split(' ')[1]));
    setTimeout(() => {
      setMessages(msgs => [
        ...msgs,
        { from: 'bot', text: found ? found.a : 'سؤالك غير واضح. جرب صياغة أخرى أو اسأل عن زر أو صفحة محددة.' }
      ]);
    }, 700);
    setInput('');
  };

  return (
    <>
      {/* زر عائم */}
      <button
        className="fixed bottom-8 left-8 z-50 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl transition-all"
        onClick={() => setOpen(o => !o)}
        aria-label="مساعد كابتن ستار"
      >
        {open ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
      </button>
      {/* نافذة الشات بوت */}
      {open && (
        <div className="fixed bottom-28 left-8 z-50 w-80 max-w-[90vw] bg-white rounded-3xl shadow-2xl border-2 border-rose-100 flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 border-b flex items-center gap-3 bg-rose-600 rounded-t-3xl">
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="font-black text-white text-lg">الدميري</span>
          </div>
          <div ref={chatRef} className="flex-1 p-5 space-y-3 overflow-y-auto max-h-80 text-right">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm font-bold shadow ${msg.from === 'user' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form className="flex border-t p-3 gap-2 bg-slate-50 rounded-b-3xl" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <input
              className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-400"
              placeholder="اسألني عن أي شيء..."
              value={input}
              onChange={e => setInput(e.target.value)}
              dir="rtl"
            />
            <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 font-black">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
