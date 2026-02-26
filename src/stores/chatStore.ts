import { create } from 'zustand';
import type { ChatMessage } from '@/types';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { generateId } from '@/utils';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;

  loadMessages: (weddingId: string) => Promise<void>;
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'created_at'>) => Promise<void>;
  subscribeToMessages: (weddingId: string) => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  loadMessages: async (weddingId) => {
    set({ isLoading: true });
    try {
      // Try Supabase first
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (data && data.length > 0) {
        set({ messages: data as ChatMessage[] });
      } else {
        // Fall back to local
        const local = await db.messages
          .where('wedding_id')
          .equals(weddingId)
          .sortBy('created_at');
        set({ messages: local });
      }
    } catch {
      const local = await db.messages
        .where('wedding_id')
        .equals(weddingId)
        .sortBy('created_at');
      set({ messages: local });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (msg) => {
    const message: ChatMessage = {
      ...msg,
      id: generateId(),
      created_at: new Date().toISOString(),
    };

    // Optimistic add
    set({ messages: [...get().messages, message] });

    // Save locally
    try {
      await db.messages.add(message);
    } catch { /* ok */ }

    // Push to Supabase
    try {
      await supabase.from('messages').insert(message);
    } catch { /* offline — will sync later */ }
  },

  subscribeToMessages: (weddingId) => {
    const channel = supabase
      .channel(`messages:${weddingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          const existing = get().messages;
          // Avoid duplicates
          if (!existing.find((m) => m.id === newMsg.id)) {
            set({ messages: [...existing, newMsg] });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
}));
