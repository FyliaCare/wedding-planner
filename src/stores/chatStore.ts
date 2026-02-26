import { create } from 'zustand';
import type { ChatMessage } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';
import { generateId } from '@/utils';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  typingUsers: Map<string, { name: string; timeout: NodeJS.Timeout }>;
  replyingTo: ChatMessage | null;
  onlineUsers: Set<string>;

  loadMessages: (weddingId: string) => Promise<void>;
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'created_at' | 'reactions' | 'is_deleted' | 'reply_to' | 'image_url'> & { reply_to?: string | null; image_url?: string | null }) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  setReplyingTo: (msg: ChatMessage | null) => void;
  sendTypingIndicator: (weddingId: string, userId: string, userName: string) => void;
  subscribeToMessages: (weddingId: string, currentUserId: string) => () => void;
}

function sanitizeMessage(msg: Record<string, unknown>): ChatMessage {
  return {
    id: (msg.id as string) ?? '',
    wedding_id: (msg.wedding_id as string) ?? '',
    user_id: (msg.user_id as string) ?? '',
    user_name: (msg.user_name as string) ?? 'Someone',
    user_avatar: (msg.user_avatar as string) ?? null,
    content: (msg.content as string) ?? '',
    type: (msg.type as ChatMessage['type']) ?? 'message',
    reply_to: (msg.reply_to as string) ?? null,
    reactions: (msg.reactions as Record<string, string[]>) ?? {},
    image_url: (msg.image_url as string) ?? null,
    is_deleted: (msg.is_deleted as boolean) ?? false,
    created_at: (msg.created_at as string) ?? new Date().toISOString(),
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  typingUsers: new Map(),
  replyingTo: null,
  onlineUsers: new Set(),

  loadMessages: async (weddingId) => {
    set({ isLoading: true });
    try {
      const local = await db.messages
        .where('wedding_id')
        .equals(weddingId)
        .sortBy('created_at');

      let remote: ChatMessage[] = [];
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('created_at', { ascending: true })
          .limit(500);

        if (!error && data) {
          remote = data.map((d) => sanitizeMessage(d as Record<string, unknown>));
        }
      }

      // Merge local + remote, deduplicate by ID, sort by time
      const byId = new Map<string, ChatMessage>();
      for (const m of local) byId.set(m.id, sanitizeMessage(m as unknown as Record<string, unknown>));
      for (const m of remote) byId.set(m.id, m);
      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      set({ messages: merged });
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
    if (!msg.content?.trim() && !msg.image_url) return;

    const message: ChatMessage = {
      ...msg,
      content: msg.content?.trim() ?? '',
      id: generateId(),
      reply_to: msg.reply_to ?? null,
      reactions: {},
      image_url: msg.image_url ?? null,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic add
    set({ messages: [...get().messages, message], replyingTo: null });

    // Save locally
    try {
      await db.messages.add(message);
    } catch (e) {
      console.error('Failed to save message locally:', e);
    }

    // Push to Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('messages').insert({
          ...message,
          reactions: message.reactions,
        });
        if (error) console.error('Failed to sync message:', error.message);
      } catch (e) {
        console.error('Failed to push message:', e);
      }
    }
  },

  deleteMessage: async (messageId) => {
    const messages = get().messages.map((m) =>
      m.id === messageId ? { ...m, is_deleted: true, content: '' } : m
    );
    set({ messages });

    try {
      await db.messages.update(messageId, { is_deleted: true, content: '' });
    } catch { /* ignore */ }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('messages').update({ is_deleted: true, content: '' }).eq('id', messageId);
      } catch { /* ignore */ }
    }
  },

  toggleReaction: async (messageId, emoji, userId) => {
    const messages = get().messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = { ...m.reactions };
      const users = reactions[emoji] ? [...reactions[emoji]] : [];
      const idx = users.indexOf(userId);
      if (idx >= 0) {
        users.splice(idx, 1);
        if (users.length === 0) delete reactions[emoji];
        else reactions[emoji] = users;
      } else {
        reactions[emoji] = [...users, userId];
      }
      return { ...m, reactions };
    });
    set({ messages });

    const updated = messages.find((m) => m.id === messageId);
    if (!updated) return;

    try {
      await db.messages.update(messageId, { reactions: updated.reactions });
    } catch { /* ignore */ }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('messages').update({ reactions: updated.reactions }).eq('id', messageId);
      } catch { /* ignore */ }
    }
  },

  setReplyingTo: (msg) => set({ replyingTo: msg }),

  sendTypingIndicator: (weddingId, userId, userName) => {
    if (!isSupabaseConfigured) return;
    const channel = supabase.channel(`typing:${weddingId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, user_name: userName },
    });
  },

  subscribeToMessages: (weddingId, currentUserId) => {
    if (!isSupabaseConfigured) return () => {};

    // 1. Realtime message inserts + updates
    const msgChannel = supabase
      .channel(`messages:${weddingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          const newMsg = sanitizeMessage(payload.new as Record<string, unknown>);
          const existing = get().messages;
          if (!existing.find((m) => m.id === newMsg.id)) {
            set({ messages: [...existing, newMsg] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          const updated = sanitizeMessage(payload.new as Record<string, unknown>);
          set({
            messages: get().messages.map((m) => (m.id === updated.id ? updated : m)),
          });
        }
      )
      .subscribe();

    // 2. Typing indicators (broadcast channel)
    const typingChannel = supabase
      .channel(`typing:${weddingId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as { user_id: string; user_name: string } | undefined;
        if (!data || data.user_id === currentUserId) return;

        const typingUsers = new Map(get().typingUsers);
        const existing = typingUsers.get(data.user_id);
        if (existing) clearTimeout(existing.timeout);

        const timeout = setTimeout(() => {
          const updated = new Map(get().typingUsers);
          updated.delete(data.user_id);
          set({ typingUsers: updated });
        }, 3000);

        typingUsers.set(data.user_id, { name: data.user_name, timeout });
        set({ typingUsers });
      })
      .subscribe();

    // 3. Presence (online users)
    const presenceChannel = supabase
      .channel(`presence:${weddingId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as unknown as Array<{ user_id?: string }>).forEach((p) => {
            if (p.user_id) onlineIds.add(p.user_id);
          });
        });
        set({ onlineUsers: onlineIds });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUserId });
        }
      });

    return () => {
      void supabase.removeChannel(msgChannel);
      void supabase.removeChannel(typingChannel);
      void supabase.removeChannel(presenceChannel);
      get().typingUsers.forEach((v) => clearTimeout(v.timeout));
      set({ typingUsers: new Map(), onlineUsers: new Set() });
    };
  },
}));
