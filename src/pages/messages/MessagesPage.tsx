import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AppLayout } from '@/layouts/AppLayout';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { EmptyState, Spinner, Badge } from '@/components/ui/Feedback';
import { fetchConversations } from '@/lib/messages';
import { initials } from '@/utils/format';
import type { ConversationSummary } from '@/types';

function navItemsForRole(role: string) {
  if (role === 'driver') {
    return [
      { to: '/driver', label: 'Dashboard' },
      { to: '/driver/trips', label: 'Mes trajets' },
      { to: '/messages', label: 'Messages' },
      { to: '/driver/profile', label: 'Profil' },
    ];
  }
  return [
    { to: '/dashboard', label: 'Accueil' },
    { to: '/trajets', label: 'Trajets' },
    { to: '/messages', label: 'Messages' },
    { to: '/profile', label: 'Profil' },
  ];
}

export function MessagesPage() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ConversationSummary | null>(null);

  async function load() {
    setLoading(true);
    try {
      setConversations(await fetchConversations());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!profile) return null;

  function closeChat() {
    setActive(null);
    load();
  }

  return (
    <AppLayout navItems={navItemsForRole(profile.role)}>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-neutral-800">Messages</h1>
        <p className="mt-1 text-sm text-neutral-500">Vos conversations liées à vos trajets.</p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-2xl text-primary-600" />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            title="Aucune conversation"
            message="Démarrez une discussion depuis un trajet pour la retrouver ici."
          />
        ) : (
          <div className="mt-6 space-y-2">
            {conversations.map(c => (
              <button
                key={`${c.trip_id}-${c.peer_id}`}
                onClick={() => setActive(c)}
                className="card w-full text-left flex items-center gap-3 hover:shadow-card-hover transition-shadow"
              >
                <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {initials(c.peer_first_name, c.peer_last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {c.peer_first_name} {c.peer_last_name}
                    </p>
                    {c.unread_count > 0 && (
                      <Badge className="bg-primary-600 text-white shrink-0">{c.unread_count}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 truncate">
                    {c.origin_address} → {c.destination_address}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{c.last_message}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <ChatPanel
          tripId={active.trip_id}
          currentUserId={profile.id}
          peerId={active.peer_id}
          peerName={`${active.peer_first_name} ${active.peer_last_name}`}
          tripLabel={`${active.origin_address} → ${active.destination_address}`}
          onClose={closeChat}
        />
      )}
    </AppLayout>
  );
}
