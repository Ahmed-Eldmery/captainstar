import React, { useState, useRef, useEffect } from 'react';
import { Users, Send, MessageSquare, ChevronLeft } from 'lucide-react';



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
export default function ChatPage({ users = [] }) {
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
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, selectedUser]);

  const handleSend = () => {
    if (!input.trim() || !selectedUser) return;
    setMessages(msgs => [...msgs, { from: 'me', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: selectedUser.id, text: '👍' }]);
    }, 800);
  };

  return (
    <div className="w-full h-full min-h-screen bg-white flex font-ibm-plex-arabic">
      {/* قائمة المستخدمين */}
      <aside className="w-80 min-w-[260px] max-w-xs bg-rose-50 border-l border-rose-100 flex flex-col">
        <div className="p-6 border-b border-rose-100 bg-rose-600 rounded-bl-3xl flex items-center gap-3">
          <Users className="w-6 h-6 text-white" />
          <span className="font-black text-white text-lg tracking-tight">دردشة الفريق</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {users.map(u => (
            <button
              key={u.id}
              className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all text-right font-bold text-lg font-ibm-plex-arabic ${selectedUser?.id === u.id ? 'bg-rose-100 text-rose-700' : 'hover:bg-rose-100 text-slate-800'}`}
              onClick={() => setSelectedUser(u)}
            >
              <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=rose&color=fff`} alt={u.name} className="w-12 h-12 rounded-full border-2 border-rose-200" />
              <span>{u.name}</span>
            </button>
          ))}
        </div>
      </aside>
      {/* نافذة الشات */}
      <main className="flex-1 flex flex-col h-full bg-white">
        {!selectedUser ? (
          <div className="flex flex-1 items-center justify-center text-slate-400 font-black text-2xl font-ibm-plex-arabic">
            <MessageSquare className="w-10 h-10 mb-4 text-rose-200" />
            اختر مستخدم لبدء المحادثة
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <div className="p-6 border-b border-rose-100 bg-rose-600 flex items-center gap-3">
              <button onClick={() => setSelectedUser(null)} className="text-white hover:text-rose-200"><ChevronLeft className="w-6 h-6" /></button>
              <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full border-2 border-rose-200" />
              <span className="font-black text-white text-lg font-ibm-plex-arabic">{selectedUser.name}</span>
            </div>
            <div ref={chatRef} className="flex-1 p-8 space-y-3 overflow-y-auto bg-white text-right max-h-[calc(100vh-180px)] font-ibm-plex-arabic">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-5 py-3 max-w-[70%] text-base font-bold shadow font-ibm-plex-arabic ${msg.from === 'me' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <form className="flex border-t border-rose-100 p-6 gap-3 bg-rose-50" onSubmit={e => { e.preventDefault(); handleSend(); }}>
              <input
                className="flex-1 rounded-xl border-2 border-rose-200 px-5 py-3 text-base outline-none focus:border-rose-400 font-ibm-plex-arabic"
                placeholder={`اكتب رسالة إلى ${selectedUser.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                dir="rtl"
              />
              <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 py-3 font-black font-ibm-plex-arabic">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
