import React, { useState, useRef, useEffect } from 'react';
import { Users, X, Send, MessageSquare, ChevronLeft } from 'lucide-react';
import { supabase, db, generateId } from '../lib/supabase';



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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Load current user
  useEffect(() => {
    const saved = localStorage.getItem('cs_user');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const fetchMessages = async () => {
      // Convert to strings for safe comparison
      const myId = String(currentUser.id);
      const otherId = String(selectedUser.id);

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${myId},sender_id.eq.${otherId}`)
        .or(`receiver_id.eq.${myId},receiver_id.eq.${otherId}`)
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
      if (data && data.length > 0) {
        // Mark as read
        const unreadIds = data.filter((m: any) => m.receiver_id === currentUser.id && !m.read_at).map((m: any) => m.id);
        if (unreadIds.length > 0) {
          supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
        }
      }
    };

    fetchMessages();

    subscriptionRef.current = supabase
      .channel('sidebar_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        const myId = String(currentUser.id);
        const otherId = String(selectedUser.id);

        if (
          (String(newMsg.sender_id) === myId && String(newMsg.receiver_id) === otherId) ||
          (String(newMsg.sender_id) === otherId && String(newMsg.receiver_id) === myId)
        ) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [selectedUser, currentUser]);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUser || !currentUser) return;
    const text = input;

    // Optimistic Update
    const optimisticMsg = {
      id: generateId(),
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null
    };

    setInput('');
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await db.insert('messages', optimisticMsg);
    } catch (e) {
      console.error(e);
    }
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
                {users.filter((u: any) => u.id !== currentUser?.id).map((u: any) => (
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
                <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=rose&color=fff`} alt={selectedUser.name} className="w-10 h-10 rounded-full border-2 border-rose-200" />
                <span className="font-black text-white text-lg font-ibm-plex-arabic">{selectedUser.name}</span>
              </div>
              <div ref={chatRef} className="flex-1 p-5 space-y-3 overflow-y-auto max-h-60 text-right font-ibm-plex-arabic">
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm font-bold shadow font-ibm-plex-arabic ${isMe ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="flex border-t p-3 gap-2 bg-rose-50 rounded-b-3xl font-ibm-plex-arabic" onSubmit={e => { e.preventDefault(); handleSend(); }}>
                <input
                  className="flex-1 rounded-xl border-2 border-rose-200 px-4 py-2 text-sm outline-none focus:border-rose-400 font-ibm-plex-arabic"
                  placeholder={`اكتب رسالة...`}
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
