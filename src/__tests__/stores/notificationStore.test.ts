// ============================================================
// Notification Store — Panel, Read, Subscribe Tests
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '@/stores/notificationStore';
import type { AppNotification } from '@/stores/notificationStore';

function createNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'notif-1',
    type: 'activity',
    title: 'Janet',
    body: 'added a guest — Aunt Mary',
    emoji: '👤',
    timestamp: '2025-01-01T12:00:00Z',
    read: false,
    ...overrides,
  };
}

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      panelOpen: false,
    });
  });

  // ---- Panel Toggle ----
  describe('togglePanel', () => {
    it('opens panel', () => {
      useNotificationStore.getState().togglePanel();
      expect(useNotificationStore.getState().panelOpen).toBe(true);
    });

    it('closes panel on second toggle', () => {
      useNotificationStore.getState().togglePanel();
      useNotificationStore.getState().togglePanel();
      expect(useNotificationStore.getState().panelOpen).toBe(false);
    });
  });

  describe('closePanel', () => {
    it('closes panel', () => {
      useNotificationStore.setState({ panelOpen: true });
      useNotificationStore.getState().closePanel();
      expect(useNotificationStore.getState().panelOpen).toBe(false);
    });
  });

  // ---- Mark Read ----
  describe('markAllRead', () => {
    it('marks all notifications as read', () => {
      useNotificationStore.setState({
        notifications: [
          createNotification(),
          createNotification({ id: 'notif-2' }),
        ],
        unreadCount: 2,
      });
      useNotificationStore.getState().markAllRead();
      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('markRead', () => {
    it('marks single notification as read', () => {
      useNotificationStore.setState({
        notifications: [
          createNotification(),
          createNotification({ id: 'notif-2' }),
        ],
        unreadCount: 2,
      });
      useNotificationStore.getState().markRead('notif-1');
      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(1);
      expect(state.notifications.find((n) => n.id === 'notif-1')?.read).toBe(true);
      expect(state.notifications.find((n) => n.id === 'notif-2')?.read).toBe(false);
    });
  });

  // ---- Subscribe ----
  describe('subscribe', () => {
    it('returns a cleanup function', () => {
      const cleanup = useNotificationStore.getState().subscribe('wedding-1', 'user-1');
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });
});
