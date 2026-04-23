'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

export default function ChatPage() {
  const params = useParams();

  const postId = params.id as string;
  const otherUserId = params.userId as string;

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('messages')
      .select('*')
      .eq('post_id', Number(postId))
      .in('sender_id', [user.id, otherUserId])
      .in('receiver_id', [user.id, otherUserId])
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));
  }, [user, otherUserId, postId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await supabase.from('messages').insert({
      post_id: Number(postId),
      sender_id: user.id,
      receiver_id: otherUserId,
      content: newMessage,
      read: false,
    });

    setNewMessage('');
  };

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen flex flex-col">
      <div className="flex-1 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded ${
              msg.sender_id === user?.id ? 'bg-blue-600 ml-auto' : 'bg-gray-800'
            }`}
          >
            {msg.content}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 bg-gray-800 rounded"
        />

        <button onClick={sendMessage} className="bg-blue-600 px-4">
          Küldés
        </button>
      </div>
    </div>
  );
}