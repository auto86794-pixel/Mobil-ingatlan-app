'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // ✅ HELYES PATH
import { useRouter, useParams } from 'next/navigation';

type Message = {
  id: string;
  post_id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read?: boolean;
};

export default function InboxPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  // 🔐 USER
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  // 📥 MESSAGES
  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error.message);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();
  }, [user]);

  // 👤 PROFILES BETÖLTÉS
  useEffect(() => {
    if (!messages.length || !user) return;

    const loadProfiles = async () => {
      const ids = messages.map((msg) =>
        msg.sender_id === user.id
          ? msg.receiver_id
          : msg.sender_id
      );

      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', ids);

      const map: Record<string, string> = {};

      data?.forEach((p) => {
        map[p.id] = p.email;
      });

      setProfiles(map);
    };

    loadProfiles();
  }, [messages, user]);

  // 🧠 BESZÉLGETÉSEK CSOPORTOSÍTÁSA
  const conversations = Object.values(
    messages.reduce((acc: Record<string, Message>, msg) => {
      const otherUser =
        msg.sender_id === user?.id
          ? msg.receiver_id
          : msg.sender_id;

      if (!acc[otherUser]) {
        acc[otherUser] = msg;
      }

      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <h1 className="text-3xl mb-6">📩 Üzenetek</h1>

      {conversations.length === 0 && (
        <p className="text-gray-400">Nincs beszélgetés</p>
      )}

      <div className="space-y-4">
        {conversations.map((msg) => {
          const otherUser =
            msg.sender_id === user?.id
              ? msg.receiver_id
              : msg.sender_id;

          return (
            <div
              key={msg.id}
              onClick={() =>
                router.push(`/post/${postId}/inbox/chat/${otherUser}`)
              }
              className="bg-gray-900 p-4 rounded-xl cursor-pointer hover:bg-gray-800 transition"
            >
              {/* 👤 EMAIL */}
              <p className="text-blue-400">
                👤 {profiles[otherUser] || 'Ismeretlen user'}
              </p>

              {/* 💬 UTOLSÓ ÜZENET */}
              <p>{msg.content}</p>

              {/* 🕒 IDŐ */}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}