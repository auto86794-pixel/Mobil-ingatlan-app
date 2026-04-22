'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { useParams } from 'next/navigation';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const params = useParams();
  const otherUserId = params?.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔐 USER BETÖLTÉS
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  // 📥 ÜZENETEK BETÖLTÉSE
  useEffect(() => {
    if (!user || !otherUserId) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error.message);
        setLoading(false);
        return;
      }

      setMessages(data || []);
      setLoading(false);
    };

    loadMessages();
  }, [user, otherUserId]);

  // ⚡ REALTIME
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message;

          if (
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId]);

  // 💬 ÜZENET KÜLDÉS
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content: newMessage,
      post_id: null,
    });

    if (error) {
      console.error(error.message);
      return;
    }

    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col">

      <h1 className="text-2xl mb-4">💬 Chat</h1>

      {/* ⏳ LOADING */}
      {loading && (
        <p className="text-gray-400 mb-4">Betöltés...</p>
      )}

      {/* 📦 ÜZENETEK */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender_id === user?.id
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div className="bg-gray-800 px-3 py-2 rounded max-w-xs">
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 bg-gray-800 rounded"
          placeholder="Írj üzenetet..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded"
        >
          Küld
        </button>
      </div>

    </div>
  );
}