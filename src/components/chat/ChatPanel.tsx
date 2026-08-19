import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, Send } from 'lucide-react';
import { fetchMessages, sendMessage, markMessagesRead, subscribeToTripMessages } from '@/lib/messages';
import { Spinner } from '@/components/ui/Feedback';
import type { Message } from '@/types';

interface ChatPanelProps {
  tripId: string;
  currentUserId: string;
  peerId: string;
  peerName: string;
  tripLabel: string;
  onClose: () => void;
}

export function ChatPanel({ tripId, currentUserId, peerId, peerName, tripLabel, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const data = await fetchMessages(tripId, peerId);
        if (mounted) setMessages(data);
        await markMessagesRead(tripId, peerId, currentUserId);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const unsubscribe = subscribeToTripMessages(tripId, message => {
      const belongsToThisThread =
        (message.sender_id === peerId && message.receiver_id === currentUserId) ||
        (message.sender_id === currentUserId && message.receiver_id === peerId);
      if (!belongsToThisThread) return;

      setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]));
      if (message.receiver_id === currentUserId) {
        markMessagesRead(tripId, peerId, currentUserId).catch(() => {});
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [tripId, peerId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    setContent('');
    try {
      const message = await sendMessage({
        tripId,
        senderId: currentUserId,
        receiverId: peerId,
        content: text,
      });
      setMessages(prev => [...prev, message]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-card flex flex-col h-[80vh] sm:h-[600px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-800 truncate">{peerName}</p>
            <p className="text-xs text-neutral-500 truncate">{tripLabel}</p>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-xl text-primary-600" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-8">
              Aucun message pour l'instant. Écrivez le premier !
            </p>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender_id === currentUserId
                    ? 'ml-auto bg-primary-600 text-white rounded-br-sm'
                    : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'
                }`}
              >
                {m.content}
                <div
                  className={`mt-1 text-[10px] ${
                    m.sender_id === currentUserId ? 'text-primary-100' : 'text-neutral-400'
                  }`}
                >
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-neutral-100 px-3 py-3 shrink-0">
          <input
            type="text"
            className="input flex-1"
            placeholder="Écrire un message…"
            value={content}
            onChange={e => setContent(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={sending || !content.trim()} className="btn-primary !px-3 !py-2.5">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
