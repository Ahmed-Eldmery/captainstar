import React, { useState, useRef, useEffect } from 'react';
import { Users, X, Send, MessageSquare, ChevronLeft } from 'lucide-react';



const FAKE_MESSAGES = {
  '1': [
    { from: '1', text: 'السلام عليكم! كيف حالك؟' },
    { from: 'me', text: 'وعليكم السلام! تمام الحمد لله.' },
  ],
  '2': [
    { from: '2', text: 'ممكن تساعدني في مهمة؟' },
    { from: 'me', text: 'أكيد، ابعتلي التفاصيل.' },
  ],
  '3': [
    { from: 'me', text: 'صباح الخير يا أحمد!' },
    { from: '3', text: 'صباح النور 😊' },
  ],
};


// users prop: array of user objects from team
export default function ChatSidebar({ users = [] }) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      setMessages(FAKE_MESSAGES[selectedUser.id] || []);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim() || !selectedUser) return;
    setMessages(msgs => [...msgs, { from: 'me', text: input }]);
    setInput('');
    // إضافة رسالة وهمية كرد تلقائي
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: selectedUser.id, text: '👍' }]);
    }, 800);
  };

  return (
    <>
      {/* زر عائم لفتح الدردشة */}
      <button
        className="fixed bottom-8 right-8 z-50 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl transition-all font-ibm-plex-arabic"
        onClick={() => setOpen(o => !o)}
        aria-label="دردشة الفريق"
      >
        {open ? <X className="w-8 h-8" /> : <Users className="w-8 h-8" />}
      </button>
      {/* الشات سايدبار */}
      {open && (
        <div className="fixed bottom-28 right-8 z-50 w-96 max-w-[95vw] bg-white rounded-3xl shadow-2xl border-2 border-rose-200 flex flex-col animate-in fade-in slide-in-from-bottom-4 overflow-hidden font-ibm-plex-arabic">
          {!selectedUser ? (
            <div className="flex flex-col h-96">
              <div className="p-5 border-b flex items-center gap-3 bg-rose-600 rounded-t-3xl">
                <Users className="w-6 h-6 text-white" />
                <span className="font-black text-white text-lg">دردشة الفريق</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {users.map(u => (
                  <button
                    key={u.id}
                    className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-rose-50 transition-all text-right font-ibm-plex-arabic"
                    onClick={() => setSelectedUser(u)}
                  >
                    <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=rose&color=fff`} alt={u.name} className="w-12 h-12 rounded-full border-2 border-rose-200" />
                    <span className="font-bold text-lg text-slate-800 font-ibm-plex-arabic">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-96">
              <div className="p-5 border-b flex items-center gap-3 bg-rose-600 rounded-t-3xl">
                <button onClick={() => setSelectedUser(null)} className="text-white hover:text-rose-200"><ChevronLeft className="w-6 h-6" /></button>
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full border-2 border-rose-200" />
                <span className="font-black text-white text-lg font-ibm-plex-arabic">{selectedUser.name}</span>
              </div>
              <div ref={chatRef} className="flex-1 p-5 space-y-3 overflow-y-auto max-h-60 text-right font-ibm-plex-arabic">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm font-bold shadow font-ibm-plex-arabic ${msg.from === 'me' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form className="flex border-t p-3 gap-2 bg-rose-50 rounded-b-3xl font-ibm-plex-arabic" onSubmit={e => { e.preventDefault(); handleSend(); }}>
                <input
                  className="flex-1 rounded-xl border-2 border-rose-200 px-4 py-2 text-sm outline-none focus:border-rose-400 font-ibm-plex-arabic"
                  placeholder={`اكتب رسالة إلى ${selectedUser.name}...`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  dir="rtl"
                />
                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 font-black font-ibm-plex-arabic">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
