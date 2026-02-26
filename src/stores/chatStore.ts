import { create } from 'zustand';
import type { ChatMessage } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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
      if (isSupabaseConfigured) {
        // Try Supabase first
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('created_at', { ascending: true })
          .limit(200);

        if (!error && data && data.length > 0) {
          set({ messages: data as ChatMessage[] });
          set({ isLoading: false });
          return;
        }
      }

      // Fall back to local
      const local = await db.messages
        .where('wedding_id')
        .equals(weddingId)
        .sortBy('created_at');
      set({ messages: local });
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
    if (!msg.content || !msg.content.trim()) return;

    const message: ChatMessage = {
      ...msg,
      content: msg.content.trim(),
      id: generateId(),
      created_at: new Date().toISOString(),
    };

    // Optimistic add
    set({ messages: [...get().messages, message] });

    // Save locally
    try {
      await db.messages.add(message);
    } catch (e) {
      console.error('Failed to save message locally:', e);
    }

    // Push to Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('messages').insert(message);
        if (error) console.error('Failed to sync message to Supabase:', error.message);
      } catch (e) {
        console.error('Failed to push message to Supabase:', e);
      }
    }
  },

  subscribeToMessages: (weddingId) => {
    if (!isSupabaseConfigured) return () => {};

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
