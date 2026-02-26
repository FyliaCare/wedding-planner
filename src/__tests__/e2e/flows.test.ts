// ============================================================
// End-to-End Integration Tests — Full User Flows
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useGuestStore } from '@/stores/guestStore';
import { useVendorStore } from '@/stores/vendorStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Task, Guest, Vendor, TimelineEvent } from '@/types';

// ---- Mocks ----
vi.mock('@/lib/db', () => ({
  db: {
    weddings: {
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue('id'),
    },
    tasks: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    budgetCategories: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    budgetItems: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    guests: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    vendors: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    timelineEvents: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    messages: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue([]),
        }),
      }),
      add: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock('@/lib/sync', () => ({
  addToSyncQueue: vi.fn(),
}));

let idCounter = 0;
vi.mock('@/utils', async () => {
  const actual = await vi.importActual('@/utils');
  return {
    ...actual,
    generateId: vi.fn().mockImplementation(() => `e2e-id-${++idCounter}`),
  };
});

describe('E2E Integration Flows', () => {
  beforeEach(() => {
    idCounter = 0;

    // Reset all stores
    useAuthStore.setState({
      user: null,
      wedding: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    });
    useTaskStore.setState({
      tasks: [],
      isLoading: false,
      filter: { status: 'all', category: 'all', search: '' },
    });
    useBudgetStore.setState({
      categories: [],
      items: [],
      isLoading: false,
    });
    useGuestStore.setState({
      guests: [],
      isLoading: false,
      filter: { rsvpStatus: 'all', group: 'all', search: '' },
    });
    useVendorStore.setState({
      vendors: [],
      isLoading: false,
      filter: { category: 'all', search: '' },
    });
    useTimelineStore.setState({
      events: [],
      isLoading: false,
    });
    useChatStore.setState({
      messages: [],
      isLoading: false,
      typingUsers: new Map(),
      replyingTo: null,
      onlineUsers: new Set(),
    });
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      panelOpen: false,
    });
  });

  // ============================================================
  // Flow 1: Guest User Journey (Skip Auth → Browse)
  // ============================================================
  describe('Flow 1: Guest User Journey', () => {
    it('skips auth and becomes offline user', () => {
      useAuthStore.getState().skipAuth();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe('offline-user');
      expect(state.user?.name).toBe('Guest');
      expect(state.isAdmin).toBe(false);
    });

    it('guest user can add tasks', async () => {
      useAuthStore.getState().skipAuth();
      await useTaskStore.getState().addTask({
        wedding_id: 'wedding-1',
        title: 'Browse venues',
        description: 'Research potential venues',
        category: 'venue',
        due_date: '2025-06-01',
        assigned_to: null,
        priority: 'high',
        status: 'todo',
      });
      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it('guest user can sign out', () => {
      useAuthStore.getState().skipAuth();
      useAuthStore.getState().signOut();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  // ============================================================
  // Flow 2: Full Task Management Lifecycle
  // ============================================================
  describe('Flow 2: Full Task Management Lifecycle', () => {
    it('creates, updates status through workflow, then deletes', async () => {
      // Create task
      await useTaskStore.getState().addTask({
        wedding_id: 'wedding-1',
        title: 'Book photographer',
        description: 'Find and book wedding photographer',
        category: 'photography',
        due_date: '2025-06-01',
        assigned_to: null,
        priority: 'high',
        status: 'todo',
      });

      const task = useTaskStore.getState().tasks[0]!;
      expect(task.status).toBe('todo');

      // Move to in-progress
      await useTaskStore.getState().updateTask(task.id, { status: 'in-progress' });
      expect(useTaskStore.getState().tasks[0]?.status).toBe('in-progress');

      // Move to done
      await useTaskStore.getState().updateTask(task.id, { status: 'done' });
      expect(useTaskStore.getState().tasks[0]?.status).toBe('done');

      // Delete task
      await useTaskStore.getState().deleteTask(task.id);
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('creates multiple tasks and filters them', async () => {
      // Create various tasks
      const taskData: Array<Omit<Task, 'id' | 'created_at'>> = [
        { wedding_id: 'w1', title: 'Book venue', description: '', category: 'venue', due_date: null, assigned_to: null, priority: 'high', status: 'todo' },
        { wedding_id: 'w1', title: 'Hire DJ', description: 'Dance floor', category: 'music', due_date: null, assigned_to: null, priority: 'medium', status: 'in-progress' },
        { wedding_id: 'w1', title: 'Buy dress', description: 'White gown', category: 'attire', due_date: null, assigned_to: null, priority: 'high', status: 'done' },
        { wedding_id: 'w1', title: 'Order flowers', description: 'Roses', category: 'flowers', due_date: null, assigned_to: null, priority: 'low', status: 'todo' },
      ];

      for (const data of taskData) {
        await useTaskStore.getState().addTask(data);
      }

      expect(useTaskStore.getState().tasks).toHaveLength(4);

      // Filter by status
      useTaskStore.getState().setFilter({ status: 'todo' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(2);

      // Filter by category
      useTaskStore.getState().setFilter({ status: 'all', category: 'venue' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(1);

      // Filter by search in description
      useTaskStore.getState().setFilter({ category: 'all', search: 'roses' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(1);

      // Clear filters
      useTaskStore.getState().setFilter({ status: 'all', category: 'all', search: '' });
      expect(useTaskStore.getState().getFilteredTasks()).toHaveLength(4);
    });
  });

  // ============================================================
  // Flow 3: Full Budget Management
  // ============================================================
  describe('Flow 3: Full Budget Management', () => {
    it('creates categories with items and tracks totals', async () => {
      // Create categories
      await useBudgetStore.getState().addCategory({
        wedding_id: 'w1', name: 'Venue', allocated_amount: 10000, icon: '🏛️',
      });
      await useBudgetStore.getState().addCategory({
        wedding_id: 'w1', name: 'Photography', allocated_amount: 5000, icon: '📷',
      });

      expect(useBudgetStore.getState().categories).toHaveLength(2);
      expect(useBudgetStore.getState().getTotalAllocated()).toBe(15000);

      // Add items
      const cats = useBudgetStore.getState().categories;
      await useBudgetStore.getState().addItem({
        category_id: cats[0]!.id, wedding_id: 'w1', name: 'Reception Hall',
        estimated_cost: 8000, actual_cost: 7500, payment_status: 'fully-paid',
        vendor_id: null, notes: '',
      });
      await useBudgetStore.getState().addItem({
        category_id: cats[0]!.id, wedding_id: 'w1', name: 'Ceremony Site',
        estimated_cost: 2000, actual_cost: 0, payment_status: 'pending',
        vendor_id: null, notes: '',
      });
      await useBudgetStore.getState().addItem({
        category_id: cats[1]!.id, wedding_id: 'w1', name: 'Photographer',
        estimated_cost: 4000, actual_cost: 1000, payment_status: 'deposit-paid',
        vendor_id: null, notes: '',
      });

      expect(useBudgetStore.getState().items).toHaveLength(3);
      expect(useBudgetStore.getState().getTotalEstimated()).toBe(14000);
      expect(useBudgetStore.getState().getTotalActual()).toBe(8500);

      // Filter items by category
      expect(useBudgetStore.getState().getItemsByCategory(cats[0]!.id)).toHaveLength(2);
      expect(useBudgetStore.getState().getItemsByCategory(cats[1]!.id)).toHaveLength(1);
    });

    it('deleting a category removes its items', async () => {
      await useBudgetStore.getState().addCategory({
        wedding_id: 'w1', name: 'Flowers', allocated_amount: 2000, icon: '🌸',
      });
      const catId = useBudgetStore.getState().categories[0]!.id;

      await useBudgetStore.getState().addItem({
        category_id: catId, wedding_id: 'w1', name: 'Bouquet',
        estimated_cost: 500, actual_cost: 0, payment_status: 'pending',
        vendor_id: null, notes: '',
      });

      expect(useBudgetStore.getState().items).toHaveLength(1);

      await useBudgetStore.getState().deleteCategory(catId);
      expect(useBudgetStore.getState().categories).toHaveLength(0);
      expect(useBudgetStore.getState().items).toHaveLength(0);
    });
  });

  // ============================================================
  // Flow 4: Guest Management with Stats
  // ============================================================
  describe('Flow 4: Guest Management with Stats', () => {
    it('manages guest RSVP lifecycle', async () => {
      // Add guests
      const guestBase: Omit<Guest, 'id' | 'created_at'> = {
        wedding_id: 'w1', name: 'Test', email: '', phone: '',
        group: 'bride-family', meal_preference: 'standard',
        dietary_restrictions: '', plus_one: false, plus_one_name: '',
        rsvp_status: 'invited', table_id: null, seat_number: null, notes: '',
      };

      await useGuestStore.getState().addGuest({ ...guestBase, name: 'Guest A' });
      await useGuestStore.getState().addGuest({ ...guestBase, name: 'Guest B', rsvp_status: 'accepted', plus_one: true, plus_one_name: 'Plus B' });
      await useGuestStore.getState().addGuest({ ...guestBase, name: 'Guest C', rsvp_status: 'declined', group: 'groom-family' });
      await useGuestStore.getState().addGuest({ ...guestBase, name: 'Guest D', rsvp_status: 'pending' });

      // Check stats
      const stats = useGuestStore.getState().getStats();
      expect(stats.total).toBe(4);
      expect(stats.accepted).toBe(1);
      expect(stats.declined).toBe(1);
      expect(stats.pending).toBe(2); // invited + pending
      expect(stats.plusOnes).toBe(1);

      // Update RSVP
      const guestA = useGuestStore.getState().guests[0]!;
      await useGuestStore.getState().updateGuest(guestA.id, { rsvp_status: 'accepted' });

      const updatedStats = useGuestStore.getState().getStats();
      expect(updatedStats.accepted).toBe(2);
      expect(updatedStats.pending).toBe(1);

      // Delete guest
      await useGuestStore.getState().deleteGuest(guestA.id);
      expect(useGuestStore.getState().guests).toHaveLength(3);
    });

    it('filters guests by group and status', async () => {
      const base: Omit<Guest, 'id' | 'created_at'> = {
        wedding_id: 'w1', name: 'Test', email: '', phone: '',
        group: 'bride-family', meal_preference: 'standard',
        dietary_restrictions: '', plus_one: false, plus_one_name: '',
        rsvp_status: 'accepted', table_id: null, seat_number: null, notes: '',
      };

      await useGuestStore.getState().addGuest({ ...base, name: 'Alice', group: 'bride-family', rsvp_status: 'accepted' });
      await useGuestStore.getState().addGuest({ ...base, name: 'Bob', group: 'groom-family', rsvp_status: 'declined' });
      await useGuestStore.getState().addGuest({ ...base, name: 'Charlie', group: 'bride-friends', rsvp_status: 'accepted' });

      useGuestStore.getState().setFilter({ group: 'bride-family' });
      expect(useGuestStore.getState().getFilteredGuests()).toHaveLength(1);

      useGuestStore.getState().setFilter({ group: 'all', rsvpStatus: 'accepted' });
      expect(useGuestStore.getState().getFilteredGuests()).toHaveLength(2);
    });
  });

  // ============================================================
  // Flow 5: Vendor Management
  // ============================================================
  describe('Flow 5: Vendor Management', () => {
    it('creates vendors and computes totals', async () => {
      const base: Omit<Vendor, 'id' | 'created_at'> = {
        wedding_id: 'w1', name: 'Test', category: 'venue',
        email: '', phone: '', website: '', contract_url: null,
        total_cost: 0, deposit_paid: 0, rating: 3, notes: '',
      };

      await useVendorStore.getState().addVendor({ ...base, name: 'Grand Hall', category: 'venue', total_cost: 10000, deposit_paid: 2500 });
      await useVendorStore.getState().addVendor({ ...base, name: 'Photo Pro', category: 'photography', total_cost: 3000, deposit_paid: 500 });
      await useVendorStore.getState().addVendor({ ...base, name: 'DJ Mike', category: 'music-dj', total_cost: 1500, deposit_paid: 300 });

      expect(useVendorStore.getState().getTotalCost()).toBe(14500);
      expect(useVendorStore.getState().getTotalDeposits()).toBe(3300);

      // Filter by category
      useVendorStore.getState().setFilter({ category: 'photography' });
      expect(useVendorStore.getState().getFilteredVendors()).toHaveLength(1);

      // Search
      useVendorStore.getState().setFilter({ category: 'all', search: 'dj' });
      expect(useVendorStore.getState().getFilteredVendors()).toHaveLength(1);
    });
  });

  // ============================================================
  // Flow 6: Timeline Management
  // ============================================================
  describe('Flow 6: Timeline Management', () => {
    it('creates, reorders, and deletes events', async () => {
      const base: Omit<TimelineEvent, 'id'> = {
        wedding_id: 'w1', title: '', start_time: '', end_time: '',
        location: '', responsible_person: '', notes: '', sort_order: 0,
      };

      await useTimelineStore.getState().addEvent({ ...base, title: 'Ceremony', start_time: '14:00', end_time: '15:00', sort_order: 0 });
      await useTimelineStore.getState().addEvent({ ...base, title: 'Cocktails', start_time: '15:00', end_time: '16:00', sort_order: 1 });
      await useTimelineStore.getState().addEvent({ ...base, title: 'Reception', start_time: '16:00', end_time: '23:00', sort_order: 2 });

      expect(useTimelineStore.getState().events).toHaveLength(3);

      // Reorder: move Reception first
      const events = useTimelineStore.getState().events;
      await useTimelineStore.getState().reorderEvents([events[2]!, events[0]!, events[1]!]);

      const reordered = useTimelineStore.getState().events;
      expect(reordered[0]?.title).toBe('Reception');
      expect(reordered[0]?.sort_order).toBe(0);

      // Update event
      await useTimelineStore.getState().updateEvent(reordered[0]!.id, { location: 'Ballroom' });
      expect(useTimelineStore.getState().events[0]?.location).toBe('Ballroom');

      // Delete event
      await useTimelineStore.getState().deleteEvent(reordered[2]!.id);
      expect(useTimelineStore.getState().events).toHaveLength(2);
    });
  });

  // ============================================================
  // Flow 7: Chat Conversation Flow
  // ============================================================
  describe('Flow 7: Chat Conversation Flow', () => {
    it('sends messages, reacts, replies, and deletes', async () => {
      const baseMsg = {
        wedding_id: 'w1', user_id: 'user-1', user_name: 'Janet', user_avatar: null,
        type: 'message' as const,
      };

      // Send messages
      await useChatStore.getState().sendMessage({ ...baseMsg, content: 'Hello everyone!' });
      await useChatStore.getState().sendMessage({ ...baseMsg, user_id: 'user-2', user_name: 'Jojo', content: 'Hey Janet! 💕' });
      await useChatStore.getState().sendMessage({ ...baseMsg, content: 'Who is coming to the tasting?' });

      expect(useChatStore.getState().messages).toHaveLength(3);

      // React to a message
      const msg2 = useChatStore.getState().messages[1]!;
      await useChatStore.getState().toggleReaction(msg2.id, '❤️', 'user-1');
      expect(useChatStore.getState().messages[1]?.reactions['❤️']).toContain('user-1');

      // Another user reacts
      await useChatStore.getState().toggleReaction(msg2.id, '❤️', 'user-3');
      expect(useChatStore.getState().messages[1]?.reactions['❤️']).toHaveLength(2);

      // Reply to a message
      const msg3 = useChatStore.getState().messages[2]!;
      useChatStore.getState().setReplyingTo(msg3);
      expect(useChatStore.getState().replyingTo?.id).toBe(msg3.id);

      await useChatStore.getState().sendMessage({
        ...baseMsg, user_id: 'user-2', user_name: 'Jojo',
        content: 'I am! 🙋‍♂️', reply_to: msg3.id,
      });
      expect(useChatStore.getState().replyingTo).toBeNull();
      expect(useChatStore.getState().messages).toHaveLength(4);

      // Delete a message (soft delete)
      const msg1 = useChatStore.getState().messages[0]!;
      await useChatStore.getState().deleteMessage(msg1.id);
      expect(useChatStore.getState().messages[0]?.is_deleted).toBe(true);
      expect(useChatStore.getState().messages[0]?.content).toBe('');
    });

    it('sends image-only message', async () => {
      await useChatStore.getState().sendMessage({
        wedding_id: 'w1', user_id: 'user-1', user_name: 'Janet',
        user_avatar: null, content: '', type: 'photo',
        image_url: 'https://example.com/venue.jpg',
      });
      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]?.image_url).toBe('https://example.com/venue.jpg');
    });

    it('toggle reaction off removes empty emoji key', async () => {
      await useChatStore.getState().sendMessage({
        wedding_id: 'w1', user_id: 'user-1', user_name: 'Janet',
        user_avatar: null, content: 'Test', type: 'message',
      });
      const msgId = useChatStore.getState().messages[0]!.id;

      // Add reaction
      await useChatStore.getState().toggleReaction(msgId, '🎉', 'user-1');
      expect(useChatStore.getState().messages[0]?.reactions['🎉']).toHaveLength(1);

      // Remove reaction
      await useChatStore.getState().toggleReaction(msgId, '🎉', 'user-1');
      expect(useChatStore.getState().messages[0]?.reactions['🎉']).toBeUndefined();
    });
  });

  // ============================================================
  // Flow 8: Notification System
  // ============================================================
  describe('Flow 8: Notification System', () => {
    it('manages notification panel and read state', () => {
      // Add some notifications
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', type: 'activity', title: 'Janet', body: 'added guest Aunt Mary', emoji: '👤', timestamp: '2025-01-01T12:00:00Z', read: false },
          { id: 'n2', type: 'message', title: 'Jojo', body: 'Check out this venue!', emoji: '💬', timestamp: '2025-01-01T12:05:00Z', read: false },
          { id: 'n3', type: 'activity', title: 'Janet', body: 'updated the budget', emoji: '💰', timestamp: '2025-01-01T12:10:00Z', read: false },
        ],
        unreadCount: 3,
      });

      // Open panel
      useNotificationStore.getState().togglePanel();
      expect(useNotificationStore.getState().panelOpen).toBe(true);

      // Mark one as read
      useNotificationStore.getState().markRead('n2');
      expect(useNotificationStore.getState().unreadCount).toBe(2);

      // Mark all as read
      useNotificationStore.getState().markAllRead();
      expect(useNotificationStore.getState().unreadCount).toBe(0);

      // Close panel
      useNotificationStore.getState().closePanel();
      expect(useNotificationStore.getState().panelOpen).toBe(false);
    });
  });

  // ============================================================
  // Flow 9: Cross-Store Integration
  // ============================================================
  describe('Flow 9: Cross-Store Integration', () => {
    it('multiple stores can operate simultaneously', async () => {
      // Auth first
      useAuthStore.getState().skipAuth();

      // Add data to all stores in parallel
      await Promise.all([
        useTaskStore.getState().addTask({
          wedding_id: 'w1', title: 'Task 1', description: '', category: 'venue',
          due_date: null, assigned_to: null, priority: 'high', status: 'todo',
        }),
        useBudgetStore.getState().addCategory({
          wedding_id: 'w1', name: 'Category 1', allocated_amount: 5000, icon: '💰',
        }),
        useGuestStore.getState().addGuest({
          wedding_id: 'w1', name: 'Guest 1', email: '', phone: '',
          group: 'bride-family', meal_preference: 'standard', dietary_restrictions: '',
          plus_one: false, plus_one_name: '', rsvp_status: 'accepted',
          table_id: null, seat_number: null, notes: '',
        }),
        useVendorStore.getState().addVendor({
          wedding_id: 'w1', name: 'Vendor 1', category: 'venue',
          email: '', phone: '', website: '', contract_url: null,
          total_cost: 10000, deposit_paid: 2500, rating: 5, notes: '',
        }),
      ]);

      // Verify all stores have data
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useBudgetStore.getState().categories).toHaveLength(1);
      expect(useGuestStore.getState().guests).toHaveLength(1);
      expect(useVendorStore.getState().vendors).toHaveLength(1);
    });
  });

  // ============================================================
  // Flow 10: Complete Wedding Planning Scenario
  // ============================================================
  describe('Flow 10: Complete Wedding Planning Scenario', () => {
    it('simulates a full wedding planning session', async () => {
      // 1. User signs in (skip auth for test)
      useAuthStore.getState().skipAuth();
      useAuthStore.getState().setWedding({
        id: 'w1', user_id: 'offline-user', partner1_name: 'Janet',
        partner2_name: 'Jojo', wedding_date: '2025-12-20',
        venue: 'Rose Garden', location: 'London', theme: 'romantic',
        total_budget: 50000, cover_image_url: null, created_at: new Date().toISOString(),
      });

      expect(useAuthStore.getState().wedding?.partner1_name).toBe('Janet');

      // 2. Create budget categories and items
      await useBudgetStore.getState().addCategory({ wedding_id: 'w1', name: 'Venue', allocated_amount: 15000, icon: '🏛️' });
      await useBudgetStore.getState().addCategory({ wedding_id: 'w1', name: 'Catering', allocated_amount: 12000, icon: '🍽️' });
      await useBudgetStore.getState().addCategory({ wedding_id: 'w1', name: 'Photography', allocated_amount: 5000, icon: '📷' });

      const cats = useBudgetStore.getState().categories;
      await useBudgetStore.getState().addItem({
        category_id: cats[0]!.id, wedding_id: 'w1', name: 'Rose Garden Booking',
        estimated_cost: 12000, actual_cost: 12000, payment_status: 'fully-paid',
        vendor_id: null, notes: 'Confirmed!',
      });

      expect(useBudgetStore.getState().getTotalAllocated()).toBe(32000);
      expect(useBudgetStore.getState().getTotalActual()).toBe(12000);

      // 3. Add tasks
      await useTaskStore.getState().addTask({
        wedding_id: 'w1', title: 'Send invitations', description: 'Mail out all invites',
        category: 'invitations', due_date: '2025-06-01', assigned_to: null,
        priority: 'high', status: 'todo',
      });
      await useTaskStore.getState().addTask({
        wedding_id: 'w1', title: 'Book band', description: 'Live band for reception',
        category: 'music', due_date: '2025-07-01', assigned_to: null,
        priority: 'medium', status: 'in-progress',
      });

      expect(useTaskStore.getState().tasks).toHaveLength(2);

      // 4. Add guests
      await useGuestStore.getState().addGuest({
        wedding_id: 'w1', name: 'Mom', email: 'mom@family.com', phone: '',
        group: 'bride-family', meal_preference: 'standard', dietary_restrictions: '',
        plus_one: true, plus_one_name: 'Dad', rsvp_status: 'accepted',
        table_id: null, seat_number: null, notes: '',
      });
      await useGuestStore.getState().addGuest({
        wedding_id: 'w1', name: 'Best Friend', email: 'bestie@test.com', phone: '',
        group: 'bride-friends', meal_preference: 'vegetarian', dietary_restrictions: 'No nuts',
        plus_one: false, plus_one_name: '', rsvp_status: 'accepted',
        table_id: null, seat_number: null, notes: '',
      });

      const guestStats = useGuestStore.getState().getStats();
      expect(guestStats.total).toBe(2);
      expect(guestStats.accepted).toBe(2);
      expect(guestStats.plusOnes).toBe(1);

      // 5. Create timeline
      await useTimelineStore.getState().addEvent({
        wedding_id: 'w1', title: 'Ceremony', start_time: '14:00', end_time: '15:00',
        location: 'Garden', responsible_person: 'Officiant', notes: '', sort_order: 0,
      });
      await useTimelineStore.getState().addEvent({
        wedding_id: 'w1', title: 'First Dance', start_time: '18:30', end_time: '18:45',
        location: 'Ballroom', responsible_person: 'DJ', notes: '', sort_order: 1,
      });

      expect(useTimelineStore.getState().events).toHaveLength(2);

      // 6. Chat about the wedding
      await useChatStore.getState().sendMessage({
        wedding_id: 'w1', user_id: 'offline-user', user_name: 'Guest',
        user_avatar: null, content: "Can't wait for the big day! 🎉", type: 'message',
      });

      expect(useChatStore.getState().messages).toHaveLength(1);

      // 7. Final state check — everything is populated
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().wedding).toBeTruthy();
      expect(useTaskStore.getState().tasks).toHaveLength(2);
      expect(useBudgetStore.getState().categories).toHaveLength(3);
      expect(useBudgetStore.getState().items).toHaveLength(1);
      expect(useGuestStore.getState().guests).toHaveLength(2);
      expect(useVendorStore.getState().vendors).toHaveLength(0); // No vendors in this scenario yet
      expect(useTimelineStore.getState().events).toHaveLength(2);
      expect(useChatStore.getState().messages).toHaveLength(1);
    });
  });
});
