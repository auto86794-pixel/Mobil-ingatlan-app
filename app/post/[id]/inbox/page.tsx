'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  post_id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read?: boolean;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Conversation = {
  userId: string;
  profile: Profile;
  lastMessage: Message;
  unreadCount: number;
};

export default function InboxPage() {
  const params = useParams();
  const postId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  // USER
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  // MESSAGES
  useEffect(() => {
    if (!user) return;

    supabase
      .from('messages')
      .select('*')
      .eq('post_id', Number(postId))
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMessages(data || []));
  }, [user, postId]);

  // PROFILES
  useEffect(() => {
    const ids = Array.from(
      new Set(messages.flatMap((m) => [m.sender_id, m.receiver_id]))
    );

    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, Profile> = {};
        data?.forEach((p) => (map[p.id] = p));
        setProfiles(map);
      });
  }, [messages]);

  const conversations = useMemo(() => {
    if (!user) return [];

    const map = new Map<string, Conversation>();

    for (const msg of messages) {
      const otherId =
        msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

      if (!map.has(otherId)) {
        const unread = messages.filter(
          (m) =>
            m.sender_id === otherId &&
            m.receiver_id === user.id &&
            !m.read
        ).length;

        map.set(otherId, {
          userId: otherId,
          profile: profiles[otherId] || {
            id: otherId,
            full_name: 'Felhasználó',
            avatar_url: null,
          },
          lastMessage: msg,
          unreadCount: unread,
        });
      }
    }

    return Array.from(map.values());
  }, [messages, profiles, user]);

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-3">
        <h1>Üzenetek</h1>

        {conversations.map((c) => (
          <Link
            key={c.userId}
            href={`/post/${postId}/inbox/chat/${c.userId}`}
            className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl"
          >
            <img
              src={c.profile.avatar_url || 'https://placehold.co/40'}
              className="w-10 h-10 rounded-full"
            />

            <div className="flex-1">
              <div>{c.profile.full_name}</div>
              <div className="text-sm text-gray-400">
                {c.lastMessage.content || 'Kép'}
              </div>
            </div>

            {c.unreadCount > 0 && (
              <div className="bg-blue-600 px-2 rounded">
                {c.unreadCount}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}