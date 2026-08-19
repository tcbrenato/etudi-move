import { supabase } from '@/lib/supabase';
import type { Message, ConversationSummary } from '@/types';

export async function fetchMessages(tripId: string, peerId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('trip_id', tripId)
    .or(`sender_id.eq.${peerId},receiver_id.eq.${peerId}`)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export interface SendMessageInput {
  tripId: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export async function sendMessage(input: SendMessageInput): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      trip_id: input.tripId,
      sender_id: input.senderId,
      receiver_id: input.receiverId,
      content: input.content,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Message;
}

export async function markMessagesRead(tripId: string, peerId: string, myId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('trip_id', tripId)
    .eq('sender_id', peerId)
    .eq('receiver_id', myId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('my_conversations')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ConversationSummary[];
}

export function subscribeToTripMessages(
  tripId: string,
  onInsert: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:trip:${tripId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` },
      payload => onInsert(payload.new as Message)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
