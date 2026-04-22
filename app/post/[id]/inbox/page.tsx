'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  post_id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

type Conversation = {
  userId: string;
  lastMessage: Message;
};

export default function InboxPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 USER BETÖLTÉS
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  // 📥 ÜZENETEK BETÖLTÉSE
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error.message);
        setLoading(false);
        return;
      }

      setMessages(data || []);
      setLoading(false);
    };

    loadMessages();
  }, [user]);

  // 🧠 BESZÉLGETÉSEK (USER SZERINT)
  const conversations: Conversation[] = Object.values(
    messages.reduce((acc: Record<string, Conversation>, msg) => {
      const otherUser =
        msg.sender_id === user?.id
          ? msg.receiver_id
          : msg.sender_id;

      if (!acc[otherUser]) {
        acc[otherUser] = {
          userId: otherUser,
          lastMessage: msg,
        };
      }

      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <h1 className="text-3xl mb-6">📩 Üzenetek</h1>

      {/* ⏳ LOADING */}
      {loading && (
        <p className="text-gray-400">Betöltés...</p>
      )}

      {/* ❌ EMPTY */}
      {!loading && conversations.length === 0 && (
        <p className="text-gray-400">Nincs beszélgetés</p>
      )}

      {/* 📦 LISTA */}
      <div className="space-y-4">
        {conversations.map((conv) => (
          <div
            key={conv.userId}
            onClick={() =>
              router.push(`/post/${conv.lastMessage.post_id}`)
            }
            className="bg-gray-900 p-4 rounded-xl cursor-pointer hover:bg-gray-800 transition"
          >
            {/* 👤 USER */}
            <p className="text-sm text-blue-400">
              👤 {conv.userId.slice(0, 8)}...
            </p>

            {/* 💬 UTOLSÓ ÜZENET */}
            <p className="mt-1">
              {conv.lastMessage.content}
            </p>

            {/* 🕒 IDŐ */}
            <p className="text-xs text-gray-500 mt-1">
              {new Date(conv.lastMessage.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}