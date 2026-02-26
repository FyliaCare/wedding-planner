import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Activity, ChatMessage } from '@/types';

export interface AppNotification {
  id: string;
  type: 'message' | 'activity';
  title: string;
  body: string;
  emoji: string;
  timestamp: string;
  read: boolean;
}

const EMOJI_MAP: Record<string, string> = {
  message: '💬',
  update: '📢',
  photo: '📸',
  task: '✅',
  guest: '👤',
  budget: '💰',
  vendor: '🏪',
};

function activityToNotification(a: Activity): AppNotification {
  return {
    id: a.id,
    type: 'activity',
    title: a.user_name,
    body: `${a.action} — ${a.entity_name}`,
    emoji: EMOJI_MAP[a.entity_type] || '📌',
    timestamp: a.created_at,
    read: false,
  };
}

function messageToNotification(m: ChatMessage): AppNotification {
  return {
    id: m.id,
    type: 'message',
    title: m.user_name,
    body: m.content.length > 80 ? m.content.slice(0, 80) + '…' : m.content,
    emoji: EMOJI_MAP[m.type] || '💬',
    timestamp: m.created_at,
    read: false,
  };
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  panelOpen: boolean;

  togglePanel: () => void;
  closePanel: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  loadRecent: (weddingId: string, currentUserId: string) => Promise<void>;
  subscribe: (weddingId: string, currentUserId: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,

  togglePanel: () => {
    const open = !get().panelOpen;
    set({ panelOpen: open });
  },

  closePanel: () => set({ panelOpen: false }),

  markAllRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  markRead: (id) => {
    set((s) => {
      const updated = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  loadRecent: async (weddingId: string, currentUserId: string) => {
    if (!isSupabaseConfigured || !weddingId) return;

    try {
      // Load last 15 activities (excluding current user's own)
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('wedding_id', weddingId)
        .neq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(15);

      // Load last 10 messages (excluding current user's own)
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('wedding_id', weddingId)
        .neq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      const notifs: AppNotification[] = [];

      if (activities) {
        notifs.push(...(activities as Activity[]).map(activityToNotification));
      }
      if (messages) {
        notifs.push(...(messages as ChatMessage[]).map(messageToNotification));
      }

      // Sort by newest first
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Keep top 25 — mark loaded ones as read (they're historical)
      const top = notifs.slice(0, 25).map((n) => ({ ...n, read: true }));

      set({ notifications: top, unreadCount: 0 });
    } catch {
      // Offline — just keep empty
    }
  },

  subscribe: (weddingId: string, currentUserId: string) => {
    if (!isSupabaseConfigured || !weddingId) return () => {};

    const channel = supabase
      .channel(`notifications-${weddingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          const activity = payload.new as Activity;
          // Don't notify for own actions
          if (activity.user_id === currentUserId) return;
          const notif = activityToNotification(activity);
          set((s) => ({
            notifications: [notif, ...s.notifications].slice(0, 30),
            unreadCount: s.unreadCount + 1,
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          const message = payload.new as ChatMessage;
          // Don't notify for own messages
          if (message.user_id === currentUserId) return;
          const notif = messageToNotification(message);
          set((s) => ({
            notifications: [notif, ...s.notifications].slice(0, 30),
            unreadCount: s.unreadCount + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
}));
