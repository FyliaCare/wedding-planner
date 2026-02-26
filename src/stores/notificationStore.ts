import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
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
  loadRecent: () => Promise<void>;
  subscribe: () => () => void;
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

  loadRecent: async () => {
    try {
      // Load last 20 activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      // Load last 10 messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
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

      // Keep top 25
      const top = notifs.slice(0, 25);

      set({ notifications: top, unreadCount: top.length });
    } catch {
      // Offline — just keep empty
    }
  },

  subscribe: () => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          const notif = activityToNotification(payload.new as Activity);
          set((s) => ({
            notifications: [notif, ...s.notifications].slice(0, 30),
            unreadCount: s.unreadCount + 1,
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const notif = messageToNotification(payload.new as ChatMessage);
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
