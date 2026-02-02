import React, { useState, useRef, useEffect } from 'react';
import { Users, Send, MessageSquare, ChevronLeft } from 'lucide-react';
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
export default function ChatPage({ users = [] }) {
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
      // Fetch messages between me and selected user
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);

      // Mark received messages as read
      if (data) {
        const unreadIds = data
          .filter((m: any) => m.receiver_id === currentUser.id && !m.read_at)
          .map((m: any) => m.id);

        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
        }
      }
    };

    fetchMessages();

    // Realtime Subscription
    subscriptionRef.current = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        // Check if this message belongs to the current conversation
        const isRelevant =
          (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedUser.id) ||
          (newMsg.sender_id === selectedUser.id && newMsg.receiver_id === currentUser.id);

        if (isRelevant) {
          setMessages(prev => {
            // Prevent duplicates (if we added it consistently via optimistic update)
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If I received it, mark as read immediately
          if (newMsg.receiver_id === currentUser.id) {
            supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', newMsg.id);
          }
        }
      })
      .subscribe();

    return () => {
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [selectedUser, currentUser]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, selectedUser]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUser || !currentUser) return;

    const textToSend = input;
    // Optimistic UI Update
    const optimisticMsg = {
      id: generateId(),
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: textToSend,
      created_at: new Date().toISOString(),
      read_at: null
    };

    setInput('');
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await db.insert('messages', optimisticMsg);
    } catch (err) {
      console.error("Failed to send", err);
      setInput(textToSend);
      // Remove the optimistic message if failed (optional, keeping simple for now)
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
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
          {users.filter((u: any) => u.id !== currentUser?.id).map((u: any) => (
            <button
              key={u.id}
              className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all text-right font-bold text-lg font-ibm-plex-arabic ${selectedUser?.id === u.id ? 'bg-rose-100 text-rose-700' : 'hover:bg-rose-100 text-slate-800'}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="relative">
                <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=rose&color=fff`} alt={u.name} className="w-12 h-12 rounded-full border-2 border-rose-200" />
                {/* Online/Offline indicator could go here */}
              </div>
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
              <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=rose&color=fff`} alt={selectedUser.name} className="w-10 h-10 rounded-full border-2 border-rose-200" />
              <div>
                <span className="font-black text-white text-lg font-ibm-plex-arabic block">{selectedUser.name}</span>
                <span className="text-rose-100 text-xs font-bold">{selectedUser.teamRole}</span>
              </div>
            </div>
            <div ref={chatRef} className="flex-1 p-8 space-y-3 overflow-y-auto bg-white text-right max-h-[calc(100vh-180px)] font-ibm-plex-arabic">
              {messages.length === 0 && (
                <div className="text-center text-slate-300 mt-10">
                  <p>لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-5 py-3 max-w-[70%] text-base font-bold shadow font-ibm-plex-arabic ${isMe ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-slate-400 font-bold">{formatTime(msg.created_at)}</span>
                      {isMe && (
                        <span className="text-[10px]">
                          {msg.read_at ? <span className="text-emerald-500">✓✓</span> : <span className="text-slate-300">✓</span>}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
